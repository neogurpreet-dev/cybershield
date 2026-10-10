import React, { useState } from 'react';
import { Shield, Link2, Globe, Lock, LifeBuoy, ShieldAlert, Loader2 } from 'lucide-react';
import { friendlyAuthError, useAuth } from '../hooks/useAuth';
import { GoogleIcon } from './GoogleIcon';

const FEATURES = [
  { icon: Link2, title: 'Check suspicious links', body: 'AI-assisted scam and phishing checks using real domain age, certificate and redirect data.' },
  { icon: Globe, title: 'Monitor your domains', body: 'Live DNS, SSL certificate, email-spoofing and security-header checks with change alerts.' },
  { icon: Lock, title: 'Encrypted vault', body: 'Passwords and recovery codes encrypted on your device. Only you hold the key.' },
  { icon: LifeBuoy, title: 'Emergency SOS', body: 'Share a live-tracking link with your contacts and find the nearest hospitals and police.' },
  { icon: ShieldAlert, title: 'Incident tracking', body: 'Log what happened, follow a step-by-step checklist, and export reports as PDF or Word.' },
];

export const SignInScreen: React.FC = () => {
  const { signIn } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const go = async () => {
    setBusy(true);
    setError(null);
    try {
      await signIn();
    } catch (e) {
      setError(friendlyAuthError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#070a0f] text-slate-800 dark:text-slate-200 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-6 items-center">
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-600 text-white flex items-center justify-center shadow-md">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">CyberShield</h1>
              <p className="text-xs text-slate-500">Personal security &amp; emergency toolkit</p>
            </div>
          </div>
          <ul className="space-y-3">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center shrink-0 text-cyan-600 dark:text-cyan-400">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</div>
                  <div className="text-xs text-slate-500">{body}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white dark:bg-[#0e141e] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Sign in to continue</h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Your incidents, domains, contacts and vault are private to your account and sync across your devices.
          </p>
          <button
            onClick={go}
            disabled={busy}
            className="mt-6 w-full flex items-center justify-center gap-2.5 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-semibold text-slate-800 dark:text-slate-100 transition cursor-pointer disabled:opacity-60"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleIcon />}
            Continue with Google
          </button>
          {error && (
            <p className="mt-3 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-lg p-2.5">{error}</p>
          )}
          <p className="mt-6 text-[11px] text-slate-500 leading-relaxed">
            In an emergency, don’t wait: call <a href="tel:112" className="font-bold text-rose-600">112</a>. For online fraud, call{' '}
            <a href="tel:1930" className="font-bold text-rose-600">1930</a>.
          </p>
        </div>
      </div>
    </div>
  );
};
