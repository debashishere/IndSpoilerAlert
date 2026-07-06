import request from 'supertest';
import mongoose from 'mongoose';
import app from '../index';

import nodemailer from 'nodemailer';

describe('Email Communications, SMTP Settings & Telemetry API', () => {
  jest.setTimeout(30000);

  beforeEach(() => {
    jest.spyOn(nodemailer, 'createTransport').mockImplementation(() => {
      return {
        verify: jest.fn().mockResolvedValue(true),
        sendMail: jest.fn().mockResolvedValue({
          messageId: `mock-msg-${Date.now()}`,
          response: '250 OK'
        })
      } as any;
    });
  });

  afterAll(async () => {
    if (mongoose.connection.readyState === 1) {
      try {
        const EmailThread = mongoose.model('EmailThread');
        await EmailThread.deleteMany({ subject: /#888/ });
        await EmailThread.deleteMany({ buyerEmail: 'buyer@example.com' });
      } catch (e) {}
    }
    await mongoose.disconnect();
  });

  describe('Cycle 1: Supplier SMTP Settings & Encryption', () => {
    it('should save custom supplier SMTP settings with password masked on GET', async () => {
      const smtpPayload = {
        supplierId: 'supplier-unilever-123',
        host: 'smtp.unilever-test.com',
        port: 587,
        secure: false,
        user: 'ops@unilever-test.com',
        pass: 'SecretSmtpPass123!',
        senderName: 'Unilever Operations',
        senderEmail: 'ops@unilever-test.com'
      };

      const postRes = await request(app)
        .post('/api/settings/smtp')
        .send(smtpPayload);

      expect(postRes.status).toBe(200);
      expect(postRes.body.success).toBe(true);
      expect(postRes.body.config.host).toBe('smtp.unilever-test.com');
      expect(postRes.body.config.encryptedPass).toBeUndefined(); // raw pass not exposed

      const getRes = await request(app)
        .get('/api/settings/smtp?supplierId=supplier-unilever-123');

      expect(getRes.status).toBe(200);
      expect(getRes.body.host).toBe('smtp.unilever-test.com');
      expect(getRes.body.user).toBe('ops@unilever-test.com');
      expect(getRes.body.passMasked).toBe('********');
    });
  });

  describe('Cycle 2: Real-Time SMTP Connection Verification', () => {
    it('should test SMTP transport connectivity and return success feedback', async () => {
      const testRes = await request(app)
        .post('/api/settings/smtp/test')
        .send({
          supplierId: 'supplier-unilever-123',
          testEmail: 'test.buyer@example.com'
        });

      expect(testRes.status).toBe(200);
      expect(testRes.body.success).toBe(true);
      expect(testRes.body.message).toContain('verified');
    });
  });

  describe('Cycle 3: Open Tracking Telemetry Pixel', () => {
    it('should return 1x1 transparent PNG image and record open count & timestamps', async () => {
      const dispatchId = `dispatch-telemetry-${Date.now()}`;


      const firstOpen = await request(app)
        .get(`/api/tracking/pixel.png?dispatchId=${dispatchId}&buyerEmail=testbuyer@retail.com&listingId=listing-123`)
        .responseType('blob');

      expect(firstOpen.status).toBe(200);
      expect(firstOpen.headers['content-type']).toContain('image/png');

      const secondOpen = await request(app)
        .get(`/api/tracking/pixel.png?dispatchId=${dispatchId}&buyerEmail=testbuyer@retail.com&listingId=listing-123`)
        .responseType('blob');

      expect(secondOpen.status).toBe(200);

      const DispatchLog = mongoose.model('EmailDispatchLog');
      const log = await DispatchLog.findOne({ dispatchId });
      expect(log).not.toBeNull();
      expect(log.openCount).toBe(2);
      expect(log.firstOpenedAt).toBeDefined();
      expect(log.lastOpenedAt).toBeDefined();
    });
  });

  describe('Cycle 4: Dynamic Server-Rendered Email SVG Assets', () => {
    it('should render dynamic SVG countdown timer and live bid badge', async () => {
      const futureTime = new Date(Date.now() + 3600000).toISOString();

      const timerRes = await request(app)
        .get(`/api/email-assets/timer.svg?expiresAt=${futureTime}`);

      const timerSvg = timerRes.text || timerRes.body.toString();
      expect(timerRes.status).toBe(200);
      expect(timerRes.headers['content-type']).toContain('image/svg+xml');
      expect(timerSvg).toContain('<svg');
      expect(timerSvg).toContain('REMAINING');

      const badgeRes = await request(app)
        .get('/api/email-assets/bid-badge.svg?listingId=lst-123&currentBid=18.50&cases=200');

      const badgeSvg = badgeRes.text || badgeRes.body.toString();
      expect(badgeRes.status).toBe(200);
      expect(badgeRes.headers['content-type']).toContain('image/svg+xml');
      expect(badgeSvg).toContain('$18.50');
    });
  });

  describe('Cycle 5: Single-Use Quick-Bid Token & Submission', () => {
    it('should validate single-use quick bid token and process 1-click bid submission', async () => {
      const QuickBidToken = mongoose.model('QuickBidToken');
      const testToken = `signed-token-quickbid-${Date.now()}`;
      const tokenDoc = await QuickBidToken.create({
        token: testToken,
        buyerEmail: 'quickbuyer@test.com',

        listingId: 'listing-lot-456',
        defaultAmount: 17.50,
        expiresAt: new Date(Date.now() + 86400000),
        isUsed: false
      });

      const infoRes = await request(app)
        .get(`/api/bids/quick-bid-info?token=${tokenDoc.token}`);

      expect(infoRes.status).toBe(200);
      expect(infoRes.body.buyerEmail).toBe('quickbuyer@test.com');
      expect(infoRes.body.defaultAmount).toBe(17.50);

      const submitRes = await request(app)
        .post('/api/bids/quick-submit')
        .send({
          token: tokenDoc.token,
          amount: 18.25,
          cases: 100
        });

      expect(submitRes.status).toBe(200);
      expect(submitRes.body.success).toBe(true);
      expect(submitRes.body.bid.amount).toBe(18.25);

      // Verify token single-use invariant
      const reusedRes = await request(app)
        .post('/api/bids/quick-submit')
        .send({
          token: tokenDoc.token,
          amount: 19.00,
          cases: 100
        });

      expect(reusedRes.status).toBe(400);
      expect(reusedRes.body.error).toContain('used');
    });
  });

  describe('Cycle 6: Listing-Scoped Email Thread Inbox & Reply Dispatch', () => {
    it('should list buyer email threads with open count badges and dispatch replies', async () => {
      const EmailThread = mongoose.model('EmailThread');
      const testThreadId = `thread-unilever-buyer-${Date.now()}`;
      const thread = await EmailThread.create({
        threadId: testThreadId,
        supplierId: 'supplier-unilever-123',
        buyerEmail: 'retailbuyer@target.com',

        listingId: 'listing-dairy-888',
        subject: 'Surplus Dairy Offer Sheet #888',
        status: 'active',
        openCount: 4,
        firstOpenedAt: new Date(),
        lastOpenedAt: new Date()
      });

      const listRes = await request(app)
        .get('/api/email-threads?supplierId=supplier-unilever-123');

      expect(listRes.status).toBe(200);
      expect(Array.isArray(listRes.body)).toBe(true);
      const targetThread = listRes.body.find((t: any) => t.threadId === thread.threadId);
      expect(targetThread).toBeDefined();
      expect(targetThread.openCount).toBe(4);

      const replyRes = await request(app)
        .post(`/api/email-threads/${thread.threadId}/reply`)
        .send({
          supplierId: 'supplier-unilever-123',
          message: 'Thank you for your bid! We can award 150 cases at $18.25/case.'
        });

      expect(replyRes.status).toBe(200);
      expect(replyRes.body.success).toBe(true);
      expect(replyRes.body.message.body).toContain('$18.25/case');

      // Test real inbound buyer message ingestion
      const inboundRes = await request(app)
        .post(`/api/email-threads/${thread.threadId}/messages`)
        .send({
          buyerEmail: 'retailbuyer@target.com',
          message: 'Great, we accept the awarded offer! Please send logistics info.',
          senderType: 'buyer'
        });

      expect(inboundRes.status).toBe(200);
      expect(inboundRes.body.success).toBe(true);
      expect(inboundRes.body.message.senderType).toBe('buyer');
      expect(inboundRes.body.message.body).toContain('accept the awarded offer');
    });
  });

  describe('Cycle 7: Simple Direct Email Sending from Central Platform Settings', () => {
    it('should validate inputs and send simple text email', async () => {
      // Missing parameters validation
      const badRes = await request(app)
        .post('/api/settings/send-email')
        .send({ to: 'buyer@example.com' });
      expect(badRes.status).toBe(400);
      expect(badRes.body.error).toContain('required');

      // Valid email dispatch
      const sendRes = await request(app)
        .post('/api/settings/send-email')
        .send({
          to: 'buyer@example.com',
          subject: 'Test Subject',
          body: 'Hello, this is a direct email test from Central Platform Settings.'
        });

      expect(sendRes.status).toBe(200);
      expect(sendRes.body.success).toBe(true);
      expect(sendRes.body.message).toContain('sent successfully');
    });
  });

  describe('Cycle 8: Multi-Thread Direct Emails & Historical Dispatch Reconciliation', () => {
    it('should create distinct EmailThreads when sending multiple emails with different subjects to the same buyer', async () => {
      const buyerEmail = `multi-thread-buyer-${Date.now()}@test.com`;

      // 1. Send first email
      const res1 = await request(app)
        .post('/api/settings/send-email')
        .send({
          to: buyerEmail,
          subject: 'First Offer: Organic Yogurt Batch',
          body: 'Here is our organic yogurt offer.',
          supplierId: 'supplier-unilever-123'
        });

      expect(res1.status).toBe(200);
      const threadId1 = res1.body.threadId;

      // 2. Send second email to SAME buyer but DIFFERENT subject
      const res2 = await request(app)
        .post('/api/settings/send-email')
        .send({
          to: buyerEmail,
          subject: 'Second Offer: Plant Milk Stock',
          body: 'Here is our plant milk offer.',
          supplierId: 'supplier-unilever-123'
        });

      expect(res2.status).toBe(200);
      const threadId2 = res2.body.threadId;

      // Thread IDs must be distinct!
      expect(threadId2).not.toBe(threadId1);

      // 3. Fetch threads for supplier
      const listRes = await request(app)
        .get('/api/email-threads?supplierId=supplier-unilever-123');

      expect(listRes.status).toBe(200);
      const buyerThreads = listRes.body.filter((t: any) => t.buyerEmail === buyerEmail);
      expect(buyerThreads.length).toBe(2);
      expect(buyerThreads.map((t: any) => t.subject)).toContain('First Offer: Organic Yogurt Batch');
      expect(buyerThreads.map((t: any) => t.subject)).toContain('Second Offer: Plant Milk Stock');
    });

    it('should reconcile unsynced historical EmailDispatchLog records into EmailThread list on GET', async () => {
      const EmailDispatchLog = mongoose.model('EmailDispatchLog');
      const EmailThread = mongoose.model('EmailThread');
      const oldBuyerEmail = `old-log-buyer-${Date.now()}@historical.com`;
      const oldDispatchId = `disp-historical-${Date.now()}`;

      // Create an old orphan dispatch log without an EmailThread
      await EmailDispatchLog.create({
        dispatchId: oldDispatchId,
        supplierId: 'supplier-unilever-123',
        buyerEmail: oldBuyerEmail,
        listingId: 'lst-old-999',
        status: 'sent',
        dispatchedAt: new Date('2026-07-01T10:00:00Z'),
        openCount: 2
      });

      // GET email threads should discover and include old historical dispatched emails
      const listRes = await request(app)
        .get('/api/email-threads?supplierId=supplier-unilever-123');

      expect(listRes.status).toBe(200);
      const historicalThread = listRes.body.find((t: any) => t.buyerEmail === oldBuyerEmail);
      expect(historicalThread).toBeDefined();
      expect(historicalThread.openCount).toBe(2);
    });
  });
});


