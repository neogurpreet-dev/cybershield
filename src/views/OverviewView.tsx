import React, { useEffect, useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import type { CheckupResult, EmergencyContact, Goal, Incident, SecurityEvent, SubsystemTab, Task } from '../types';
import { useAuth, useUid } from '../hooks/useAuth';
import { useCollection } from '../hooks/useFirestore';
import { timeAgo, toDate } from '../lib/format';
import { Spinner } from '../ui/ui';
import { ActivityChart } from './overview/ActivityChart';
import { HabitsCard } from './overview/HabitsCard';
import { TasksCard } from './overview/TasksCard';
import { GoalsCard } from './overview/GoalsCard';
import { StatusGrid } from './overview/StatusGrid';

export const OverviewView: React.FC<{ onNavigate: (t: SubsystemTab) => void }> = ({ onNavigate }) => {
  const uid = useUid();
  const { profile, user } = useAuth();
  const { items: events, loading } = useCollection<SecurityEvent>(uid, 'events', { orderBy: ['createdAt', 'desc'], limit: 500 });
  const { items: checkups } = useCollection<CheckupResult>(uid, 'checkups', { orderBy: ['createdAt', 'desc'], limit: 1 });
  const { items: incidents } = useCollection<Incident>(uid, 'incidents');
  const { items: tasks } = useCollection<Task>(uid, 'tasks');
  const { items: goals } = useCollection<Goal>(uid, 'goals', { orderBy: ['createdAt', 'desc'] });
  const { items: contacts } = useCollection<EmergencyContact>(uid, 'contacts');
  const { items: vaultMeta } = useCollection<{ id: string }>(uid, 'vaultMeta');
  const { items: vaultItems } = useCollection<{ id: string }>(uid, 'vaultItems');
  const [geoPerm, setGeoPerm] = useState('unknown');

  useEffect(() => {
    navigator.permissions?.query({ name: 'geolocation' as PermissionName }).then((p) => setGeoPerm(p.state), () => {});
  }, []);

  const since = Date.now() - 31 * 86400_000;
  const recent = events.filter((e) => (toDate(e.createdAt)?.getTime() || 0) > since);
  const links = recent.filter((e) => e.type === 'url_check');
  const last = checkups[0];
  const open = incidents.filter((i) => i.status !== 'resolved');
  const dueSoon = tasks.filter((t) => !t.done && (toDate(t.dueAt)?.getTime() ?? Infinity) < Date.now() + 86400_000).length;
  const parts = [contacts.length > 0, geoPerm === 'granted', Boolean(profile?.displayName)];
  const readiness = Math.round((parts.filter(Boolean).length / parts.length) * 100);
  const firstName = (profile?.displayName || user?.displayName || '').split(' ')[0];

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      <div className="p-5 rounded-2xl bg-gradient-to-r from-cyan-500/10 via-cyan-500/5 to-emerald-500/5 border border-cyan-200 dark:border-cyan-900/70 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Hi{firstName ? `, ${firstName}` : ''} 👋</h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            {open.length ? `${open.length} open incident${open.length > 1 ? 's' : ''}` : 'No open incidents'} ·{' '}
            {dueSoon ? `${dueSoon} task${dueSoon > 1 ? 's' : ''} due within a day` : 'no tasks due soon'} ·{' '}
            {last ? `last browser checkup ${timeAgo(last.createdAt)}` : 'no browser checkup yet'}
          </p>
        </div>
        {open.length > 0 && (
          <button onClick={() => onNavigate('incident')} className="self-start md:self-auto inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer">
            <ShieldAlert className="w-4 h-4" /> Review open incidents
          </button>
        )}
      </div>

      <StatusGrid
        onNavigate={onNavigate}
        last={last}
        linksChecked={links.length}
        flagged={links.filter((e) => e.verdict !== 'safe').length}
        vaultReady={vaultMeta.length > 0}
        vaultCount={vaultItems.length}
        contacts={contacts.length}
        geoPerm={geoPerm}
        readiness={readiness}
      />

      {loading ? <Spinner label="Loading your activity…" /> : <ActivityChart events={recent} onStart={() => onNavigate('protection')} />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HabitsCard uid={uid} checklist={profile?.checklist || {}} />
        <TasksCard uid={uid} tasks={tasks} />
      </div>
      <GoalsCard uid={uid} goals={goals} />
    </div>
  );
};
