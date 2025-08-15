import { Request, Response, NextFunction } from 'express';

export type AuthedRequest = Request & { user?: { uid: string } };

function isAuthEnabled() { return String(process.env.AUTH_ENABLED || '').toLowerCase() === 'true'; }

export function authMiddleware(req: AuthedRequest, res: Response, next: NextFunction) {
  if (!isAuthEnabled()) return next();
  const h = req.header('authorization') || req.header('Authorization') || '';
  const m = h.match(/^Bearer\s+(.+)$/i);
  if (!m) return res.status(401).json({ error: 'unauthorized' });
  const token = m[1];
  // MVP mock: accept 'dev-token' and set uid=dev. Future: verify Firebase ID token.
  if (token === 'dev-token') {
    req.user = { uid: 'dev' };
    return next();
  }
  return res.status(401).json({ error: 'unauthorized' });
}
