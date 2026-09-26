import request from 'supertest';
import app from '../index';
import * as buyerAuthService from '../services/buyerAuthService';

describe('SEC-03 — Standalone Marketplace CORS & Ingress Security', () => {
  beforeAll(() => {
    jest.spyOn(buyerAuthService, 'sendVerificationToken').mockResolvedValue({
      success: true,
      message: 'Mock verification token sent',
      email: 'buyer@example.com',
      devOtp: '123456',
      emailDispatched: true,
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  const allowedMarketplaceOrigins = [
    'https://marketplace.inventoryflowing.com',
    'https://staging.marketplace.inventoryflowing.com',
    'http://localhost:5173',
  ];

  allowedMarketplaceOrigins.forEach((origin) => {
    describe(`CORS support for origin: ${origin}`, () => {
      it('handles OPTIONS preflight requests for marketplace health endpoint', async () => {
        const res = await request(app)
          .options('/api/v1/marketplace/health')
          .set('Origin', origin)
          .set('Access-Control-Request-Method', 'GET');

        expect([200, 204]).toContain(res.status);
        expect(res.headers['access-control-allow-origin']).toBe(origin);
        expect(res.headers['access-control-allow-credentials']).toBe('true');
      });

      it('handles OPTIONS preflight requests for marketplace auth endpoints', async () => {
        const res = await request(app)
          .options('/api/v1/marketplace/auth/send-verification')
          .set('Origin', origin)
          .set('Access-Control-Request-Method', 'POST')
          .set('Access-Control-Request-Headers', 'Content-Type, Authorization');

        expect([200, 204]).toContain(res.status);
        expect(res.headers['access-control-allow-origin']).toBe(origin);
        expect(res.headers['access-control-allow-credentials']).toBe('true');
      });

      it('includes CORS headers on GET /api/v1/marketplace/listings', async () => {
        const res = await request(app)
          .get('/api/v1/marketplace/listings')
          .set('Origin', origin);

        expect(res.headers['access-control-allow-origin']).toBe(origin);
        expect(res.headers['access-control-allow-credentials']).toBe('true');
      });

      it('includes CORS headers on POST /api/v1/marketplace/auth/send-verification', async () => {
        const res = await request(app)
          .post('/api/v1/marketplace/auth/send-verification')
          .set('Origin', origin)
          .send({ email: 'buyer@example.com' });

        expect(res.headers['access-control-allow-origin']).toBe(origin);
        expect(res.headers['access-control-allow-credentials']).toBe('true');
      });
    });
  });
});
