import request from 'supertest';
import app from '../index';

describe('0086 — Buyer Authentication & Email Verification API (/api/v1/marketplace/auth)', () => {
  const testEmail = 'buyer.auth.test@example.com';
  const companyName = 'Test Buyer Bistro';
  let devToken: string;
  let sessionAuthToken: string;

  it('POST /api/v1/marketplace/auth/send-verification sends verification OTP/token', async () => {
    const res = await request(app)
      .post('/api/v1/marketplace/auth/send-verification')
      .send({ email: testEmail, companyName });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.email).toBe(testEmail);
    expect(res.body.devOtp).toBeDefined();
    devToken = res.body.devOtp;
  });

  it('POST /api/v1/marketplace/auth/verify-token fails with invalid token', async () => {
    const res = await request(app)
      .post('/api/v1/marketplace/auth/verify-token')
      .send({ email: testEmail, token: 'INVALID_999' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/invalid/i);
  });

  it('POST /api/v1/marketplace/auth/verify-token succeeds with valid OTP and returns session token', async () => {
    const res = await request(app)
      .post('/api/v1/marketplace/auth/verify-token')
      .send({ email: testEmail, token: devToken });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.buyer).toBeDefined();
    expect(res.body.buyer.email).toBe(testEmail);
    expect(res.body.buyer.isVerified).toBe(true);

    sessionAuthToken = res.body.token;
  });

  it('GET /api/v1/marketplace/auth/session returns current buyer profile', async () => {
    const res = await request(app)
      .get('/api/v1/marketplace/auth/session')
      .set('Authorization', `Bearer ${sessionAuthToken}`);

    expect(res.status).toBe(200);
    expect(res.body.authenticated).toBe(true);
    expect(res.body.buyer.email).toBe(testEmail);
    expect(res.body.buyer.isVerified).toBe(true);
  });

  it('GET /api/v1/marketplace/auth/session returns unauthenticated without token', async () => {
    const res = await request(app)
      .get('/api/v1/marketplace/auth/session');

    expect(res.status).toBe(200);
    expect(res.body.authenticated).toBe(false);
  });
});
