import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, Info, XCircle, X, Loader2 } from 'lucide-react';
import { dismissToast, subscribeToasts, type Toast } from '../lib/toast';

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

export const Card: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => (
  <div className={cx('border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0e141e] rounded-xl p-5 shadow-xs', className)}>{children}</div>
);

export const CardHeader: React.FC<{ icon?: React.ReactNode; title: React.ReactNode; subtitle?: React.ReactNode; action?: React.ReactNode }> = ({ icon, title, subtitle, action }) => (
  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
    <div className="flex items-start gap-2.5 min-w-0">
      {icon && <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center shrink-0">{icon}</div>}
      <div className="min-w-0">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
    {action}
  </div>
);

type BtnVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
const BTN: Record<BtnVariant, string> = {
  primary: 'bg-cyan-600 hover:bg-cyan-700 text-white',
  success: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  danger: 'bg-rose-600 hover:bg-rose-700 text-white',
  secondary: 'bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200',
  ghost: 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800',
};

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; loading?: boolean; icon?: React.ReactNode; size?: 'sm' | 'md' }> = ({
  variant = 'primary',
  loading,
  icon,
  size = 'md',
  className,
  children,
  disabled,
  ...rest
}) => (
  <button
    {...rest}
    disabled={disabled || loading}
    className={cx(
      'inline-flex items-center justify-center gap-1.5 rounded-lg font-semibold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500',
      size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-3.5 py-2 text-xs',
      BTN[variant],
      className
    )}
  >
    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : icon}
    {children}
  </button>
);

type Tone = 'slate' | 'cyan' | 'emerald' | 'amber' | 'rose' | 'indigo';
const BADGE: Record<Tone, string> = {
  slate: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  cyan: 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
  emerald: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  amber: 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  rose: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  indigo: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
};

export const Badge: React.FC<{ tone?: Tone; children: React.ReactNode; className?: string }> = ({ tone = 'slate', children, className }) => (
  <span className={cx('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap', BADGE[tone], className)}>{children}</span>
);

export const Modal: React.FC<{ open: boolean; onClose: () => void; title: React.ReactNode; children: React.ReactNode; wide?: boolean }> = ({ open, onClose, title, children, wide }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" className={cx('w-full bg-white dark:bg-[#0e141e] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-h-[90vh] flex flex-col', wide ? 'max-w-2xl' : 'max-w-md')}>
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{title}</h3>
          <button onClick={onClose} aria-label="Close" className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto text-xs">{children}</div>
      </div>
    </div>
  );
};

export const inputCls =
  'w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder:text-slate-400';

export const Field: React.FC<{ label: string; hint?: string; children: React.ReactNode }> = ({ label, hint, children }) => (
  <label className="block">
    <span className="block text-slate-700 dark:text-slate-300 font-semibold mb-1 text-xs">{label}</span>
    {children}
    {hint && <span className="block text-[11px] text-slate-500 mt-1">{hint}</span>}
  </label>
);

export const EmptyState: React.FC<{ icon: React.ReactNode; title: string; body: string; action?: React.ReactNode }> = ({ icon, title, body, action }) => (
  <div className="text-center py-8 px-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30">
    <div className="mx-auto w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center mb-3">{icon}</div>
    <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{title}</div>
    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">{body}</p>
    {action && <div className="mt-4 flex justify-center">{action}</div>}
  </div>
);

export const Spinner: React.FC<{ label?: string }> = ({ label }) => (
  <div className="flex items-center gap-2 text-xs text-slate-500 py-6 justify-center">
    <Loader2 className="w-4 h-4 animate-spin" />
    {label || 'Loading…'}
  </div>
);

export const Toaster: React.FC = () => {
  const [items, setItems] = useState<Toast[]>([]);
  useEffect(() => subscribeToasts(setItems), []);
  const icon = { info: Info, success: CheckCircle2, warning: AlertTriangle, danger: XCircle };
  const color = { info: 'border-cyan-500', success: 'border-emerald-500', warning: 'border-amber-500', danger: 'border-rose-500' };
  return (
    <div className="fixed z-[60] bottom-20 md:bottom-6 right-4 left-4 sm:left-auto sm:w-96 space-y-2 pointer-events-none" aria-live="polite">
      {items.map((t) => {
        const Icon = icon[t.tone];
        return (
          <div key={t.id} className={cx('pointer-events-auto p-3.5 rounded-xl bg-slate-900 text-white text-xs shadow-xl border-l-4 flex items-start gap-3 animate-fadeIn', color[t.tone])}>
            <Icon className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="font-bold">{t.title}</div>
              {t.message && <div className="text-slate-300 mt-0.5 break-words">{t.message}</div>}
            </div>
            <button onClick={() => dismissToast(t.id)} className="text-slate-400 hover:text-white cursor-pointer" aria-label="Dismiss">
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export const ScoreRing: React.FC<{ score: number | null; size?: number }> = ({ score, size = 56 }) => {
  const r = size / 2 - 5;
  const c = 2 * Math.PI * r;
  const pct = score === null ? 0 : Math.max(0, Math.min(100, score));
  const stroke = score === null ? '#94a3b8' : pct >= 80 ? '#10b981' : pct >= 55 ? '#f59e0b' : '#f43f5e';
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={5} className="stroke-slate-200 dark:stroke-slate-800" fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={5} stroke={stroke} fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (c * pct) / 100} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-900 dark:text-slate-100">{score === null ? '—' : score}</div>
    </div>
  );
};

export function useConfirm() {
  const [state, setState] = useState<null | { title: string; body: string; confirmLabel: string; resolve: (v: boolean) => void }>(null);
  const confirm = (title: string, body: string, confirmLabel = 'Delete') =>
    new Promise<boolean>((resolve) => setState({ title, body, confirmLabel, resolve }));
  const close = (v: boolean) => {
    state?.resolve(v);
    setState(null);
  };
  const dialog = (
    <Modal open={Boolean(state)} onClose={() => close(false)} title={state?.title || ''}>
      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{state?.body}</p>
      <div className="flex justify-end gap-2 mt-5">
        <Button variant="secondary" onClick={() => close(false)}>Cancel</Button>
        <Button variant="danger" onClick={() => close(true)}>{state?.confirmLabel}</Button>
      </div>
    </Modal>
  );
  return { confirm, dialog };
}
