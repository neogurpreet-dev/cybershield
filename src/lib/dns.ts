import type { DnsAnswer, DomainScan } from '../types';
import { apiGet } from './api';

const TYPE_CODES: Record<number, string> = { 1: 'A', 2: 'NS', 5: 'CNAME', 6: 'SOA', 15: 'MX', 16: 'TXT', 28: 'AAAA', 257: 'CAA' };

export const RECORD_TYPES = ['A', 'AAAA', 'CNAME', 'MX', 'NS', 'TXT', 'CAA'] as const;

export const DOMAIN_RE = /^(?=.{1,253}$)(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/i;

export function cleanDomain(input: string): string | null {
  let v = input.trim().toLowerCase();
  try {
    if (!/^[a-z]+:\/\//.test(v)) v = `https://${v}`;
    v = new URL(v).hostname.replace(/\.$/, '');
  } catch {
    return null;
  }
  return DOMAIN_RE.test(v) ? v : null;
}

/** Real DNS lookup over HTTPS (Google Public DNS JSON API, works from the browser). */
export async function resolve(name: string, type: string): Promise<{ answers: DnsAnswer[]; dnssec: boolean; status: number }> {
  const res = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(name)}&type=${type}&do=1`, {
    headers: { Accept: 'application/dns-json' },
  });
  if (!res.ok) throw new Error(`DNS lookup failed (${res.status})`);
  const data = await res.json();
  const answers: DnsAnswer[] = (data.Answer || [])
    .filter((a: any) => TYPE_CODES[a.type] === type)
    .map((a: any) => ({ type: TYPE_CODES[a.type], data: String(a.data).replace(/^"|"$/g, '').replace(/" "/g, ''), ttl: a.TTL }));
  return { answers, dnssec: Boolean(data.AD), status: data.Status };
}

function policyOf(record: string, key: string) {
  return record.match(new RegExp(`${key}=([^;\s]+)`, 'i'))?.[1];
}

export async function checkVerification(domain: string, token: string): Promise<boolean> {
  const r = await resolve(`_cybershield.${domain}`, 'TXT');
  return r.answers.some((a) => a.data.trim() === `cybershield-verify=${token}`);
}

/** Full domain scan: DNS in the browser + TLS/headers from the server. */
export async function scanDomain(domain: string, previous?: DomainScan): Promise<DomainScan> {
  const dns: Record<string, DnsAnswer[]> = {};
  let dnssec = false;
  let nxdomain = false;
  await Promise.all(
    RECORD_TYPES.map(async (t) => {
      try {
        const r = await resolve(domain, t);
        dns[t] = r.answers;
        if (r.dnssec) dnssec = true;
        if (r.status === 3) nxdomain = true;
      } catch {
        dns[t] = [];
      }
    })
  );

  const txt = dns.TXT || [];
  const spfRecord = txt.find((r) => r.data.toLowerCase().startsWith('v=spf1'))?.data;
  const spfPolicy = spfRecord?.match(/([~\-?+])all\b/)?.[1];
  let dmarcRecord: string | undefined;
  try {
    dmarcRecord = (await resolve(`_dmarc.${domain}`, 'TXT')).answers.find((r) => r.data.toLowerCase().startsWith('v=dmarc1'))?.data;
  } catch {
    /* ignore */
  }
  const dmarcPolicy = dmarcRecord ? policyOf(dmarcRecord, 'p') : undefined;

  let site: any;
  try {
    site = await apiGet(`/api/site-check?host=${encodeURIComponent(domain)}`);
  } catch (e: any) {
    site = { error: e.message };
  }

  const ctx = { domain, dns, dnssec, nxdomain, spfRecord, spfPolicy, dmarcRecord, dmarcPolicy, site, previous };
  return buildScan(ctx);
}

interface ScanContext {
  domain: string;
  dns: Record<string, DnsAnswer[]>;
  dnssec: boolean;
  nxdomain: boolean;
  spfRecord?: string;
  spfPolicy?: string;
  dmarcRecord?: string;
  dmarcPolicy?: string;
  site: any;
  previous?: DomainScan;
}

function buildScan(c: ScanContext): DomainScan {
  const { dns, site } = c;
  const findings: DomainScan['findings'] = [];
  let score = 100;
  const bad = (title: string, fix: string, points: number) => {
    findings.push({ level: 'bad', title, fix });
    score -= points;
  };
  const warn = (title: string, fix: string, points: number) => {
    findings.push({ level: 'warn', title, fix });
    score -= points;
  };
  const good = (title: string) => findings.push({ level: 'good', title });
  const info = (title: string, fix?: string) => findings.push({ level: 'info', title, fix });

  if (c.nxdomain) bad('Domain does not exist in DNS', 'Check the spelling, or renew the domain if it expired.', 100);
  if (!(dns.A?.length || dns.AAAA?.length || dns.CNAME?.length)) {
    warn('No website address (A/AAAA) records', 'Point the domain at your web host if it should serve a website.', 10);
  }

  const tls = site?.tls;
  if (site?.error) info(`Server checks unavailable: ${site.error}`);
  else if (site && site.resolvable === false) info(`Server checks skipped: ${site.error || 'domain did not resolve'}`);
  else if (!tls?.reachable) bad('HTTPS is not reachable', 'Enable HTTPS on your host. Most hosts offer free certificates from Let’s Encrypt.', 25);
  else if (!tls.authorized) bad(`Certificate not trusted: ${tls.authorizationError}`, 'Install a valid certificate that matches this domain.', 25);
  else if (tls.daysRemaining < 0) bad('Certificate has expired', 'Renew the certificate now. Visitors are seeing security warnings.', 30);
  else if (tls.daysRemaining < 14) bad(`Certificate expires in ${tls.daysRemaining} days`, 'Renew it now or check that auto-renewal is working.', 15);
  else if (tls.daysRemaining < 30) warn(`Certificate expires in ${tls.daysRemaining} days`, 'Make sure auto-renewal is set up.', 5);
  else good(`Valid certificate from ${tls.issuerOrg || tls.issuer}, ${tls.daysRemaining} days left`);

  if (tls?.reachable && tls.protocol && !/TLSv1\.[23]/.test(tls.protocol)) {
    warn(`Old encryption protocol (${tls.protocol})`, 'Disable TLS 1.0 and 1.1; allow TLS 1.2 and 1.3 only.', 10);
  }
  if (site?.httpRedirectsToHttps === false) warn('http:// does not redirect to https://', 'Redirect all plain-HTTP traffic to HTTPS.', 8);
  else if (site?.httpRedirectsToHttps) good('Plain HTTP redirects to HTTPS');

  const hdr = site?.headers;
  if (hdr?.reachable) {
    if (hdr.grade === 'A' || hdr.grade === 'B') good(`Security headers grade ${hdr.grade}`);
    else warn(`Security headers grade ${hdr.grade}`, 'Add the missing headers listed in the Security headers section.', hdr.grade === 'C' ? 6 : 12);
  }

  if (dns.MX?.length) {
    if (!c.spfRecord) warn('No SPF record (email spoofing protection)', 'Add a TXT record like "v=spf1 include:<your mail provider> -all".', 10);
    else if (c.spfPolicy === '+' || c.spfPolicy === '?') warn('SPF lets anyone send email as you', 'End the SPF record with "-all" or "~all".', 8);
    else good('SPF record found');
    if (!c.dmarcRecord) warn('No DMARC record', 'Add a TXT record at _dmarc: "v=DMARC1; p=quarantine; rua=mailto:you@yourdomain".', 10);
    else if (c.dmarcPolicy === 'none') warn('DMARC is monitor-only (p=none)', 'Move to p=quarantine or p=reject once reports look clean.', 4);
    else good(`DMARC policy: ${c.dmarcPolicy}`);
  } else {
    info('No mail (MX) records, so email checks were skipped');
  }

  if (c.dnssec) good('DNSSEC is enabled');
  else info('DNSSEC not enabled', 'Optional: turn on DNSSEC at your registrar to prevent DNS tampering.');
  const caa = (dns.CAA || []).length > 0;
  if (!caa) info('No CAA record', 'Optional: a CAA record limits which companies may issue certificates for your domain.');

  const changes: string[] = [];
  if (c.previous) {
    for (const t of RECORD_TYPES) {
      const before = new Set((c.previous.dns?.[t] || []).map((r) => r.data));
      const after = new Set((dns[t] || []).map((r) => r.data));
      after.forEach((v) => {
        if (!before.has(v)) changes.push(`${t} added: ${v}`);
      });
      before.forEach((v) => {
        if (!after.has(v)) changes.push(`${t} removed: ${v}`);
      });
    }
    const prevFp = c.previous.site?.tls?.fingerprint256;
    if (prevFp && tls?.fingerprint256 && prevFp !== tls.fingerprint256) changes.push('TLS certificate was replaced');
  }

  return {
    at: Date.now(),
    score: Math.max(0, Math.min(100, Math.round(score))),
    dns,
    dnssec: c.dnssec,
    spf: { present: Boolean(c.spfRecord), record: c.spfRecord, policy: c.spfPolicy },
    dmarc: { present: Boolean(c.dmarcRecord), record: c.dmarcRecord, policy: c.dmarcPolicy },
    caa,
    site,
    findings,
    changes,
  };
}
