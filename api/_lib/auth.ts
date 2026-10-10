import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Firebase project ID is public (it is also in the web config), so a default is safe.
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'cybershield-faf03';

const JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
);

export interface AuthedUser {
  uid: string;
  email?: string;
}

/**
 * Verifies the Firebase ID token sent as `Authorization: Bearer <token>`.
 * Uses Google's public signing keys, so no service-account secret is needed.
 */
export async function requireUser(req: VercelRequest, res: VercelResponse): Promise<AuthedUser | null> {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) {
    res.status(401).json({ error: 'Sign in required.' });
    return null;
  }
  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `https://securetoken.google.com/${PROJECT_ID}`,
      audience: PROJECT_ID,
    });
    if (!payload.sub) throw new Error('Token has no subject');
    return { uid: payload.sub, email: payload.email as string | undefined };
  } catch {
    res.status(401).json({ error: 'Your session has expired. Please sign in again.' });
    return null;
  }
}

export function methodGuard(req: VercelRequest, res: VercelResponse, method: 'GET' | 'POST'): boolean {
  if (req.method !== method) {
    res.setHeader('Allow', method);
    res.status(405).json({ error: `Use ${method}.` });
    return false;
  }
  return true;
}
