import request from 'supertest';
import mongoose from 'mongoose';
import nodemailer from 'nodemailer';
import app from '../index';
import Offer from '../models/Offer';
import Buyer from '../models/Buyer';
import InventoryLot from '../models/InventoryLot';
import ProductMaster from '../models/ProductMaster';
import DistributionCenter from '../models/DistributionCenter';
import SupplierOAuthMailbox from '../models/SupplierOAuthMailbox';
import Activity from '../models/Activity';
import EmailThread from '../models/EmailThread';
import Award from '../models/Award';

describe('Backend Seam 1: Bid Acceptance Action Flow & Settlement Email (Issue #04)', () => {
  jest.setTimeout(30000);

  const testSupplierId = 'supplier-accept-test-1';
  let buyer: any;
  let product: any;
  let dc: any;
  let lot: any;
  let offer: any;

  beforeAll(async () => {
    process.env.GOOGLE_CLIENT_ID = 'test-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
    process.env.REAL_SMTP = 'true';

    jest.spyOn(nodemailer, 'createTransport').mockImplementation(() => {
      return {
        sendMail: jest.fn().mockResolvedValue({
          messageId: 'test-accept-msg-id-888',
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

    await SupplierOAuthMailbox.deleteMany({ supplierId: testSupplierId });
    await Activity.deleteMany({ 'metadata.action': 'accept' });
    await EmailThread.deleteMany({ buyerEmail: /accept-test-buyer/i });
    await Offer.deleteMany({ price: { $in: [10.00, 15.00] } });
    await Award.deleteMany({});
    await InventoryLot.deleteMany({ lotNumber: 'LOT-ACCEPT-04' });
    await ProductMaster.deleteMany({ sku: 'SKU-ACCEPT-04' });
    await DistributionCenter.deleteMany({ code: 'DC-DENVER-01' });
    await Buyer.deleteMany({ email: /accept-test-buyer/i });

    buyer = await Buyer.create({
      companyName: 'Apex Liquidators',
      email: 'accept-test-buyer@example-buyer.org',
      acceptsShortDated: true
    });

    product = await ProductMaster.create({
      supplierId: mockSupplierId,
      sku: 'SKU-ACCEPT-04',
      brand: 'SunHarvest',
      category: 'Beverages',
      description: 'Cold Pressed Orange Juice 1L'
    });

    dc = await DistributionCenter.create({
      supplierId: mockSupplierId.toString(),
      name: 'Denver Central Depot',
      code: 'DC-DENVER-01',
      address: '450 Logistics Blvd, Denver, CO 80202',
      coordinates: { lat: 39.7392, lng: -104.9903 },
      coldStorage: true
    });

    lot = await InventoryLot.create({
      lotNumber: 'LOT-ACCEPT-04',
      distributionCenterId: dc._id,
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
    await Activity.deleteMany({ 'metadata.action': 'accept' });
    await EmailThread.deleteMany({ buyerEmail: /accept-test-buyer/i });
    await Award.deleteMany({});
    await Offer.deleteMany({ buyerId: buyer?._id });
    await InventoryLot.deleteMany({ lotNumber: 'LOT-ACCEPT-04' });
    await ProductMaster.deleteMany({ sku: 'SKU-ACCEPT-04' });
    await DistributionCenter.deleteMany({ code: 'DC-DENVER-01' });
    await Buyer.deleteMany({ email: /accept-test-buyer/i });
  });

  describe('POST /api/bids/:id/accept', () => {
    it('should record award, lock inventory allocation, resolve tokens, dispatch email, and log to CRM timeline', async () => {
      await SupplierOAuthMailbox.create({
        supplierId: testSupplierId,
        status: 'connected',
        userEmail: 'dispatch@sunharvest.com',
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token'
      });

      const templateBody = '<p>Congratulations {{buyer_name}}, your offer for {{awarded_quantity}} cases of {{product_name}} (SKU: {{sku}}) at {{price_per_case}} is accepted. Total: {{total_amount}}. Pickup at: {{pickup_location}} (Hours: {{pickup_hours}}). Pay here: {{payment_link}}. View Deal: {{deal_document_link}}.</p>';

      const res = await request(app)
        .post(`/api/bids/${offer._id}/accept`)
        .send({
          awardedQuantity: 200,
          pickupAddress: '450 Logistics Blvd, Denver, CO 80202',
          pickupHours: '08:00 AM - 04:30 PM CST',
          templateHtml: templateBody,
          emailSubject: 'Offer Accepted: {{product_name}} - Deal Settlement Memo'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.status).toBe('fully_accepted');
      expect(res.body.awardedQty).toBe(200);
      expect(res.body.dealToken).toBeDefined();
      expect(res.body.dealId).toBeDefined();
      expect(res.body.emailDispatch).toBeDefined();
      expect(res.body.emailDispatch.dispatched).toBe(true);

      // 1. Verify Offer updated
      const updatedOffer = await Offer.findById(offer._id);
      expect(updatedOffer?.status).toBe('fully_accepted');
      expect(updatedOffer?.awardedQty).toBe(200);
      expect(updatedOffer?.messages.length).toBeGreaterThanOrEqual(1);

      // 2. Verify InventoryLot availableQty deducted
      const updatedLot = await InventoryLot.findById(lot._id);
      expect(updatedLot?.availableQty).toBe(300); // 500 - 200

      // 3. Verify Award record created
      const award = await Award.findOne({ offerId: offer._id });
      expect(award).toBeDefined();
      expect(award?.awardedQty).toBe(200);
      expect(award?.price).toBe(10.00);
      expect((award as any)?.totalAmount).toBe(2000.00);
      expect((award as any)?.pickupLocation).toBe('450 Logistics Blvd, Denver, CO 80202');
      expect((award as any)?.pickupHours).toBe('08:00 AM - 04:30 PM CST');
      expect((award as any)?.dealToken).toBeDefined();

      // 4. Verify Activity (type: Email) logged in Lot CRM timeline
      const activity = await Activity.findOne({
        lotId: lot._id,
        type: 'Email',
        'metadata.offerId': offer._id
      });
      expect(activity).toBeDefined();
      expect(activity?.subject).toMatch(/Offer Accepted/i);
      expect(activity?.recipient).toBe(buyer.email);
      expect(activity?.content).toContain('Apex Liquidators');
      expect(activity?.content).toContain('200 cases');
      expect(activity?.content).toContain('Cold Pressed Orange Juice 1L');
      expect(activity?.content).toContain('SKU-ACCEPT-04');
      expect(activity?.content).toContain('$10.00');
      expect(activity?.content).toContain('$2,000.00');
      expect(activity?.content).toContain('450 Logistics Blvd, Denver, CO 80202');
      expect(activity?.content).toContain('08:00 AM - 04:30 PM CST');
      expect(activity?.content).toContain('/deal/');
      expect(activity?.metadata?.totalAmount).toBe(2000.00);
      expect(activity?.metadata?.awardedQuantity).toBe(200);

      // 5. Verify Emails Hub thread synchronized
      const thread = await EmailThread.findOne({
        buyerEmail: buyer.email
      });
      expect(thread).toBeDefined();
      const lastMsg = thread?.messages[thread.messages.length - 1];
      expect(lastMsg?.senderType).toBe('supplier');
      expect(lastMsg?.body).toContain('$2,000.00');
      expect(lastMsg?.body).toContain('450 Logistics Blvd, Denver, CO 80202');
    });

    it('should set status to partially_accepted when awarded quantity is less than offered quantity', async () => {
      const res = await request(app)
        .post(`/api/bids/${offer._id}/accept`)
        .send({
          awardedQuantity: 120, // Offer was for 200
          pickupAddress: '450 Logistics Blvd, Denver, CO 80202',
          pickupHours: '08:00 AM - 04:30 PM CST'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.status).toBe('partially_accepted');
      expect(res.body.awardedQty).toBe(120);

      const updatedOffer = await Offer.findById(offer._id);
      expect(updatedOffer?.status).toBe('partially_accepted');
      expect(updatedOffer?.awardedQty).toBe(120);

      const updatedLot = await InventoryLot.findById(lot._id);
      expect(updatedLot?.availableQty).toBe(380); // 500 - 120
    });

    it('should commit database records and return warning telemetry if mail transport fails', async () => {
      jest.spyOn(nodemailer, 'createTransport').mockImplementation(() => {
        return {
          sendMail: jest.fn().mockRejectedValue(new Error('ETIMEDOUT: Mail server connection timed out'))
        } as any;
      });

      await SupplierOAuthMailbox.create({
        supplierId: testSupplierId,
        status: 'expired',
        userEmail: 'dispatch@sunharvest.com',
        accessToken: 'expired-token',
        refreshToken: 'expired-token'
      });

      const res = await request(app)
        .post(`/api/bids/${offer._id}/accept`)
        .send({
          awardedQuantity: 200,
          pickupAddress: '450 Logistics Blvd, Denver, CO 80202',
          pickupHours: '08:00 AM - 04:30 PM CST'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.status).toBe('fully_accepted');
      expect(res.body.emailDispatch).toBeDefined();
      expect(res.body.emailDispatch.dispatched).toBe(false);
      expect(res.body.emailDispatch.warning).toBeDefined();

      // Database state still successfully locked and awarded
      const updatedOffer = await Offer.findById(offer._id);
      expect(updatedOffer?.status).toBe('fully_accepted');

      const updatedLot = await InventoryLot.findById(lot._id);
      expect(updatedLot?.availableQty).toBe(300);

      const award = await Award.findOne({ offerId: offer._id });
      expect(award).toBeDefined();
      expect(award?.awardedQty).toBe(200);
    });

    it('should reject duplicate accept calls with 409 Conflict (Idempotency Guard)', async () => {
      // First accept
      const firstRes = await request(app)
        .post(`/api/bids/${offer._id}/accept`)
        .send({ awardedQuantity: 200 });
      expect(firstRes.status).toBe(200);

      // Duplicate accept
      const dupRes = await request(app)
        .post(`/api/bids/${offer._id}/accept`)
        .send({ awardedQuantity: 200 });
      expect(dupRes.status).toBe(409);
      expect(dupRes.body.error).toMatch(/already been accepted/i);

      // Verify inventory was NOT double-deducted
      const updatedLot = await InventoryLot.findById(lot._id);
      expect(updatedLot?.availableQty).toBe(300); // 500 - 200, not 100
    });

    it('should reject accepting a rejected offer with 400 Bad Request', async () => {
      await Offer.findByIdAndUpdate(offer._id, { status: 'rejected' });

      const res = await request(app)
        .post(`/api/bids/${offer._id}/accept`)
        .send({ awardedQuantity: 200 });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Cannot accept a rejected offer/i);
    });

    it('should reject awarding more than the offered quantity', async () => {
      const res = await request(app)
        .post(`/api/bids/${offer._id}/accept`)
        .send({ awardedQuantity: 250 }); // Offer was only for 200

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/cannot exceed offered quantity/i);
    });

    it('should reject awarding when insufficient inventory available', async () => {
      // Set lot availableQty to 50
      await InventoryLot.findByIdAndUpdate(lot._id, { availableQty: 50 });

      const res = await request(app)
        .post(`/api/bids/${offer._id}/accept`)
        .send({ awardedQuantity: 100 }); // Offer was 200, requested 100, but only 50 left

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Insufficient inventory/i);
    });

    it('should transition lot status to sold when availableQty reaches 0', async () => {
      // Set lot to exactly 200
      await InventoryLot.findByIdAndUpdate(lot._id, { availableQty: 200 });

      const res = await request(app)
        .post(`/api/bids/${offer._id}/accept`)
        .send({ awardedQuantity: 200 });

      expect(res.status).toBe(200);
      const updatedLot = await InventoryLot.findById(lot._id);
      expect(updatedLot?.availableQty).toBe(0);
      expect(updatedLot?.status).toBe('sold');
    });

    it('should restore inventory and void Award when resetBid or declineBid is called on an accepted offer', async () => {
      // Accept offer
      const acceptRes = await request(app)
        .post(`/api/bids/${offer._id}/accept`)
        .send({ awardedQuantity: 200 });
      expect(acceptRes.status).toBe(200);

      let currentLot = await InventoryLot.findById(lot._id);
      expect(currentLot?.availableQty).toBe(300);

      // Now reset the bid
      const resetRes = await request(app).post(`/api/bids/${offer._id}/reset`);
      expect(resetRes.status).toBe(200);

      // Verify inventory restored
      currentLot = await InventoryLot.findById(lot._id);
      expect(currentLot?.availableQty).toBe(500);

      // Verify Award record removed
      const awards = await Award.find({ offerId: offer._id });
      expect(awards.length).toBe(0);
    });

    it('should support resending settlement communications via POST /api/bids/:id/resend-settlement', async () => {
      // First accept offer
      await request(app)
        .post(`/api/bids/${offer._id}/accept`)
        .send({ awardedQuantity: 200 });

      const res = await request(app).post(`/api/bids/${offer._id}/resend-settlement`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.dealToken).toBeDefined();
      expect(res.body.dealId).toBeDefined();

      // Verify activity log recorded
      const resendActivity = await Activity.findOne({
        lotId: lot._id,
        'metadata.action': 'resend_settlement'
      });
      expect(resendActivity).toBeDefined();
    });

    it('should idempotently update existing award without throwing E11000 duplicate key error and without double-deducting inventory', async () => {
      // Pre-create an award with the same offerId (simulating an existing award or prior partial award attempt)
      await Award.create({
        offerId: offer._id,
        buyerId: buyer._id,
        lotId: lot._id,
        awardedQty: 200,
        price: 10.00,
        paymentStatus: 'pending',
        signatureStatus: 'pending'
      });

      // Reset lot availableQty to 300 (as if the 200 cases were already accounted for)
      await InventoryLot.findByIdAndUpdate(lot._id, { availableQty: 300 });

      // Calling accept should update the existing award without E11000 duplicate key error
      const res = await request(app)
        .post(`/api/bids/${offer._id}/accept`)
        .send({
          awardedQuantity: 200,
          pickupAddress: '450 Logistics Blvd, Denver, CO 80202',
          pickupHours: '08:00 AM - 04:30 PM CST'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify only 1 award exists for this offer
      const awards = await Award.find({ offerId: offer._id });
      expect(awards.length).toBe(1);
      expect(awards[0].dealToken).toBeDefined();

      // Verify inventory was NOT double-deducted (availableQty should still be 300)
      const currentLot = await InventoryLot.findById(lot._id);
      expect(currentLot?.availableQty).toBe(300);
    });
  });
});
