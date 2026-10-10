import type { VercelRequest, VercelResponse } from '@vercel/node';
import { methodGuard, requireUser } from './_lib/auth.js';
import { normaliseHost, resolvePublicHost, safeFetch } from './_lib/net.js';
import { inspectTls } from './_lib/tls.js';
import { gradeHeaders } from './_lib/headers.js';

/**
 * GET /api/site-check?host=example.com
 * Real server-side checks a browser cannot do itself: the TLS certificate,
 * HTTP security headers, and whether plain HTTP redirects to HTTPS.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!methodGuard(req, res, 'GET')) return;
  const user = await requireUser(req, res);
  if (!user) return;

  const host = normaliseHost(String(req.query.host || ''));
  if (!host) return res.status(400).json({ error: 'Enter a valid domain name, like example.com.' });

  const resolved = await resolvePublicHost(host);
  if (!resolved.ok) return res.status(200).json({ host, resolvable: false, error: resolved.reason });

  const [tlsReport, httpsResult, httpResult] = await Promise.all([
    inspectTls(host),
    safeFetch(`https://${host}/`).then(
      (r) => ({ ok: true as const, r }),
      (e: Error) => ({ ok: false as const, error: e.message })
    ),
    safeFetch(`http://${host}/`, { maxHops: 3 }).then(
      (r) => ({ ok: true as const, r }),
      (e: Error) => ({ ok: false as const, error: e.message })
    ),
  ]);

  const headers = httpsResult.ok
    ? { reachable: true, status: httpsResult.r.status, finalUrl: httpsResult.r.finalUrl, ...gradeHeaders(httpsResult.r.headers) }
    : { reachable: false, error: httpsResult.error };

  const httpRedirectsToHttps = httpResult.ok ? httpResult.r.finalUrl.startsWith('https://') : null;

  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({
    host,
    resolvable: true,
    addresses: resolved.addresses,
    tls: tlsReport,
    headers,
    httpRedirectsToHttps,
    checkedAt: new Date().toISOString(),
  });
}
