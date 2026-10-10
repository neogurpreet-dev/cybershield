import type { Timestamp } from 'firebase/firestore';

export type SubsystemTab =
  | 'overview'
  | 'protection'
  | 'incident'
  | 'network'
  | 'emergency'
  | 'compliance'
  | 'vault';

/** Firestore timestamps arrive as Timestamp, or null briefly while a write is pending. */
export type When = Timestamp | null;

export interface UserProfile {
  displayName: string;
  email: string;
  photoURL?: string | null;
  role?: string;
  incidentCounter?: number;
  checklist?: Record<string, boolean>;
  activeSosId?: string | null;
  createdAt?: When;
  lastSeenAt?: When;
}

export type EventType = 'url_check' | 'password_check' | 'checkup' | 'domain_scan' | 'sos';
export type Verdict = 'safe' | 'suspicious' | 'dangerous' | 'info';

export interface SecurityEvent {
  id: string;
  type: EventType;
  verdict: Verdict;
  title: string;
  detail?: string;
  createdAt: When;
}

export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type IncidentStatus = 'open' | 'investigating' | 'resolved';

export interface TimelineEntry {
  id: string;
  at: number; // epoch ms (arrays can't hold serverTimestamp)
  kind: 'created' | 'note' | 'status' | 'severity' | 'checklist' | 'auto';
  text: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface Incident {
  id: string;
  number: number;
  title: string;
  category: string;
  severity: Severity;
  status: IncidentStatus;
  summary: string;
  details?: string;
  source: 'manual' | 'url_check' | 'domain_scan' | 'password_check';
  sourceRef?: string;
  timeline: TimelineEntry[];
  checklist: ChecklistItem[];
  createdAt: When;
  updatedAt: When;
  resolvedAt?: When;
}

export type TaskPriority = 'critical' | 'high' | 'routine';
export type TaskCategory = 'security' | 'accounts' | 'network' | 'backup' | 'incident' | 'compliance';

export interface Task {
  id: string;
  title: string;
  category: TaskCategory;
  priority: TaskPriority;
  dueAt: When;
  done: boolean;
  notified?: boolean;
  createdAt: When;
}

export interface Goal {
  id: string;
  title: string;
  area: string;
  status: 'planned' | 'in_progress' | 'done' | 'blocked';
  progress: number;
  deadline?: string; // yyyy-mm-dd
  notes: string;
  createdAt: When;
}

export interface EmergencyContact {
  id: string;
  name: string;
  relation: string;
  phone: string;
  priority: number;
  createdAt: When;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'security' | 'task' | 'sos' | 'domain' | 'vault' | 'system';
  read: boolean;
  createdAt: When;
}

export interface DnsAnswer {
  type: string;
  data: string;
  ttl: number;
}

export interface DomainScan {
  at: number;
  score: number;
  dns: Record<string, DnsAnswer[]>;
  dnssec: boolean;
  spf: { present: boolean; record?: string; policy?: string };
  dmarc: { present: boolean; record?: string; policy?: string };
  caa: boolean;
  site?: any; // response of /api/site-check
  findings: { level: 'good' | 'warn' | 'bad' | 'info'; title: string; fix?: string }[];
  changes?: string[];
}

export interface MonitoredDomain {
  id: string;
  domain: string;
  verifyToken: string;
  verified: boolean;
  verifiedAt?: When;
  lastScan?: DomainScan;
  createdAt: When;
}

export interface CheckupResult {
  id: string;
  score: number;
  checks: { id: string; label: string; status: 'pass' | 'warn' | 'fail' | 'info'; detail: string; fix?: string }[];
  device: { os: string; browser: string };
  createdAt: When;
}

export interface ComplianceState {
  id: string; // framework id
  controls: Record<string, { status: 'not_started' | 'in_progress' | 'implemented' | 'not_applicable'; notes?: string; updatedAt?: number }>;
}

export interface SosSession {
  ownerUid: string;
  ownerName: string;
  active: boolean;
  message: string;
  startedAt: When;
  endedAt?: When;
  lastLocation?: { lat: number; lng: number; accuracy: number | null; source: string; at: number; address?: string | null };
}
