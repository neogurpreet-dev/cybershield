import React from 'react';
import { Search } from 'lucide-react';
import { Badge, Card, inputCls } from '../../ui/ui';
import { timeAgo } from '../../lib/format';
import type { Incident, IncidentStatus } from '../../types';
import { SEVERITY, STATUS } from './meta';

interface Props {
  list: Incident[];
  currentId?: string;
  filter: 'all' | IncidentStatus;
  setFilter: (f: 'all' | IncidentStatus) => void;
  query: string;
  setQuery: (q: string) => void;
  onSelect: (id: string) => void;
  className?: string;
}

export const IncidentList: React.FC<Props> = ({ list, currentId, filter, setFilter, query, setQuery, onSelect, className }) => (
  <Card className={`!p-3 space-y-2 ${className || ''}`}>
    <div className="relative">
      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
      <input className={`${inputCls} pl-8`} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search incidents" />
    </div>
    <div className="flex flex-wrap gap-1 text-[11px]">
      {(['all', 'open', 'investigating', 'resolved'] as const).map((f) => (
        <button key={f} onClick={() => setFilter(f)} className={`px-2.5 py-1 rounded-md font-semibold capitalize cursor-pointer ${filter === f ? 'bg-slate-900 dark:bg-slate-700 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
          {f}
        </button>
      ))}
    </div>
    <div className="space-y-1.5 max-h-[65vh] overflow-y-auto">
      {list.length === 0 && <div className="text-xs text-slate-500 p-4 text-center">No incidents match.</div>}
      {list.map((i) => (
        <button
          key={i.id}
          onClick={() => onSelect(i.id)}
          className={`w-full text-left p-3 rounded-lg border transition cursor-pointer ${currentId === i.id ? 'border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/30' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'}`}
        >
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            <span className="text-[10px] font-mono-code text-slate-500">#{i.number}</span>
            <Badge tone={STATUS[i.status].tone}>{STATUS[i.status].label}</Badge>
            <Badge tone={SEVERITY[i.severity].tone}>{SEVERITY[i.severity].label}</Badge>
          </div>
          <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 line-clamp-2">{i.title}</div>
          <div className="text-[10px] text-slate-500 mt-1">
            {timeAgo(i.createdAt)} · {i.checklist.filter((c) => c.done).length}/{i.checklist.length} steps
          </div>
        </button>
      ))}
    </div>
  </Card>
);
