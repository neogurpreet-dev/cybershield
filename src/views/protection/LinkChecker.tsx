import React, { useState } from 'react';
import { Link2, Search, ShieldAlert, History } from 'lucide-react';
import { Button, Card, CardHeader, inputCls } from '../../ui/ui';
import { apiPost } from '../../lib/api';
import { createIncident, logEvent, notify } from '../../lib/db';
import { timeAgo } from '../../lib/format';
import { toast } from '../../lib/toast';
import { useCollection } from '../../hooks/useFirestore';
import type { SecurityEvent } from '../../types';
import { LinkResult } from './LinkResult';
import type { UrlCheckResult } from './linkTypes';

export const LinkChecker: React.FC<{ uid: string }> = ({ uid }) => {
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<UrlCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [incidentFor, setIncidentFor] = useState<string | null>(null);
  const { items: history } = useCollection<SecurityEvent>(uid, 'events', { orderBy: ['createdAt', 'desc'], limit: 40 });
  const recent = history.filter((e) => e.type === 'url_check').slice(0, 6);

  const openIncident = async (r: UrlCheckResult, auto: boolean) => {
    const { number } = await createIncident(uid, {
      title: `${r.verdict === 'dangerous' ? 'Dangerous' : 'Suspicious'} link: ${r.host}`,
      category: 'phishing',
      severity: r.verdict === 'dangerous' ? 'high' : 'medium',
      summary: r.ai?.summary || `CyberShield flagged ${r.host} as ${r.verdict} (risk ${r.riskScore}/100).`,
      details: [`Link: ${r.url}`, `Final address: ${r.finalUrl}`, '', 'Signals:', ...r.signals.map((s) => `- ${s.label}: ${s.detail}`)].join('\n'),
      source: 'url_check',
      sourceRef: r.url,
    });
    setIncidentFor(r.url);
    if (!auto) toast(`Incident #${number} opened`, 'Find it under Incidents with a step-by-step checklist.', 'success');
    return number;
  };

  const check = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setBusy(true);
    setError(null);
    setResult(null);
    setIncidentFor(null);
    try {
      const r = await apiPost<UrlCheckResult>('/api/url-check', { url: url.trim() });
      setResult(r);
      logEvent(uid, 'url_check', r.verdict, r.host, `${r.verdict} · risk ${r.riskScore}`);
      if (r.verdict === 'dangerous') {
        const n = await openIncident(r, true);
        notify(uid, 'Dangerous link blocked', `${r.host} looks like a scam. Incident #${n} was opened for you.`, 'security', 'danger');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="space-y-4">
      <CardHeader
        icon={<Link2 className="w-4 h-4 text-cyan-500" />}
        title="Link safety checker"
        subtitle="Paste a link from an SMS, WhatsApp, email or ad. CyberShield checks it without you opening it."
      />
      <form onSubmit={check} className="flex flex-col sm:flex-row gap-2">
        <input
          className={`${inputCls} font-mono-code`}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/login"
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          aria-label="Link to check"
        />
        <Button type="submit" loading={busy} icon={<Search className="w-3.5 h-3.5" />} className="shrink-0">
          {busy ? 'Checking…' : 'Check link'}
        </Button>
      </form>
      <p className="text-[11px] text-slate-500 leading-relaxed">
        We look up the domain’s registration age, its security certificate, where it redirects, and red flags in the address, then Gemini AI weighs the evidence.
        This is a careful assessment, not a guarantee. If money or passwords are involved and you are unsure, don’t proceed.
      </p>

      {error && <div className="text-xs p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300">{error}</div>}
      {result && (
        <LinkResult
          r={result}
          actions={
            result.verdict !== 'safe' &&
            (incidentFor === result.url ? (
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Incident opened. See the Incidents tab.</span>
            ) : (
              <Button size="sm" variant="danger" icon={<ShieldAlert className="w-3.5 h-3.5" />} onClick={() => openIncident(result, false)}>
                Open an incident
              </Button>
            ))
          }
        />
      )}

      {recent.length > 0 && (
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 mb-2">
            <History className="w-3.5 h-3.5" /> Your recent checks
          </div>
          <div className="space-y-1">
            {recent.map((e) => (
              <div key={e.id} className="flex items-center justify-between gap-2 text-xs">
                <span className="font-mono-code truncate text-slate-700 dark:text-slate-300">{e.title}</span>
                <span className="flex items-center gap-2 shrink-0">
                  <span className={`font-semibold ${e.verdict === 'safe' ? 'text-emerald-600' : e.verdict === 'suspicious' ? 'text-amber-600' : 'text-rose-600'}`}>{e.verdict}</span>
                  <span className="text-slate-400 text-[11px]">{timeAgo(e.createdAt)}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};
