import React, { useEffect, useState } from 'react';
import { Wand2, Eye, EyeOff } from 'lucide-react';
import { Button, Field, Modal, inputCls } from '../../ui/ui';
import { generatePassword, passwordStrength } from '../../lib/hibp';
import type { VaultEntry, VaultKind } from './useVault';

const EMPTY: VaultEntry = { kind: 'login', title: '', username: '', password: '', url: '', notes: '' };

export const ItemModal: React.FC<{ open: boolean; initial?: VaultEntry & { id?: string }; onClose: () => void; onSave: (e: VaultEntry, id?: string) => Promise<void> }> = ({ open, initial, onClose, onSave }) => {
  const [form, setForm] = useState<VaultEntry>(EMPTY);
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(initial ? { ...EMPTY, ...initial } : EMPTY);
      setShow(false);
    }
  }, [open, initial]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setBusy(true);
    try {
      const { id, ...rest } = form as VaultEntry & { id?: string };
      await onSave({ ...rest, title: form.title.trim() }, initial?.id);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const s = passwordStrength(form.password || '');
  return (
    <Modal open={open} onClose={onClose} title={initial?.id ? 'Edit item' : 'Add to vault'}>
      <form onSubmit={submit} className="space-y-3">
        <div className="flex gap-1 text-xs">
          {([['login', 'Login'], ['note', 'Secure note'], ['recovery', 'Recovery codes']] as [VaultKind, string][]).map(([k, l]) => (
            <button type="button" key={k} onClick={() => setForm({ ...form, kind: k })} className={`px-3 py-1.5 rounded-lg font-semibold cursor-pointer ${form.kind === k ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
              {l}
            </button>
          ))}
        </div>
        <Field label="Title">
          <input className={inputCls} required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder={form.kind === 'login' ? 'e.g. Gmail' : form.kind === 'recovery' ? 'e.g. GitHub backup codes' : 'e.g. Wi-Fi password'} />
        </Field>
        {form.kind === 'login' && (
          <>
            <Field label="Website">
              <input className={inputCls} value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://accounts.google.com" />
            </Field>
            <Field label="Username / email">
              <input className={inputCls} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} autoComplete="off" />
            </Field>
            <Field label="Password" hint={form.password ? `Strength: ${s.label}` : undefined}>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input type={show ? 'text' : 'password'} className={`${inputCls} pr-9 font-mono-code`} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="new-password" />
                  <button type="button" onClick={() => setShow(!show)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer" aria-label={show ? 'Hide' : 'Show'}>
                    {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <Button type="button" variant="secondary" icon={<Wand2 className="w-3.5 h-3.5" />} onClick={() => { setForm({ ...form, password: generatePassword(20) }); setShow(true); }}>
                  Generate
                </Button>
              </div>
            </Field>
          </>
        )}
        <Field label={form.kind === 'recovery' ? 'Codes' : 'Notes'}>
          <textarea className={`${inputCls} font-mono-code`} rows={form.kind === 'login' ? 3 : 6} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={busy}>Save encrypted</Button>
        </div>
      </form>
    </Modal>
  );
};
