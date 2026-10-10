import type { CheckupResult } from '../types';

type Check = CheckupResult['checks'][number];

export function detectDevice() {
  const ua = navigator.userAgent;
  let os = 'Unknown OS';
  if (/Windows NT 10/.test(ua)) os = 'Windows 10/11';
  else if (/Windows/.test(ua)) os = 'Windows (old version)';
  else if (/Android/.test(ua)) os = 'Android';
  else if (/iPhone|iPad|iPod/.test(ua)) os = 'iOS / iPadOS';
  else if (/Mac OS X/.test(ua)) os = 'macOS';
  else if (/CrOS/.test(ua)) os = 'ChromeOS';
  else if (/Linux/.test(ua)) os = 'Linux';
  let browser = 'Unknown browser';
  let major = 0;
  let family: 'chrome' | 'edge' | 'firefox' | 'safari' | 'other' = 'other';
  const m = (re: RegExp) => Number(ua.match(re)?.[1] || 0);
  if (/Edg\//.test(ua)) { family = 'edge'; major = m(/Edg\/(\d+)/); browser = `Microsoft Edge ${major}`; }
  else if (/OPR\//.test(ua)) { family = 'chrome'; major = m(/Chrome\/(\d+)/); browser = `Opera (Chromium ${major})`; }
  else if (/Chrome\//.test(ua)) { family = 'chrome'; major = m(/Chrome\/(\d+)/); browser = `Google Chrome ${major}`; }
  else if (/Firefox\//.test(ua)) { family = 'firefox'; major = m(/Firefox\/(\d+)/); browser = `Mozilla Firefox ${major}`; }
  else if (/Safari\//.test(ua)) { family = 'safari'; major = m(/Version\/(\d+)/); browser = `Safari ${major}`; }
  return { os, browser, family, major };
}

async function latestMajor(family: string): Promise<number | null> {
  try {
    if (family === 'chrome' || family === 'edge') {
      const r = await fetch('https://versionhistory.googleapis.com/v1/chrome/platforms/win/channels/stable/versions?pageSize=1');
      const d = await r.json();
      return Number(String(d.versions?.[0]?.version || '').split('.')[0]) || null;
    }
    if (family === 'firefox') {
      const r = await fetch('https://product-details.mozilla.org/1.0/firefox_versions.json');
      const d = await r.json();
      return Number(String(d.LATEST_FIREFOX_VERSION || '').split('.')[0]) || null;
    }
  } catch {
    /* offline or blocked */
  }
  return null;
}

/** Collects ICE candidates to see whether the local network IP is exposed to websites. */
function webrtcLeak(): Promise<{ supported: boolean; privateIps: string[]; mdnsOnly: boolean }> {
  return new Promise((resolve) => {
    const RTC = (window as any).RTCPeerConnection;
    if (!RTC) return resolve({ supported: false, privateIps: [], mdnsOnly: false });
    const pc: RTCPeerConnection = new RTC({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    const privateIps = new Set<string>();
    let sawMdns = false;
    const finish = () => {
      try { pc.close(); } catch { /* ignore */ }
      resolve({ supported: true, privateIps: [...privateIps], mdnsOnly: sawMdns && privateIps.size === 0 });
    };
    pc.createDataChannel('probe');
    pc.onicecandidate = (e) => {
      if (!e.candidate) return finish();
      const addr = e.candidate.candidate.split(' ')[4] || '';
      if (addr.endsWith('.local')) sawMdns = true;
      else if (/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(addr)) privateIps.add(addr);
    };
    pc.createOffer().then((o) => pc.setLocalDescription(o)).catch(finish);
    setTimeout(finish, 3000);
  });
}

async function permissionState(name: string): Promise<string> {
  try {
    return (await navigator.permissions.query({ name: name as PermissionName })).state;
  } catch {
    return 'unknown';
  }
}

export async function runBrowserCheckup(): Promise<Omit<CheckupResult, 'id' | 'createdAt'>> {
  const device = detectDevice();
  const checks: Check[] = [];

  checks.push(
    window.isSecureContext
      ? { id: 'https', label: 'Encrypted connection', status: 'pass', detail: 'This page is loaded over HTTPS, so data between you and CyberShield is encrypted.' }
      : { id: 'https', label: 'Encrypted connection', status: 'fail', detail: 'This page is not loaded over HTTPS.', fix: 'Always open CyberShield using https://.' }
  );

  const latest = await latestMajor(device.family);
  if (device.family === 'safari' || device.family === 'other') {
    checks.push({ id: 'browser', label: 'Browser up to date', status: 'info', detail: `${device.browser}. Automatic version comparison is not available for this browser.`, fix: 'Check for updates in your browser or system settings.' });
  } else if (latest === null) {
    checks.push({ id: 'browser', label: 'Browser up to date', status: 'info', detail: `${device.browser}. Could not reach the official release feed to compare.` });
  } else {
    const behind = latest - device.major;
    checks.push(
      behind <= 0
        ? { id: 'browser', label: 'Browser up to date', status: 'pass', detail: `${device.browser} matches the latest stable release (${latest}).` }
        : behind === 1
          ? { id: 'browser', label: 'Browser up to date', status: 'warn', detail: `${device.browser} is one version behind (latest is ${latest}).`, fix: 'Restart your browser to finish installing the update.' }
          : { id: 'browser', label: 'Browser up to date', status: 'fail', detail: `${device.browser} is ${behind} versions behind (latest is ${latest}). Old browsers have known security holes.`, fix: 'Update your browser now: Menu → Help → About, then restart it.' }
    );
  }

  const uad = (navigator as any).userAgentData;
  if (/Windows/.test(navigator.userAgent) && uad?.getHighEntropyValues) {
    try {
      const { platformVersion } = await uad.getHighEntropyValues(['platformVersion']);
      const win11 = Number(String(platformVersion).split('.')[0]) >= 13;
      checks.push(
        win11
          ? { id: 'os', label: 'Operating system supported', status: 'pass', detail: 'Windows 11 detected. It still receives security updates.' }
          : { id: 'os', label: 'Operating system supported', status: 'fail', detail: 'Windows 10 detected. Microsoft ended free security updates on 14 October 2025.', fix: 'Upgrade to Windows 11, or enrol in Extended Security Updates.' }
      );
    } catch {
      /* ignore */
    }
  }
  return finishCheckup(device, checks);
}

async function finishCheckup(device: ReturnType<typeof detectDevice>, checks: Check[]) {
  const leak = await webrtcLeak();
  if (!leak.supported) {
    checks.push({ id: 'webrtc', label: 'Local IP privacy (WebRTC)', status: 'pass', detail: 'WebRTC is disabled, so websites cannot read your local network address.' });
  } else if (leak.privateIps.length) {
    checks.push({ id: 'webrtc', label: 'Local IP privacy (WebRTC)', status: 'warn', detail: `Websites can see your local network address (${leak.privateIps.join(', ')}). It helps trackers fingerprint you.`, fix: 'Update your browser, or use a privacy extension that limits WebRTC.' });
  } else {
    checks.push({ id: 'webrtc', label: 'Local IP privacy (WebRTC)', status: 'pass', detail: leak.mdnsOnly ? 'Your browser hides your local IP behind a random name (mDNS).' : 'No local network address was exposed.' });
  }

  const gpc = (navigator as any).globalPrivacyControl;
  checks.push(
    gpc
      ? { id: 'gpc', label: 'Do-not-sell signal', status: 'pass', detail: 'Global Privacy Control is on: websites are told not to sell or share your data.' }
      : { id: 'gpc', label: 'Do-not-sell signal', status: 'info', detail: 'Global Privacy Control is off.', fix: 'Optional: browsers like Firefox, Brave and DuckDuckGo can send this signal.' }
  );

  const geo = await permissionState('geolocation');
  checks.push(
    geo === 'granted'
      ? { id: 'geo', label: 'Location ready for SOS', status: 'pass', detail: 'CyberShield may use your location, so SOS can share where you are instantly.' }
      : geo === 'denied'
        ? { id: 'geo', label: 'Location ready for SOS', status: 'warn', detail: 'Location is blocked for CyberShield, so SOS can only share an approximate city.', fix: 'Click the padlock icon next to the address bar → Location → Allow.' }
        : { id: 'geo', label: 'Location ready for SOS', status: 'info', detail: 'You have not decided yet. The browser will ask the first time you open Emergency SOS.' }
  );

  const notif = 'Notification' in window ? Notification.permission : 'unsupported';
  checks.push(
    notif === 'granted'
      ? { id: 'notif', label: 'Reminder notifications', status: 'pass', detail: 'CyberShield can alert you when a security task is due.' }
      : { id: 'notif', label: 'Reminder notifications', status: 'info', detail: notif === 'denied' ? 'Notifications are blocked for this site.' : 'Notifications are not enabled.', fix: 'Turn them on from the Overview page to get task reminders.' }
  );

  let persisted = false;
  try {
    persisted = (await navigator.storage?.persisted?.()) || false;
  } catch {
    /* ignore */
  }
  checks.push({
    id: 'storage',
    label: 'Offline copy kept',
    status: 'info',
    detail: persisted ? 'Your browser will keep CyberShield’s offline copy even when space is low.' : 'Your browser may clear the offline copy when space is low. Your data is still safe in the cloud.',
  });

  const scored = checks.filter((c) => c.status !== 'info');
  const points = scored.reduce((sum, c) => sum + (c.status === 'pass' ? 1 : c.status === 'warn' ? 0.5 : 0), 0);
  const score = scored.length ? Math.round((points / scored.length) * 100) : 0;
  return { score, checks, device: { os: device.os, browser: device.browser } };
}
