import { auth } from './firebase';

async function authHeader(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) throw new Error('Please sign in first.');
  return { Authorization: `Bearer ${await user.getIdToken()}` };
}

async function parse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as any)?.error || `Request failed (${res.status}).`);
  return data as T;
}

export async function apiGet<T>(path: string): Promise<T> {
  return parse<T>(await fetch(path, { headers: await authHeader() }));
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  return parse<T>(
    await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(await authHeader()) }, body: JSON.stringify(body) })
  );
}

let statusPromise: Promise<{ ai: boolean }> | null = null;
/** Which optional server features are on. A negative answer is not cached, so adding a key takes effect without a reload. */
export function serverStatus() {
  if (!statusPromise) {
    statusPromise = fetch('/api/status', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { ai: false }))
      .catch(() => ({ ai: false }))
      .then((s) => {
        if (!s.ai) statusPromise = null;
        return s;
      });
  }
  return statusPromise;
}
