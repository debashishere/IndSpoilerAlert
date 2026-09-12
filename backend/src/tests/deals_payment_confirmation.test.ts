import request from 'supertest';
import mongoose from 'mongoose';
import crypto from 'crypto';
import app from '../index';
import Award from '../models/Award';
import Buyer from '../models/Buyer';
import InventoryLot from '../models/InventoryLot';
import ProductMaster from '../models/ProductMaster';
import DistributionCenter from '../models/DistributionCenter';
import Offer from '../models/Offer';
import Activity from '../models/Activity';

describe('Backend Seam 1: Payment Gate & Settlement State Machine (Issue #04B)', () => {
  jest.setTimeout(30000);

  let buyer: any;
  let product: any;
  let dc: any;
  let lot: any;
  let offer: any;
  let award: any;
  let validDealToken: string;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/indspoileralert_test');
    }
  });

  beforeEach(async () => {
    await Award.deleteMany({});
    await Offer.deleteMany({});
    await InventoryLot.deleteMany({ lotNumber: 'LOT-DEAL-04B' });
    await ProductMaster.deleteMany({ sku: 'SKU-DEAL-04B' });
    await DistributionCenter.deleteMany({ code: 'DC-DENVER-04B' });
    await Buyer.deleteMany({ email: /deal-test-buyer-04b/i });
    await Activity.deleteMany({ 'metadata.dealId': { $exists: true } });

    buyer = await Buyer.create({
      companyName: 'Apex Liquidators',
      email: 'deal-test-buyer-04b@example-buyer.org',
      acceptsShortDated: true
    });

    const mockSupplierId = new mongoose.Types.ObjectId();

    product = await ProductMaster.create({
      supplierId: mockSupplierId,
      sku: 'SKU-DEAL-04B',
      brand: 'SunHarvest',
      category: 'Beverages',
      description: 'Cold Pressed Orange Juice 1L'
    });

    dc = await DistributionCenter.create({
      supplierId: mockSupplierId.toString(),
      code: 'DC-DENVER-04B',
      name: 'Denver Central DC',
      address: '7400 E 40th Ave, Denver, CO 80207',
      coordinates: { lat: 39.7392, lng: -104.9903 },
      operatingHours: '08:00 AM - 04:30 PM CST'
    });

    lot = await InventoryLot.create({
      lotNumber: 'LOT-DEAL-04B',
      productId: product._id,
      supplierId: mockSupplierId,
      distributionCenterId: dc._id,
      quantityCases: 250,
      availableQty: 250,
      costPerCase: 8.50,
      standardSellPrice: 16.00,
      expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'active'
    });

    offer = await Offer.create({
      lotId: lot._id,
      buyerId: buyer._id,
      price: 12.50,
      quantity: 100,
      status: 'fully_accepted',
      submittedAt: new Date()
    });

    const rawToken = crypto.randomBytes(16).toString('hex');
    const hmacSecret = process.env.QUICK_BID_SECRET || 'spoileralert-quick-bid-secret';
    validDealToken = `${rawToken}.${crypto.createHmac('sha256', hmacSecret).update(`${rawToken}:${offer._id}`).digest('hex')}`;

    award = await Award.create({
      lotId: lot._id,
      offerId: offer._id,
      buyerId: buyer._id,
      awardedQty: 100,
      price: 12.50,
      totalAmount: 1250.00,
      dealToken: validDealToken,
      pickupLocation: dc.address,
      pickupHours: dc.operatingHours,
      paymentStatus: 'pending',
      signatureStatus: 'pending',
      approvedDate: new Date()
    });
  });

  describe('Slice 1: POST /api/deals/:dealId/confirm-payment authorization and validation', () => {
    it('returns HTTP 403 when unauthenticated and missing or invalid dealToken', async () => {
      const res = await request(app)
        .post(`/api/deals/${award._id}/confirm-payment`)
        .send({});

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/Unauthorized/i);
    });

    it('returns HTTP 403 when providing an invalid token', async () => {
      const res = await request(app)
        .post(`/api/deals/${award._id}/confirm-payment?token=invalid.token123`)
        .send({});

      expect(res.status).toBe(403);
    });

    it('returns HTTP 404 when dealId is non-existent', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post(`/api/deals/${fakeId}/confirm-payment?token=${validDealToken}`)
        .send({});

      expect(res.status).toBe(404);
    });
  });

  describe('Slice 2: Payment confirmation persistence and Lot CRM timeline logging', () => {
    it('confirms payment via valid dealToken, updates Award.paymentStatus, and logs Lot CRM activity', async () => {
      expect(award.paymentStatus).toBe('pending');

      const res = await request(app)
        .post(`/api/deals/${award._id}/confirm-payment?token=${validDealToken}`)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.deal).toBeDefined();
      expect(res.body.deal.paymentStatus).toBe('confirmed');

      // 1. Verify Award in database
      const updatedAward = await Award.findById(award._id);
      expect(updatedAward?.paymentStatus).toBe('confirmed');

      // 2. Verify Activity in Lot CRM timeline
      const activity = await Activity.findOne({
        lotId: lot._id,
        'metadata.dealId': award._id.toString()
      });

      expect(activity).toBeDefined();
      expect(activity?.type).toMatch(/Payment/i);
      expect(activity?.subject).toMatch(/Payment Received/i);
      expect(activity?.content).toContain('$1,250.00');
      expect(activity?.content).toContain('Apex Liquidators');
      expect(activity?.metadata?.totalAmount).toBe(1250.00);
      expect(activity?.metadata?.status).toBe('confirmed');
    });

    it('is idempotent when re-confirming already confirmed payment', async () => {
      await Award.findByIdAndUpdate(award._id, { paymentStatus: 'confirmed' });

      const res = await request(app)
        .post(`/api/deals/${award._id}/confirm-payment?token=${validDealToken}`)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.deal.paymentStatus).toBe('confirmed');
    });
  });
});
