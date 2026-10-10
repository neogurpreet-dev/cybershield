import { useEffect, useState } from 'react';
import { limit as qLimit, onSnapshot, orderBy as qOrderBy, query, type QueryConstraint } from 'firebase/firestore';
import { userCol, userDoc, type UserCollection } from '../lib/db';

export function useCollection<T extends { id: string }>(
  uid: string | undefined,
  name: UserCollection,
  opts: { orderBy?: [string, 'asc' | 'desc']; limit?: number } = {}
) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const orderKey = opts.orderBy ? opts.orderBy.join(':') : '';

  useEffect(() => {
    if (!uid) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const constraints: QueryConstraint[] = [];
    if (opts.orderBy) constraints.push(qOrderBy(opts.orderBy[0], opts.orderBy[1]));
    if (opts.limit) constraints.push(qLimit(opts.limit));
    const unsub = onSnapshot(
      query(userCol(uid, name), ...constraints),
      (snap) => {
        setItems(snap.docs.map((d) => ({ id: d.id, ...(d.data({ serverTimestamps: 'estimate' }) as object) }) as T));
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.warn(`useCollection(${name})`, err);
        setError(err.message);
        setLoading(false);
      }
    );
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, name, orderKey, opts.limit]);

  return { items, loading, error };
}

export function useUserDoc<T>(uid: string | undefined) {
  const [data, setData] = useState<T | null>(null);
  const [pendingWrites, setPendingWrites] = useState(false);
  const [fromCache, setFromCache] = useState(false);
  useEffect(() => {
    if (!uid) return;
    return onSnapshot(userDoc(uid), { includeMetadataChanges: true }, (snap) => {
      setData((snap.data({ serverTimestamps: 'estimate' }) as T) || null);
      setPendingWrites(snap.metadata.hasPendingWrites);
      setFromCache(snap.metadata.fromCache);
    });
  }, [uid]);
  return { data, pendingWrites, fromCache };
}
