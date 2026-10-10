import React, { useState } from 'react';
import { Copy, Eye, EyeOff, Pencil, Trash2, ShieldQuestion, ExternalLink, KeyRound, StickyNote, LifeBuoy } from 'lucide-react';
import { Badge } from '../../ui/ui';
import { pwnedCount } from '../../lib/hibp';
import { copyText } from '../../lib/format';
import { toast } from '../../lib/toast';
import type { VaultEntry } from './useVault';

const KIND = {
  login: { label: 'Login', icon: KeyRound },
  note: { label: 'Note', icon: StickyNote },
  recovery: { label: 'Recovery codes', icon: LifeBuoy },
};

async function copySecret(value: string, what: string) {
  if (!(await copyText(value))) return toast('Copy failed', undefined, 'danger');
  toast(`${what} copied`, 'Clipboard will be cleared in 30 seconds.', 'info');
  setTimeout(() => {
    navigator.clipboard.readText?.().then((t) => { if (t === value) void navigator.clipboard.writeText(''); }, () => {});
  }, 30_000);
}

export const EntryRow: React.FC<{ e: VaultEntry & { id: string }; onEdit: () => void; onDelete: () => void }> = ({ e, onEdit, onDelete }) => {
  const [reveal, setReveal] = useState(false);
  const [breach, setBreach] = useState<number | null | 'checking'>(null);
  const K = KIND[e.kind];

  const check = async () => {
    if (!e.password) return;
    setBreach('checking');
    try {
      setBreach(await pwnedCount(e.password));
    } catch (err: any) {
      setBreach(null);
      toast('Breach check failed', err.message, 'danger');
    }
  };

  return (
    <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 flex items-center justify-center shrink-0"><K.icon className="w-4 h-4" /></span>
          <div className="min-w-0">
            <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{e.title}</div>
            <div className="text-[11px] text-slate-500 truncate">{e.username || K.label}</div>
          </div>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          {e.url && (
            <a href={/^https?:\/\//.test(e.url) ? e.url : `https://${e.url}`} target="_blank" rel="noopener noreferrer" className="p-1.5 text-slate-400 hover:text-cyan-600" aria-label="Open website">
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          <button onClick={onEdit} className="p-1.5 text-slate-400 hover:text-cyan-600 cursor-pointer" aria-label="Edit"><Pencil className="w-3.5 h-3.5" /></button>
          <button onClick={onDelete} className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer" aria-label="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      </div>
      {e.username && (
        <button onClick={() => copySecret(e.username!, 'Username')} className="w-full text-left flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 text-xs cursor-pointer">
          <span className="truncate font-mono-code">{e.username}</span>
          <Copy className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        </button>
      )}
      {e.password && (
        <div className="flex items-center gap-1.5">
          <div className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 text-xs font-mono-code truncate">{reveal ? e.password : '•'.repeat(Math.min(16, e.password.length))}</div>
          <button onClick={() => setReveal(!reveal)} className="p-1.5 text-slate-400 hover:text-slate-700 cursor-pointer" aria-label={reveal ? 'Hide password' : 'Show password'}>
            {reveal ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
          <button onClick={() => copySecret(e.password!, 'Password')} className="p-1.5 text-slate-400 hover:text-slate-700 cursor-pointer" aria-label="Copy password"><Copy className="w-3.5 h-3.5" /></button>
          <button onClick={check} className="p-1.5 text-slate-400 hover:text-emerald-600 cursor-pointer" aria-label="Check for breaches" title="Check if leaked"><ShieldQuestion className="w-3.5 h-3.5" /></button>
        </div>
      )}
      {breach === 'checking' && <div className="text-[11px] text-slate-500">Checking breaches…</div>}
      {typeof breach === 'number' && (breach > 0 ? <Badge tone="rose">Leaked {breach.toLocaleString()} times. Change it.</Badge> : <Badge tone="emerald">Not found in breaches</Badge>)}
      {e.notes && <pre className="text-[11px] text-slate-600 dark:text-slate-400 whitespace-pre-wrap break-words font-mono-code bg-slate-50 dark:bg-slate-900 rounded-lg p-2 max-h-40 overflow-y-auto">{e.notes}</pre>}
    </div>
  );
};
