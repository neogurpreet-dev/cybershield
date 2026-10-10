import React, { useState } from 'react';
import { CheckCircle2, XCircle, Copy, Check, BadgeCheck } from 'lucide-react';
import { serverTimestamp } from 'firebase/firestore';
import { Badge, Button } from '../../ui/ui';
import { checkVerification } from '../../lib/dns';
import { updateItem } from '../../lib/db';
import { copyText, formatDateTime } from '../../lib/format';
import { toast } from '../../lib/toast';
import type { DomainScan, MonitoredDomain } from '../../types';

export const HeadersPanel: React.FC<{ scan: DomainScan }> = ({ scan }) => {
  const h = scan.site?.headers;
  if (!h) return <p className="text-xs text-slate-500">Header check unavailable.</p>;
  if (!h.reachable) return <p className="text-xs text-rose-600">Website not reachable over HTTPS: {h.error}</p>;
  return (
    <div className="space-y-2 text-xs">
      <div className="flex items-center gap-2">
        <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{h.grade}</span>
        <span className="text-slate-500">{h.score}/100 · HTTP {h.status}{h.server ? ` · server: ${h.server}` : ''}</span>
      </div>
      {h.checks.map((c: any) => (
        <div key={c.key} className="flex gap-2.5 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
          {c.present ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> : <XCircle className="w-4 h-4 text-rose-500 shrink-0" />}
          <div className="min-w-0">
            <div className="font-semibold text-slate-800 dark:text-slate-200">{c.label}</div>
            {c.present ? <div className="font-mono-code text-[10px] text-slate-500 break-all">{c.value}</div> : <div className="text-slate-500">{c.advice}</div>}
          </div>
        </div>
      ))}
    </div>
  );
};

export const EmailPanel: React.FC<{ scan: DomainScan }> = ({ scan }) => (
  <div className="space-y-3 text-xs">
    {[
      ['SPF', scan.spf.present, scan.spf.record, 'Lists which servers may send email for your domain.'],
      ['DMARC', scan.dmarc.present, scan.dmarc.record, 'Tells receivers what to do with email that fails SPF/DKIM checks.'],
    ].map(([name, ok, rec, about]) => (
      <div key={name as string} className="p-3 rounded-lg border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-900 dark:text-slate-100">{name as string}</span>
          {ok ? <Badge tone="emerald">Found</Badge> : <Badge tone={(scan.dns.MX || []).length ? 'rose' : 'slate'}>Missing</Badge>}
        </div>
        <div className="text-slate-500 mt-1">{about as string}</div>
        {rec && <div className="font-mono-code text-[10px] mt-1.5 break-all text-slate-700 dark:text-slate-300">{rec as string}</div>}
      </div>
    ))}
  </div>
);

export const VerifyPanel: React.FC<{ uid: string; d: MonitoredDomain }> = ({ uid, d }) => {
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const host = `_cybershield.${d.domain}`;
  const value = `cybershield-verify=${d.verifyToken}`;

  const copy = async (v: string) => {
    if (await copyText(v)) {
      setCopied(v);
      setTimeout(() => setCopied(null), 1500);
    }
  };

  const verify = async () => {
    setBusy(true);
    try {
      if (await checkVerification(d.domain, d.verifyToken)) {
        await updateItem(uid, 'domains', d.id, { verified: true, verifiedAt: serverTimestamp() });
        toast('Ownership verified', `${d.domain} is confirmed as yours.`, 'success');
      } else {
        toast('Record not found yet', 'DNS changes can take a few minutes to an hour to appear. Try again later.', 'warning');
      }
    } catch (e: any) {
      toast('Verification failed', e.message, 'danger');
    } finally {
      setBusy(false);
    }
  };

  if (d.verified) {
    return (
      <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300">
        <BadgeCheck className="w-5 h-5" /> Ownership verified {formatDateTime(d.verifiedAt)} via DNS TXT record.
      </div>
    );
  }
  return (
    <div className="space-y-3 text-xs">
      <p className="text-slate-600 dark:text-slate-400">Prove this domain is yours by adding this TXT record at your DNS provider (GoDaddy, Cloudflare, Hostinger…), then press Verify.</p>
      {[['Type', 'TXT'], ['Name / Host', host], ['Value', value]].map(([k, v]) => (
        <div key={k} className="flex items-center gap-2">
          <span className="w-24 text-slate-500 shrink-0">{k}</span>
          <code className="flex-1 min-w-0 px-2 py-1.5 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono-code text-[11px] break-all">{v}</code>
          {k !== 'Type' && (
            <button onClick={() => copy(v)} className="p-1.5 text-slate-400 hover:text-cyan-600 cursor-pointer" aria-label={`Copy ${k}`}>
              {copied === v ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      ))}
      <Button onClick={verify} loading={busy} size="sm">Verify now</Button>
    </div>
  );
};
