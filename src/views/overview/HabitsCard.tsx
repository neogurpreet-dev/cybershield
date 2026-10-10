import React from 'react';
import { ShieldCheck, Check } from 'lucide-react';
import { setDoc } from 'firebase/firestore';
import { Card, CardHeader, Badge } from '../../ui/ui';
import { userDoc } from '../../lib/db';
import { sound } from '../../services/audio';

export const HABITS = [
  { id: 'mfa', label: 'Two-step verification (2FA) is on for my email, bank and social accounts', area: 'Accounts' },
  { id: 'unique', label: 'I use a different password for every important account', area: 'Passwords' },
  { id: 'updates', label: 'Automatic updates are on for my phone, computer and browser', area: 'Devices' },
  { id: 'backup', label: 'My important files are backed up somewhere other than this device', area: 'Backups' },
  { id: 'lock', label: 'My phone and laptop lock with a PIN, password or fingerprint', area: 'Devices' },
  { id: 'otp', label: 'I never share OTPs, PINs or passwords with anyone, even “bank staff”', area: 'Scams' },
  { id: 'recovery', label: 'My account recovery email and phone number are up to date', area: 'Accounts' },
  { id: 'upi', label: 'I check the payee name before approving any UPI request', area: 'Payments' },
];

export const HabitsCard: React.FC<{ uid: string; checklist: Record<string, boolean> }> = ({ uid, checklist }) => {
  const done = HABITS.filter((h) => checklist[h.id]).length;
  const pct = Math.round((done / HABITS.length) * 100);

  const toggle = (id: string) => {
    const next = !checklist[id];
    next ? sound.playSuccess() : sound.playBeep(600, 0.04);
    setDoc(userDoc(uid), { checklist: { [id]: next } }, { merge: true });
  };

  return (
    <Card className="space-y-3">
      <CardHeader
        icon={<ShieldCheck className="w-4 h-4 text-emerald-500" />}
        title="Safety habits"
        subtitle="Tick the habits you already follow. This is your own self-assessment, saved to your account."
        action={<Badge tone={pct >= 75 ? 'emerald' : pct >= 40 ? 'amber' : 'rose'}>{done}/{HABITS.length} done</Badge>}
      />
      <div className="space-y-2">
        {HABITS.map((h) => {
          const on = Boolean(checklist[h.id]);
          return (
            <button
              key={h.id}
              onClick={() => toggle(h.id)}
              aria-pressed={on}
              className={`w-full text-left p-3 rounded-xl border transition cursor-pointer flex items-start gap-3 ${
                on ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/70' : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <span className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center shrink-0 ${on ? 'bg-emerald-600 text-white' : 'border-2 border-slate-400 dark:border-slate-600'}`}>
                {on && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-xs font-semibold text-slate-800 dark:text-slate-200 leading-snug">{h.label}</span>
                <span className="block text-[10px] text-slate-500 mt-1 uppercase font-semibold tracking-wide">{h.area}</span>
              </span>
            </button>
          );
        })}
      </div>
    </Card>
  );
};
