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

describe('Decline Offer Resilient Mailbox Dispatch, CRM & Thread Sync (Slice 1, Seam 1A)', () => {
  jest.setTimeout(30000);

  const testSupplierId = 'supplier-decline-test-1';
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
          messageId: 'test-decline-msg-id-123',
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
    await Activity.deleteMany({ 'metadata.action': 'decline' });
    await EmailThread.deleteMany({ buyerEmail: /decline-test-buyer/i });
    await Offer.deleteMany({ price: 15.00 });
    await InventoryLot.deleteMany({ lotNumber: 'LOT-DECLINE-0108' });
    await ProductMaster.deleteMany({ sku: 'SKU-DEC-0108' });
    await Buyer.deleteMany({ email: /decline-test-buyer/i });

    buyer = await Buyer.create({
      companyName: 'Apex Grocery Liquidators',
      email: 'decline-test-buyer@example-buyer.org',
      acceptsShortDated: true
    });

    product = await ProductMaster.create({
      supplierId: mockSupplierId,
      sku: 'SKU-DEC-0108',
      brand: 'HarvestBest',
      category: 'Produce',
      description: 'Organic Honeycrisp Apples'
    });

    lot = await InventoryLot.create({
      lotNumber: 'LOT-DECLINE-0108',
      distributionCenterId: mockDcId,
      productId: product._id,
      supplierId: mockSupplierId,
      quantityCases: 400,
      availableQty: 400,
      standardSellPrice: 25.00,
      costPerCase: 10.00,
      expirationDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000)
    });

    offer = await Offer.create({
      buyerId: buyer._id,
      lotId: lot._id,
      price: 15.00,
      quantity: 150,
      status: 'pending',
      submittedAt: new Date(),
      messages: []
    });
  });

  afterAll(async () => {
    await SupplierOAuthMailbox.deleteMany({ supplierId: testSupplierId });
    await Activity.deleteMany({ 'metadata.action': 'decline' });
    await EmailThread.deleteMany({ buyerEmail: /decline-test-buyer/i });
    await Offer.deleteMany({ buyerId: buyer?._id });
    await InventoryLot.deleteMany({ lotNumber: 'LOT-DECLINE-0108' });
    await ProductMaster.deleteMany({ sku: 'SKU-DEC-0108' });
    await Buyer.deleteMany({ email: /decline-test-buyer/i });
  });

  describe('Outbound Decline Notice Dispatch & Dynamic Token Compilation', () => {
    it('should compile TipTap decline template, dispatch through mailbox, create Activity (type: Email), sync thread, and return telemetry', async () => {
      await SupplierOAuthMailbox.create({
        supplierId: testSupplierId,
        status: 'connected',
        userEmail: 'dispatch@harvestbest.com',
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token'
      });

      const templateBody = '<p>Dear {{buyer_name}},</p><p>We cannot accept your offer on <strong>{{product_name}}</strong> (Lot #{{lot_number}}).</p><p><strong>Reason:</strong> {{decline_reason}}</p><p><strong>Notes:</strong> {{decline_rationale}}</p><p><a href="{{catalog_link}}">Explore Available Surplus Inventory</a></p>';

      const res = await request(app)
        .post(`/api/bids/${offer._id}/decline`)
        .send({
          reason: 'Price below minimum recovery floor',
          rationale: 'Our recovery floor for Honeycrisp is $18.50/cs.',
          templateHtml: templateBody,
          emailSubject: 'Offer Declined: {{product_name}} (Lot #{{lot_number}})'
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('rejected');
      expect(res.body.emailDispatch).toBeDefined();
      expect(res.body.emailDispatch.dispatched).toBe(true);
      expect(res.body.emailDispatch.messageId).toBeDefined();

      // 1. Verify Activity record created in Lot CRM
      const activity = await Activity.findOne({
        lotId: lot._id,
        type: 'Email',
        'metadata.offerId': offer._id
      });
      expect(activity).toBeDefined();
      expect(activity?.subject).toContain('Organic Honeycrisp Apples');
      expect(activity?.subject).toContain('LOT-DECLINE-0108');
      expect(activity?.recipient).toBe(buyer.email);
      expect(activity?.sender).toBe('Supplier');
      expect(activity?.content).toContain('Apex Grocery Liquidators');
      expect(activity?.content).toContain('Organic Honeycrisp Apples');
      expect(activity?.content).toContain('Price below minimum recovery floor');
      expect(activity?.content).toContain('Our recovery floor for Honeycrisp is $18.50/cs.');
      expect(activity?.content).toContain('/marketplace');

      // 2. Verify Emails Hub thread sync
      const thread = await EmailThread.findOne({
        buyerEmail: buyer.email
      });
      expect(thread).toBeDefined();
      expect(thread?.messages.length).toBeGreaterThanOrEqual(1);
      const lastMsg = thread?.messages[thread.messages.length - 1];
      expect(lastMsg?.senderType).toBe('supplier');
      expect(lastMsg?.body).toContain('Apex Grocery Liquidators');
      expect(lastMsg?.body).toContain('Price below minimum recovery floor');
    });

    it('should resiliently reject offer and return warning telemetry when email dispatch fails', async () => {
      jest.spyOn(nodemailer, 'createTransport').mockImplementation(() => {
        return {
          sendMail: jest.fn().mockRejectedValue(new Error('SMTP connection timeout'))
        } as any;
      });

      const res = await request(app)
        .post(`/api/bids/${offer._id}/decline`)
        .send({
          reason: 'Inventory committed to another partner',
          rationale: 'Allocated to institutional buyer earlier today.'
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('rejected');
      expect(res.body.emailDispatch).toBeDefined();
      expect(res.body.emailDispatch.dispatched).toBe(false);
      expect(res.body.emailDispatch.warning).toBeDefined();

      // Offer must still be marked rejected
      const updatedOffer = await Offer.findById(offer._id);
      expect(updatedOffer?.status).toBe('rejected');
    });

    it('should fall back to default decline template when templateHtml and emailSubject are omitted, compiling context tokens into Activity and thread', async () => {
      jest.spyOn(nodemailer, 'createTransport').mockImplementation(() => {
        return {
          sendMail: jest.fn().mockResolvedValue({
            messageId: 'test-default-template-msg-id',
            response: '250 OK'
          })
        } as any;
      });

      const res = await request(app)
        .post(`/api/bids/${offer._id}/decline`)
        .send({
          reason: 'Delivery / transport constraints',
          rationale: 'Carrier unable to service requested route this week.'
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('rejected');
      expect(res.body.emailDispatch?.dispatched).toBe(true);

      const activity = await Activity.findOne({
        lotId: lot._id,
        type: 'Email',
        'metadata.reason': 'Delivery / transport constraints'
      });
      expect(activity).toBeDefined();
      expect(activity?.subject).toBe('Offer Declined: Organic Honeycrisp Apples (Lot #LOT-DECLINE-0108)');
      expect(activity?.content).toContain('Dear Apex Grocery Liquidators');
      expect(activity?.content).toContain('Thank you for your offer on <strong>Organic Honeycrisp Apples</strong> (Lot #LOT-DECLINE-0108)');
      expect(activity?.content).toContain('<strong>Reason:</strong> Delivery / transport constraints');
      expect(activity?.content).toContain('<strong>Notes:</strong> Carrier unable to service requested route this week.');
      expect(activity?.content).toContain('Explore Available Surplus Inventory');
    });
  });
});

