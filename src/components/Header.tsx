import React from 'react';
import { Shield, Sun, Moon, Menu, X, Search, Contrast, CloudOff, RefreshCw, ShieldCheck } from 'lucide-react';
import type { CheckupResult, SubsystemTab } from '../types';
import { NAV } from '../nav';
import { sound } from '../services/audio';
import { useAuth } from '../hooks/useAuth';
import { useOnline } from '../hooks/useOnline';
import { useCollection } from '../hooks/useFirestore';
import { NotificationsBell } from './NotificationsBell';
import { timeAgo } from '../lib/format';

interface HeaderProps {
  activeTab: SubsystemTab;
  setActiveTab: (tab: SubsystemTab) => void;
  onOpenProfile: () => void;
  onOpenCommandPalette: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  isHighContrast: boolean;
  toggleHighContrast: () => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

const toolBtn = 'p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer';

export const Header: React.FC<HeaderProps> = (p) => {
  const { activeTab, isDarkMode, isHighContrast, mobileMenuOpen, setMobileMenuOpen } = p;
  const { user, profile, syncPending } = useAuth();
  const online = useOnline();
  const { items: checkups } = useCollection<CheckupResult>(user?.uid, 'checkups', { orderBy: ['createdAt', 'desc'], limit: 1 });
  const last = checkups[0];
  const name = profile?.displayName || user?.displayName || 'You';

  const go = (tab: SubsystemTab) => {
    p.setActiveTab(tab);
    setMobileMenuOpen(false);
    sound.playBeep(750, 0.04);
  };

  const status = online ? (
    <>
      <span className={`w-2 h-2 rounded-full shrink-0 ${syncPending ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
      <span className={`font-medium ${syncPending ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{syncPending ? 'Syncing…' : 'Synced'}</span>
    </>
  ) : (
    <>
      <CloudOff className="w-3 h-3 text-amber-500" />
      <span className="text-amber-600 dark:text-amber-400 font-medium">Offline: saving locally</span>
    </>
  );

  const checkupPill = last ? (
    <>
      <ShieldCheck className={`w-3.5 h-3.5 ${last.score >= 80 ? 'text-emerald-500' : last.score >= 55 ? 'text-amber-500' : 'text-rose-500'}`} />
      <span>Checkup {last.score}/100</span>
      <span className="text-slate-400 font-normal hidden md:inline">· {timeAgo(last.createdAt)}</span>
    </>
  ) : (
    <>
      <RefreshCw className="w-3.5 h-3.5 text-cyan-500" />
      <span>Run security checkup</span>
    </>
  );

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#0c1017]/95 backdrop-blur-md px-3 sm:px-6 py-2.5 transition-colors font-sans no-print">
      <div className="flex items-center justify-between gap-3 max-w-[1700px] mx-auto">
        <div className="flex items-center gap-3 shrink-0">
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer" aria-label="Toggle navigation menu">
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <button onClick={() => go('overview')} className="flex items-center gap-2.5 text-left cursor-pointer">
            <div className="w-9 h-9 rounded-xl bg-cyan-600 text-white flex items-center justify-center shadow-xs">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm tracking-tight text-slate-900 dark:text-slate-100 leading-tight">CyberShield</div>
              <div className="flex items-center gap-1.5 text-[11px] mt-0.5">{status}</div>
            </div>
          </button>
          <button onClick={() => go('protection')} className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer" title="Open the browser security checkup">
            {checkupPill}
          </button>
        </div>

        <nav className="hidden lg:flex items-center gap-0.5 bg-slate-100 dark:bg-slate-900/80 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium">
          {NAV.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => go(tab.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  isActive ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-semibold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {tab.id === 'emergency' && <tab.icon className="w-3.5 h-3.5 text-rose-500" />}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button onClick={p.onOpenCommandPalette} className="flex items-center gap-2 px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 text-xs cursor-pointer" title="Search pages and actions (Ctrl+K)">
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Search</span>
            <kbd className="hidden xl:inline px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px] font-mono text-slate-500">Ctrl K</kbd>
          </button>
          <button onClick={p.toggleHighContrast} className={`hidden sm:block ${toolBtn} ${isHighContrast ? '!border-amber-400 !bg-amber-100 dark:!bg-amber-950 !text-amber-700 dark:!text-amber-300' : ''}`} title="High contrast" aria-pressed={isHighContrast}>
            <Contrast className="w-4 h-4" />
          </button>
          <button onClick={p.toggleDarkMode} className={toolBtn} title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'} aria-label="Toggle theme">
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
          <NotificationsBell />
          <button onClick={p.onOpenProfile} className="flex items-center gap-2 pl-1.5 pr-1.5 xl:pr-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-left cursor-pointer" title="Your profile and account">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="" referrerPolicy="no-referrer" className="w-7 h-7 rounded-full" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-cyan-700 text-white flex items-center justify-center text-xs font-bold">{name.charAt(0).toUpperCase()}</div>
            )}
            <div className="hidden xl:block max-w-[140px]">
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight truncate">{name}</div>
              <div className="text-[10px] text-slate-500 leading-tight truncate">{profile?.role || user?.email}</div>
            </div>
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden mt-2 pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2 animate-fadeIn">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {NAV.map((tab) => (
              <button
                key={tab.id}
                onClick={() => go(tab.id)}
                className={`p-2.5 rounded-lg text-left flex items-center gap-2 cursor-pointer ${activeTab === tab.id ? 'bg-cyan-600 text-white font-bold' : 'bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300'}`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
          <button onClick={() => go('protection')} className="sm:hidden w-full flex items-center justify-center gap-1.5 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold cursor-pointer">
            {checkupPill}
          </button>
        </div>
      )}
    </header>
  );
};
