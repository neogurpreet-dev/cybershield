import React from 'react';
import { PhoneCall, ExternalLink } from 'lucide-react';
import { Card, CardHeader } from '../../ui/ui';
import { CYBERCRIME_PORTAL, INDIA_HELPLINES } from '../../data/helplines';

export const HelplinesCard: React.FC = () => (
  <Card className="space-y-3">
    <CardHeader icon={<PhoneCall className="w-4 h-4 text-rose-500" />} title="Emergency helplines (India)" subtitle="Tap to call. These are official national numbers." />
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {INDIA_HELPLINES.map((h) => (
        <a key={h.number} href={`tel:${h.number}`} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-rose-400 dark:hover:border-rose-700 transition">
          <span className="min-w-14 px-2 py-1.5 rounded-lg bg-rose-600 text-white text-sm font-black text-center">{h.number}</span>
          <span className="min-w-0">
            <span className="block text-xs font-bold text-slate-900 dark:text-slate-100">{h.name}</span>
            <span className="block text-[11px] text-slate-500 leading-snug">{h.description}</span>
          </span>
        </a>
      ))}
    </div>
    <a href={CYBERCRIME_PORTAL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-700 dark:text-cyan-300 hover:underline">
      Report cyber crime online at cybercrime.gov.in <ExternalLink className="w-3 h-3" />
    </a>
  </Card>
);
