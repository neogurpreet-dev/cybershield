import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, Copy, Check } from 'lucide-react';
import { Badge } from '../../ui/ui';
import { RECORD_TYPES } from '../../lib/dns';
import { copyText } from '../../lib/format';
import type { DomainScan } from '../../types';

const LEVEL_ICON = {
  good: <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />,
  warn: <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />,
  bad: <XCircle className="w-4 h-4 text-rose-500 shrink-0" />,
  info: <Info className="w-4 h-4 text-slate-400 shrink-0" />,
};
const ORDER = { bad: 0, warn: 1, info: 2, good: 3 };

export const Findings: React.FC<{ scan: DomainScan }> = ({ scan }) => (
  <div className="space-y-2">
    {[...scan.findings].sort((a, b) => ORDER[a.level] - ORDER[b.level]).map((f, i) => (
      <div key={i} className="flex gap-2.5 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
        {LEVEL_ICON[f.level]}
        <div>
          <div className="font-semibold text-slate-800 dark:text-slate-200">{f.title}</div>
          {f.fix && f.level !== 'good' && <div className="text-slate-500 mt-0.5">{f.fix}</div>}
        </div>
      </div>
    ))}
  </div>
);

export const DnsTable: React.FC<{ scan: DomainScan }> = ({ scan }) => {
  const [type, setType] = useState<string>('A');
  const rows = scan.dns[type] || [];
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1">
        {RECORD_TYPES.map((t) => (
          <button key={t} onClick={() => setType(t)} className={`px-2.5 py-1 rounded-md text-[11px] font-mono-code font-bold cursor-pointer ${type === t ? 'bg-slate-900 dark:bg-slate-700 text-white' : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400'}`}>
            {t} <span className="opacity-60">{(scan.dns[t] || []).length}</span>
          </button>
        ))}
      </div>
      <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-900/70 text-slate-500 text-[11px]">
            <tr>
              <th className="py-2 px-3 font-semibold">Value</th>
              <th className="py-2 px-3 font-semibold w-20">TTL</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {rows.length === 0 && (
              <tr>
                <td colSpan={2} className="py-3 px-3 text-slate-500">No {type} records.</td>
              </tr>
            )}
            {rows.map((r, i) => (
              <tr key={i}>
                <td className="py-2 px-3 font-mono-code text-slate-700 dark:text-slate-300 break-all">{r.data}</td>
                <td className="py-2 px-3 text-slate-500">{r.ttl}s</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-slate-500">Live answers from Google Public DNS{scan.dnssec ? ', DNSSEC-validated' : ''}. CyberShield shows your records but cannot edit them. Change records at your domain registrar or DNS host.</p>
    </div>
  );
};

export const CertificatePanel: React.FC<{ scan: DomainScan }> = ({ scan }) => {
  const tls = scan.site?.tls;
  const [copied, setCopied] = useState(false);
  if (!tls) return <p className="text-xs text-slate-500">{scan.site?.error || 'Certificate check unavailable.'}</p>;
  if (!tls.reachable) return <p className="text-xs text-rose-600">HTTPS not reachable: {tls.error}</p>;
  const pct = Math.max(0, Math.min(100, (tls.daysRemaining / 90) * 100));
  const rows: [string, React.ReactNode][] = [
    ['Issued to', tls.subject],
    ['Issued by', `${tls.issuerOrg || ''} ${tls.issuer ? `(${tls.issuer})` : ''}`],
    ['Valid from', new Date(tls.validFrom).toLocaleDateString()],
    ['Expires', new Date(tls.validTo).toLocaleDateString()],
    ['Protocol', `${tls.protocol} · ${tls.cipher}`],
    ['Trusted', tls.authorized ? <Badge tone="emerald">Yes</Badge> : <Badge tone="rose">{tls.authorizationError}</Badge>],
  ];
  return (
    <div className="space-y-3 text-xs">
      <div>
        <div className="flex justify-between font-semibold mb-1">
          <span className="text-slate-700 dark:text-slate-300">Time left</span>
          <span className={tls.daysRemaining < 14 ? 'text-rose-600' : tls.daysRemaining < 30 ? 'text-amber-600' : 'text-emerald-600'}>{tls.daysRemaining} days</span>
        </div>
        <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
          <div className={`h-full ${tls.daysRemaining < 14 ? 'bg-rose-500' : tls.daysRemaining < 30 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
      <dl className="grid grid-cols-[110px_1fr] gap-y-1.5">
        {rows.map(([k, v]) => (
          <React.Fragment key={k}>
            <dt className="text-slate-500">{k}</dt>
            <dd className="text-slate-800 dark:text-slate-200 break-words">{v}</dd>
          </React.Fragment>
        ))}
      </dl>
      <div>
        <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
          <span>SHA-256 fingerprint</span>
          <button onClick={async () => { setCopied(await copyText(tls.fingerprint256)); setTimeout(() => setCopied(false), 1500); }} className="flex items-center gap-1 text-cyan-600 cursor-pointer">
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <div className="font-mono-code text-[10px] break-all p-2 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">{tls.fingerprint256}</div>
      </div>
      {tls.altNames?.length > 0 && <div className="text-[11px] text-slate-500">Also covers: {tls.altNames.slice(0, 8).join(', ')}{tls.altNames.length > 8 ? ` +${tls.altNames.length - 8} more` : ''}</div>}
    </div>
  );
};
