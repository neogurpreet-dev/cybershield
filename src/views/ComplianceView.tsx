import React from 'react';
import { useUid } from '../hooks/useAuth';
import { useCollection } from '../hooks/useFirestore';
import type { ComplianceState } from '../types';
import { Assessment } from './compliance/Assessment';
import { Policies } from './compliance/Policies';

export const ComplianceView: React.FC = () => {
  const uid = useUid();
  const { items } = useCollection<ComplianceState>(uid, 'compliance');
  return (
    <div className="max-w-7xl mx-auto font-sans space-y-6">
      <div>
        <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Compliance</h1>
        <p className="text-xs text-slate-500 mt-0.5">Prepare for ISO 27001, India’s DPDP Act / GDPR and SOC 2 with a saved checklist, and read how CyberShield handles your data.</p>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start">
        <div className="xl:col-span-3"><Assessment uid={uid} states={items} /></div>
        <div className="xl:col-span-2"><Policies /></div>
      </div>
    </div>
  );
};
