import type { VercelRequest, VercelResponse } from '@vercel/node';
import { geminiConfigured } from './_lib/gemini.js';

/** GET /api/status: which optional server features are configured. No secrets are returned. */
export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({ ok: true, ai: geminiConfigured() });
}
