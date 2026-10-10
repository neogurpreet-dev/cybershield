import React, { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { Bot, Loader2 } from 'lucide-react';
import type { SubsystemTab } from './types';
import { isTab } from './nav';
import { useAuth } from './hooks/useAuth';
import { useTaskReminders } from './hooks/useTaskReminders';
import { useTheme, type Theme } from './hooks/useTheme';
import { Toaster } from './ui/ui';
import { SignInScreen } from './components/SignInScreen';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';
import { CommandPalette } from './components/CommandPalette';
import { ProfileModal } from './components/ProfileModal';
import { AssistantPanel } from './components/AssistantPanel';

const OverviewView = lazy(() => import('./views/OverviewView').then((m) => ({ default: m.OverviewView })));
const ProtectionView = lazy(() => import('./views/ProtectionView').then((m) => ({ default: m.ProtectionView })));
const IncidentsView = lazy(() => import('./views/IncidentsView').then((m) => ({ default: m.IncidentsView })));
const DomainsView = lazy(() => import('./views/DomainsView').then((m) => ({ default: m.DomainsView })));
const EmergencyView = lazy(() => import('./views/EmergencyView').then((m) => ({ default: m.EmergencyView })));
const ComplianceView = lazy(() => import('./views/ComplianceView').then((m) => ({ default: m.ComplianceView })));
const VaultView = lazy(() => import('./views/VaultView').then((m) => ({ default: m.VaultView })));

function readTab(): SubsystemTab {
  const h = window.location.hash.replace('#', '').split('/')[0];
  return isTab(h) ? h : 'overview';
}

const Shell: React.FC<{ uid: string; theme: Theme }> = ({ uid, theme }) => {
  const { signOutUser } = useAuth();
  const [tab, setTabState] = useState<SubsystemTab>(readTab);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [palette, setPalette] = useState(false);
  const [profile, setProfile] = useState(false);
  const [assistant, setAssistant] = useState(false);
  useTaskReminders(uid);

  const setTab = useCallback((t: SubsystemTab) => {
    setTabState(t);
    if (window.location.hash !== `#${t}`) window.history.pushState(null, '', `#${t}`);
    window.scrollTo({ top: 0 });
  }, []);

  useEffect(() => {
    const onPop = () => setTabState(readTab());
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPalette((p) => !p);
      }
    };
    window.addEventListener('popstate', onPop);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('popstate', onPop);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <div className={`min-h-screen flex flex-col bg-slate-100 dark:bg-[#070a0f] text-slate-800 dark:text-slate-200 transition-colors ${theme.contrast ? 'contrast-125 saturate-150' : ''}`}>
      <Header
        activeTab={tab}
        setActiveTab={setTab}
        onOpenProfile={() => setProfile(true)}
        onOpenCommandPalette={() => setPalette(true)}
        isDarkMode={theme.dark}
        toggleDarkMode={theme.toggleDark}
        isHighContrast={theme.contrast}
        toggleHighContrast={theme.toggleContrast}
        mobileMenuOpen={mobileMenu}
        setMobileMenuOpen={setMobileMenu}
      />
      <div className="flex-1 flex max-w-[1700px] w-full mx-auto">
        <Sidebar activeTab={tab} setActiveTab={setTab} onQuickSos={() => setTab('emergency')} />
        <main className="flex-1 p-3 sm:p-6 lg:p-8 min-w-0 pb-28 lg:pb-8">
          <Suspense fallback={<div className="flex items-center justify-center gap-2 py-20 text-sm text-slate-500"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>}>
          {tab === 'overview' && <OverviewView onNavigate={setTab} />}
          {tab === 'protection' && <ProtectionView onNavigate={setTab} />}
          {tab === 'incident' && <IncidentsView />}
          {tab === 'network' && <DomainsView />}
          {tab === 'emergency' && <EmergencyView />}
          {tab === 'compliance' && <ComplianceView />}
          {tab === 'vault' && <VaultView />}
          </Suspense>
        </main>
      </div>
      <MobileNav activeTab={tab} setActiveTab={setTab} />

      {!assistant && (
        <button
          onClick={() => setAssistant(true)}
          className="fixed z-40 right-4 bottom-20 lg:bottom-6 flex items-center gap-2 pl-3 pr-4 py-2.5 rounded-full bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold shadow-lg cursor-pointer no-print"
          aria-label="Open the AI Safety Guide"
        >
          <Bot className="w-4 h-4" /> <span className="hidden sm:inline">Ask</span> Safety Guide
        </button>
      )}
      <AssistantPanel open={assistant} onOpen={() => setAssistant(true)} onClose={() => setAssistant(false)} />
      <CommandPalette
        isOpen={palette}
        onClose={() => setPalette(false)}
        onSelectTab={setTab}
        toggleDarkMode={theme.toggleDark}
        onOpenAssistant={() => setAssistant(true)}
        onOpenProfile={() => setProfile(true)}
        onSignOut={signOutUser}
      />
      <ProfileModal open={profile} onClose={() => setProfile(false)} />
    </div>
  );
};

export default function App() {
  const { user, loading } = useAuth();
  const theme = useTheme();
  return (
    <>
      {loading ? (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-[#070a0f] text-slate-500 text-sm gap-2">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading CyberShield…
        </div>
      ) : user ? (
        <Shell key={user.uid} uid={user.uid} theme={theme} />
      ) : (
        <SignInScreen />
      )}
      <Toaster />
    </>
  );
}
