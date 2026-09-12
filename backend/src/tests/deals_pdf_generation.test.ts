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

describe('Backend Seam: Authoritative Agreement PDF Compilation & Streaming (Issue #04D)', () => {
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
    await InventoryLot.deleteMany({ lotNumber: 'LOT-DEAL-04D' });
    await ProductMaster.deleteMany({ sku: 'SKU-DEAL-04D' });
    await DistributionCenter.deleteMany({ code: 'DC-DENVER-04D' });
    await Buyer.deleteMany({ email: /deal-test-buyer-04d/i });

    buyer = await Buyer.create({
      companyName: 'Apex Liquidators',
      email: 'deal-test-buyer-04d@example-buyer.org',
      acceptsShortDated: true
    });

    const mockSupplierId = new mongoose.Types.ObjectId();

    product = await ProductMaster.create({
      supplierId: mockSupplierId,
      sku: 'SKU-DEAL-04D',
      brand: 'SunHarvest',
      category: 'Beverages',
      description: 'Cold Pressed Orange Juice 1L'
    });

    dc = await DistributionCenter.create({
      supplierId: mockSupplierId.toString(),
      code: 'DC-DENVER-04D',
      name: 'Denver Central DC',
      address: '7400 E 40th Ave, Denver, CO 80207',
      coordinates: { lat: 39.7392, lng: -104.9903 },
      operatingHours: '08:00 AM - 04:30 PM CST'
    });

    lot = await InventoryLot.create({
      lotNumber: 'LOT-DEAL-04D',
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
      paymentStatus: 'confirmed',
      signatureStatus: 'executed',
      executionAudit: {
        signerName: 'Jane Doe',
        signerTitle: 'VP Procurement',
        signatureType: 'draw',
        signatureData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        signedAt: new Date(),
        ipAddress: '127.0.0.1',
        userAgent: 'Jest-Test-Runner',
        verificationHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
      },
      approvedDate: new Date()
    });
  });

  describe('Slice 1A: GET /api/deals/:dealId/pdf authorization and existence checks', () => {
    it('returns HTTP 404 when deal ID is invalid or not found', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/deals/${nonExistentId}/pdf?token=${validDealToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/deal not found/i);
    });

    it('returns HTTP 403 when unauthenticated and missing or invalid dealToken', async () => {
      const res = await request(app)
        .get(`/api/deals/${award._id}/pdf`);

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/unauthorized deal access/i);

      const invalidTokenRes = await request(app)
        .get(`/api/deals/${award._id}/pdf?token=invalid.tampered-token`);

      expect(invalidTokenRes.status).toBe(403);
    });
  });

  describe('Slice 1B: PDF Compilation & Streaming Response', () => {
    it('streams a valid PDF binary with correct content-type, content-disposition and PDF headers', async () => {
      const res = await request(app)
        .get(`/api/deals/${award._id}/pdf?token=${validDealToken}`)
        .buffer(true)
        .parse((res, cb) => {
          const data: Buffer[] = [];
          res.on('data', (chunk) => data.push(Buffer.from(chunk)));
          res.on('end', () => cb(null, Buffer.concat(data)));
        });

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');
      expect(res.headers['content-disposition']).toMatch(/inline;\s*filename="agreement-deal-.*\.pdf"/);

      // Verify valid PDF magic bytes (%PDF-)
      const pdfBuffer: Buffer = res.body;
      expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
      expect(pdfBuffer.length).toBeGreaterThan(500);
      const headerString = pdfBuffer.slice(0, 5).toString('utf-8');
      expect(headerString).toBe('%PDF-');

      // Decode PDF text tokens (both hex and literal strings)
      const rawPdf = pdfBuffer.toString('latin1');
      const decodedContent = rawPdf.replace(/<([0-9a-fA-F]+)>/g, (_, hex) => {
        try {
          return Buffer.from(hex, 'hex').toString('utf-8');
        } catch {
          return '';
        }
      });

      expect(decodedContent).toContain('B2B');
      expect(decodedContent).toContain('Surplus');
      expect(decodedContent).toContain('Purchase');
      expect(decodedContent).toContain('Where-Is');
      expect(decodedContent).toContain('Liquidators');
      expect(decodedContent).toContain('Doe');
      expect(decodedContent).toContain('Procurement');
      expect(decodedContent).toContain('80207');
      expect(decodedContent).toContain('FOB');
    });
  });

  describe('Slice 1C: Persistence of poPdfUrl to Award', () => {
    it('persists poPdfUrl to the Award record upon compiling/serving the authoritative agreement PDF', async () => {
      expect(award.poPdfUrl).toBeUndefined();

      const res = await request(app)
        .get(`/api/deals/${award._id}/pdf?token=${validDealToken}`);

      expect(res.status).toBe(200);

      const refreshedAward = await Award.findById(award._id);
      expect(refreshedAward?.poPdfUrl).toBe(`/api/deals/${award._id}/pdf`);
    });
  });
});
