import { LayoutDashboard, ShieldCheck, ShieldAlert, Globe2, Radio, FileCheck2, Lock } from 'lucide-react';
import type { SubsystemTab } from './types';

export const NAV: { id: SubsystemTab; label: string; short: string; icon: typeof LayoutDashboard; color: string }[] = [
  { id: 'overview', label: 'Overview', short: 'Home', icon: LayoutDashboard, color: 'text-cyan-500' },
  { id: 'protection', label: 'Protection', short: 'Protect', icon: ShieldCheck, color: 'text-emerald-500' },
  { id: 'incident', label: 'Incidents', short: 'Incidents', icon: ShieldAlert, color: 'text-rose-500' },
  { id: 'network', label: 'Domains', short: 'Domains', icon: Globe2, color: 'text-sky-500' },
  { id: 'emergency', label: 'Emergency SOS', short: 'SOS', icon: Radio, color: 'text-rose-500' },
  { id: 'compliance', label: 'Compliance', short: 'Comply', icon: FileCheck2, color: 'text-indigo-500' },
  { id: 'vault', label: 'Vault', short: 'Vault', icon: Lock, color: 'text-amber-500' },
];

export const isTab = (v: string): v is SubsystemTab => NAV.some((n) => n.id === v);
