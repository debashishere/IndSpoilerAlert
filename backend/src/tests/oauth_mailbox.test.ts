import request from 'supertest';
import mongoose from 'mongoose';
import app from '../index';

describe('OAuth Mailbox Integration API', () => {
  jest.setTimeout(30000);

  afterAll(async () => {
    await mongoose.disconnect();
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

  describe('Campaign Dispatch Isolation', () => {
    it('should throw an error if supplier has no connected OAuth mailbox', async () => {
      // Import the service dynamically since we're testing a backend method, 
      // but ideally we'd hit an API. Let's just import it at the top of the test.
      const emailService = require('../services/emailService');
      
      const supplierId = 'supplier-no-oauth';
      
      await expect(
        emailService.sendCampaignEmail(supplierId, 'buyer@test.com', 'subject', 'body')
      ).rejects.toThrow('OAuth Mailbox not connected for supplier');
    });
  });
});


