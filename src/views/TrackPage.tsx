import React, { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { Shield, Navigation, PhoneCall, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { db } from '../lib/firebase';
import { LeafletMap } from '../components/LeafletMap';
import { directionsLink, mapsLink } from '../lib/geo';
import { formatDateTime, timeAgo } from '../lib/format';
import type { SosSession } from '../types';

export const TrackPage: React.FC<{ sessionId: string }> = ({ sessionId }) => {
  const [session, setSession] = useState<(SosSession & { lastLocation?: SosSession['lastLocation'] & { approximate?: boolean } }) | null>(null);
  const [state, setState] = useState<'loading' | 'ok' | 'missing' | 'error'>('loading');
  const [, tick] = useState(0);

  useEffect(() => {
    if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) document.documentElement.classList.add('dark');
    document.title = 'Live SOS location · CyberShield';
    const unsub = onSnapshot(
      doc(db, 'sosSessions', sessionId),
      (snap) => {
        if (!snap.exists()) return setState('missing');
        setSession(snap.data({ serverTimestamps: 'estimate' }) as any);
        setState('ok');
      },
      () => setState('error')
    );
    const t = setInterval(() => tick((n) => n + 1), 15_000);
    return () => {
      unsub();
      clearInterval(t);
    };
  }, [sessionId]);

  const loc = session?.lastLocation;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#070a0f] text-slate-800 dark:text-slate-200 font-sans p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
          <span className="w-8 h-8 rounded-lg bg-cyan-600 text-white flex items-center justify-center"><Shield className="w-4 h-4" /></span>
          CyberShield live location
        </div>

        {state === 'loading' && <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>}
        {(state === 'missing' || state === 'error') && (
          <div className="p-4 rounded-xl bg-white dark:bg-[#0e141e] border border-slate-200 dark:border-slate-800 text-sm">
            This tracking link is invalid or has been removed.
          </div>
        )}

        {session && (
          <>
            {session.active ? (
              <div className="p-4 rounded-xl bg-rose-600 text-white">
                <div className="font-black text-lg flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-white animate-ping" /> {session.ownerName} needs help</div>
                <div className="text-sm text-rose-100">SOS started {formatDateTime(session.startedAt)}. This page updates automatically.</div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-emerald-600 text-white flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6" />
                <div>
                  <div className="font-bold">{session.ownerName} ended the SOS</div>
                  <div className="text-sm text-emerald-100">They marked themselves safe {session.endedAt ? formatDateTime(session.endedAt) : ''}.</div>
                </div>
              </div>
            )}

            {loc ? (
              <div className="p-4 rounded-xl bg-white dark:bg-[#0e141e] border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="text-xs text-slate-500">
                  Last update <b className="text-slate-800 dark:text-slate-200">{timeAgo(loc.at)}</b> · {loc.approximate ? 'approximate area (city level)' : `accurate to ±${loc.accuracy ?? '?'} m`}
                </div>
                {loc.approximate && (
                  <div className="text-xs p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 flex gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" /> Their device could not get GPS, so this location may be several kilometres off. Call them.
                  </div>
                )}
                {loc.address && <div className="text-sm"><b>Near:</b> {loc.address}</div>}
                <LeafletMap center={{ lat: loc.lat, lng: loc.lng }} accuracy={loc.accuracy} height={320} zoom={16} />
                <div className="flex flex-wrap gap-2">
                  <a href={directionsLink(loc.lat, loc.lng)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-600 text-white text-sm font-bold">
                    <Navigation className="w-4 h-4" /> Directions
                  </a>
                  <a href={mapsLink(loc.lat, loc.lng)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-sm font-semibold">
                    Open in Google Maps
                  </a>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-white dark:bg-[#0e141e] border border-slate-200 dark:border-slate-800 text-sm">No location has been shared yet. Try calling them.</div>
            )}

            <a href="tel:112" className="flex items-center justify-center gap-2 py-3 rounded-xl bg-black text-amber-300 font-black">
              <PhoneCall className="w-5 h-5" /> Call 112 (Emergency)
            </a>
          </>
        )}
      </div>
    </div>
  );
};
