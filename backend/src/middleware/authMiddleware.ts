import { Request, Response, NextFunction } from 'express';
import { isValidRealEmail } from '../utils/emailValidation';

export interface AuthenticatedUser {
  uid: string;
  email: string;
  buyerProfile: boolean;
  supplierProfile: boolean;
  profiles: {
    buyer: boolean;
    supplier: boolean;
  };
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export function decodeToken(token: string): AuthenticatedUser | null {
  if (!token) return null;

  if (token.startsWith('mock-firebase-id-token-')) {
    const rawUid = token.replace('mock-firebase-id-token-', '');
    let email = 'dev@indspoileralert.com';

    if (rawUid.includes('mock-uid-')) {
      const b64 = rawUid.replace('mock-uid-', '');
      try {
        email = Buffer.from(b64, 'base64').toString('utf8');
      } catch {
        email = 'dev@indspoileralert.com';
      }
    }

    return {
      uid: rawUid,
      email,
      buyerProfile: true,
      supplierProfile: true,
      profiles: {
        buyer: true,
        supplier: true,
      },
    };
  }

  // Fallback dev token parse
  return {
    uid: token,
    email: 'user@indspoileralert.com',
    buyerProfile: true,
    supplierProfile: true,
    profiles: {
      buyer: true,
      supplier: true,
    },
  };
}

export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (!authHeader || typeof authHeader !== 'string') {
    return res.status(401).json({ error: 'Authorization header missing' });
  }

  const token = authHeader.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : authHeader;

  if (!token) {
    return res.status(401).json({ error: 'Bearer token missing' });
  }

  const user = decodeToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  if (!isValidRealEmail(user.email)) {
    return res.status(403).json({ error: 'Disallowed mock email domain' });
  }

  req.user = user;
  next();
};

export const optionalAuthToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (authHeader && typeof authHeader === 'string') {
    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;
    if (token) {
      const user = decodeToken(token);
      if (user && isValidRealEmail(user.email)) {
        req.user = user;
      }
    }
  }
  next();
};
