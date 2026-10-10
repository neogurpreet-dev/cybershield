import React, { useState } from 'react';
import { MonitorCheck, CheckCircle2, AlertTriangle, XCircle, Info, Play } from 'lucide-react';
import { Button, Card, CardHeader, ScoreRing } from '../../ui/ui';
import { runBrowserCheckup } from '../../lib/checkup';
import { addItem, logEvent } from '../../lib/db';
import { formatDateTime } from '../../lib/format';
import { useCollection } from '../../hooks/useFirestore';
import type { CheckupResult } from '../../types';

const ICON = {
  pass: <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />,
  warn: <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />,
  fail: <XCircle className="w-4 h-4 text-rose-500 shrink-0" />,
  info: <Info className="w-4 h-4 text-slate-400 shrink-0" />,
};

export const BrowserCheckup: React.FC<{ uid: string }> = ({ uid }) => {
  const { items } = useCollection<CheckupResult>(uid, 'checkups', { orderBy: ['createdAt', 'desc'], limit: 6 });
  const [busy, setBusy] = useState(false);
  const [fresh, setFresh] = useState<Omit<CheckupResult, 'id' | 'createdAt'> | null>(null);
  const latest = fresh || items[0] || null;

  const run = async () => {
    setBusy(true);
    try {
      const r = await runBrowserCheckup();
      setFresh(r);
      await addItem(uid, 'checkups', r);
      const problems = r.checks.filter((c) => c.status === 'fail').length;
      logEvent(uid, 'checkup', problems ? 'suspicious' : 'safe', `Browser checkup ${r.score}/100`, `${r.device.browser} on ${r.device.os}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="space-y-4">
      <CardHeader
        icon={<MonitorCheck className="w-4 h-4 text-indigo-500" />}
        title="Browser security checkup"
        subtitle="Real checks on this browser and device that a website is allowed to see"
        action={<Button onClick={run} loading={busy} icon={<Play className="w-3.5 h-3.5" />}>{latest ? 'Run again' : 'Run checkup'}</Button>}
      />
      {latest ? (
        <>
          <div className="flex items-center gap-4">
            <ScoreRing score={latest.score} size={64} />
            <div className="text-xs">
              <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">{latest.device.browser}</div>
              <div className="text-slate-500">{latest.device.os}</div>
              {!fresh && items[0] && <div className="text-slate-400 text-[11px] mt-0.5">Checked {formatDateTime(items[0].createdAt)}</div>}
            </div>
          </div>
          <div className="space-y-2">
            {latest.checks.map((c) => (
              <div key={c.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex gap-3">
                {ICON[c.status]}
                <div className="text-xs min-w-0">
                  <div className="font-semibold text-slate-900 dark:text-slate-100">{c.label}</div>
                  <div className="text-slate-600 dark:text-slate-400 mt-0.5">{c.detail}</div>
                  {c.fix && c.status !== 'pass' && <div className="text-cyan-700 dark:text-cyan-300 mt-1 font-medium">Fix: {c.fix}</div>}
                </div>
              </div>
            ))}
          </div>
          {items.length > 1 && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="text-[11px] font-semibold text-slate-500 mb-1">History</div>
              <div className="flex flex-wrap gap-2">
                {items.map((h) => (
                  <span key={h.id} className="text-[11px] px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400">
                    {h.score} · {formatDateTime(h.createdAt)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <p className="text-xs text-slate-500">No checkup yet. It takes about 5 seconds and nothing leaves your device except anonymous version look-ups.</p>
      )}
      <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
        <b>Honest limits:</b> websites cannot scan your hard drive or remove viruses. For that, use <b>Windows Security</b> (Start → Windows Security → Virus &amp; threat protection → Quick scan) or your phone’s built-in protection (Google Play Protect / iOS updates).
      </div>
    </Card>
  );
};
