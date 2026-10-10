import React, { useEffect, useState } from 'react';
import { Hospital, Siren, Flame, Pill, Stethoscope, Navigation, Phone, RefreshCw } from 'lucide-react';
import { Button, Card, CardHeader, Spinner } from '../../ui/ui';
import { findNearby, type Place, type PlaceKind } from '../../lib/nearby';
import { directionsLink, type Fix } from '../../lib/geo';

export const KIND_META: Record<PlaceKind, { label: string; color: string; icon: typeof Hospital }> = {
  hospital: { label: 'Hospital', color: '#e11d48', icon: Hospital },
  police: { label: 'Police', color: '#2563eb', icon: Siren },
  fire: { label: 'Fire station', color: '#ea580c', icon: Flame },
  clinic: { label: 'Clinic', color: '#db2777', icon: Stethoscope },
  pharmacy: { label: 'Pharmacy', color: '#059669', icon: Pill },
};

export const NearbyCard: React.FC<{ fix: Fix | null; onPlaces: (p: Place[]) => void }> = ({ fix, onPlaces }) => {
  const [places, setPlaces] = useState<Place[] | null>(null);
  const [kind, setKind] = useState<'all' | PlaceKind>('all');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const key = fix ? `${fix.lat.toFixed(3)},${fix.lng.toFixed(3)}` : '';

  const load = async () => {
    if (!fix) return;
    setBusy(true);
    setError(null);
    try {
      const p = await findNearby(fix.lat, fix.lng, fix.source === 'ip' ? 8000 : 5000);
      setPlaces(p);
      onPlaces(p);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const shown = (places || []).filter((p) => kind === 'all' || p.kind === kind).slice(0, 25);

  return (
    <Card className="space-y-3">
      <CardHeader
        icon={<Hospital className="w-4 h-4 text-rose-500" />}
        title="Nearby help"
        subtitle="Real hospitals, police and fire stations from OpenStreetMap"
        action={fix && <Button size="sm" variant="secondary" loading={busy} icon={<RefreshCw className="w-3.5 h-3.5" />} onClick={load}>Refresh</Button>}
      />
      {!fix ? (
        <p className="text-xs text-slate-500">Waiting for your location…</p>
      ) : busy && !places ? (
        <Spinner label="Searching nearby…" />
      ) : error ? (
        <p className="text-xs text-rose-600">Couldn’t load nearby places: {error}. Try Refresh.</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-1 text-[11px]">
            {(['all', 'hospital', 'police', 'fire', 'clinic', 'pharmacy'] as const).map((k) => (
              <button key={k} onClick={() => setKind(k)} className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer ${kind === k ? 'bg-slate-900 dark:bg-slate-700 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                {k === 'all' ? 'All' : KIND_META[k].label} {k !== 'all' && `(${(places || []).filter((p) => p.kind === k).length})`}
              </button>
            ))}
          </div>
          {shown.length === 0 ? (
            <p className="text-xs text-slate-500">Nothing found within {fix.source === 'ip' ? 8 : 5} km in OpenStreetMap. Call 112 for help.</p>
          ) : (
            <div className="space-y-1.5 max-h-96 overflow-y-auto">
              {shown.map((p) => {
                const M = KIND_META[p.kind];
                return (
                  <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0" style={{ background: M.color }}>
                      <M.icon className="w-4 h-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{p.name}</div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {M.label} · {p.distanceKm < 1 ? `${Math.round(p.distanceKm * 1000)} m` : `${p.distanceKm.toFixed(1)} km`}
                        {p.emergency ? ' · 24h emergency' : ''}
                        {p.address ? ` · ${p.address}` : ''}
                      </div>
                    </div>
                    {p.phone && (
                      <a href={`tel:${p.phone.split(';')[0].replace(/[^\d+]/g, '')}`} className="p-2 rounded-lg bg-emerald-600 text-white" aria-label={`Call ${p.name}`}>
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <a href={directionsLink(p.lat, p.lng)} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-slate-900 dark:bg-slate-700 text-white" aria-label={`Directions to ${p.name}`}>
                      <Navigation className="w-3.5 h-3.5" />
                    </a>
                  </div>
                );
              })}
            </div>
          )}
          <p className="text-[10px] text-slate-400">Data © OpenStreetMap contributors. Listings may be incomplete; distances are straight-line.</p>
        </>
      )}
    </Card>
  );
};
