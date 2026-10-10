export type LocationSource = 'gps' | 'network' | 'ip';

export interface Fix {
  lat: number;
  lng: number;
  accuracy: number | null; // metres
  altitude: number | null;
  heading: number | null;
  speedKmh: number | null;
  source: LocationSource;
  at: number;
  label?: string; // e.g. ISP/city for IP lookups
}

export type GeoStatus =
  | { state: 'idle' }
  | { state: 'locating'; step: string }
  | { state: 'ok'; fix: Fix }
  | { state: 'error'; reason: 'denied' | 'unavailable' | 'unsupported'; message: string; approx?: Fix };

export function fromPosition(p: GeolocationPosition): Fix {
  return {
    lat: p.coords.latitude,
    lng: p.coords.longitude,
    accuracy: Math.round(p.coords.accuracy),
    altitude: p.coords.altitude !== null ? Math.round(p.coords.altitude) : null,
    heading: p.coords.heading !== null && !Number.isNaN(p.coords.heading) ? Math.round(p.coords.heading) : null,
    speedKmh: p.coords.speed !== null ? Math.round(p.coords.speed * 3.6) : null,
    source: p.coords.accuracy <= 100 ? 'gps' : 'network',
    at: p.timestamp,
  };
}

export function getPosition(highAccuracy: boolean, timeout: number): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: highAccuracy, timeout, maximumAge: highAccuracy ? 0 : 60_000 })
  );
}

/** City-level estimate from the internet connection. Clearly approximate. */
export async function ipLocation(): Promise<Fix | null> {
  const attempts: [string, (d: any) => Fix | null][] = [
    ['https://ipwho.is/', (d) => (d?.success ? { lat: d.latitude, lng: d.longitude, accuracy: 5000, altitude: null, heading: null, speedKmh: null, source: 'ip', at: Date.now(), label: [d.city, d.region, d.connection?.isp].filter(Boolean).join(', ') } : null)],
    ['https://freeipapi.com/api/json', (d) => (d?.latitude ? { lat: d.latitude, lng: d.longitude, accuracy: 5000, altitude: null, heading: null, speedKmh: null, source: 'ip', at: Date.now(), label: [d.cityName, d.regionName].filter(Boolean).join(', ') } : null)],
  ];
  for (const [url, map] of attempts) {
    try {
      const r = await fetch(url);
      if (!r.ok) continue;
      const fix = map(await r.json());
      if (fix && Number.isFinite(fix.lat) && Number.isFinite(fix.lng)) return fix;
    } catch {
      /* try next */
    }
  }
  return null;
}

/** GPS → Wi-Fi/network → IP estimate. Never invents coordinates. */
export async function locate(onStep: (s: string) => void): Promise<GeoStatus> {
  if (!('geolocation' in navigator)) {
    onStep('This browser has no location support. Trying your internet connection…');
    const approx = await ipLocation();
    return { state: 'error', reason: 'unsupported', message: 'This browser does not support location.', approx: approx || undefined };
  }
  try {
    onStep('Asking your device for its GPS location…');
    return { state: 'ok', fix: fromPosition(await getPosition(true, 12_000)) };
  } catch (err: any) {
    if (err?.code === 1) {
      onStep('Location permission was blocked. Estimating from your internet connection…');
      const approx = await ipLocation();
      return {
        state: 'error',
        reason: 'denied',
        message: 'Location access is blocked for this site. Click the padlock icon next to the address bar, set Location to Allow, then tap Retry.',
        approx: approx || undefined,
      };
    }
  }
  try {
    onStep('GPS is slow. Trying Wi-Fi/mobile network location…');
    return { state: 'ok', fix: fromPosition(await getPosition(false, 10_000)) };
  } catch {
    onStep('Device location unavailable. Estimating from your internet connection…');
    const approx = await ipLocation();
    return {
      state: 'error',
      reason: 'unavailable',
      message: 'Your device could not determine its location. Check that Location is turned on in your system settings.',
      approx: approx || undefined,
    };
  }
}

export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
      headers: { Accept: 'application/json' },
    });
    if (!r.ok) return null;
    const d = await r.json();
    const a = d.address || {};
    const parts = [a.house_number && a.road ? `${a.house_number} ${a.road}` : a.road, a.neighbourhood || a.suburb, a.city || a.town || a.village || a.county, a.state, a.postcode];
    return parts.filter(Boolean).join(', ') || d.display_name || null;
  } catch {
    return null;
  }
}

export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export const mapsLink = (lat: number, lng: number) => `https://www.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)}`;
export const directionsLink = (lat: number, lng: number) => `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
