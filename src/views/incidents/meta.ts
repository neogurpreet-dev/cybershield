import type { IncidentStatus, Severity } from '../../types';

export const SEVERITY: Record<Severity, { label: string; tone: 'slate' | 'amber' | 'rose' | 'cyan' }> = {
  low: { label: 'Low', tone: 'slate' },
  medium: { label: 'Medium', tone: 'amber' },
  high: { label: 'High', tone: 'rose' },
  critical: { label: 'Critical', tone: 'rose' },
};

export const STATUS: Record<IncidentStatus, { label: string; tone: 'rose' | 'amber' | 'emerald' }> = {
  open: { label: 'Open', tone: 'rose' },
  investigating: { label: 'Investigating', tone: 'amber' },
  resolved: { label: 'Resolved', tone: 'emerald' },
};

export const CATEGORIES: { id: string; label: string; hint: string }[] = [
  { id: 'phishing', label: 'Phishing / scam link or message', hint: 'Fake SMS, email, WhatsApp or website' },
  { id: 'fraud', label: 'Money lost / payment fraud', hint: 'UPI, card or bank transfer you didn’t authorise' },
  { id: 'account', label: 'Account hacked or suspicious sign-in', hint: 'Email, social media, bank login' },
  { id: 'malware', label: 'Virus / malware on a device', hint: 'Pop-ups, strange apps, slow device, ransomware' },
  { id: 'website', label: 'Website or domain problem', hint: 'Expired certificate, DNS changed, site defaced' },
  { id: 'other', label: 'Something else', hint: '' },
];

export const categoryLabel = (id: string) => CATEGORIES.find((c) => c.id === id)?.label || id;
