import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button, inputCls } from '../../ui/ui';
import { cleanDomain } from '../../lib/dns';
import { addItem, newId } from '../../lib/db';
import { toast } from '../../lib/toast';
import type { MonitoredDomain } from '../../types';

export const AddDomain: React.FC<{ uid: string; existing: MonitoredDomain[]; onAdded: (id: string, domain: string) => void }> = ({ uid, existing, onAdded }) => {
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const domain = cleanDomain(value);
    if (!domain) return toast('That doesn’t look like a domain', 'Try something like example.com or shop.example.in', 'warning');
    if (existing.some((d) => d.domain === domain)) return toast('Already monitoring that domain', undefined, 'info');
    setBusy(true);
    try {
      const ref = await addItem(uid, 'domains', { domain, verifyToken: newId(), verified: false });
      setValue('');
      onAdded(ref.id, domain);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={add} className="flex gap-2">
      <input className={`${inputCls} font-mono-code`} value={value} onChange={(e) => setValue(e.target.value)} placeholder="yourdomain.com" aria-label="Domain to monitor" autoComplete="off" spellCheck={false} />
      <Button type="submit" loading={busy} icon={<Plus className="w-3.5 h-3.5" />} className="shrink-0">Add domain</Button>
    </form>
  );
};
