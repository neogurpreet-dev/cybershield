import React, { useState } from 'react';
import { ArrowLeft, Copy, Check, FileDown, FileText, Mail, Bot, Trash2, Pencil, Printer } from 'lucide-react';
import { serverTimestamp } from 'firebase/firestore';
import { Badge, Button, Card, inputCls, useConfirm } from '../../ui/ui';
import { newId, removeItem, updateItem } from '../../lib/db';
import { copyText, formatDateTime } from '../../lib/format';
import { exportIncidentDocx, exportIncidentPdf, incidentText } from '../../lib/reports';
import { toast } from '../../lib/toast';
import { askAssistant } from '../../components/AssistantPanel';
import type { Incident, IncidentStatus, Severity } from '../../types';
import { SEVERITY, STATUS, categoryLabel } from './meta';
import { IncidentChecklist } from './IncidentChecklist';
import { IncidentTimeline } from './IncidentTimeline';

export const IncidentDetail: React.FC<{ uid: string; inc: Incident; owner: string; onBack: () => void }> = ({ uid, inc, owner, onBack }) => {
  const [tab, setTab] = useState<'steps' | 'timeline' | 'details'>('steps');
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ summary: inc.summary, details: inc.details || '' });
  const { confirm, dialog } = useConfirm();

  const entry = (kind: 'status' | 'severity', text: string) => [...inc.timeline, { id: newId(), at: Date.now(), kind, text }];

  const setStatus = (status: IncidentStatus) => {
    if (status === inc.status) return;
    updateItem(uid, 'incidents', inc.id, {
      status,
      resolvedAt: status === 'resolved' ? serverTimestamp() : null,
      updatedAt: serverTimestamp(),
      timeline: entry('status', `Status changed to ${STATUS[status].label}.`),
    });
  };
  const setSeverity = (severity: Severity) =>
    updateItem(uid, 'incidents', inc.id, { severity, updatedAt: serverTimestamp(), timeline: entry('severity', `Severity changed to ${SEVERITY[severity].label}.`) });

  const saveText = async () => {
    await updateItem(uid, 'incidents', inc.id, { summary: draft.summary.trim(), details: draft.details, updatedAt: serverTimestamp() });
    setEditing(false);
  };

  const text = incidentText(inc, owner);
  const mailto = `mailto:?subject=${encodeURIComponent(`Security incident #${inc.number}: ${inc.title}`)}&body=${encodeURIComponent(text.slice(0, 1800))}`;

  return (
    <div className="space-y-4">
      {dialog}
      <Card className="!p-0 overflow-hidden">
        <div className={`h-1 ${inc.status === 'resolved' ? 'bg-emerald-500' : inc.status === 'investigating' ? 'bg-amber-500' : 'bg-rose-500'}`} />
        <div className="p-5 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={onBack} className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer" aria-label="Back to list">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono-code font-bold text-slate-500">#{inc.number}</span>
            <button onClick={async () => { setCopied(await copyText(String(inc.number))); setTimeout(() => setCopied(false), 1500); }} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer" aria-label="Copy incident number">
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <Badge tone={STATUS[inc.status].tone}>{STATUS[inc.status].label}</Badge>
            <Badge tone={SEVERITY[inc.severity].tone}>{SEVERITY[inc.severity].label} severity</Badge>
            {inc.source !== 'manual' && <Badge tone="cyan">Auto-detected</Badge>}
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 break-words">{inc.title}</h2>
          <div className="text-[11px] text-slate-500">
            {categoryLabel(inc.category)} · reported {formatDateTime(inc.createdAt)}
            {inc.resolvedAt ? ` · resolved ${formatDateTime(inc.resolvedAt)}` : ''}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-lg border border-slate-200 dark:border-slate-800 p-0.5 text-xs">
              {(['open', 'investigating', 'resolved'] as IncidentStatus[]).map((s) => (
                <button key={s} onClick={() => setStatus(s)} className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer ${inc.status === s ? 'bg-slate-900 dark:bg-slate-700 text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                  {STATUS[s].label}
                </button>
              ))}
            </div>
            <select value={inc.severity} onChange={(e) => setSeverity(e.target.value as Severity)} className={`${inputCls} !w-auto !py-1.5`} aria-label="Severity">
              {Object.entries(SEVERITY).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <Button size="sm" variant="secondary" icon={<FileDown className="w-3.5 h-3.5" />} onClick={() => exportIncidentPdf(inc, owner).catch((e) => toast('PDF export failed', e.message, 'danger'))}>PDF</Button>
            <Button size="sm" variant="secondary" icon={<FileText className="w-3.5 h-3.5" />} onClick={() => exportIncidentDocx(inc, owner).catch((e) => toast('Word export failed', e.message, 'danger'))}>Word</Button>
            <a href={mailto} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800">
              <Mail className="w-3.5 h-3.5" /> Email
            </a>
            <Button size="sm" variant="secondary" icon={<Printer className="w-3.5 h-3.5" />} onClick={() => window.print()}>Print</Button>
            <Button size="sm" icon={<Bot className="w-3.5 h-3.5" />} onClick={() => askAssistant({ prompt: 'Explain this incident simply and tell me exactly what I should do next, in order.', context: text, label: `Incident #${inc.number}` })}>
              Ask AI about this
            </Button>
            <Button
              size="sm"
              variant="ghost"
              icon={<Trash2 className="w-3.5 h-3.5" />}
              onClick={async () => {
                if (await confirm('Delete this incident?', `Incident #${inc.number} and its timeline will be permanently deleted.`)) {
                  await removeItem(uid, 'incidents', inc.id);
                  onBack();
                }
              }}
            >
              Delete
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex gap-1 mb-4 border-b border-slate-100 dark:border-slate-800 text-xs">
          {([
            ['steps', 'Next steps'],
            ['timeline', `Timeline (${inc.timeline.length})`],
            ['details', 'Summary & details'],
          ] as const).map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} className={`px-3 py-2 -mb-px border-b-2 font-semibold cursor-pointer ${tab === id ? 'border-cyan-500 text-cyan-700 dark:text-cyan-300' : 'border-transparent text-slate-500'}`}>
              {label}
            </button>
          ))}
        </div>
        {tab === 'steps' && <IncidentChecklist uid={uid} inc={inc} />}
        {tab === 'timeline' && <IncidentTimeline uid={uid} inc={inc} />}
        {tab === 'details' &&
          (editing ? (
            <div className="space-y-3">
              <textarea className={inputCls} rows={4} value={draft.summary} onChange={(e) => setDraft({ ...draft, summary: e.target.value })} aria-label="Summary" />
              <textarea className={inputCls} rows={6} value={draft.details} onChange={(e) => setDraft({ ...draft, details: e.target.value })} aria-label="Details" placeholder="Details" />
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
                <Button onClick={saveText} disabled={!draft.summary.trim()}>Save</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              <div>
                <div className="font-semibold text-slate-500 mb-1">Summary</div>
                <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap break-words leading-relaxed">{inc.summary}</p>
              </div>
              {inc.details && (
                <div>
                  <div className="font-semibold text-slate-500 mb-1">Details</div>
                  <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap break-words leading-relaxed font-mono-code text-[11px]">{inc.details}</p>
                </div>
              )}
              <Button
                size="sm"
                variant="secondary"
                icon={<Pencil className="w-3.5 h-3.5" />}
                onClick={() => {
                  setDraft({ summary: inc.summary, details: inc.details || '' });
                  setEditing(true);
                }}
              >
                Edit
              </Button>
            </div>
          ))}
      </Card>
    </div>
  );
};
