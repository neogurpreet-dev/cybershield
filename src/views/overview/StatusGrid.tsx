import React from 'react';
import { ShieldCheck, Link2, Lock, LifeBuoy } from 'lucide-react';
import type { CheckupResult, SubsystemTab } from '../../types';
import { timeAgo } from '../../lib/format';
import { ScoreRing } from '../../ui/ui';
import { StatusCard } from './StatusCard';

interface Props {
  onNavigate: (t: SubsystemTab) => void;
  last?: CheckupResult;
  linksChecked: number;
  flagged: number;
  vaultReady: boolean;
  vaultCount: number;
  contacts: number;
  geoPerm: string;
  readiness: number;
}

export const StatusGrid: React.FC<Props> = ({ onNavigate, last, linksChecked, flagged, vaultReady, vaultCount, contacts, geoPerm, readiness }) => {
  const issues = last ? last.checks.filter((c) => c.status === 'fail' || c.status === 'warn').length : 0;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <StatusCard
        onClick={() => onNavigate('protection')}
        tone="border-emerald-200 dark:border-emerald-900/60"
        icon={<ShieldCheck className="w-6 h-6 text-emerald-500" />}
        badge={<ScoreRing score={last ? last.score : null} size={44} />}
        title={last ? (last.score >= 80 ? 'Browser looks healthy' : 'Browser needs attention') : 'Run your first checkup'}
        body={last ? `${issues} issue${issues === 1 ? '' : 's'} found ${timeAgo(last.createdAt)} on ${last.device.browser}.` : 'Checks your browser version, OS support, privacy leaks and SOS readiness.'}
        cta={last ? 'Run again' : 'Start checkup'}
      />
      <StatusCard
        onClick={() => onNavigate('protection')}
        tone="border-cyan-200 dark:border-cyan-900/60"
        icon={<Link2 className="w-6 h-6 text-cyan-500" />}
        badge={<span className={`text-xs font-bold ${flagged ? 'text-rose-500' : 'text-slate-500'}`}>{flagged} flagged</span>}
        title={linksChecked ? `${linksChecked} link${linksChecked > 1 ? 's' : ''} checked` : 'Check a suspicious link'}
        body={linksChecked ? `In the past 30 days, ${flagged} looked unsafe. Got a strange SMS or email? Check it before you tap.` : 'Paste any link from SMS, WhatsApp or email to see if it is a scam before you open it.'}
        cta="Check a link"
      />
      <StatusCard
        onClick={() => onNavigate('vault')}
        tone="border-indigo-200 dark:border-indigo-900/60"
        icon={<Lock className="w-6 h-6 text-indigo-500" />}
        badge={<span className="text-xs font-bold text-slate-500">{vaultReady ? `${vaultCount} items` : 'Not set up'}</span>}
        title={vaultReady ? 'Vault is encrypted' : 'Set up your vault'}
        body={vaultReady ? 'Your saved passwords and notes are encrypted with your passphrase. Only you can open them.' : 'Store passwords, recovery codes and notes encrypted with a passphrase only you know.'}
        cta={vaultReady ? 'Open vault' : 'Create vault'}
      />
      <StatusCard
        onClick={() => onNavigate('emergency')}
        tone="border-amber-200 dark:border-amber-900/60"
        icon={<LifeBuoy className="w-6 h-6 text-amber-500" />}
        badge={<span className={`text-xs font-bold ${readiness === 100 ? 'text-emerald-500' : 'text-amber-500'}`}>{readiness}% ready</span>}
        title="Emergency SOS"
        body={`${contacts} SOS contact${contacts === 1 ? '' : 's'} · location ${geoPerm === 'granted' ? 'allowed' : geoPerm === 'denied' ? 'blocked' : 'not set up yet'}.`}
        cta="Emergency centre"
      />
    </div>
  );
};
