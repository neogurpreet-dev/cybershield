import React, { useState } from 'react';
import { Clock, Plus, Trash2, Check, ListTodo } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import { Badge, Button, Card, CardHeader, EmptyState, Field, Modal, inputCls } from '../../ui/ui';
import { addItem, removeItem, updateItem } from '../../lib/db';
import { formatDateTime, timeAgo, toDate } from '../../lib/format';
import { toast } from '../../lib/toast';
import type { Task, TaskCategory, TaskPriority } from '../../types';

const CATEGORIES: TaskCategory[] = ['security', 'accounts', 'network', 'backup', 'incident', 'compliance'];
const PRIORITY_TONE = { critical: 'rose', high: 'amber', routine: 'slate' } as const;

function defaultDue() {
  const d = new Date(Date.now() + 24 * 3600 * 1000);
  d.setMinutes(0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:00`;
}

export const TasksCard: React.FC<{ uid: string; tasks: Task[] }> = ({ uid, tasks }) => {
  const [filter, setFilter] = useState<'all' | TaskCategory>('all');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', category: 'security' as TaskCategory, priority: 'high' as TaskPriority, due: defaultDue() });
  const [saving, setSaving] = useState(false);

  const sorted = [...tasks]
    .filter((t) => filter === 'all' || t.category === filter)
    .sort((a, b) => Number(a.done) - Number(b.done) || (toDate(a.dueAt)?.getTime() ?? Infinity) - (toDate(b.dueAt)?.getTime() ?? Infinity));

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await addItem(uid, 'tasks', {
        title: form.title.trim(),
        category: form.category,
        priority: form.priority,
        dueAt: form.due ? Timestamp.fromDate(new Date(form.due)) : null,
        done: false,
        notified: false,
      });
      setOpen(false);
      setForm({ title: '', category: 'security', priority: 'high', due: defaultDue() });
      toast('Task added', form.due ? `You’ll get a reminder ${timeAgo(new Date(form.due).getTime())}.` : undefined, 'success');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="space-y-3">
      <CardHeader
        icon={<Clock className="w-4 h-4 text-cyan-500" />}
        title="Security tasks & reminders"
        subtitle="Things to do, with a reminder when they’re due (while CyberShield is open)"
        action={<Button size="sm" onClick={() => setOpen(true)} icon={<Plus className="w-3.5 h-3.5" />}>Add task</Button>}
      />
      <div className="flex flex-wrap gap-1 text-[11px]">
        {(['all', ...CATEGORIES] as const).map((c) => (
          <button key={c} onClick={() => setFilter(c)} className={`px-2.5 py-1 rounded-md capitalize font-medium cursor-pointer ${filter === c ? 'bg-slate-900 dark:bg-slate-700 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
            {c}
          </button>
        ))}
      </div>
      {sorted.length === 0 ? (
        <EmptyState icon={<ListTodo className="w-5 h-5" />} title="No tasks yet" body="Add reminders like “Renew domain SSL certificate” or “Review Google account security”." />
      ) : (
        <div className="space-y-2">
          {sorted.map((t) => {
            const due = toDate(t.dueAt);
            const overdue = !t.done && due && due.getTime() < Date.now();
            return (
              <div key={t.id} className={`p-3 rounded-xl border flex items-start justify-between gap-3 ${t.done ? 'opacity-60 border-slate-200 dark:border-slate-800' : overdue ? 'border-rose-300 dark:border-rose-900 bg-rose-50/40 dark:bg-rose-950/20' : 'border-slate-200 dark:border-slate-800'}`}>
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge tone={PRIORITY_TONE[t.priority]}>{t.priority}</Badge>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase">{t.category}</span>
                    {overdue && <Badge tone="rose">Overdue</Badge>}
                  </div>
                  <div className={`text-xs font-semibold break-words ${t.done ? 'line-through text-slate-500' : 'text-slate-900 dark:text-slate-100'}`}>{t.title}</div>
                  <div className="text-[11px] text-slate-500">{due ? `Due ${formatDateTime(t.dueAt)} (${timeAgo(t.dueAt)})` : 'No due date'}</div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button size="sm" variant={t.done ? 'secondary' : 'success'} onClick={() => updateItem(uid, 'tasks', t.id, { done: !t.done })} icon={<Check className="w-3.5 h-3.5" />}>
                    {t.done ? 'Undo' : 'Done'}
                  </Button>
                  <button onClick={() => removeItem(uid, 'tasks', t.id)} className="p-1.5 text-slate-400 hover:text-rose-500 cursor-pointer" aria-label="Delete task">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Add a security task">
        <form onSubmit={add} className="space-y-3">
          <Field label="What needs doing?">
            <input className={inputCls} required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Turn on 2FA for my bank app" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <select className={inputCls} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as TaskCategory })}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Priority">
              <select className={inputCls} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as TaskPriority })}>
                <option value="critical">critical</option>
                <option value="high">high</option>
                <option value="routine">routine</option>
              </select>
            </Field>
          </div>
          <Field label="Due" hint="Leave empty for no reminder.">
            <input type="datetime-local" className={inputCls} value={form.due} onChange={(e) => setForm({ ...form, due: e.target.value })} />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Add task</Button>
          </div>
        </form>
      </Modal>
    </Card>
  );
};
