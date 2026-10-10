import { lookup } from 'node:dns/promises';
import net from 'node:net';

const HOST_RE = /^(?=.{1,253}$)(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/i;

/** Normalises user input like "https://Example.com/path" to "example.com". */
export function normaliseHost(input: string): string | null {
  let value = String(input || '').trim().toLowerCase();
  if (!value) return null;
  try {
    if (!/^[a-z][a-z0-9+.-]*:\/\//.test(value)) value = `https://${value}`;
    value = new URL(value).hostname;
  } catch {
    return null;
  }
  value = value.replace(/\.$/, '');
  return HOST_RE.test(value) ? value : null;
}

function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    return (
      a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 198 && (b === 18 || b === 19))
    );
  }
  const v6 = ip.toLowerCase();
  if (v6.startsWith('::ffff:')) return isPrivateIp(v6.slice(7));
  return v6 === '::' || v6 === '::1' || v6.startsWith('fc') || v6.startsWith('fd') || v6.startsWith('fe80') || v6.startsWith('ff');
}

/**
 * Resolves a hostname and refuses anything that points at a private or
 * internal network, so the server can't be used to probe its own network.
 */
export async function resolvePublicHost(host: string): Promise<{ ok: true; addresses: string[] } | { ok: false; reason: string }> {
  try {
    const results = await lookup(host, { all: true, verbatim: true });
    const addresses = results.map((r) => r.address);
    if (addresses.length === 0) return { ok: false, reason: 'Domain does not resolve to any address.' };
    if (addresses.some(isPrivateIp)) return { ok: false, reason: 'Domain points to a private or internal network address.' };
    return { ok: true, addresses };
  } catch {
    return { ok: false, reason: 'Domain does not exist or does not resolve (DNS lookup failed).' };
  }
}

/** Fetch with a hard timeout. */
export async function fetchWithTimeout(url: string, init: RequestInit = {}, ms = 8000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export interface HopResult {
  finalUrl: string;
  status: number;
  headers: Headers;
  redirects: string[];
  body?: string;
}

/**
 * Follows redirects one hop at a time, re-checking every hop against private
 * networks. Optionally reads up to `maxBodyBytes` of the final response.
 */
export async function safeFetch(startUrl: string, opts: { maxHops?: number; maxBodyBytes?: number } = {}): Promise<HopResult> {
  const maxHops = opts.maxHops ?? 5;
  const redirects: string[] = [];
  let url = startUrl;
  for (let hop = 0; hop <= maxHops; hop++) {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new Error(`Unsupported redirect to ${parsed.protocol}`);
    const resolved = await resolvePublicHost(parsed.hostname);
    if (!resolved.ok) throw new Error(resolved.reason);
    const res = await fetchWithTimeout(url, {
      redirect: 'manual',
      headers: { 'User-Agent': 'CyberShield-SecurityCheck/1.0 (+https://cybershield-tau-one.vercel.app)', Accept: 'text/html,*/*' },
    });
    const location = res.headers.get('location');
    if (res.status >= 300 && res.status < 400 && location) {
      const next = new URL(location, url).toString();
      redirects.push(next);
      url = next;
      continue;
    }
    let body: string | undefined;
    if (opts.maxBodyBytes && res.body) {
      const reader = res.body.getReader();
      const chunks: Uint8Array[] = [];
      let total = 0;
      while (total < opts.maxBodyBytes) {
        const { done, value } = await reader.read();
        if (done || !value) break;
        chunks.push(value);
        total += value.length;
      }
      reader.cancel().catch(() => {});
      body = Buffer.concat(chunks).toString('utf8');
    }
    return { finalUrl: url, status: res.status, headers: res.headers, redirects, body };
  }
  throw new Error('Too many redirects.');
}
