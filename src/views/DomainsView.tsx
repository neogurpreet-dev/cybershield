import React, { useState } from 'react';
import { Globe2 } from 'lucide-react';
import { useUid } from '../hooks/useAuth';
import { useCollection } from '../hooks/useFirestore';
import { Card, CardHeader, EmptyState, ScoreRing, Spinner, Badge } from '../ui/ui';
import { timeAgo } from '../lib/format';
import { toast } from '../lib/toast';
import type { MonitoredDomain } from '../types';
import { AddDomain } from './domains/AddDomain';
import { DomainDetail } from './domains/DomainDetail';
import { runDomainScan } from './domains/runScan';

export const DomainsView: React.FC = () => {
  const uid = useUid();
  const { items, loading } = useCollection<MonitoredDomain>(uid, 'domains', { orderBy: ['createdAt', 'asc'] });
  const [selected, setSelected] = useState<string | null>(null);
  const current = items.find((d) => d.id === selected) || items[0];

  return (
    <div className="max-w-7xl mx-auto font-sans space-y-4">
      <div>
        <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Domains</h1>
        <p className="text-xs text-slate-500 mt-0.5">Monitor websites you own or manage: live DNS, SSL certificate expiry, security headers and email-spoofing protection.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        <Card className="lg:col-span-4 space-y-3">
          <CardHeader icon={<Globe2 className="w-4 h-4 text-sky-500" />} title="Your domains" subtitle={`${items.length} monitored`} />
          <AddDomain
            uid={uid}
            existing={items}
            onAdded={(id, domain) => {
              setSelected(id);
              // Kick off the first scan straight away.
              runDomainScan(uid, { id, domain, verifyToken: '', verified: false, createdAt: null }).catch((e) => toast('First scan failed', e.message, 'danger'));
            }}
          />
          {loading ? (
            <Spinner />
          ) : (
            <div className="space-y-1.5">
              {items.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setSelected(d.id)}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-lg border text-left transition cursor-pointer ${current?.id === d.id ? 'border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/30' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'}`}
                >
                  <ScoreRing score={d.lastScan ? d.lastScan.score : null} size={38} />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold font-mono-code truncate text-slate-900 dark:text-slate-100">{d.domain}</div>
                    <div className="text-[10px] text-slate-500">{d.lastScan ? `Scanned ${timeAgo(d.lastScan.at)}` : 'Scanning…'}</div>
                  </div>
                  {d.verified && <Badge tone="emerald">Verified</Badge>}
                </button>
              ))}
            </div>
          )}
        </Card>

        <div className="lg:col-span-8">
          {current ? (
            <DomainDetail key={current.id} uid={uid} d={current} onRemoved={() => setSelected(null)} />
          ) : (
            !loading && (
              <Card>
                <EmptyState
                  icon={<Globe2 className="w-5 h-5" />}
                  title="Add your first domain"
                  body="Type a domain you own (e.g. your business website) to see its real DNS records, certificate expiry, and what attackers could abuse."
                />
              </Card>
            )
          )}
        </div>
      </div>
    </div>
  );
};
