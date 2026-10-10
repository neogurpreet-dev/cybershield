import React from 'react';
import { Radio, ShieldCheck, Users } from 'lucide-react';
import type { CheckupResult, EmergencyContact, Incident, SubsystemTab } from '../types';
import { NAV } from '../nav';
import { sound } from '../services/audio';
import { useUid } from '../hooks/useAuth';
import { useCollection } from '../hooks/useFirestore';
import { useOnline } from '../hooks/useOnline';
import { timeAgo } from '../lib/format';

interface SidebarProps {
  activeTab: SubsystemTab;
  setActiveTab: (tab: SubsystemTab) => void;
  onQuickSos: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onQuickSos }) => {
  const uid = useUid();
  const online = useOnline();
  const { items: incidents } = useCollection<Incident>(uid, 'incidents');
  const { items: contacts } = useCollection<EmergencyContact>(uid, 'contacts');
  const { items: checkups } = useCollection<CheckupResult>(uid, 'checkups', { orderBy: ['createdAt', 'desc'], limit: 1 });
  const openIncidents = incidents.filter((i) => i.status !== 'resolved').length;
  const last = checkups[0];

  return (
    <aside className="w-60 shrink-0 hidden lg:flex flex-col justify-between border-r border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-[#0c1017]/70 backdrop-blur-sm p-4 h-[calc(100vh-57px)] sticky top-[57px] font-sans no-print">
      <div>
        <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3 px-2 flex items-center justify-between">
          <span>Navigation</span>
          <span className={`text-[10px] font-medium flex items-center gap-1 ${online ? 'text-emerald-500' : 'text-amber-500'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${online ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            {online ? 'Online' : 'Offline'}
          </span>
        </div>
        <nav className="space-y-1 text-xs">
          {NAV.map((item) => {
            const isActive = activeTab === item.id;
            const badge = item.id === 'incident' && openIncidents ? `${openIncidents} open` : undefined;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  sound.playBeep(800, 0.04);
                }}
                aria-current={isActive ? 'page' : undefined}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition text-left cursor-pointer ${
                  isActive ? 'bg-slate-900 text-white dark:bg-cyan-950 dark:text-cyan-300 shadow-xs font-semibold' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <span className="flex items-center gap-2.5 truncate">
                  <item.icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : item.color}`} />
                  <span className="truncate">{item.label}</span>
                </span>
                {badge && <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">{badge}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800 text-xs">
        <button onClick={() => setActiveTab('protection')} className="w-full text-left bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800 p-3 hover:border-cyan-500/50 cursor-pointer transition">
          <div className="flex items-center justify-between text-[11px] font-semibold mb-1 text-slate-600 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Browser checkup
            </span>
            <span className={!last ? 'text-slate-400' : last.score >= 80 ? 'text-emerald-500' : last.score >= 55 ? 'text-amber-500' : 'text-rose-500'}>{last ? `${last.score}/100` : 'Not run'}</span>
          </div>
          <p className="text-[10px] text-slate-500 leading-tight">{last ? `Last run ${timeAgo(last.createdAt)}` : 'Run a checkup to see how safe this browser is.'}</p>
        </button>
        <button onClick={() => setActiveTab('emergency')} className="w-full text-left bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800 p-3 hover:border-rose-500/50 cursor-pointer transition">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-rose-500" /> SOS contacts
            </span>
            <span className={contacts.length ? 'text-emerald-500' : 'text-amber-500'}>{contacts.length || 'None'}</span>
          </div>
          {!contacts.length && <p className="text-[10px] text-slate-500 mt-1 leading-tight">Add someone who should get your location in an emergency.</p>}
        </button>
        <button onClick={onQuickSos} className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-xs cursor-pointer">
          <Radio className="w-3.5 h-3.5" />
          Emergency SOS
        </button>
      </div>
    </aside>
  );
};
