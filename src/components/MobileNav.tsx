import React from 'react';
import type { SubsystemTab } from '../types';
import { NAV } from '../nav';
import { sound } from '../services/audio';

export const MobileNav: React.FC<{ activeTab: SubsystemTab; setActiveTab: (tab: SubsystemTab) => void }> = ({ activeTab, setActiveTab }) => (
  <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0c1017]/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-1 py-1.5 flex items-center justify-around font-sans text-[10px] safe-area-pb no-print">
    {NAV.map((tab) => {
      const isActive = activeTab === tab.id;
      return (
        <button
          key={tab.id}
          onClick={() => {
            setActiveTab(tab.id);
            sound.playBeep(750, 0.04);
          }}
          aria-current={isActive ? 'page' : undefined}
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-lg transition-all min-w-0 flex-1 cursor-pointer ${
            isActive ? 'text-cyan-600 dark:text-cyan-400 font-bold bg-cyan-50/80 dark:bg-cyan-950/40' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <tab.icon className={`w-4 h-4 mb-0.5 ${isActive ? '' : tab.color}`} />
          <span className="truncate max-w-full leading-tight">{tab.short}</span>
        </button>
      );
    })}
  </nav>
);
