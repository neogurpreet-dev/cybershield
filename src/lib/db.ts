import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  type DocumentData,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db } from './firebase';
import { toast } from './toast';
import type { AppNotification, ChecklistItem, EventType, Incident, Severity, Verdict } from '../types';

export const USER_COLLECTIONS = [
  'events',
  'incidents',
  'tasks',
  'goals',
  'contacts',
  'domains',
  'checkups',
  'notifications',
  'compliance',
  'vaultItems',
  'vaultMeta',
] as const;
export type UserCollection = (typeof USER_COLLECTIONS)[number];

export const userDoc = (uid: string) => doc(db, 'users', uid);
export const userCol = (uid: string, name: UserCollection) => collection(db, 'users', uid, name);
export const userItem = (uid: string, name: UserCollection, id: string) => doc(db, 'users', uid, name, id);

export const newId = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(15));
  return Array.from(bytes, (b) => b.toString(36).padStart(2, '0')).join('').slice(0, 24);
};

export async function ensureProfile(user: User) {
  await setDoc(
    userDoc(user.uid),
    {
      displayName: user.displayName || user.email?.split('@')[0] || 'CyberShield user',
      email: user.email || '',
      photoURL: user.photoURL || null,
      lastSeenAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export function addItem(uid: string, name: UserCollection, data: DocumentData) {
  return addDoc(userCol(uid, name), { ...data, createdAt: serverTimestamp() });
}

export function updateItem(uid: string, name: UserCollection, id: string, data: DocumentData) {
  return updateDoc(userItem(uid, name, id), data);
}

export function removeItem(uid: string, name: UserCollection, id: string) {
  return deleteDoc(userItem(uid, name, id));
}

/** Every real check the user runs is logged here; the dashboard chart is built from these. */
export function logEvent(uid: string, type: EventType, verdict: Verdict, title: string, detail?: string) {
  return addItem(uid, 'events', { type, verdict, title, detail: detail || '' }).catch((e) => console.warn('logEvent failed', e));
}

export function notify(uid: string, title: string, message: string, type: AppNotification['type'] = 'system', tone: 'info' | 'success' | 'warning' | 'danger' = 'info') {
  toast(title, message, tone);
  return addItem(uid, 'notifications', { title, message, type, read: false }).catch((e) => console.warn('notify failed', e));
}

const DEFAULT_CHECKLISTS: Record<string, string[]> = {
  phishing: [
    'Do not click the link again or enter any details on that page',
    'If you entered a password there, change it now (and anywhere you reused it)',
    'If you shared bank/UPI/card details, call your bank and report at 1930 / cybercrime.gov.in',
    'Turn on two-step verification for the affected account',
    'Warn the person or group the link came from',
  ],
  malware: [
    'Disconnect the device from the internet',
    'Run a full scan with Windows Security (or your antivirus)',
    'Change passwords from a different, clean device',
    'Check bank and email accounts for unusual activity',
  ],
  account: [
    'Change the password for the affected account',
    'Sign out of all other sessions/devices',
    'Turn on two-step verification',
    'Review recovery email and phone number',
    'Check for unknown forwarding rules or linked apps',
  ],
  fraud: [
    'Call 1930 (National Cyber Crime Helpline) immediately',
    'Call your bank to block the card/UPI and dispute the transaction',
    'File a complaint at cybercrime.gov.in and note the acknowledgement number',
    'Save screenshots of messages, numbers and transaction IDs',
  ],
  website: [
    'Confirm what changed and when',
    'Fix the configuration issue',
    'Re-scan the domain in CyberShield to confirm the fix',
  ],
  other: ['Write down what happened and when', 'Decide on next steps', 'Confirm the issue is fixed'],
};

export function defaultChecklist(category: string): ChecklistItem[] {
  return (DEFAULT_CHECKLISTS[category] || DEFAULT_CHECKLISTS.other).map((text) => ({ id: newId(), text, done: false }));
}

async function nextIncidentNumber(uid: string): Promise<number> {
  try {
    return await runTransaction(db, async (tx) => {
      const ref = userDoc(uid);
      const snap = await tx.get(ref);
      const next = ((snap.data()?.incidentCounter as number) || 0) + 1;
      tx.set(ref, { incidentCounter: next }, { merge: true });
      return next;
    });
  } catch {
    // Offline: transactions need the server, so fall back to a time-based number.
    return Number(String(Date.now()).slice(-6));
  }
}

export async function createIncident(
  uid: string,
  input: { title: string; category: string; severity: Severity; summary: string; details?: string; source?: Incident['source']; sourceRef?: string }
) {
  const number = await nextIncidentNumber(uid);
  const now = Date.now();
  const ref = await addDoc(userCol(uid, 'incidents'), {
    number,
    title: input.title,
    category: input.category,
    severity: input.severity,
    status: 'open',
    summary: input.summary,
    details: input.details || '',
    source: input.source || 'manual',
    sourceRef: input.sourceRef || '',
    timeline: [
      {
        id: newId(),
        at: now,
        kind: input.source && input.source !== 'manual' ? 'auto' : 'created',
        text: input.source && input.source !== 'manual' ? 'Opened automatically by a CyberShield check.' : 'Incident reported.',
      },
    ],
    checklist: defaultChecklist(input.category),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { id: ref.id, number };
}

/** Everything stored for this user, as plain JSON (vault entries stay encrypted). */
export async function exportAllData(uid: string) {
  const out: Record<string, unknown> = { exportedAt: new Date().toISOString(), uid };
  for (const name of USER_COLLECTIONS) {
    const snap = await getDocs(userCol(uid, name));
    out[name] = snap.docs.map((d) => ({ id: d.id, ...serialise(d.data()) }));
  }
  return out;
}

function serialise(value: any): any {
  if (value && typeof value.toDate === 'function') return value.toDate().toISOString();
  if (Array.isArray(value)) return value.map(serialise);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, serialise(v)]));
  return value;
}

export async function deleteAllData(uid: string) {
  for (const name of USER_COLLECTIONS) {
    const snap = await getDocs(userCol(uid, name));
    for (let i = 0; i < snap.docs.length; i += 400) {
      const batch = writeBatch(db);
      snap.docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  }
  await deleteDoc(userDoc(uid));
}
