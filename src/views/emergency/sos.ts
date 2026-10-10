import { doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { logEvent, newId, notify, userDoc } from '../../lib/db';
import { mapsLink, type Fix } from '../../lib/geo';

export const trackUrl = (id: string) => `${window.location.origin}/track/${id}`;

const toLocation = (fix: Fix, address: string | null) => ({
  lat: fix.lat,
  lng: fix.lng,
  accuracy: fix.accuracy,
  source: fix.source,
  at: fix.at,
  address: address || null,
});

export function sosMessage(name: string, fix: Fix | null, address: string | null, sessionId: string | null, approximate: boolean) {
  const lines = [`🚨 SOS: ${name} needs help urgently.`];
  if (sessionId) lines.push(`Live location (updates automatically): ${trackUrl(sessionId)}`);
  if (fix) {
    lines.push(`${approximate ? 'Approximate area' : 'Location'}: ${mapsLink(fix.lat, fix.lng)}${fix.accuracy ? ` (±${fix.accuracy} m)` : ''}`);
    if (address) lines.push(`Near: ${address}`);
  } else {
    lines.push('Location could not be determined. Please call me immediately.');
  }
  lines.push('If you cannot reach me, call 112.');
  return lines.join('\n');
}

export async function startSos(uid: string, name: string, fix: Fix | null, address: string | null, approximate: boolean) {
  const id = newId();
  await setDoc(doc(db, 'sosSessions', id), {
    ownerUid: uid,
    ownerName: name,
    active: true,
    message: `${name} triggered an SOS alert.`,
    startedAt: serverTimestamp(),
    ...(fix ? { lastLocation: { ...toLocation(fix, address), approximate } } : {}),
  });
  await setDoc(userDoc(uid), { activeSosId: id }, { merge: true });
  logEvent(uid, 'sos', 'info', 'SOS activated', fix ? `${fix.lat.toFixed(4)}, ${fix.lng.toFixed(4)}` : 'no location');
  notify(uid, 'SOS is active', 'Your live-tracking link is ready. Send it to your contacts.', 'sos', 'danger');
  return id;
}

export function pushSosLocation(id: string, fix: Fix, address: string | null, approximate: boolean) {
  return updateDoc(doc(db, 'sosSessions', id), { lastLocation: { ...toLocation(fix, address), approximate } });
}

export async function stopSos(uid: string, id: string) {
  await updateDoc(doc(db, 'sosSessions', id), { active: false, endedAt: serverTimestamp() });
  await setDoc(userDoc(uid), { activeSosId: null }, { merge: true });
  logEvent(uid, 'sos', 'info', 'SOS ended');
}
