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
});
