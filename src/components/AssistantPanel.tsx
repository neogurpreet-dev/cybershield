import React, { useEffect, useRef, useState } from 'react';
import { Bot, Send, X, Loader2, AlertTriangle } from 'lucide-react';
import { apiPost, serverStatus } from '../lib/api';

interface Msg {
  role: 'user' | 'model';
  text: string;
}

export interface AskRequest {
  prompt: string;
  context?: string;
  label?: string;
}

/** Open the assistant from anywhere with a prompt (and optional context). */
export const askAssistant = (detail: AskRequest) => window.dispatchEvent(new CustomEvent<AskRequest>('cs:ask', { detail }));

/** Minimal, safe formatting: **bold** and bullet lines. No HTML is injected. */
function renderText(text: string) {
  return text.split('\n').map((line, i) => {
    const bullet = /^\s*[-*•]\s+/.test(line);
    const clean = line.replace(/^\s*[-*•]\s+/, '').replace(/^#+\s*/, '');
    const parts = clean
      .split(/(\*\*[^*]+\*\*)/g)
      .map((p, j) => (p.startsWith('**') && p.endsWith('**') ? <strong key={j}>{p.slice(2, -2)}</strong> : <React.Fragment key={j}>{p}</React.Fragment>));
    return (
      <div key={i} className={bullet ? 'pl-4 relative before:content-["•"] before:absolute before:left-1' : line.trim() ? '' : 'h-2'}>
        {parts}
      </div>
    );
  });
}

const SUGGESTIONS = [
  'I got an SMS saying my bank KYC expires today. Is it a scam?',
  'How do I set up two-step verification on Gmail?',
  'Someone took money from my UPI. What do I do right now?',
];

export const AssistantPanel: React.FC<{ open: boolean; onOpen: () => void; onClose: () => void }> = ({ open, onOpen, onClose }) => {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [context, setContext] = useState<{ text: string; label: string } | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<Msg[]>([]);
  messagesRef.current = messages;

  useEffect(() => {
    if (open) serverStatus().then((s) => setConfigured(s.ai));
  }, [open]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, busy]);

  const send = async (text: string, ctx: { text: string; label: string } | null) => {
    const q = text.trim();
    if (!q) return;
    setError(null);
    const history = messagesRef.current;
    setMessages([...history, { role: 'user', text: q }]);
    setInput('');
    setBusy(true);
    try {
      const r = await apiPost<{ text: string }>('/api/assistant', { message: q, history, context: ctx?.text });
      setMessages((m) => [...m, { role: 'model', text: r.text }]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    const onAsk = (e: Event) => {
      const d = (e as CustomEvent<AskRequest>).detail;
      onOpen();
      const ctx = d.context ? { text: d.context, label: d.label || 'Attached context' } : null;
      setContext(ctx);
      messagesRef.current = [];
      setMessages([]);
      send(d.prompt, ctx);
    };
    window.addEventListener('cs:ask', onAsk);
    return () => window.removeEventListener('cs:ask', onAsk);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!open) return null;
  return renderPanel({ messages, input, setInput, busy, error, configured, context, setContext, endRef, onClose, send });
};

interface PanelProps {
  messages: Msg[];
  input: string;
  setInput: (v: string) => void;
  busy: boolean;
  error: string | null;
  configured: boolean | null;
  context: { text: string; label: string } | null;
  setContext: (c: null) => void;
  endRef: React.RefObject<HTMLDivElement | null>;
  onClose: () => void;
  send: (text: string, ctx: { text: string; label: string } | null) => void;
}

function renderPanel(p: PanelProps) {
  const disabled = p.configured === false;
  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-white dark:bg-[#0c1017] border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col font-sans animate-fadeIn no-print">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-600 text-white flex items-center justify-center"><Bot className="w-4 h-4" /></div>
          <div>
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100">Safety Guide</div>
            <div className="text-[10px] text-slate-500">AI answers in plain English · powered by Gemini</div>
          </div>
        </div>
        <button onClick={p.onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer" aria-label="Close assistant">
          <X className="w-5 h-5" />
        </button>
      </div>

      {p.context && (
        <div className="mx-4 mt-3 px-3 py-2 rounded-lg bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-900 text-[11px] text-cyan-800 dark:text-cyan-300 flex items-center justify-between gap-2">
          <span className="truncate">Context: {p.context.label}</span>
          <button onClick={() => p.setContext(null)} className="shrink-0 underline cursor-pointer">Remove</button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
        {disabled && (
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 flex gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>The assistant isn’t configured yet. The site owner needs to add a GEMINI_API_KEY in Vercel.</span>
          </div>
        )}
        {p.messages.length === 0 && !disabled && (
          <div className="space-y-2">
            <p className="text-slate-500">Ask anything about staying safe online. For example:</p>
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => p.send(s, p.context)} className="block w-full text-left p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 cursor-pointer">
                {s}
              </button>
            ))}
          </div>
        )}
        {p.messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
            <div className={`max-w-[88%] px-3 py-2 rounded-xl leading-relaxed break-words ${m.role === 'user' ? 'bg-cyan-600 text-white' : 'bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800'}`}>
              {m.role === 'user' ? m.text : renderText(m.text)}
            </div>
          </div>
        ))}
        {p.busy && <div className="flex items-center gap-2 text-slate-500"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Thinking…</div>}
        {p.error && <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900">{p.error}</div>}
        <div ref={p.endRef} />
      </div>

      <form onSubmit={(e) => { e.preventDefault(); if (!p.busy) p.send(p.input, p.context); }} className="p-3 border-t border-slate-200 dark:border-slate-800 flex gap-2">
        <input value={p.input} onChange={(e) => p.setInput(e.target.value)} placeholder="Type your question…" disabled={disabled} className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
        <button type="submit" disabled={!p.input.trim() || p.busy || disabled} className="px-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white disabled:opacity-50 cursor-pointer" aria-label="Send">
          <Send className="w-4 h-4" />
        </button>
      </form>
      <p className="px-3 pb-3 text-[10px] text-slate-400">AI can make mistakes. Never share passwords or OTPs. In an emergency call 112.</p>
    </div>
  );
}
