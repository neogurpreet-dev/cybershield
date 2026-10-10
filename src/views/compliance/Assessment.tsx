import React, { useState } from 'react';
import { ClipboardCheck, Download } from 'lucide-react';
import { setDoc } from 'firebase/firestore';
import { Badge, Button, Card, CardHeader, inputCls } from '../../ui/ui';
import { FRAMEWORKS } from '../../data/compliance';
import { userItem } from '../../lib/db';
import { downloadFile } from '../../lib/format';
import type { ComplianceState } from '../../types';

type Status = ComplianceState['controls'][string]['status'];
const STATUS: Record<Status, { label: string; tone: 'slate' | 'amber' | 'emerald' | 'indigo' }> = {
  not_started: { label: 'Not started', tone: 'slate' },
  in_progress: { label: 'In progress', tone: 'amber' },
  implemented: { label: 'Implemented', tone: 'emerald' },
  not_applicable: { label: 'Not applicable', tone: 'indigo' },
};

export const Assessment: React.FC<{ uid: string; states: ComplianceState[] }> = ({ uid, states }) => {
  const [fwId, setFwId] = useState(FRAMEWORKS[0].id);
  const fw = FRAMEWORKS.find((f) => f.id === fwId)!;
  const controls = states.find((s) => s.id === fwId)?.controls || {};

  const set = (id: string, patch: Partial<ComplianceState['controls'][string]>) =>
    setDoc(userItem(uid, 'compliance', fwId), { controls: { [id]: { status: controls[id]?.status || 'not_started', ...patch, updatedAt: Date.now() } } }, { merge: true });

  const applicable = fw.controls.filter((c) => controls[c.id]?.status !== 'not_applicable');
  const done = applicable.filter((c) => controls[c.id]?.status === 'implemented').length;
  const pct = applicable.length ? Math.round((done / applicable.length) * 100) : 0;

  const exportCsv = () => {
    const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
    const rows = [['Ref', 'Control', 'Question', 'Status', 'Notes'], ...fw.controls.map((c) => [c.ref, c.title, c.question, STATUS[controls[c.id]?.status || 'not_started'].label, controls[c.id]?.notes || ''])];
    downloadFile(`cybershield-${fw.id}-self-assessment.csv`, rows.map((r) => r.map(esc).join(',')).join('\n'), 'text/csv');
  };

  return (
    <Card className="space-y-4">
      <CardHeader
        icon={<ClipboardCheck className="w-4 h-4 text-indigo-500" />}
        title="Self-assessment"
        subtitle="Track how ready you are. Your answers are saved privately to your account."
        action={<Button size="sm" variant="secondary" icon={<Download className="w-3.5 h-3.5" />} onClick={exportCsv}>Export CSV</Button>}
      />
      <div className="flex flex-wrap gap-2">
        {FRAMEWORKS.map((f) => {
          const c = states.find((s) => s.id === f.id)?.controls || {};
          const app = f.controls.filter((x) => c[x.id]?.status !== 'not_applicable');
          const p = app.length ? Math.round((app.filter((x) => c[x.id]?.status === 'implemented').length / app.length) * 100) : 0;
          return (
            <button key={f.id} onClick={() => setFwId(f.id)} className={`px-3 py-2 rounded-lg border text-xs font-semibold cursor-pointer ${fwId === f.id ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300' : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'}`}>
              {f.short} <span className="opacity-70">{p}%</span>
            </button>
          );
        })}
      </div>
      <div>
        <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{fw.name}</div>
        <p className="text-xs text-slate-500 mt-0.5">{fw.description}</p>
        <div className="mt-3 flex items-center gap-3">
          <div className="flex-1 h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div className="h-full bg-indigo-500 transition-all" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{done}/{applicable.length} implemented</span>
        </div>
      </div>
      <div className="space-y-2">
        {fw.controls.map((c) => {
          const st = controls[c.id]?.status || 'not_started';
          return (
            <div key={c.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono-code font-bold text-slate-500">{c.ref}</span>
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{c.title}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{c.question}</p>
                </div>
                <select value={st} onChange={(e) => set(c.id, { status: e.target.value as Status })} className={`${inputCls} !w-auto !py-1`} aria-label={`Status for ${c.title}`}>
                  {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <input
                className={`${inputCls} !text-[11px]`}
                defaultValue={controls[c.id]?.notes || ''}
                onBlur={(e) => e.target.value !== (controls[c.id]?.notes || '') && set(c.id, { notes: e.target.value })}
                placeholder="Notes or evidence (e.g. link to your policy document)"
              />
              {st !== 'not_started' && <Badge tone={STATUS[st].tone}>{STATUS[st].label}</Badge>}
            </div>
          );
        })}
      </div>
      <p className="text-[11px] text-slate-500">These are plain-language summaries written by CyberShield to help you prepare. They are not the official standard text, and completing them is not a certification or legal advice.</p>
    </Card>
  );
};
