import React, { useState } from 'react';
import { Check, Plus, Trash2 } from 'lucide-react';
import { serverTimestamp } from 'firebase/firestore';
import { Button, inputCls } from '../../ui/ui';
import { newId, updateItem } from '../../lib/db';
import type { Incident } from '../../types';

export const IncidentChecklist: React.FC<{ uid: string; inc: Incident }> = ({ uid, inc }) => {
  const [text, setText] = useState('');
  const done = inc.checklist.filter((c) => c.done).length;

  const save = (checklist: Incident['checklist'], note?: string) =>
    updateItem(uid, 'incidents', inc.id, {
      checklist,
      updatedAt: serverTimestamp(),
      ...(note ? { timeline: [...inc.timeline, { id: newId(), at: Date.now(), kind: 'checklist', text: note }] } : {}),
    });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-700 dark:text-slate-300">Next steps</span>
        <span className="text-slate-500">{done}/{inc.checklist.length} done</span>
      </div>
      <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
        <div className="h-full bg-emerald-500 transition-all" style={{ width: `${inc.checklist.length ? (done / inc.checklist.length) * 100 : 0}%` }} />
      </div>
      <div className="space-y-2">
        {inc.checklist.map((c) => (
          <div key={c.id} className={`group flex items-start gap-3 p-2.5 rounded-lg border ${c.done ? 'border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/20' : 'border-slate-200 dark:border-slate-800'}`}>
            <button
              onClick={() => save(inc.checklist.map((x) => (x.id === c.id ? { ...x, done: !x.done } : x)), `${c.done ? 'Reopened' : 'Completed'}: ${c.text}`)}
              className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center shrink-0 cursor-pointer ${c.done ? 'bg-emerald-600 text-white' : 'border-2 border-slate-400 dark:border-slate-600'}`}
              aria-label={c.done ? 'Mark not done' : 'Mark done'}
            >
              {c.done && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </button>
            <span className={`flex-1 text-xs ${c.done ? 'line-through text-slate-500' : 'text-slate-800 dark:text-slate-200'}`}>{c.text}</span>
            <button onClick={() => save(inc.checklist.filter((x) => x.id !== c.id))} className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 cursor-pointer" aria-label="Remove step">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          save([...inc.checklist, { id: newId(), text: text.trim(), done: false }]);
          setText('');
        }}
        className="flex gap-2"
      >
        <input className={inputCls} value={text} onChange={(e) => setText(e.target.value)} placeholder="Add your own step…" />
        <Button type="submit" variant="secondary" icon={<Plus className="w-3.5 h-3.5" />}>Add</Button>
      </form>
    </div>
  );
};
