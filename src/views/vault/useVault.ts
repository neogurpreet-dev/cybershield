import { useCallback, useEffect, useRef, useState } from 'react';
import { doc, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { addItem, removeItem, updateItem, userItem } from '../../lib/db';
import { useCollection } from '../../hooks/useFirestore';
import { checkVerifier, deriveKey, makeVerifier, open, randomSalt, seal, VAULT_ITERATIONS, type Sealed } from '../../lib/vaultCrypto';

export type VaultKind = 'login' | 'note' | 'recovery';
export interface VaultEntry {
  kind: VaultKind;
  title: string;
  username?: string;
  password?: string;
  url?: string;
  notes?: string;
}
interface StoredItem extends Sealed {
  id: string;
}
interface Meta {
  id: string;
  salt: string;
  iterations: number;
  verifier: Sealed;
}

const AUTO_LOCK_MS = 5 * 60 * 1000;

export function useVault(uid: string) {
  const { items: metas, loading: metaLoading } = useCollection<Meta>(uid, 'vaultMeta');
  const { items: stored } = useCollection<StoredItem>(uid, 'vaultItems', { orderBy: ['createdAt', 'desc'] });
  const meta = metas.find((m) => m.id === 'main') || null;
  const [key, setKey] = useState<CryptoKey | null>(null);
  const [entries, setEntries] = useState<(VaultEntry & { id: string })[]>([]);
  const [decryptErrors, setDecryptErrors] = useState(0);
  const lastActive = useRef(Date.now());

  const lock = useCallback(() => {
    setKey(null);
    setEntries([]);
  }, []);

  // Decrypt whenever the stored items or key change.
  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    (async () => {
      let errors = 0;
      const out: (VaultEntry & { id: string })[] = [];
      for (const s of stored) {
        try {
          out.push({ id: s.id, ...(await open<VaultEntry>(key, s)) });
        } catch {
          errors++;
        }
      }
      if (!cancelled) {
        setEntries(out);
        setDecryptErrors(errors);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [key, stored]);

  // Auto-lock after inactivity.
  useEffect(() => {
    if (!key) return;
    const bump = () => (lastActive.current = Date.now());
    const events = ['mousemove', 'keydown', 'touchstart', 'scroll'];
    events.forEach((e) => window.addEventListener(e, bump, { passive: true }));
    const t = setInterval(() => Date.now() - lastActive.current > AUTO_LOCK_MS && lock(), 15_000);
    return () => {
      events.forEach((e) => window.removeEventListener(e, bump));
      clearInterval(t);
    };
  }, [key, lock]);

  const setup = async (passphrase: string) => {
    const salt = randomSalt();
    const k = await deriveKey(passphrase, salt);
    await setDoc(userItem(uid, 'vaultMeta', 'main'), { salt, iterations: VAULT_ITERATIONS, verifier: await makeVerifier(k), createdAt: serverTimestamp() });
    lastActive.current = Date.now();
    setKey(k);
  };

  const unlock = async (passphrase: string) => {
    if (!meta) return false;
    const k = await deriveKey(passphrase, meta.salt, meta.iterations);
    if (!(await checkVerifier(k, meta.verifier))) return false;
    lastActive.current = Date.now();
    setKey(k);
    return true;
  };

  const save = async (entry: VaultEntry, id?: string) => {
    if (!key) throw new Error('Vault is locked');
    const sealed = await seal(key, entry);
    if (id) await updateItem(uid, 'vaultItems', id, { ...sealed, updatedAt: serverTimestamp() });
    else await addItem(uid, 'vaultItems', sealed);
  };

  const remove = (id: string) => removeItem(uid, 'vaultItems', id);

  /** Re-encrypts every entry under a new passphrase in one atomic batch. */
  const changePassphrase = async (next: string) => {
    if (!key) throw new Error('Vault is locked');
    const salt = randomSalt();
    const k = await deriveKey(next, salt);
    const batch = writeBatch(db);
    for (const e of entries) {
      const { id, ...data } = e;
      batch.update(doc(db, 'users', uid, 'vaultItems', id), { ...(await seal(k, data)), updatedAt: serverTimestamp() });
    }
    batch.set(userItem(uid, 'vaultMeta', 'main'), { salt, iterations: VAULT_ITERATIONS, verifier: await makeVerifier(k) }, { merge: true });
    await batch.commit();
    setKey(k);
  };

  return { ready: !metaLoading, exists: Boolean(meta), meta, unlocked: Boolean(key), entries, decryptErrors, setup, unlock, lock, save, remove, changePassphrase, stored };
}
