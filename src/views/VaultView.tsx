import React, { useState } from 'react';
import { Lock, Plus, Search, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useUid } from '../hooks/useAuth';
import { Button, Card, EmptyState, Spinner, inputCls, useConfirm } from '../ui/ui';
import { useVault, type VaultEntry } from './vault/useVault';
import { VaultSetup, VaultUnlock } from './vault/VaultGate';
import { ItemModal } from './vault/ItemModal';
import { EntryRow } from './vault/EntryRow';
import { VaultTools } from './vault/VaultTools';

export const VaultView: React.FC = () => {
  const uid = useUid();
  const v = useVault(uid);
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<(VaultEntry & { id?: string }) | undefined>();
  const [open, setOpen] = useState(false);
  const { confirm, dialog } = useConfirm();

  const header = (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Vault</h1>
        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> End-to-end encrypted. CyberShield only ever stores scrambled data it cannot read.
        </p>
      </div>
      {v.unlocked && (
        <div className="flex gap-2">
          <Button variant="secondary" icon={<Lock className="w-3.5 h-3.5" />} onClick={v.lock}>Lock now</Button>
          <Button icon={<Plus className="w-3.5 h-3.5" />} onClick={() => { setEditing(undefined); setOpen(true); }}>Add item</Button>
        </div>
      )}
    </div>
  );

  if (!v.ready) return <Spinner />;

  const shown = v.entries.filter((e) => `${e.title} ${e.username || ''} ${e.url || ''}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="max-w-5xl mx-auto font-sans space-y-5">
      {dialog}
      {header}
      {!v.exists ? (
        <VaultSetup onSetup={v.setup} />
      ) : !v.unlocked ? (
        <VaultUnlock onUnlock={v.unlock} />
      ) : (
        <>
          {v.decryptErrors > 0 && (
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-200 flex gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" /> {v.decryptErrors} item(s) could not be decrypted with this passphrase.
            </div>
          )}
          <Card className="space-y-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className={`${inputCls} pl-8`} value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${v.entries.length} item(s)`} />
            </div>
            {v.entries.length === 0 ? (
              <EmptyState
                icon={<Lock className="w-5 h-5" />}
                title="Your vault is empty"
                body="Save logins, Wi-Fi passwords, recovery codes and private notes. They’re encrypted before leaving this device."
                action={<Button onClick={() => { setEditing(undefined); setOpen(true); }}>Add your first item</Button>}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {shown.map((e) => (
                  <EntryRow
                    key={e.id}
                    e={e}
                    onEdit={() => { setEditing(e); setOpen(true); }}
                    onDelete={async () => {
                      if (await confirm(`Delete “${e.title}”?`, 'This item will be permanently removed from your vault.')) v.remove(e.id);
                    }}
                  />
                ))}
              </div>
            )}
          </Card>
          <VaultTools v={v} />
        </>
      )}
      <ItemModal open={open} initial={editing} onClose={() => setOpen(false)} onSave={v.save} />
    </div>
  );
};
