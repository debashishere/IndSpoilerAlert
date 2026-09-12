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

describe('Backend Seam 1: Standalone Portal Route & Hybrid Deal Authorization (Issue #04A)', () => {
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
    await InventoryLot.deleteMany({ lotNumber: 'LOT-DEAL-04A' });
    await ProductMaster.deleteMany({ sku: 'SKU-DEAL-04A' });
    await DistributionCenter.deleteMany({ code: 'DC-DENVER-04A' });
    await Buyer.deleteMany({ email: /deal-test-buyer/i });

    buyer = await Buyer.create({
      companyName: 'Apex Liquidators',
      email: 'deal-test-buyer@example-buyer.org',
      acceptsShortDated: true
    });

    const mockSupplierId = new mongoose.Types.ObjectId();

    product = await ProductMaster.create({
      supplierId: mockSupplierId,
      sku: 'SKU-DEAL-04A',
      brand: 'SunHarvest',
      category: 'Beverages',
      description: 'Cold Pressed Orange Juice 1L'
    });

    dc = await DistributionCenter.create({
      supplierId: mockSupplierId.toString(),
      code: 'DC-DENVER-04A',
      name: 'Denver Central DC',
      address: '7400 E 40th Ave, Denver, CO 80207',
      coordinates: { lat: 39.7392, lng: -104.9903 },
      operatingHours: '08:00 AM - 04:30 PM CST'
    });

    lot = await InventoryLot.create({
      lotNumber: 'LOT-DEAL-04A',
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

  describe('Slice 1A: Cryptographic Guest Access via valid dealToken', () => {
    it('returns HTTP 200 with deal summary when a valid HMAC dealToken is supplied', async () => {
      const res = await request(app)
        .get(`/api/deals/${award._id}?token=${validDealToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toBeDefined();
      expect(res.body.deal).toBeDefined();
      expect(res.body.deal._id).toBe(award._id.toString());
      expect(res.body.deal.awardedQty).toBe(100);
      expect(res.body.deal.price).toBe(12.50);
      expect(res.body.deal.totalAmount).toBe(1250.00);
      expect(res.body.deal.pickupLocation).toBe('7400 E 40th Ave, Denver, CO 80207');
      expect(res.body.deal.pickupHours).toBe('08:00 AM - 04:30 PM CST');
      expect(res.body.deal.paymentStatus).toBe('pending');
      expect(res.body.deal.signatureStatus).toBe('pending');
      expect(res.body.deal.product).toBeDefined();
      expect(res.body.deal.product.name).toBe('Cold Pressed Orange Juice 1L');
      expect(res.body.deal.product.sku).toBe('SKU-DEAL-04A');
    });
  });

  describe('Slice 1B: Authorized Session Access (Buyer JWT & Supplier Admin)', () => {
    function makeMockJwt(payload: any) {
      const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
      const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
      return `${header}.${body}.mock-signature`;
    }

    it('returns HTTP 200 when authenticated as the awarded buyer without dealToken parameter', async () => {
      const buyerJwt = makeMockJwt({
        uid: buyer._id.toString(),
        email: buyer.email,
        profiles: { buyer: true, supplier: false }
      });

      const res = await request(app)
        .get(`/api/deals/${award._id}`)
        .set('Authorization', `Bearer ${buyerJwt}`);

      expect(res.status).toBe(200);
      expect(res.body.deal._id).toBe(award._id.toString());
      expect(res.body.deal.totalAmount).toBe(1250.00);
    });

    it('returns HTTP 200 when authenticated as a supplier administrator previewing the deal', async () => {
      const supplierJwt = makeMockJwt({
        uid: 'supplier-admin-user',
        email: 'operations@spoileralert-distro.com',
        profiles: { buyer: false, supplier: true }
      });

      const res = await request(app)
        .get(`/api/deals/${award._id}`)
        .set('Authorization', `Bearer ${supplierJwt}`);

      expect(res.status).toBe(200);
      expect(res.body.deal._id).toBe(award._id.toString());
      expect(res.body.deal.product.sku).toBe('SKU-DEAL-04A');
    });
  });

  describe('Slice 1C: Access Denied (HTTP 403) and Not Found (HTTP 404)', () => {
    function makeMockJwt(payload: any) {
      const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
      const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
      return `${header}.${body}.mock-signature`;
    }

    it('returns HTTP 403 when no token is provided and user is unauthenticated', async () => {
      const res = await request(app)
        .get(`/api/deals/${award._id}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/Unauthorized deal access/i);
    });

    it('returns HTTP 403 when a tampered or invalid dealToken is supplied', async () => {
      const res = await request(app)
        .get(`/api/deals/${award._id}?token=invalid-fake-token-12345`);

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/Unauthorized deal access/i);
    });

    it('returns HTTP 403 when authenticated as an unrelated buyer without token', async () => {
      const otherBuyerJwt = makeMockJwt({
        uid: new mongoose.Types.ObjectId().toString(),
        email: 'other-buyer@unrelated-liquidator.org',
        profiles: { buyer: true, supplier: false }
      });

      const res = await request(app)
        .get(`/api/deals/${award._id}`)
        .set('Authorization', `Bearer ${otherBuyerJwt}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/Unauthorized deal access/i);
    });

    it('returns HTTP 404 when querying a non-existent deal ID', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/deals/${nonExistentId}?token=${validDealToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/Deal not found/i);
    });
  });
});
