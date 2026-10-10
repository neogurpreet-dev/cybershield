import React, { useMemo, useState } from 'react';
import { TrendingUp, Link2 } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Card, CardHeader, EmptyState, Button } from '../../ui/ui';
import { toDate } from '../../lib/format';
import type { SecurityEvent } from '../../types';

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

export const ActivityChart: React.FC<{ events: SecurityEvent[]; onStart: () => void }> = ({ events, onStart }) => {
  const [range, setRange] = useState<7 | 30>(7);

  const { data, totals } = useMemo(() => {
    const days: { key: string; label: string; checks: number; threats: number }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      days.push({ key: dayKey(d), label: range === 7 ? d.toLocaleDateString([], { weekday: 'short' }) : d.toLocaleDateString([], { day: 'numeric', month: 'short' }), checks: 0, threats: 0 });
    }
    const byKey = new Map(days.map((d) => [d.key, d]));
    const start = new Date(today);
    start.setDate(today.getDate() - (range - 1));
    const t = { links: 0, threats: 0, domains: 0, passwords: 0, checkups: 0 };
    events.forEach((e) => {
      const at = toDate(e.createdAt);
      if (!at || at < start) return;
      const bucket = byKey.get(dayKey(at));
      if (!bucket) return;
      bucket.checks += 1;
      const isThreat = e.verdict === 'dangerous' || e.verdict === 'suspicious';
      if (isThreat) bucket.threats += 1;
      if (e.type === 'url_check') t.links += 1;
      if (e.type === 'domain_scan') t.domains += 1;
      if (e.type === 'password_check') t.passwords += 1;
      if (e.type === 'checkup') t.checkups += 1;
      if (isThreat) t.threats += 1;
    });
    return { data: days, totals: t };
  }, [events, range]);

  const any = data.some((d) => d.checks > 0);

  return (
    <Card>
      <CardHeader
        icon={<TrendingUp className="w-4 h-4 text-cyan-500" />}
        title="Your security activity"
        subtitle="Every link, password, domain and browser check you run, and how many problems they caught"
        action={
          <div className="flex items-center rounded-lg bg-slate-100 dark:bg-slate-900 p-0.5 border border-slate-200 dark:border-slate-800 text-xs">
            {[7, 30].map((r) => (
              <button key={r} onClick={() => setRange(r as 7 | 30)} className={`px-3 py-1 rounded-md font-semibold cursor-pointer ${range === r ? 'bg-cyan-600 text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                Past {r} days
              </button>
            ))}
          </div>
        }
      />
      {any ? (
        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gChecks" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gThreats" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} interval={range === 30 ? 4 : 0} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, fontSize: 12, color: '#e2e8f0' }} />
              <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: 8, fontSize: 11 }} />
              <Area type="monotone" dataKey="checks" name="Checks run" stroke="#06b6d4" strokeWidth={2} fill="url(#gChecks)" />
              <Area type="monotone" dataKey="threats" name="Problems found" stroke="#f43f5e" strokeWidth={2} fill="url(#gThreats)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <EmptyState
          icon={<Link2 className="w-5 h-5" />}
          title={`No checks in the past ${range} days`}
          body="This chart only shows real checks you run. Try checking a suspicious link or running a browser checkup."
          action={<Button onClick={onStart}>Open Protection</Button>}
        />
      )}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
        {[
          ['Links checked', totals.links, 'text-cyan-600 dark:text-cyan-400'],
          ['Problems caught', totals.threats, 'text-rose-600 dark:text-rose-400'],
          ['Domain scans', totals.domains, 'text-sky-600 dark:text-sky-400'],
          ['Passwords checked', totals.passwords, 'text-emerald-600 dark:text-emerald-400'],
        ].map(([label, value, color]) => (
          <div key={label as string} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
            <div className="text-[11px] text-slate-500 font-medium">{label}</div>
            <div className={`text-base font-bold mt-0.5 ${color}`}>{value as number}</div>
          </div>
        ))}
      </div>
    </Card>
  );
};
