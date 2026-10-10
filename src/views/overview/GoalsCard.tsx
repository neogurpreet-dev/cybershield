import React, { useState } from 'react';
import { Target, Plus, Trash2, Pencil, Flag } from 'lucide-react';
import { Badge, Button, Card, CardHeader, EmptyState, Field, Modal, inputCls } from '../../ui/ui';
import { addItem, removeItem, updateItem } from '../../lib/db';
import type { Goal } from '../../types';

const STATUS: Record<Goal['status'], { label: string; tone: 'slate' | 'cyan' | 'emerald' | 'rose' }> = {
  planned: { label: 'Planned', tone: 'slate' },
  in_progress: { label: 'In progress', tone: 'cyan' },
  done: { label: 'Done', tone: 'emerald' },
  blocked: { label: 'Blocked', tone: 'rose' },
};

const EMPTY = { title: '', area: 'Personal security', status: 'planned' as Goal['status'], progress: 0, deadline: '', notes: '' };

export const GoalsCard: React.FC<{ uid: string; goals: Goal[] }> = ({ uid, goals }) => {
  const [editing, setEditing] = useState<Goal | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const start = (g?: Goal) => {
    setEditing(g || null);
    setForm(g ? { title: g.title, area: g.area, status: g.status, progress: g.progress, deadline: g.deadline || '', notes: g.notes } : EMPTY);
    setOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    const progress = form.status === 'done' ? 100 : Math.max(0, Math.min(100, Number(form.progress) || 0));
    const data = { ...form, title: form.title.trim(), progress };
    if (editing) await updateItem(uid, 'goals', editing.id, data);
    else await addItem(uid, 'goals', data);
    setOpen(false);
  };

  return (
    <Card className="space-y-4">
      <CardHeader
        icon={<Target className="w-4 h-4 text-amber-500" />}
        title="Security goals"
        subtitle="Bigger projects you want to finish, like moving to a password manager or securing your website"
        action={<Button size="sm" onClick={() => start()} icon={<Plus className="w-3.5 h-3.5" />}>New goal</Button>}
      />
      {goals.length === 0 ? (
        <EmptyState icon={<Flag className="w-5 h-5" />} title="No goals yet" body="Track a project and its progress, e.g. “Enable DMARC on my business domain”." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {goals.map((g) => (
            <div key={g.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 break-words">{g.title}</h4>
                <Badge tone={STATUS[g.status].tone}>{STATUS[g.status].label}</Badge>
              </div>
              {g.notes && <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed break-words">{g.notes}</p>}
              <div>
                <div className="flex justify-between text-[11px] text-slate-500 font-medium mb-1">
                  <span>Progress</span>
                  <span>{g.progress}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={g.progress}
                  onChange={(e) => {
                    const progress = Number(e.target.value);
                    updateItem(uid, 'goals', g.id, { progress, status: progress === 100 ? 'done' : g.status === 'done' ? 'in_progress' : g.status === 'planned' && progress > 0 ? 'in_progress' : g.status });
                  }}
                  className="w-full accent-cyan-600"
                  aria-label={`Progress for ${g.title}`}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span>{g.area}{g.deadline ? ` · target ${new Date(g.deadline).toLocaleDateString()}` : ''}</span>
                <span className="flex gap-1">
                  <button onClick={() => start(g)} className="p-1 hover:text-cyan-600 cursor-pointer" aria-label="Edit goal"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => removeItem(uid, 'goals', g.id)} className="p-1 hover:text-rose-600 cursor-pointer" aria-label="Delete goal"><Trash2 className="w-3.5 h-3.5" /></button>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit goal' : 'New security goal'}>
        <form onSubmit={save} className="space-y-3">
          <Field label="Goal">
            <input className={inputCls} required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Move all passwords into a password manager" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Area">
              <select className={inputCls} value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })}>
                {['Personal security', 'Accounts', 'Devices', 'Website & domains', 'Business', 'Compliance'].map((a) => <option key={a}>{a}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select className={inputCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Goal['status'] })}>
                {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Progress (%)">
              <input type="number" min={0} max={100} className={inputCls} value={form.progress} onChange={(e) => setForm({ ...form, progress: Number(e.target.value) })} />
            </Field>
            <Field label="Target date">
              <input type="date" className={inputCls} value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
            </Field>
          </div>
          <Field label="Notes">
            <textarea rows={3} className={inputCls} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit">{editing ? 'Save' : 'Create goal'}</Button>
          </div>
        </form>
      </Modal>
    </Card>
  );
};
