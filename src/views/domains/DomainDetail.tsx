import React, { useState } from 'react';
import { RefreshCw, Trash2, GitCompare, ShieldAlert, ExternalLink } from 'lucide-react';
import { Badge, Button, Card, CardHeader, ScoreRing, useConfirm } from '../../ui/ui';
import { createIncident, removeItem } from '../../lib/db';
import { formatDateTime } from '../../lib/format';
import { toast } from '../../lib/toast';
import type { MonitoredDomain } from '../../types';
import { runDomainScan } from './runScan';
import { CertificatePanel, DnsTable, Findings } from './ScanSections';
import { EmailPanel, HeadersPanel, VerifyPanel } from './MoreSections';

type Tab = 'findings' | 'dns' | 'cert' | 'headers' | 'email' | 'verify';
const TABS: [Tab, string][] = [
  ['findings', 'Findings'],
  ['dns', 'DNS records'],
  ['cert', 'SSL certificate'],
  ['headers', 'Security headers'],
  ['email', 'Email security'],
  ['verify', 'Ownership'],
];

export const DomainDetail: React.FC<{ uid: string; d: MonitoredDomain; onRemoved: () => void }> = ({ uid, d, onRemoved }) => {
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<Tab>('findings');
  const { confirm, dialog } = useConfirm();
  const scan = d.lastScan;

  const rescan = async () => {
    setBusy(true);
    try {
      const s = await runDomainScan(uid, d);
      toast(`${d.domain} scanned`, `Score ${s.score}/100${s.changes?.length ? ` · ${s.changes.length} change(s) detected` : ''}`, s.score >= 80 ? 'success' : 'warning');
    } catch (e: any) {
      toast('Scan failed', e.message, 'danger');
    } finally {
      setBusy(false);
    }
  };

  const report = async () => {
    if (!scan) return;
    const problems = scan.findings.filter((f) => f.level === 'bad' || f.level === 'warn');
    const { number } = await createIncident(uid, {
      title: `Security issues on ${d.domain}`,
      category: 'website',
      severity: scan.score < 50 ? 'high' : 'medium',
      summary: `Domain scan scored ${scan.score}/100 with ${problems.length} issue(s).`,
      details: problems.map((f) => `- ${f.title}${f.fix ? `\n  Fix: ${f.fix}` : ''}`).join('\n'),
      source: 'domain_scan',
      sourceRef: d.domain,
    });
    toast(`Incident #${number} opened`, undefined, 'success');
  };

  return (
    <Card className="space-y-4">
      {dialog}
      <CardHeader
        title={
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-mono-code">{d.domain}</span>
            {d.verified ? <Badge tone="emerald">Verified owner</Badge> : <Badge tone="amber">Not verified</Badge>}
          </span>
        }
        subtitle={scan ? `Last scanned ${formatDateTime(scan.at)}` : 'Not scanned yet'}
        action={
          <div className="flex gap-2">
            <a href={`https://${d.domain}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Open website">
              <ExternalLink className="w-4 h-4" />
            </a>
            <Button onClick={rescan} loading={busy} icon={<RefreshCw className="w-3.5 h-3.5" />}>{scan ? 'Scan again' : 'Scan now'}</Button>
            <Button
              variant="ghost"
              aria-label="Remove domain"
              icon={<Trash2 className="w-3.5 h-3.5" />}
              onClick={async () => {
                if (await confirm(`Stop monitoring ${d.domain}?`, 'Its scan history will be removed from CyberShield. Your actual domain is not affected.', 'Remove')) {
                  await removeItem(uid, 'domains', d.id);
                  onRemoved();
                }
              }}
            />
          </div>
        }
      />
      {!scan ? (
        <p className="text-xs text-slate-500">Press <b>Scan now</b> to run live DNS, certificate, header and email-security checks.</p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-4">
            <ScoreRing score={scan.score} size={64} />
            <div className="text-xs text-slate-600 dark:text-slate-400 flex-1 min-w-[200px]">
              {scan.findings.filter((f) => f.level === 'bad').length} critical · {scan.findings.filter((f) => f.level === 'warn').length} warnings ·{' '}
              {scan.findings.filter((f) => f.level === 'good').length} passed
              {scan.site?.addresses && <div className="text-[11px] text-slate-500 mt-0.5">Resolves to {scan.site.addresses.slice(0, 3).join(', ')}</div>}
            </div>
            {scan.score < 80 && (
              <Button size="sm" variant="secondary" icon={<ShieldAlert className="w-3.5 h-3.5" />} onClick={report}>Track as incident</Button>
            )}
          </div>
          {scan.changes && scan.changes.length > 0 && (
            <div className="p-3 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300 mb-1"><GitCompare className="w-4 h-4" /> Changed since the previous scan</div>
              <ul className="list-disc pl-5 text-amber-900 dark:text-amber-200 font-mono-code text-[11px] space-y-0.5">
                {scan.changes.map((c, i) => <li key={i} className="break-all">{c}</li>)}
              </ul>
              <p className="text-amber-800/80 dark:text-amber-300/80 mt-1">If you didn’t make these changes, someone may have access to your DNS account.</p>
            </div>
          )}
          <div className="flex gap-1 overflow-x-auto border-b border-slate-100 dark:border-slate-800 text-xs">
            {TABS.map(([id, label]) => (
              <button key={id} onClick={() => setTab(id)} className={`px-3 py-2 -mb-px border-b-2 whitespace-nowrap font-semibold cursor-pointer ${tab === id ? 'border-cyan-500 text-cyan-700 dark:text-cyan-300' : 'border-transparent text-slate-500'}`}>
                {label}
              </button>
            ))}
          </div>
          {tab === 'findings' && <Findings scan={scan} />}
          {tab === 'dns' && <DnsTable scan={scan} />}
          {tab === 'cert' && <CertificatePanel scan={scan} />}
          {tab === 'headers' && <HeadersPanel scan={scan} />}
          {tab === 'email' && <EmailPanel scan={scan} />}
        </>
      )}
      {(tab === 'verify' || !scan) && (
        <div className={scan ? '' : 'pt-3 border-t border-slate-100 dark:border-slate-800'}>
          <VerifyPanel uid={uid} d={d} />
        </div>
      )}
    </Card>
  );
};
