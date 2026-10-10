import React, { useState } from 'react';
import { KeyRound, Eye, EyeOff, ShieldCheck, ShieldX, Wand2, Copy } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import { Button, Card, CardHeader, inputCls } from '../../ui/ui';
import { generatePassword, passwordStrength, pwnedCount } from '../../lib/hibp';
import { addItem, logEvent } from '../../lib/db';
import { copyText } from '../../lib/format';
import { toast } from '../../lib/toast';

const BAR = ['bg-rose-500', 'bg-orange-500', 'bg-amber-500', 'bg-emerald-500', 'bg-emerald-600'];

export const PasswordChecker: React.FC<{ uid: string }> = ({ uid }) => {
  const [pw, setPw] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const strength = passwordStrength(pw);

  const check = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pw) return;
    setBusy(true);
    setError(null);
    try {
      const n = await pwnedCount(pw);
      setCount(n);
      // Only the outcome is logged. The password itself is never stored or sent.
      logEvent(uid, 'password_check', n > 0 ? 'dangerous' : 'safe', n > 0 ? 'Password found in breaches' : 'Password not found in breaches', n > 0 ? `${n.toLocaleString()} times` : '');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remind = async () => {
    await addItem(uid, 'tasks', {
      title: 'Change the password that appeared in a data breach (everywhere it is used)',
      category: 'accounts',
      priority: 'critical',
      dueAt: Timestamp.fromDate(new Date(Date.now() + 2 * 3600_000)),
      done: false,
      notified: false,
    });
    toast('Reminder added', 'Find it under Overview → Security tasks.', 'success');
  };

  return (
    <Card className="space-y-4">
      <CardHeader
        icon={<KeyRound className="w-4 h-4 text-emerald-500" />}
        title="Has my password been leaked?"
        subtitle="Checks against 900M+ passwords from real data breaches (Have I Been Pwned)."
      />
      <form onSubmit={check} className="space-y-2">
        <div className="relative">
          <input
            type={show ? 'text' : 'password'}
            className={`${inputCls} pr-10`}
            value={pw}
            onChange={(e) => {
              setPw(e.target.value);
              setCount(null);
            }}
            placeholder="Type a password to test"
            autoComplete="off"
            aria-label="Password to check"
          />
          <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 cursor-pointer" aria-label={show ? 'Hide password' : 'Show password'}>
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {pw && (
          <div className="space-y-1">
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map((i) => <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= strength.score ? BAR[strength.score] : 'bg-slate-200 dark:bg-slate-800'}`} />)}
            </div>
            <div className="text-[11px] text-slate-600 dark:text-slate-400">
              Strength: <b>{strength.label}</b>
              {strength.tips.length > 0 && ` · ${strength.tips[0]}`}
            </div>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <Button type="submit" variant="success" loading={busy} disabled={!pw}>Check for leaks</Button>
          <Button
            type="button"
            variant="secondary"
            icon={<Wand2 className="w-3.5 h-3.5" />}
            onClick={() => {
              setPw(generatePassword(20));
              setShow(true);
              setCount(null);
            }}
          >
            Generate a strong one
          </Button>
          {pw && show && (
            <Button type="button" variant="ghost" icon={<Copy className="w-3.5 h-3.5" />} onClick={async () => toast((await copyText(pw)) ? 'Copied' : 'Copy failed', undefined, 'info')}>
              Copy
            </Button>
          )}
        </div>
      </form>

      {error && <div className="text-xs p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300">{error}</div>}
      {count !== null &&
        (count > 0 ? (
          <div className="p-3 rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30 flex gap-3 animate-fadeIn">
            <ShieldX className="w-6 h-6 text-rose-600 shrink-0" />
            <div className="text-xs text-rose-800 dark:text-rose-200 space-y-2">
              <div className="font-bold text-sm">Leaked {count.toLocaleString()} times</div>
              <p>Criminals use leaked lists to break into accounts. Stop using this password everywhere, and change it on every site where you used it.</p>
              <Button size="sm" variant="danger" onClick={remind}>Remind me to change it</Button>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 flex gap-3 animate-fadeIn">
            <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
            <div className="text-xs text-emerald-800 dark:text-emerald-200">
              <div className="font-bold text-sm">Not found in known breaches</div>
              <p>Good sign, but still use it on only one account and turn on two-step verification.</p>
            </div>
          </div>
        ))}
      <p className="text-[11px] text-slate-500">
        Private by design: your password never leaves this device. Only the first 5 characters of its SHA-1 fingerprint are sent (k-anonymity), and nothing is saved.
      </p>
    </Card>
  );
};
