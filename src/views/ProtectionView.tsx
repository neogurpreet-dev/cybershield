import React from 'react';
import type { SubsystemTab } from '../types';
import { useUid } from '../hooks/useAuth';
import { LinkChecker } from './protection/LinkChecker';
import { PasswordChecker } from './protection/PasswordChecker';
import { BrowserCheckup } from './protection/BrowserCheckup';

export const ProtectionView: React.FC<{ onNavigate: (t: SubsystemTab) => void }> = () => {
  const uid = useUid();
  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      <div>
        <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Protection</h1>
        <p className="text-xs text-slate-500 mt-0.5">Check things before you trust them. Every result is saved to your activity history.</p>
      </div>
      <LinkChecker uid={uid} />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        <PasswordChecker uid={uid} />
        <BrowserCheckup uid={uid} />
      </div>
    </div>
  );
};
