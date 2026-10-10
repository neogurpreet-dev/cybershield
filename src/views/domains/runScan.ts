import { serverTimestamp } from 'firebase/firestore';
import { scanDomain } from '../../lib/dns';
import { logEvent, notify, updateItem } from '../../lib/db';
import type { MonitoredDomain } from '../../types';

/** Runs a real scan, stores it, logs it, and raises alerts for expiring certs or DNS changes. */
export async function runDomainScan(uid: string, d: MonitoredDomain) {
  const scan = await scanDomain(d.domain, d.lastScan);
  await updateItem(uid, 'domains', d.id, { lastScan: scan, scannedAt: serverTimestamp() });

  const verdict = scan.score >= 80 ? 'safe' : scan.score >= 50 ? 'suspicious' : 'dangerous';
  logEvent(uid, 'domain_scan', verdict, d.domain, `Score ${scan.score}/100`);

  const days = scan.site?.tls?.daysRemaining;
  if (typeof days === 'number' && days < 14) {
    notify(uid, `Certificate for ${d.domain} ${days < 0 ? 'has expired' : `expires in ${days} days`}`, 'Renew it to avoid browser security warnings for visitors.', 'domain', 'danger');
  }
  if (scan.changes && scan.changes.length) {
    notify(uid, `${d.domain} changed since your last scan`, scan.changes.slice(0, 3).join(' · '), 'domain', 'warning');
  }
  return scan;
}
