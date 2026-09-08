import express from 'express';
import request from 'supertest';
import { authenticateToken } from '../middleware/authMiddleware';

describe('backend authMiddleware', () => {
  const app = express();
  app.use(express.json());

  app.get('/api/protected', authenticateToken, (req: any, res: any) => {
    res.status(200).json({
      message: 'Access granted',
      user: req.user,
    });
  });

  it('should return 401 Unauthorized if Authorization header is missing', async () => {
    const res = await request(app).get('/api/protected');
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/authorization header missing/i);
  });

  it('should return 403 Forbidden if user email is a mock domain', async () => {
    // authtest@example.com
    const mockToken = 'mock-firebase-id-token-mock-uid-YXV0aHRlc3RAZXhhbXBsZS5jb20';
    const res = await request(app)
      .get('/api/protected')
      .set('Authorization', `Bearer ${mockToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/disallowed mock email domain|forbidden/i);
  });

  it('should decode valid non-mock email token and allow access with 200 OK', async () => {
    // authtest@indspoileralert.com
    const validToken = 'mock-firebase-id-token-mock-uid-YXV0aHRlc3RAaW5kc3BvaWxlcmFsZXJ0LmNvbQ';
    const res = await request(app)
      .get('/api/protected')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe('authtest@indspoileralert.com');
    expect(res.body.user.buyerProfile).toBeDefined();
    expect(res.body.user.supplierProfile).toBeDefined();
    expect(res.body.user.profiles).toEqual(
      expect.objectContaining({ buyer: expect.any(Boolean), supplier: expect.any(Boolean) })
    );
  });

  it('should decode a real Firebase ID token (JWT format) and extract the email correctly', async () => {
    const email = 'debashisroe1996+atlantacommunityfoodbank@gmail.com';
    const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({
      iss: 'https://securetoken.google.com/indspoileralert',
      aud: 'indspoileralert',
      user_id: 'firebase-user-999',
      sub: 'firebase-user-999',
      email: email,
      email_verified: true
    })).toString('base64url');
    const signature = 'mockSignatureString123';
    const jwtToken = `${header}.${payload}.${signature}`;

    const res = await request(app)
      .get('/api/protected')
      .set('Authorization', `Bearer ${jwtToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe(email);
    expect(res.body.user.uid).toBe('firebase-user-999');
  });

  it('should extract name, displayName, photoURL, and profiles from JWT payload', async () => {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({
      user_id: 'user-vip-001',
      sub: 'user-vip-001',
      email: 'vip.buyer@indspoileralert.com',
      name: 'Debashis Roy',
      photoURL: 'https://example.com/avatar.png',
      profiles: { buyer: true, supplier: false },
    })).toString('base64url');
    const token = `${header}.${payload}.sig`;

    const res = await request(app)
      .get('/api/protected')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe('Debashis Roy');
    expect(res.body.user.displayName).toBe('Debashis Roy');
    expect(res.body.user.photoURL).toBe('https://example.com/avatar.png');
    expect(res.body.user.profiles).toEqual({ buyer: true, supplier: false });
    expect(res.body.user.buyerProfile).toBe(true);
    expect(res.body.user.supplierProfile).toBe(false);
  });
});
