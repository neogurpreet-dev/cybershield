import React, { useState } from 'react';
import { Users, Plus, Trash2, Phone } from 'lucide-react';
import { Button, Card, CardHeader, EmptyState, Field, Modal, inputCls } from '../../ui/ui';
import { addItem, removeItem } from '../../lib/db';
import type { EmergencyContact } from '../../types';

export const ContactsCard: React.FC<{ uid: string; contacts: EmergencyContact[] }> = ({ uid, contacts }) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', relation: '', phone: '', priority: 1 });
  const [error, setError] = useState<string | null>(null);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = form.phone.replace(/[^\d+]/g, '');
    if (digits.replace('+', '').length < 6) return setError('Enter a valid phone number, ideally with country code (e.g. +91 98765 43210).');
    await addItem(uid, 'contacts', { name: form.name.trim(), relation: form.relation.trim() || 'Contact', phone: form.phone.trim(), priority: Number(form.priority) || 1 });
    setForm({ name: '', relation: '', phone: '', priority: 1 });
    setError(null);
    setOpen(false);
  };

  return (
    <Card className="space-y-3">
      <CardHeader
        icon={<Users className="w-4 h-4 text-rose-500" />}
        title="Your SOS contacts"
        subtitle="People who get your live location when you press SOS"
        action={<Button size="sm" onClick={() => setOpen(true)} icon={<Plus className="w-3.5 h-3.5" />}>Add</Button>}
      />
      {contacts.length === 0 ? (
        <EmptyState icon={<Users className="w-5 h-5" />} title="No contacts yet" body="Add a family member, friend or neighbour you trust. Their number stays private to your account." />
      ) : (
        <div className="space-y-2">
          {[...contacts].sort((a, b) => a.priority - b.priority).map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{c.name}</div>
                <div className="text-[11px] text-slate-500 truncate">{c.relation} · priority {c.priority}</div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <a href={`tel:${c.phone.replace(/[^\d+]/g, '')}`} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold">
                  <Phone className="w-3.5 h-3.5" /> {c.phone}
                </a>
                <button onClick={() => removeItem(uid, 'contacts', c.id)} className="p-1.5 text-slate-400 hover:text-rose-500 cursor-pointer" aria-label={`Remove ${c.name}`}>
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title="Add an SOS contact">
        <form onSubmit={save} className="space-y-3">
          <Field label="Name">
            <input className={inputCls} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Mum" />
          </Field>
          <Field label="Relationship">
            <input className={inputCls} value={form.relation} onChange={(e) => setForm({ ...form, relation: e.target.value })} placeholder="e.g. Parent, roommate, neighbour" />
          </Field>
          <Field label="Mobile number" hint="Include the country code so WhatsApp links work, e.g. +91…">
            <input className={inputCls} required type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765 43210" />
          </Field>
          <Field label="Priority" hint="1 = contact first">
            <select className={inputCls} value={form.priority} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })}>
              {[1, 2, 3, 4, 5].map((p) => <option key={p}>{p}</option>)}
            </select>
          </Field>
          {error && <p className="text-xs text-rose-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit">Save contact</Button>
          </div>
        </form>
      </Modal>
    </Card>
  );
};
