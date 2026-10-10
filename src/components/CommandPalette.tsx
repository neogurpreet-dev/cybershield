import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Sun, Bot, User, LogOut, CornerDownLeft } from 'lucide-react';
import type { SubsystemTab } from '../types';
import { NAV } from '../nav';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: SubsystemTab) => void;
  toggleDarkMode: () => void;
  onOpenAssistant: () => void;
  onOpenProfile: () => void;
  onSignOut: () => void;
}

const DESCRIPTIONS: Record<SubsystemTab, string> = {
  overview: 'Your activity, readiness, tasks and goals',
  protection: 'Check links, passwords, and run a browser security checkup',
  incident: 'Report and track security incidents, export reports',
  network: 'Monitor DNS, SSL certificates and email security for your domains',
  emergency: 'SOS with live location sharing, contacts, nearby hospitals & police',
  compliance: 'ISO 27001, data-privacy and SOC 2 self-assessment',
  vault: 'Encrypted passwords and notes, backups and data export',
};

export const CommandPalette: React.FC<Props> = ({ isOpen, onClose, onSelectTab, toggleDarkMode, onOpenAssistant, onOpenProfile, onSignOut }) => {
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const items = useMemo(
    () => [
      ...NAV.map((n) => ({ id: n.id, group: 'Go to', label: n.label, description: DESCRIPTIONS[n.id], icon: <n.icon className={`w-4 h-4 ${n.color}`} />, run: () => onSelectTab(n.id) })),
      { id: 'assistant', group: 'Actions', label: 'Ask the Safety Guide (AI)', description: 'Plain-English answers about scams, security and emergencies', icon: <Bot className="w-4 h-4 text-cyan-500" />, run: onOpenAssistant },
      { id: 'theme', group: 'Actions', label: 'Switch light / dark theme', description: 'Change how CyberShield looks', icon: <Sun className="w-4 h-4 text-amber-500" />, run: toggleDarkMode },
      { id: 'profile', group: 'Actions', label: 'Profile & account', description: 'Edit your name and role, export or delete your data', icon: <User className="w-4 h-4 text-slate-500" />, run: onOpenProfile },
      { id: 'signout', group: 'Actions', label: 'Sign out', description: 'End your session on this device', icon: <LogOut className="w-4 h-4 text-rose-500" />, run: onSignOut },
    ],
    [onSelectTab, toggleDarkMode, onOpenAssistant, onOpenProfile, onSignOut]
  );

  const filtered = items.filter((i) => `${i.label} ${i.description}`.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setIndex(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const run = (i: number) => {
    const item = filtered[i];
    if (!item) return;
    onClose();
    item.run();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start justify-center p-4 pt-[12vh]" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-lg bg-white dark:bg-[#0e141e] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-fadeIn" role="dialog" aria-label="Command palette">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIndex(0);
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setIndex((i) => Math.min(i + 1, filtered.length - 1)); }
              if (e.key === 'ArrowUp') { e.preventDefault(); setIndex((i) => Math.max(i - 1, 0)); }
              if (e.key === 'Enter') run(index);
              if (e.key === 'Escape') onClose();
            }}
            placeholder="Search pages and actions…"
            className="flex-1 bg-transparent outline-none text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
          />
          <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">Esc</kbd>
        </div>
        <div className="max-h-[50vh] overflow-y-auto p-2">
          {filtered.length === 0 && <div className="p-6 text-center text-xs text-slate-500">Nothing matches “{query}”.</div>}
          {filtered.map((item, i) => (
            <button
              key={item.id}
              onMouseEnter={() => setIndex(i)}
              onClick={() => run(i)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left cursor-pointer ${i === index ? 'bg-slate-100 dark:bg-slate-800' : ''}`}
            >
              <span className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">{item.icon}</span>
              <span className="flex-1 min-w-0">
                <span className="block text-xs font-semibold text-slate-900 dark:text-slate-100">{item.label}</span>
                <span className="block text-[11px] text-slate-500 truncate">{item.description}</span>
              </span>
              {i === index && <CornerDownLeft className="w-3.5 h-3.5 text-slate-400" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
