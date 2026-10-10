import React, { useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import { writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { userItem } from '../lib/db';
import { useCollection } from '../hooks/useFirestore';
import { useUid } from '../hooks/useAuth';
import { timeAgo } from '../lib/format';
import type { AppNotification } from '../types';

export const NotificationsBell: React.FC = () => {
  const uid = useUid();
  const { items } = useCollection<AppNotification>(uid, 'notifications', { orderBy: ['createdAt', 'desc'], limit: 30 });
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const unread = items.filter((n) => !n.read).length;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const markAll = async () => {
    const batch = writeBatch(db);
    items.filter((n) => !n.read).forEach((n) => batch.update(userItem(uid, 'notifications', n.id), { read: true }));
    await batch.commit();
  };
  const clearAll = async () => {
    const batch = writeBatch(db);
    items.forEach((n) => batch.delete(userItem(uid, 'notifications', n.id)));
    await batch.commit();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">{unread > 9 ? '9+' : unread}</span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-[#0e141e] border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-50 animate-fadeIn">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">Notifications</span>
            <div className="flex items-center gap-1">
              <button onClick={markAll} disabled={!unread} className="p-1.5 rounded text-slate-500 hover:text-cyan-600 disabled:opacity-40 cursor-pointer" title="Mark all as read">
                <CheckCheck className="w-4 h-4" />
              </button>
              <button onClick={clearAll} disabled={!items.length} className="p-1.5 rounded text-slate-500 hover:text-rose-600 disabled:opacity-40 cursor-pointer" title="Clear all">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {items.length === 0 && <div className="p-6 text-center text-xs text-slate-500">No notifications yet. Alerts from your checks will appear here.</div>}
            {items.map((n) => (
              <div key={n.id} className={`px-4 py-3 text-xs ${n.read ? 'opacity-70' : 'bg-cyan-50/40 dark:bg-cyan-950/20'}`}>
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{n.title}</span>
                  <span className="text-[10px] text-slate-400 shrink-0">{timeAgo(n.createdAt)}</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 mt-0.5 break-words">{n.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
