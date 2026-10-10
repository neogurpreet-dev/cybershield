import React, { useState } from 'react';
import { Lock, KeyRound, ShieldAlert } from 'lucide-react';
import { Button, Card, Field, inputCls } from '../../ui/ui';
import { passwordStrength } from '../../lib/hibp';

export const VaultSetup: React.FC<{ onSetup: (p: string) => Promise<void> }> = ({ onSetup }) => {
  const [p1, setP1] = useState('');
  const [p2, setP2] = useState('');
  const [ack, setAck] = useState(false);
  const [busy, setBusy] = useState(false);
  const s = passwordStrength(p1);
  const ok = p1.length >= 10 && p1 === p2 && ack && s.score >= 2;

  return (
    <Card className="max-w-lg mx-auto space-y-4">
      <div className="text-center">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mb-3"><Lock className="w-6 h-6" /></div>
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Create your encrypted vault</h2>
        <p className="text-xs text-slate-500 mt-1">Pick a passphrase only you know. Everything in the vault is encrypted with it on this device before it’s saved.</p>
      </div>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!ok) return;
          setBusy(true);
          try {
            await onSetup(p1);
          } finally {
            setBusy(false);
          }
        }}
        className="space-y-3"
      >
        <Field label="Passphrase" hint={p1 ? `Strength: ${s.label}${s.tips[0] ? ` · ${s.tips[0]}` : ''}` : 'At least 10 characters. 4 random words work well, e.g. “mango river lamp seventy”.'}>
          <input type="password" className={inputCls} value={p1} onChange={(e) => setP1(e.target.value)} autoComplete="new-password" />
        </Field>
        <Field label="Repeat passphrase">
          <input type="password" className={inputCls} value={p2} onChange={(e) => setP2(e.target.value)} autoComplete="new-password" />
        </Field>
        {p2 && p1 !== p2 && <p className="text-xs text-rose-600">Passphrases don’t match.</p>}
        <label className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-200 cursor-pointer">
          <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} className="mt-0.5" />
          <span>I understand that <b>nobody can recover my vault</b> if I forget this passphrase. Not CyberShield, not Google.</span>
        </label>
        <Button type="submit" disabled={!ok} loading={busy} className="w-full">{busy ? 'Encrypting…' : 'Create vault'}</Button>
      </form>
    </Card>
  );
};

export const VaultUnlock: React.FC<{ onUnlock: (p: string) => Promise<boolean> }> = ({ onUnlock }) => {
  const [p, setP] = useState('');
  const [busy, setBusy] = useState(false);
  const [wrong, setWrong] = useState(false);
  return (
    <Card className="max-w-md mx-auto space-y-4">
      <div className="text-center">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-slate-900 dark:bg-slate-700 text-white flex items-center justify-center mb-3"><KeyRound className="w-6 h-6" /></div>
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Vault locked</h2>
        <p className="text-xs text-slate-500 mt-1">Enter your passphrase to decrypt your items on this device. It locks itself after 5 minutes of inactivity.</p>
      </div>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setWrong(false);
          const ok = await onUnlock(p);
          setBusy(false);
          if (!ok) setWrong(true);
          else setP('');
        }}
        className="space-y-3"
      >
        <input type="password" className={inputCls} value={p} onChange={(e) => setP(e.target.value)} placeholder="Passphrase" autoFocus autoComplete="current-password" aria-label="Vault passphrase" />
        {wrong && (
          <p className="text-xs text-rose-600 flex items-center gap-1"><ShieldAlert className="w-3.5 h-3.5" /> Wrong passphrase.</p>
        )}
        <Button type="submit" loading={busy} disabled={!p} className="w-full">{busy ? 'Decrypting…' : 'Unlock'}</Button>
      </form>
    </Card>
  );
};
