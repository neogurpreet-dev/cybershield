/**
 * Zero-knowledge vault encryption. The passphrase never leaves the browser:
 * PBKDF2-SHA256 (600k iterations) derives an AES-256-GCM key, and only
 * ciphertext is stored in Firestore.
 */
export const VAULT_ITERATIONS = 600_000;
const VERIFIER_TEXT = 'cybershield-vault-verifier-v1';

const enc = new TextEncoder();
const dec = new TextDecoder();

export const toB64 = (buf: ArrayBuffer | Uint8Array) => {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = '';
  bytes.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s);
};
export const fromB64 = (b64: string) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

export function randomSalt(): string {
  return toB64(crypto.getRandomValues(new Uint8Array(16)));
}

export async function deriveKey(passphrase: string, saltB64: string, iterations = VAULT_ITERATIONS): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey('raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: fromB64(saltB64), iterations, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export interface Sealed {
  iv: string;
  ct: string;
}

export async function seal(key: CryptoKey, value: unknown): Promise<Sealed> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(value)));
  return { iv: toB64(iv), ct: toB64(ct) };
}

export async function open<T>(key: CryptoKey, sealed: Sealed): Promise<T> {
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(sealed.iv) }, key, fromB64(sealed.ct));
  return JSON.parse(dec.decode(pt)) as T;
}

export const makeVerifier = (key: CryptoKey) => seal(key, VERIFIER_TEXT);

export async function checkVerifier(key: CryptoKey, verifier: Sealed): Promise<boolean> {
  try {
    return (await open<string>(key, verifier)) === VERIFIER_TEXT;
  } catch {
    return false;
  }
}
