import React from 'react';
import { ArrowRight } from 'lucide-react';

interface Props {
  icon: React.ReactNode;
  tone: string;
  badge: React.ReactNode;
  title: string;
  body: string;
  cta: string;
  onClick: () => void;
}

export const StatusCard: React.FC<Props> = ({ icon, tone, badge, title, body, cta, onClick }) => (
  <button onClick={onClick} className={`text-left p-5 rounded-2xl border bg-white dark:bg-[#0e141e] shadow-sm hover:shadow-md transition cursor-pointer group flex flex-col justify-between ${tone}`}>
    <div>
      <div className="flex items-center justify-between gap-2">
        <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center">{icon}</div>
        {badge}
      </div>
      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-4">{title}</h3>
      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">{body}</p>
    </div>
    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
      <span>{cta}</span>
      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
    </div>
  </button>
);
