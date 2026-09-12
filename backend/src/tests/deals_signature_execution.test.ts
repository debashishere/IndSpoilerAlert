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
import Shipment from '../models/Shipment';

describe('Backend Seam: Dual-Mode Signature Capture & Legal Agreement Execution (Issue #04C)', () => {
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
    await InventoryLot.deleteMany({ lotNumber: 'LOT-DEAL-04C' });
    await ProductMaster.deleteMany({ sku: 'SKU-DEAL-04C' });
    await DistributionCenter.deleteMany({ code: 'DC-DENVER-04C' });
    await Buyer.deleteMany({ email: /deal-test-buyer-04c/i });
    await Activity.deleteMany({ 'metadata.dealId': { $exists: true } });
    await Shipment.deleteMany({});

    buyer = await Buyer.create({
      companyName: 'Apex Liquidators',
      email: 'deal-test-buyer-04c@example-buyer.org',
      acceptsShortDated: true
    });

    const mockSupplierId = new mongoose.Types.ObjectId();

    product = await ProductMaster.create({
      supplierId: mockSupplierId,
      sku: 'SKU-DEAL-04C',
      brand: 'SunHarvest',
      category: 'Beverages',
      description: 'Cold Pressed Orange Juice 1L'
    });

    dc = await DistributionCenter.create({
      supplierId: mockSupplierId.toString(),
      code: 'DC-DENVER-04C',
      name: 'Denver Central DC',
      address: '7400 E 40th Ave, Denver, CO 80207',
      coordinates: { lat: 39.7392, lng: -104.9903 },
      operatingHours: '08:00 AM - 04:30 PM CST'
    });

    lot = await InventoryLot.create({
      lotNumber: 'LOT-DEAL-04C',
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

  describe('Slice 1: POST /api/deals/:dealId/sign payment gate enforcement and validation', () => {
    it('returns HTTP 403 when unauthenticated and missing or invalid dealToken', async () => {
      const res = await request(app)
        .post(`/api/deals/${award._id}/sign`)
        .send({
          signerName: 'Jane Doe',
          signerTitle: 'VP Procurement',
          authorized: true,
          signatureType: 'draw',
          signatureData: 'data:image/png;base64,mockSignaturePng'
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/Unauthorized/i);
    });

    it('returns HTTP 400 when paymentStatus is not confirmed', async () => {
      expect(award.paymentStatus).toBe('pending');

      const res = await request(app)
        .post(`/api/deals/${award._id}/sign?token=${validDealToken}`)
        .send({
          signerName: 'Jane Doe',
          signerTitle: 'VP Procurement',
          authorized: true,
          signatureType: 'draw',
          signatureData: 'data:image/png;base64,mockSignaturePng'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Payment must be confirmed/i);
    });

    it('returns HTTP 400 when mandatory legal execution fields are missing or invalid', async () => {
      // Mark payment as confirmed first
      await Award.findByIdAndUpdate(award._id, { paymentStatus: 'confirmed' });

      // Missing signerTitle
      const res1 = await request(app)
        .post(`/api/deals/${award._id}/sign?token=${validDealToken}`)
        .send({
          signerName: 'Jane Doe',
          authorized: true,
          signatureType: 'draw',
          signatureData: 'data:image/png;base64,mockSignaturePng'
        });
      expect(res1.status).toBe(400);
      expect(res1.body.error).toMatch(/signerTitle is required/i);

      // Missing signatureData
      const res2 = await request(app)
        .post(`/api/deals/${award._id}/sign?token=${validDealToken}`)
        .send({
          signerName: 'Jane Doe',
          signerTitle: 'VP Procurement',
          authorized: true,
          signatureType: 'type'
        });
      expect(res2.status).toBe(400);
      expect(res2.body.error).toMatch(/signatureData is required/i);

      // authorized is false
      const res3 = await request(app)
        .post(`/api/deals/${award._id}/sign?token=${validDealToken}`)
        .send({
          signerName: 'Jane Doe',
          signerTitle: 'VP Procurement',
          authorized: false,
          signatureType: 'draw',
          signatureData: 'data:image/png;base64,mockSignaturePng'
        });
      expect(res3.status).toBe(400);
      expect(res3.body.error).toMatch(/Authorization confirmation is required/i);
    });
  });

  describe('Slice 2: Agreement execution, audit trail persistence, downstream shipment provisioning, and timeline sync', () => {
    it('executes agreement, persists audit trail, creates scheduled shipment, and logs timeline/messages', async () => {
      // Mark payment as confirmed first
      await Award.findByIdAndUpdate(award._id, { paymentStatus: 'confirmed' });

      const signPayload = {
        signerName: 'Jane Doe',
        signerTitle: 'Chief Commercial Officer',
        authorized: true,
        signatureType: 'draw',
        signatureData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
      };

      const res = await request(app)
        .post(`/api/deals/${award._id}/sign?token=${validDealToken}`)
        .set('User-Agent', 'Mozilla/5.0 TestBrowser')
        .send(signPayload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.deal).toBeDefined();
      expect(res.body.deal.signatureStatus).toBe('executed');
      expect(res.body.deal.executionAudit).toBeDefined();
      expect(res.body.deal.executionAudit.signerName).toBe('Jane Doe');
      expect(res.body.deal.executionAudit.signerTitle).toBe('Chief Commercial Officer');
      expect(res.body.deal.executionAudit.signatureType).toBe('draw');

      // 1. Verify Award in DB
      const updatedAward = await Award.findById(award._id);
      expect(updatedAward?.signatureStatus).toBe('executed');
      expect(updatedAward?.executionAudit?.signerName).toBe('Jane Doe');
      expect(updatedAward?.executionAudit?.signerTitle).toBe('Chief Commercial Officer');
      expect(updatedAward?.executionAudit?.signatureData).toBe(signPayload.signatureData);
      expect(updatedAward?.executionAudit?.signedAt).toBeDefined();
      expect(updatedAward?.executionAudit?.verificationHash).toBeDefined();
      expect(updatedAward?.executionAudit?.userAgent).toBe('Mozilla/5.0 TestBrowser');

      // 2. Verify Downstream Shipment created
      const shipment = await Shipment.findOne({ awardId: award._id });
      expect(shipment).toBeDefined();
      expect(shipment?.status).toBe('scheduled');
      expect(shipment?.carrier).toBe('Buyer Arranged Freight (FOB Origin)');
      expect(shipment?.pickupLocation).toBe(award.pickupLocation);

      // 3. Verify Lot CRM Timeline Activity
      const activity = await Activity.findOne({
        lotId: lot._id,
        'metadata.dealId': award._id.toString(),
        'metadata.status': 'executed'
      });
      expect(activity).toBeDefined();
      expect(activity?.subject).toMatch(/Agreement Executed/i);
      expect(activity?.content).toContain('Jane Doe');
      expect(activity?.content).toContain('Chief Commercial Officer');

      // 4. Verify Offer Messages
      const updatedOffer = await Offer.findById(offer._id);
      const lastMessage = updatedOffer?.messages[updatedOffer.messages.length - 1];
      expect(lastMessage).toBeDefined();
      expect(lastMessage?.content).toMatch(/Agreement Executed/i);
    });
  });
});

