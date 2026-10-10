import React, { useEffect, useRef, useState } from 'react';
import { AlertOctagon, Volume2, VolumeX, Share2, Copy, MessageCircle, Phone, Square, Check } from 'lucide-react';
import { Button } from '../../ui/ui';
import { sound } from '../../services/audio';
import { copyText } from '../../lib/format';
import { toast } from '../../lib/toast';
import type { useLocation } from '../../hooks/useLocation';
import type { EmergencyContact } from '../../types';
import { pushSosLocation, sosMessage, startSos, stopSos, trackUrl } from './sos';

type Loc = ReturnType<typeof useLocation>;
const digits = (p: string) => p.replace(/[^\d+]/g, '');

export const SosPanel: React.FC<{ uid: string; name: string; loc: Loc; contacts: EmergencyContact[]; activeId: string | null }> = ({ uid, name, loc, contacts, activeId }) => {
  const [count, setCount] = useState<number | null>(null);
  const [siren, setSiren] = useState(false);
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastPush = useRef(0);

  // While active: track continuously and push to the live link at most every 10 s.
  useEffect(() => {
    if (!activeId) return;
    loc.startWatch();
    return () => loc.stopWatch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);
  useEffect(() => {
    if (!activeId || !loc.fix) return;
    if (Date.now() - lastPush.current < 10_000) return;
    lastPush.current = Date.now();
    pushSosLocation(activeId, loc.fix, loc.address, loc.approximate).catch(() => {});
  }, [activeId, loc.fix, loc.address, loc.approximate]);
  useEffect(() => () => sound.stopEmergencySiren(), []);

  const begin = () => {
    sound.playWarning();
    let n = 5;
    setCount(n);
    timer.current = setInterval(async () => {
      n -= 1;
      if (n > 0) {
        setCount(n);
        sound.playBeep(880, 0.1, 'square');
        return;
      }
      clearInterval(timer.current!);
      setCount(null);
      try {
        await startSos(uid, name, loc.fix, loc.address, loc.approximate);
        sound.startEmergencySiren();
        setSiren(true);
      } catch (e: any) {
        toast('Could not start the live link', `${e.message}. You can still call or message using the buttons below.`, 'danger');
      }
    }, 1000);
  };
  const cancel = () => {
    if (timer.current) clearInterval(timer.current);
    setCount(null);
  };
  const end = async () => {
    sound.stopEmergencySiren();
    setSiren(false);
    if (activeId) await stopSos(uid, activeId);
    toast('SOS ended', 'Your live link now shows that you are safe.', 'success');
  };

  const msg = sosMessage(name, loc.fix, loc.address, activeId, loc.approximate);
  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'SOS', text: msg });
        return;
      } catch {
        /* cancelled */
      }
    }
    if (await copyText(msg)) toast('Message copied', 'Paste it into any chat app.', 'success');
  };

  if (!activeId) {
    return (
      <div className="flex flex-col items-center text-center gap-3 py-2">
        {count === null ? (
          <button onClick={begin} className="w-40 h-40 rounded-full bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-black text-3xl shadow-[0_0_40px_rgba(225,29,72,0.45)] flex flex-col items-center justify-center gap-1 cursor-pointer transition" aria-label="Start SOS. Begins a 5 second countdown">
            <AlertOctagon className="w-10 h-10" />
            SOS
          </button>
        ) : (
          <button onClick={cancel} className="w-40 h-40 rounded-full bg-slate-900 text-white font-black flex flex-col items-center justify-center cursor-pointer border-4 border-rose-500 animate-pulse" aria-label="Cancel SOS countdown">
            <span className="text-5xl">{count}</span>
            <span className="text-xs font-bold mt-1">TAP TO CANCEL</span>
          </button>
        )}
        <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm">
          Starts a siren and creates a <b>live-tracking link</b> that updates with your location. Then send it to your contacts with one tap. For immediate danger, call <a href="tel:112" className="font-bold text-rose-600">112</a> first.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl bg-rose-600 text-white flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-black text-lg flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-white animate-ping" /> SOS ACTIVE</div>
          <div className="text-xs text-rose-100">Your location is being shared live. Now send the link to people who can help.</div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { siren ? sound.stopEmergencySiren() : sound.startEmergencySiren(); setSiren(!siren); }} className="px-3 py-2 rounded-lg bg-white/15 hover:bg-white/25 text-xs font-bold flex items-center gap-1.5 cursor-pointer">
            {siren ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />} {siren ? 'Mute siren' : 'Siren'}
          </button>
          <button onClick={end} className="px-3 py-2 rounded-lg bg-white text-rose-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"><Square className="w-3.5 h-3.5" /> I’m safe, stop</button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <code className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] font-mono-code truncate">{trackUrl(activeId)}</code>
        <Button size="sm" variant="secondary" icon={copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} onClick={async () => { setCopied(await copyText(msg)); setTimeout(() => setCopied(false), 1500); }}>
          {copied ? 'Copied' : 'Copy message'}
        </Button>
        <Button size="sm" icon={<Share2 className="w-3.5 h-3.5" />} onClick={share}>Share</Button>
      </div>

      {contacts.length === 0 ? (
        <p className="text-xs text-amber-700 dark:text-amber-300">You have no SOS contacts yet. Use Share above, or add contacts below for one-tap messaging.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[...contacts].sort((a, b) => a.priority - b.priority).map((c) => (
            <div key={c.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{c.name}</div>
                <div className="text-[11px] text-slate-500 truncate">{c.relation} · {c.phone}</div>
              </div>
              <div className="flex gap-1 shrink-0">
                <a href={`https://wa.me/${digits(c.phone).replace(/^\+/, '')}?text=${encodeURIComponent(msg)}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-emerald-600 text-white" aria-label={`WhatsApp ${c.name}`}>
                  <MessageCircle className="w-4 h-4" />
                </a>
                <a href={`sms:${digits(c.phone)}?body=${encodeURIComponent(msg)}`} className="p-2 rounded-lg bg-cyan-600 text-white text-[10px] font-bold" aria-label={`Text ${c.name}`}>SMS</a>
                <a href={`tel:${digits(c.phone)}`} className="p-2 rounded-lg bg-slate-900 dark:bg-slate-700 text-white" aria-label={`Call ${c.name}`}>
                  <Phone className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="text-[11px] text-slate-500">CyberShield can’t send SMS by itself. These buttons open WhatsApp or your messages app with the text ready, so you just press send.</p>
    </div>
  );
};
