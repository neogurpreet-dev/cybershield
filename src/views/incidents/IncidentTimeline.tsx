import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { serverTimestamp } from 'firebase/firestore';
import { Button, inputCls } from '../../ui/ui';
import { newId, updateItem } from '../../lib/db';
import { formatDateTime } from '../../lib/format';
import type { Incident } from '../../types';

const DOT = { created: 'bg-cyan-500', auto: 'bg-cyan-500', note: 'bg-slate-400', status: 'bg-amber-500', severity: 'bg-rose-500', checklist: 'bg-emerald-500' };

export const IncidentTimeline: React.FC<{ uid: string; inc: Incident }> = ({ uid, inc }) => {
  const [note, setNote] = useState('');
  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;
    updateItem(uid, 'incidents', inc.id, {
      timeline: [...inc.timeline, { id: newId(), at: Date.now(), kind: 'note', text: note.trim() }],
      updatedAt: serverTimestamp(),
    });
    setNote('');
  };
  return (
    <div className="space-y-4">
      <form onSubmit={add} className="flex gap-2">
        <input className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add an update, e.g. “Called bank, card blocked, reference 12345”" />
        <Button type="submit" icon={<Send className="w-3.5 h-3.5" />}>Log</Button>
      </form>
      <ol className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-2 space-y-4">
        {[...inc.timeline].reverse().map((t) => (
          <li key={t.id} className="ml-4">
            <span className={`absolute -left-[7px] mt-1 w-3 h-3 rounded-full ring-4 ring-white dark:ring-[#0e141e] ${DOT[t.kind] || 'bg-slate-400'}`} />
            <div className="text-[11px] text-slate-500">{formatDateTime(t.at)}</div>
            <div className="text-xs text-slate-800 dark:text-slate-200 break-words">{t.text}</div>
          </li>
        ))}
      </ol>
    </div>
  );
};
