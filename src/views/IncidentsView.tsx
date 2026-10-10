import React, { useMemo, useState } from 'react';
import { Plus, ShieldAlert } from 'lucide-react';
import { useAuth, useUid } from '../hooks/useAuth';
import { useCollection } from '../hooks/useFirestore';
import { Button, Card, EmptyState, Spinner } from '../ui/ui';
import type { Incident, IncidentStatus } from '../types';
import { NewIncidentModal } from './incidents/NewIncidentModal';
import { IncidentDetail } from './incidents/IncidentDetail';
import { IncidentList } from './incidents/IncidentList';

export const IncidentsView: React.FC = () => {
  const uid = useUid();
  const { profile, user } = useAuth();
  const { items, loading } = useCollection<Incident>(uid, 'incidents', { orderBy: ['createdAt', 'desc'] });
  const [filter, setFilter] = useState<'all' | IncidentStatus>('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const list = useMemo(
    () => items.filter((i) => (filter === 'all' || i.status === filter) && `${i.number} ${i.title} ${i.summary}`.toLowerCase().includes(query.toLowerCase())),
    [items, filter, query]
  );
  // On mobile, the list shows until something is picked; on desktop, the first incident is shown by default.
  const current = items.find((i) => i.id === selected) || list[0];
  const owner = profile?.displayName || user?.email || 'CyberShield user';
  const count = (s: IncidentStatus) => items.filter((i) => i.status === s).length;

  return (
    <div className="max-w-7xl mx-auto font-sans space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Incidents</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {count('open')} open · {count('investigating')} investigating · {count('resolved')} resolved
          </p>
        </div>
        <Button onClick={() => setCreating(true)} icon={<Plus className="w-3.5 h-3.5" />}>Report incident</Button>
      </div>

      {loading ? (
        <Spinner />
      ) : items.length === 0 ? (
        <Card>
          <EmptyState
            icon={<ShieldAlert className="w-5 h-5" />}
            title="No incidents. Good news!"
            body="If something goes wrong (a scam message, a hacked account, money lost), report it here and you’ll get a step-by-step recovery checklist. Dangerous links you check are added automatically."
            action={<Button onClick={() => setCreating(true)}>Report an incident</Button>}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          <IncidentList
            className={`lg:col-span-4 ${selected ? 'hidden lg:block' : ''}`}
            list={list}
            currentId={current?.id}
            filter={filter}
            setFilter={setFilter}
            query={query}
            setQuery={setQuery}
            onSelect={setSelected}
          />
          <div className={`lg:col-span-8 ${selected ? '' : 'hidden lg:block'}`}>
            {current ? (
              <IncidentDetail key={current.id} uid={uid} inc={current} owner={owner} onBack={() => setSelected(null)} />
            ) : (
              <Card><p className="text-xs text-slate-500">No incident matches your filter.</p></Card>
            )}
          </div>
        </div>
      )}
      <NewIncidentModal uid={uid} open={creating} onClose={() => setCreating(false)} onCreated={(id) => setSelected(id)} />
    </div>
  );
};
