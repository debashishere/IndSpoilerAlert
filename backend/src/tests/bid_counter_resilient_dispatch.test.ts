import request from 'supertest';
import mongoose from 'mongoose';
import nodemailer from 'nodemailer';
import app from '../index';
import Offer from '../models/Offer';
import Buyer from '../models/Buyer';
import InventoryLot from '../models/InventoryLot';
import ProductMaster from '../models/ProductMaster';
import SupplierOAuthMailbox from '../models/SupplierOAuthMailbox';
import Activity from '../models/Activity';
import EmailThread from '../models/EmailThread';

describe('Resilient Mailbox Dispatch, CRM & Emails Hub Sync (Issue #03E)', () => {
  jest.setTimeout(30000);

  const testSupplierId = 'supplier-counter-test-1';
  let buyer: any;
  let product: any;
  let lot: any;
  let offer: any;

  beforeAll(async () => {
    process.env.GOOGLE_CLIENT_ID = 'test-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
    process.env.REAL_SMTP = 'true';

    jest.spyOn(nodemailer, 'createTransport').mockImplementation(() => {
      return {
        sendMail: jest.fn().mockResolvedValue({
          messageId: 'test-counter-msg-id-123',
          response: '250 OK'
        })
      } as any;
    });

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/indspoileralert_test');
    }
  });

  beforeEach(async () => {
    const mockSupplierId = new mongoose.Types.ObjectId();
    const mockDcId = new mongoose.Types.ObjectId();

    await SupplierOAuthMailbox.deleteMany({ supplierId: testSupplierId });
    await Activity.deleteMany({ 'metadata.action': 'counter' });
    await EmailThread.deleteMany({ buyerEmail: /counter-test-buyer/i });
    await Offer.deleteMany({ price: { $in: [10.00, 12.00] } });
    await InventoryLot.deleteMany({ lotNumber: 'LOT-COUNTER-03E' });
    await ProductMaster.deleteMany({ sku: 'SKU-CJ-03E' });
    await Buyer.deleteMany({ email: /counter-test-buyer/i });

    buyer = await Buyer.create({
      companyName: 'FreshMart Supermarkets',
      email: 'counter-test-buyer@example-buyer.org',
      acceptsShortDated: true
    });

    product = await ProductMaster.create({
      supplierId: mockSupplierId,
      sku: 'SKU-CJ-03E',
      brand: 'SunHarvest',
      category: 'Beverages',
      description: 'Organic Cold-Pressed Orange Juice'
    });

    lot = await InventoryLot.create({
      lotNumber: 'LOT-COUNTER-03E',
      distributionCenterId: mockDcId,
      productId: product._id,
      supplierId: mockSupplierId,
      quantityCases: 500,
      availableQty: 500,
      standardSellPrice: 20.00,
      costPerCase: 8.00,
      expirationDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
    });

    offer = await Offer.create({
      buyerId: buyer._id,
      lotId: lot._id,
      price: 10.00,
      quantity: 200,
      status: 'pending',
      submittedAt: new Date(),
      messages: []
    });
  });

  afterAll(async () => {
    await SupplierOAuthMailbox.deleteMany({ supplierId: testSupplierId });
    await Activity.deleteMany({ 'metadata.action': 'counter' });
    await EmailThread.deleteMany({ buyerEmail: /counter-test-buyer/i });
    await Offer.deleteMany({ buyerId: buyer?._id });
    await InventoryLot.deleteMany({ lotNumber: 'LOT-COUNTER-03E' });
    await ProductMaster.deleteMany({ sku: 'SKU-CJ-03E' });
    await Buyer.deleteMany({ email: /counter-test-buyer/i });
  });

  describe('Slice 1: Successful Outbound Dispatch, Lot CRM Activity & Emails Hub Sync', () => {
    it('should compile TipTap template, dispatch through Google OAuth mailbox, record Lot Activity (type: Email), sync to Emails Hub, and return delivery telemetry', async () => {
      // Configure connected SupplierOAuthMailbox
      await SupplierOAuthMailbox.create({
        supplierId: testSupplierId,
        status: 'connected',
        userEmail: 'dispatch@sunharvest.com',
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token'
      });

      const templateBody = '<style>p { color: #333; }</style><p>Hello {{buyer_name}}, our counter-offer is {{counter_price}} for {{counter_quantity}} cases of {{product_name}} (orig: {{original_price}}).</p>';

      const res = await request(app)
        .post(`/api/bids/${offer._id}/renegotiate`)
        .send({
          counterPrice: 14.50,
          counterQuantity: 150,
          messageText: templateBody
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.status).toBe('countered');
      expect(res.body.emailDispatch).toBeDefined();
      expect(res.body.emailDispatch.dispatched).toBe(true);
      expect(res.body.emailDispatch.messageId).toBeDefined();

      // 1. Verify Activity record created
      const activity = await Activity.findOne({
        lotId: lot._id,
        type: 'Email',
        'metadata.offerId': offer._id
      });
      expect(activity).toBeDefined();
      expect(activity?.subject).toMatch(/Counter/i);
      expect(activity?.recipient).toBe(buyer.email);
      expect(activity?.sender).toBe('Supplier');
      expect(activity?.content).toContain('FreshMart Supermarkets');
      expect(activity?.content).toContain('$14.50');
      expect(activity?.content).toContain('150');
      expect(activity?.metadata?.counterPrice).toBe(14.50);
      expect(activity?.metadata?.counterQuantity).toBe(150);

      // 2. Verify Emails Hub sync via syncEmailToThread
      const thread = await EmailThread.findOne({
        buyerEmail: buyer.email
      });
      expect(thread).toBeDefined();
      expect(thread?.messages.length).toBeGreaterThanOrEqual(1);
      const lastMsg = thread?.messages[thread.messages.length - 1];
      expect(lastMsg?.senderType).toBe('supplier');
      expect(lastMsg?.body).toContain('FreshMart Supermarkets');
      expect(lastMsg?.body).toContain('$14.50');
    });
  });

    describe('Slice 2: Resilient Counter Dispatch Under Mail Transport Failure', () => {
      it('should commit offer state, create Activity, sync thread, and return warning telemetry when mail transport encounters an error', async () => {
        // Mock nodemailer createTransport to simulate connection timeout / auth error
        jest.spyOn(nodemailer, 'createTransport').mockImplementation(() => {
          return {
            sendMail: jest.fn().mockRejectedValue(new Error('ETIMEDOUT: Mail server connection timed out'))
          } as any;
        });

        // Supplier OAuth mailbox is expired or disconnected
        await SupplierOAuthMailbox.create({
          supplierId: testSupplierId,
          status: 'expired',
          userEmail: 'dispatch@sunharvest.com',
          accessToken: 'expired-token',
          refreshToken: 'expired-token'
        });

        const res = await request(app)
          .post(`/api/bids/${offer._id}/renegotiate`)
          .send({
            counterPrice: 16.00,
            counterQuantity: 120,
            messageText: '<p>Counter proposal: {{counter_price}} for {{counter_quantity}} cases.</p>'
          });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.status).toBe('countered');
        expect(res.body.price).toBe(10.00); // Baseline preserved
        expect(res.body.emailDispatch).toBeDefined();
        expect(res.body.emailDispatch.dispatched).toBe(false);
        expect(res.body.emailDispatch.warning).toBeDefined();
        expect(res.body.emailDispatch.warning).toMatch(/mail transport|timed out|failed|disconnected/i);

        // 1. Verify Offer still committed cleanly in DB
        const dbOffer = await Offer.findById(offer._id);
        expect(dbOffer?.status).toBe('countered');
        expect(dbOffer?.messages.length).toBeGreaterThanOrEqual(1);
        const lastOfferMsg = dbOffer?.messages[dbOffer.messages.length - 1];
        expect(lastOfferMsg?.sender).toBe('supplier');
        expect(lastOfferMsg?.proposedPrice).toBe(16.00);
        expect(lastOfferMsg?.proposedQuantity).toBe(120);

        // 2. Verify Activity (type: 'Email') still created in DB
        const activity = await Activity.findOne({
          lotId: lot._id,
          type: 'Email',
          'metadata.offerId': offer._id
        });
        expect(activity).toBeDefined();
        expect(activity?.content).toContain('$16.00');
        expect(activity?.metadata?.counterPrice).toBe(16.00);

        // 3. Verify Emails Hub thread still synchronized in DB
        const thread = await EmailThread.findOne({
          buyerEmail: buyer.email
        });
        expect(thread).toBeDefined();
        const threadMsg = thread?.messages[thread.messages.length - 1];
        expect(threadMsg?.body).toContain('$16.00');
      });
    });
});
