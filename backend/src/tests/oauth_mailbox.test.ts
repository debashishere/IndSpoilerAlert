import request from 'supertest';
import mongoose from 'mongoose';
import app from '../index';

describe('OAuth Mailbox Integration API', () => {
  jest.setTimeout(30000);

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/indspoileralert_test');
    }
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    const SupplierOAuthMailbox = require('../models/SupplierOAuthMailbox').default;
    await SupplierOAuthMailbox.deleteMany({});
  });

  describe('GET /api/oauth/start', () => {
    it('should return 400 if supplierId is missing', async () => {
      const res = await request(app).get('/api/oauth/start');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should redirect to Google authorization URL or callback endpoint with supplierId state', async () => {
      const supplierId = 'supplier-oauth-start-123';
      const res = await request(app).get(`/api/oauth/start?supplierId=${supplierId}`);
      expect(res.status).toBe(302);
      expect(res.headers.location).toMatch(/accounts\.google\.com|oauth\/callback/);
    });
  });

  describe('GET /api/oauth/status', () => {
    it('should return missing status when supplier has no connected mailbox', async () => {
      const supplierId = 'supplier-missing-token';
      const res = await request(app).get(`/api/oauth/status?supplierId=${supplierId}`);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.status).toBe('missing');
    });
  });

  describe('GET /api/oauth/callback', () => {
    it('should exchange code and save connected status', async () => {
      const supplierId = 'supplier-oauth-123';
      
      // Simulate OAuth callback
      const callbackRes = await request(app).get(`/api/oauth/callback?code=mock-auth-code&state=${supplierId}`);
      expect(callbackRes.status).toBe(200);
      expect(callbackRes.body.success).toBe(true);

      // Verify status is now connected
      const statusRes = await request(app).get(`/api/oauth/status?supplierId=${supplierId}`);
      expect(statusRes.status).toBe(200);
      expect(statusRes.body.status).toBe('connected');
    });
  });

  describe('Campaign Dispatch Fallback', () => {
    it('should successfully fallback to default SMTP when supplier has no connected OAuth mailbox', async () => {
      const emailService = require('../services/emailService');
      const supplierId = 'supplier-no-oauth';
      
      const res = await emailService.sendCampaignEmail(supplierId, 'buyer@test.com', 'subject', 'body');
      expect(res.success).toBe(true);
      expect(res.compiledSubject).toBe('subject');
    });
  });

  describe('Automated Background OAuth Token Refresh Daemon Logic', () => {
    it('should refresh expiring OAuth access token and persist updated token', async () => {
      const { refreshSupplierOAuthToken } = require('../services/oauthMailbox');
      const SupplierOAuthMailbox = require('../models/SupplierOAuthMailbox').default;
      
      const supplierId = 'supplier-refresh-test-1';
      await SupplierOAuthMailbox.create({
        supplierId,
        accountId: 'test@supplier.com',
        userEmail: 'test@supplier.com',
        accessToken: 'stale-access-token',
        refreshToken: 'valid-refresh-token',
        status: 'connected'
      });

      const newToken = await refreshSupplierOAuthToken(supplierId);
      expect(newToken).toBeTruthy();

      const updated = await SupplierOAuthMailbox.findOne({ supplierId });
      expect(updated).not.toBeNull();
      expect(updated.status).toBe('connected');
    });

    it('should mark OAuth mailbox as expired if token refresh fails', async () => {
      const { refreshSupplierOAuthToken } = require('../services/oauthMailbox');
      const SupplierOAuthMailbox = require('../models/SupplierOAuthMailbox').default;
      
      const supplierId = 'supplier-refresh-failed';
      await SupplierOAuthMailbox.create({
        supplierId,
        accountId: 'failed@supplier.com',
        userEmail: 'failed@supplier.com',
        accessToken: 'stale-access-token',
        refreshToken: 'invalid-expired-refresh-token',
        status: 'connected'
      });

      // Force failure mode or simulate fetch failure
      const oldClientId = process.env.GOOGLE_CLIENT_ID;
      process.env.GOOGLE_CLIENT_ID = 'test-client-id';
      process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';

      // Mock global fetch to return 400 error
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'invalid_grant', error_description: 'Token has been revoked' })
      } as any);

      try {
        const token = await refreshSupplierOAuthToken(supplierId);
        expect(token).toBeNull();

        const updated = await SupplierOAuthMailbox.findOne({ supplierId });
        expect(updated.status).toBe('expired');
      } finally {
        global.fetch = originalFetch;
        process.env.GOOGLE_CLIENT_ID = oldClientId;
      }
    });

    it('should automatically refresh expiring OAuth tokens prior to campaign email dispatch', async () => {
      const emailService = require('../services/emailService');
      const SupplierOAuthMailbox = require('../models/SupplierOAuthMailbox').default;
      
      const supplierId = 'supplier-predispatch-refresh';
      await SupplierOAuthMailbox.create({
        supplierId,
        accountId: 'predispatch@supplier.com',
        userEmail: 'predispatch@supplier.com',
        accessToken: 'old-access-token',
        refreshToken: 'valid-refresh-token',
        status: 'connected'
      });

      const oldRealSmtp = process.env.REAL_SMTP;
      delete process.env.REAL_SMTP;

      try {
        const res = await emailService.sendCampaignEmail(supplierId, 'buyer@test.com', 'Subject', 'Body');
        expect(res.success).toBe(true);

        const mailboxAfter = await SupplierOAuthMailbox.findOne({ supplierId });
        expect(mailboxAfter.accessToken).not.toBe('old-access-token');
        expect(mailboxAfter.accessToken).toMatch(/^refreshed-access-token/);
      } finally {
        if (oldRealSmtp) process.env.REAL_SMTP = oldRealSmtp;
      }
    });
  });
});


