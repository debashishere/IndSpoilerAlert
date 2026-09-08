import { Request, Response, NextFunction } from 'express';
import { isValidRealEmail } from '../utils/emailValidation';

export interface AuthenticatedUser {
  uid: string;
  email: string;
  name?: string;
  displayName?: string;
  photoURL?: string;
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

function decodeJwtPayload(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      let payloadJson: string;
      try {
        payloadJson = Buffer.from(parts[1], 'base64url').toString('utf8');
      } catch {
        let b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        while (b64.length % 4) b64 += '=';
        payloadJson = Buffer.from(b64, 'base64').toString('utf8');
      }
      return JSON.parse(payloadJson);
    }
  } catch {
    return null;
  }
  return null;
}

export function decodeToken(token: string): AuthenticatedUser | null {
  if (!token) return null;

  // 1. If token is a JWT (e.g. Firebase ID Token or Mock JWT)
  if (token.includes('.')) {
    const jwtPayload = decodeJwtPayload(token);
    if (jwtPayload && (jwtPayload.email || jwtPayload.user_id || jwtPayload.sub)) {
      const email = jwtPayload.email || 'user@indspoileralert.com';
      const uid = jwtPayload.user_id || jwtPayload.sub || jwtPayload.uid || token;
      const name = jwtPayload.name || jwtPayload.displayName || email.split('@')[0];
      const profiles = jwtPayload.profiles || {
        buyer: jwtPayload.buyerProfile !== undefined ? Boolean(jwtPayload.buyerProfile) : true,
        supplier: jwtPayload.supplierProfile !== undefined ? Boolean(jwtPayload.supplierProfile) : true,
      };

      return {
        uid,
        email,
        name,
        displayName: name,
        photoURL: jwtPayload.picture || jwtPayload.photoURL,
        buyerProfile: Boolean(profiles.buyer),
        supplierProfile: Boolean(profiles.supplier),
        profiles: {
          buyer: Boolean(profiles.buyer),
          supplier: Boolean(profiles.supplier),
        },
      };
    }
  }

  // 2. Mock dev token format
  if (token.startsWith('mock-firebase-id-token-')) {
    const rawUid = token.replace('mock-firebase-id-token-', '');
    let email = 'dev@indspoileralert.com';

    if (rawUid.includes('mock-uid-')) {
      const b64 = rawUid.replace('mock-uid-', '');
      try {
        let paddedB64 = b64.replace(/-/g, '+').replace(/_/g, '/');
        while (paddedB64.length % 4) paddedB64 += '=';
        email = Buffer.from(paddedB64, 'base64').toString('utf8');
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
