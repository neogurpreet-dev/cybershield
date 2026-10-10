import { useEffect } from 'react';
import { useCollection } from './useFirestore';
import { notify, updateItem } from '../lib/db';
import { toDate } from '../lib/format';
import type { Task } from '../types';

/** Fires a reminder (in-app + system notification if allowed) when a task becomes due. */
export function useTaskReminders(uid: string) {
  const { items } = useCollection<Task>(uid, 'tasks');
  useEffect(() => {
    const check = () => {
      const now = Date.now();
      items.forEach((t) => {
        const due = toDate(t.dueAt)?.getTime();
        if (!t.done && !t.notified && due && due <= now) {
          updateItem(uid, 'tasks', t.id, { notified: true }).catch(() => {});
          notify(uid, 'Task due', t.title, 'task', 'warning');
          if ('Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification('CyberShield: task due', { body: t.title, tag: `task-${t.id}` });
            } catch {
              /* some mobile browsers only allow notifications from a service worker */
            }
          }
        }
      });
    };
    check();
    const timer = setInterval(check, 30_000);
    return () => clearInterval(timer);
  }, [items, uid]);
}
