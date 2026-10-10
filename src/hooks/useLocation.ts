import { useCallback, useEffect, useRef, useState } from 'react';
import { fromPosition, locate, reverseGeocode, type Fix, type GeoStatus } from '../lib/geo';

/** Current location with honest status: never returns made-up coordinates. */
export function useLocation(autoStart = true) {
  const [status, setStatus] = useState<GeoStatus>({ state: 'idle' });
  const [address, setAddress] = useState<string | null>(null);
  const watchId = useRef<number | null>(null);
  const lastGeocode = useRef<{ lat: number; lng: number } | null>(null);

  const geocode = useCallback(async (f: Fix) => {
    const prev = lastGeocode.current;
    // Only re-geocode after moving ~50 m (Nominatim asks for gentle usage).
    if (prev && Math.abs(prev.lat - f.lat) < 0.0005 && Math.abs(prev.lng - f.lng) < 0.0005) return;
    lastGeocode.current = { lat: f.lat, lng: f.lng };
    setAddress(await reverseGeocode(f.lat, f.lng));
  }, []);

  const refresh = useCallback(async () => {
    setStatus({ state: 'locating', step: 'Starting…' });
    const s = await locate((step) => setStatus({ state: 'locating', step }));
    setStatus(s);
    const fix = s.state === 'ok' ? s.fix : s.state === 'error' ? s.approx : undefined;
    if (fix) geocode(fix);
  }, [geocode]);

  /** Continuous updates (used while SOS is active). */
  const startWatch = useCallback(() => {
    if (!('geolocation' in navigator) || watchId.current !== null) return;
    watchId.current = navigator.geolocation.watchPosition(
      (p) => {
        const fix = fromPosition(p);
        setStatus({ state: 'ok', fix });
        geocode(fix);
      },
      () => {
        /* keep the last good fix */
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 }
    );
  }, [geocode]);

  const stopWatch = useCallback(() => {
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    watchId.current = null;
  }, []);

  useEffect(() => {
    if (autoStart) refresh();
    return stopWatch;
  }, [autoStart, refresh, stopWatch]);

  const fix: Fix | null = status.state === 'ok' ? status.fix : status.state === 'error' ? status.approx || null : null;
  const approximate = status.state === 'error' || fix?.source === 'ip';
  return { status, fix, approximate, address, refresh, startWatch, stopWatch };
}
