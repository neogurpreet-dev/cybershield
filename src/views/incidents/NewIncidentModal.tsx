import React, { useState } from 'react';
import { Button, Field, Modal, inputCls } from '../../ui/ui';
import { createIncident } from '../../lib/db';
import { toast } from '../../lib/toast';
import type { Severity } from '../../types';
import { CATEGORIES } from './meta';

export const NewIncidentModal: React.FC<{ uid: string; open: boolean; onClose: () => void; onCreated: (id: string) => void }> = ({ uid, open, onClose, onCreated }) => {
  const [form, setForm] = useState({ title: '', category: 'phishing', severity: 'medium' as Severity, summary: '', details: '' });
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.summary.trim()) return;
    setSaving(true);
    try {
      const { id, number } = await createIncident(uid, { ...form, title: form.title.trim(), summary: form.summary.trim() });
      toast(`Incident #${number} created`, 'A checklist of next steps was added for you.', 'success');
      setForm({ title: '', category: 'phishing', severity: 'medium', summary: '', details: '' });
      onCreated(id);
      onClose();
    } catch (err: any) {
      toast('Could not create incident', err.message, 'danger');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Report a security incident">
      <form onSubmit={submit} className="space-y-3">
        <Field label="What happened, in a few words?">
          <input className={inputCls} required maxLength={140} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Got a fake ‘electricity bill’ SMS and clicked the link" />
        </Field>
        <Field label="Type">
          <select className={inputCls} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </Field>
        <Field label="How serious is it?">
          <select className={inputCls} value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value as Severity })}>
            <option value="low">Low: no harm done, just recording it</option>
            <option value="medium">Medium: something may be at risk</option>
            <option value="high">High: account, data or money is at risk</option>
            <option value="critical">Critical: money lost or account taken over</option>
          </select>
        </Field>
        <Field label="Summary">
          <textarea className={inputCls} rows={3} required value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} placeholder="When did it happen, what did you see, what did you do?" />
        </Field>
        <Field label="Extra details (optional)" hint="Links, phone numbers, transaction IDs. Never write passwords or OTPs here.">
          <textarea className={inputCls} rows={3} value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} />
        </Field>
        {form.category === 'fraud' && (
          <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs">
            If money was taken, call <a href="tel:1930" className="font-bold underline">1930</a> right now. Reporting within the first hours gives the best chance to freeze it.
          </div>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>Create incident</Button>
        </div>
      </form>
    </Modal>
  );
};
