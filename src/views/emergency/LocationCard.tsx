import React, { useState } from 'react';
import { MapPin, RefreshCw, Volume2, Copy, Loader2, AlertTriangle, ExternalLink } from 'lucide-react';
import { Badge, Button, Card, CardHeader } from '../../ui/ui';
import { LeafletMap, type MapMarker } from '../../components/LeafletMap';
import { copyText } from '../../lib/format';
import { mapsLink } from '../../lib/geo';
import { toast } from '../../lib/toast';
import type { useLocation } from '../../hooks/useLocation';

type Loc = ReturnType<typeof useLocation>;

export const LocationCard: React.FC<{ loc: Loc; name: string; markers: MapMarker[] }> = ({ loc, name, markers }) => {
  const { status, fix, approximate, address } = loc;
  const [speaking, setSpeaking] = useState(false);

  const script = fix
    ? `Hello, this is an emergency. My name is ${name}. My ${approximate ? 'approximate ' : ''}location is latitude ${fix.lat.toFixed(5)}, longitude ${fix.lng.toFixed(5)}${address ? `, near ${address}` : ''}. Please send help.`
    : `Hello, this is an emergency. My name is ${name}. I cannot get my exact location. I will describe where I am.`;
  const hindi = fix
    ? `नमस्ते, यह आपातकाल है। मेरा नाम ${name} है। मेरी ${approximate ? 'अनुमानित ' : ''}लोकेशन अक्षांश ${fix.lat.toFixed(5)}, देशांतर ${fix.lng.toFixed(5)} है${address ? `, ${address} के पास` : ''}। कृपया तुरंत मदद भेजें।`
    : `नमस्ते, यह आपातकाल है। मेरा नाम ${name} है। मेरी सटीक लोकेशन नहीं मिल रही, मैं जगह का विवरण बताता/बताती हूँ।`;

  const speak = () => {
    if (!('speechSynthesis' in window)) return toast('Speech not supported on this browser', undefined, 'warning');
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const u = new SpeechSynthesisUtterance(script);
    u.rate = 0.9;
    u.onend = u.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(u);
  };

  let badge: React.ReactNode = <Badge>Not started</Badge>;
  if (status.state === 'locating') badge = <Badge tone="cyan"><Loader2 className="w-3 h-3 animate-spin" /> Locating</Badge>;
  else if (status.state === 'ok') badge = <Badge tone="emerald">{fix?.source === 'gps' ? 'GPS' : 'Wi-Fi / network'} · ±{fix?.accuracy} m</Badge>;
  else if (status.state === 'error') badge = <Badge tone="amber">{fix ? 'Approximate (city level)' : 'Unavailable'}</Badge>;

  return (
    <Card className="space-y-3">
      <CardHeader icon={<MapPin className="w-4 h-4 text-sky-500" />} title="Your location" subtitle="Used for SOS and nearby help. Only shared when you send it." action={badge} />
      {status.state === 'locating' && <p className="text-xs text-slate-500">{status.step}</p>}
      {status.state === 'error' && (
        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-200 flex gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <div>
            <div>{status.message}</div>
            {fix && <div className="mt-1">Showing an estimate from your internet connection{fix.label ? ` (${fix.label})` : ''}. It may be off by several kilometres.</div>}
          </div>
        </div>
      )}
      {fix && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          {[
            ['Latitude', fix.lat.toFixed(6)],
            ['Longitude', fix.lng.toFixed(6)],
            ['Accuracy', fix.accuracy ? `±${fix.accuracy} m` : '—'],
            ['Altitude', fix.altitude !== null ? `${fix.altitude} m` : '—'],
          ].map(([k, v]) => (
            <div key={k} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
              <div className="text-[10px] text-slate-500">{k}</div>
              <div className="font-mono-code font-bold text-slate-900 dark:text-slate-100">{v}</div>
            </div>
          ))}
        </div>
      )}
      {address && <p className="text-xs text-slate-700 dark:text-slate-300"><b>Near:</b> {address}</p>}
      <LeafletMap center={fix ? { lat: fix.lat, lng: fix.lng } : null} accuracy={fix?.accuracy} markers={markers} height={260} />
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" icon={<RefreshCw className="w-3.5 h-3.5" />} onClick={loc.refresh} loading={status.state === 'locating'}>Retry location</Button>
        {fix && (
          <a href={mapsLink(fix.lat, fix.lng)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200">
            <ExternalLink className="w-3.5 h-3.5" /> Google Maps
          </a>
        )}
        <Button size="sm" variant="secondary" icon={<Volume2 className="w-3.5 h-3.5" />} onClick={speak}>{speaking ? 'Stop reading' : 'Read aloud'}</Button>
        <Button size="sm" variant="secondary" icon={<Copy className="w-3.5 h-3.5" />} onClick={async () => toast((await copyText(`${script}\n\n${hindi}`)) ? 'Dispatcher script copied (English + Hindi)' : 'Copy failed', undefined, 'success')}>
          Copy what to say
        </Button>
      </div>
      <details className="text-xs">
        <summary className="cursor-pointer font-semibold text-slate-600 dark:text-slate-400">What to say on a 112 call</summary>
        <p className="mt-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-900 leading-relaxed">{script}</p>
        <p className="mt-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-900 leading-relaxed">{hindi}</p>
      </details>
    </Card>
  );
};
