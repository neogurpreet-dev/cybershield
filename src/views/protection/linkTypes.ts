export interface UrlCheckResult {
  url: string;
  host: string;
  finalUrl: string;
  redirects: string[];
  verdict: 'safe' | 'suspicious' | 'dangerous';
  riskScore: number;
  heuristicVerdict: string;
  signals: { label: string; level: 'good' | 'info' | 'warn' | 'bad'; detail: string }[];
  domainAgeDays: number | null;
  pageTitle?: string;
  ai: null | { verdict: string; confidence: number; summary: string; reasons: string[]; advice: string };
  aiConfigured: boolean;
  aiError?: string;
  model?: string;
  checkedAt: string;
}

export const VERDICT_STYLE = {
  safe: { label: 'Looks safe', box: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800', text: 'text-emerald-700 dark:text-emerald-300' },
  suspicious: { label: 'Suspicious: be careful', box: 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800', text: 'text-amber-700 dark:text-amber-300' },
  dangerous: { label: 'Dangerous: do not open', box: 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800', text: 'text-rose-700 dark:text-rose-300' },
} as const;

export const SIGNAL_DOT = { good: 'bg-emerald-500', info: 'bg-slate-400', warn: 'bg-amber-500', bad: 'bg-rose-500' } as const;
