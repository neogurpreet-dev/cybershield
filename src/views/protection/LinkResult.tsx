import React from 'react';
import { ShieldCheck, ShieldAlert, ShieldX, Sparkles, ExternalLink } from 'lucide-react';
import { SIGNAL_DOT, VERDICT_STYLE, type UrlCheckResult } from './linkTypes';

export const LinkResult: React.FC<{ r: UrlCheckResult; actions?: React.ReactNode }> = ({ r, actions }) => {
  const style = VERDICT_STYLE[r.verdict];
  const Icon = r.verdict === 'safe' ? ShieldCheck : r.verdict === 'suspicious' ? ShieldAlert : ShieldX;
  return (
    <div className={`rounded-xl border p-4 space-y-3 animate-fadeIn ${style.box}`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-7 h-7 shrink-0 ${style.text}`} />
        <div className="min-w-0 flex-1">
          <div className={`text-base font-bold ${style.text}`}>{style.label}</div>
          <div className="text-[11px] text-slate-600 dark:text-slate-400 break-all font-mono-code mt-0.5">{r.host}</div>
          {r.finalUrl && new URL(r.finalUrl).hostname !== r.host && (
            <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 break-all">
              Ends up at: <span className="font-mono-code">{new URL(r.finalUrl).hostname}</span>
            </div>
          )}
        </div>
        <div className="text-right shrink-0">
          <div className="text-[10px] uppercase text-slate-500 font-semibold">Risk</div>
          <div className={`text-lg font-bold ${style.text}`}>{r.riskScore}</div>
        </div>
      </div>

      {r.ai ? (
        <div className="rounded-lg bg-white/70 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 p-3 space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-cyan-700 dark:text-cyan-300">
            <Sparkles className="w-3.5 h-3.5" /> AI assessment ({r.ai.confidence}% confident)
          </div>
          <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed">{r.ai.summary}</p>
          {r.ai.reasons.length > 0 && (
            <ul className="list-disc pl-5 text-xs text-slate-700 dark:text-slate-300 space-y-0.5">
              {r.ai.reasons.map((x, i) => <li key={i}>{x}</li>)}
            </ul>
          )}
          <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">What to do: {r.ai.advice}</p>
        </div>
      ) : (
        <p className="text-[11px] text-slate-600 dark:text-slate-400">
          {r.aiConfigured ? `AI assessment unavailable (${r.aiError || 'unknown error'}). Verdict is based on the measured checks below.` : 'AI assessment is not configured. The verdict is based on the measured checks below.'}
        </p>
      )}

      <div className="space-y-1.5">
        <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">What CyberShield measured</div>
        {r.signals.map((s, i) => (
          <div key={i} className="flex items-start gap-2 text-xs">
            <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${SIGNAL_DOT[s.level]}`} />
            <span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{s.label}.</span> <span className="text-slate-600 dark:text-slate-400">{s.detail}</span>
            </span>
          </div>
        ))}
        {r.pageTitle && <div className="text-[11px] text-slate-500 pt-1">Page title: “{r.pageTitle}”</div>}
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        {actions}
        {r.verdict === 'safe' && (
          <a href={r.finalUrl} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-700 dark:text-cyan-300 hover:underline">
            Open link <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
};
