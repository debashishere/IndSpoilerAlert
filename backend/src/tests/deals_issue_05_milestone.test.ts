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

describe('Issue #05 Milestone Integration: Buyer Deal Settlement Portal End-to-End API Flow', () => {
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
    await InventoryLot.deleteMany({ lotNumber: 'LOT-ISSUE05-01' });
    await ProductMaster.deleteMany({ sku: 'SKU-ISSUE05-01' });
    await DistributionCenter.deleteMany({ code: 'DC-ISSUE05-01' });
    await Buyer.deleteMany({ email: /issue05-buyer/i });
    await Activity.deleteMany({ 'metadata.dealId': { $exists: true } });
    await Shipment.deleteMany({});

    buyer = await Buyer.create({
      companyName: 'Apex Liquidators Corp',
      email: 'procurement@issue05-buyer.org',
      acceptsShortDated: true
    });

    const mockSupplierId = new mongoose.Types.ObjectId();

    product = await ProductMaster.create({
      supplierId: mockSupplierId,
      sku: 'SKU-ISSUE05-01',
      brand: 'HarvestBest',
      category: 'Beverages',
      description: 'Organic Cold-Pressed Orange Juice 1L'
    });

    dc = await DistributionCenter.create({
      supplierId: mockSupplierId.toString(),
      code: 'DC-ISSUE05-01',
      name: 'Denver Central Depot',
      address: '7400 E 40th Ave, Denver, CO 80207',
      coordinates: { lat: 39.7392, lng: -104.9903 },
      operatingHours: '08:00 AM - 04:30 PM CST'
    });

    lot = await InventoryLot.create({
      lotNumber: 'LOT-ISSUE05-01',
      productId: product._id,
      supplierId: mockSupplierId,
      distributionCenterId: dc._id,
      quantityCases: 500,
      availableQty: 300,
      costPerCase: 9.00,
      standardSellPrice: 18.00,
      expirationDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      status: 'active'
    });

    offer = await Offer.create({
      lotId: lot._id,
      buyerId: buyer._id,
      price: 14.00,
      quantity: 200,
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
      awardedQty: 200,
      price: 14.00,
      totalAmount: 2800.00,
      dealToken: validDealToken,
      pickupLocation: dc.address,
      pickupHours: dc.operatingHours,
      paymentStatus: 'pending',
      signatureStatus: 'pending',
      approvedDate: new Date()
    });
  });

  afterAll(async () => {
    await Award.deleteMany({});
    await Offer.deleteMany({});
    await InventoryLot.deleteMany({ lotNumber: 'LOT-ISSUE05-01' });
    await ProductMaster.deleteMany({ sku: 'SKU-ISSUE05-01' });
    await DistributionCenter.deleteMany({ code: 'DC-ISSUE05-01' });
    await Buyer.deleteMany({ email: /issue05-buyer/i });
    await Activity.deleteMany({ 'metadata.dealId': { $exists: true } });
    await Shipment.deleteMany({});
  });

  it('executes full two-step buyer settlement: details retrieval -> payment clearance -> e-sign execution -> PDF stream', async () => {
    // 1. GET /api/deals/:dealId?token=:token loads deal, lot, product, and DC logistics
    const getRes = await request(app)
      .get(`/api/deals/${award._id}?token=${validDealToken}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.deal).toBeDefined();
    expect(getRes.body.deal._id).toBe(award._id.toString());
    expect(getRes.body.deal.totalAmount).toBe(2800.00);
    expect(getRes.body.deal.awardedQty).toBe(200);
    expect(getRes.body.deal.pickupLocation).toBe('7400 E 40th Ave, Denver, CO 80207');
    expect(getRes.body.deal.pickupHours).toBe('08:00 AM - 04:30 PM CST');
    expect(getRes.body.deal.paymentStatus).toBe('pending');
    expect(getRes.body.deal.signatureStatus).toBe('pending');
    expect(getRes.body.deal.product.name).toBe('Organic Cold-Pressed Orange Juice 1L');
    expect(getRes.body.deal.product.sku).toBe('SKU-ISSUE05-01');

    // 2. Step 2 (Agreement & E-Sign) is locked before payment confirmation
    const prematureSignRes = await request(app)
      .post(`/api/deals/${award._id}/sign?token=${validDealToken}`)
      .send({
        signerName: 'Jane Doe',
        signerTitle: 'VP Procurement',
        authorized: true,
        signatureType: 'draw',
        signatureData: 'data:image/png;base64,mockSignatureBytes'
      });

    expect(prematureSignRes.status).toBe(400);
    expect(prematureSignRes.body.error).toMatch(/payment must be confirmed/i);

    // 3. Step 1: Confirm Payment (Simulate Payment Confirmation)
    const payRes = await request(app)
      .post(`/api/deals/${award._id}/confirm-payment?token=${validDealToken}`);

    expect(payRes.status).toBe(200);
    expect(payRes.body.success).toBe(true);
    expect(payRes.body.deal.paymentStatus).toBe('confirmed');

    // Verify Payment Activity in Lot CRM Timeline
    const paymentActivity = await Activity.findOne({
      lotId: lot._id,
      'metadata.dealId': award._id.toString(),
      'metadata.status': 'confirmed'
    });
    expect(paymentActivity).not.toBeNull();
    expect(paymentActivity?.type).toBe('Payment');
    expect(paymentActivity?.subject).toContain('$2,800.00');

    // 4. Step 2: Agreement & E-Sign Execution
    const signRes = await request(app)
      .post(`/api/deals/${award._id}/sign?token=${validDealToken}`)
      .send({
        signerName: 'Jane Doe',
        signerTitle: 'VP Procurement',
        authorized: true,
        signatureType: 'type',
        signatureData: 'Jane Doe'
      });

    expect(signRes.status).toBe(200);
    expect(signRes.body.success).toBe(true);
    expect(signRes.body.deal.signatureStatus).toBe('executed');
    expect(signRes.body.deal.executionAudit).toBeDefined();
    expect(signRes.body.deal.executionAudit.signerName).toBe('Jane Doe');
    expect(signRes.body.deal.executionAudit.signerTitle).toBe('VP Procurement');
    expect(signRes.body.deal.executionAudit.verificationHash).toHaveLength(64);

    // Verify Award persistence
    const updatedAward = await Award.findById(award._id);
    expect(updatedAward?.signatureStatus).toBe('executed');
    expect(updatedAward?.poPdfUrl).toBe(`/api/deals/${award._id}/pdf`);

    // Verify Downstream Fulfillment Provisioning (Shipment record created)
    const shipment = await Shipment.findOne({ awardId: award._id });
    expect(shipment).not.toBeNull();
    expect(shipment?.status).toBe('scheduled');
    expect(shipment?.carrier).toBe('Buyer Arranged Freight (FOB Origin)');
    expect(shipment?.pickupLocation).toBe('7400 E 40th Ave, Denver, CO 80207');

    // Verify Agreement Activity in Lot CRM Timeline
    const agreementActivity = await Activity.findOne({
      lotId: lot._id,
      'metadata.dealId': award._id.toString(),
      'metadata.status': 'executed'
    });
    expect(agreementActivity).not.toBeNull();
    expect(agreementActivity?.type).toBe('Agreement');
    expect(agreementActivity?.metadata?.signerName).toBe('Jane Doe');

    // Verify Offer messages timeline updated
    const updatedOffer = await Offer.findById(offer._id);
    const executionMsg = updatedOffer?.messages.find((m: any) => m.content.includes('Agreement Executed'));
    expect(executionMsg).toBeDefined();

    // 5. Authoritative PDF Generation & Stream
    const pdfRes = await request(app)
      .get(`/api/deals/${award._id}/pdf?token=${validDealToken}`);

    expect(pdfRes.status).toBe(200);
    expect(pdfRes.headers['content-type']).toBe('application/pdf');
    expect(pdfRes.headers['content-disposition']).toContain(`agreement-deal-${award._id}.pdf`);
    expect(pdfRes.body).toBeInstanceOf(Buffer);
    expect(pdfRes.body.length).toBeGreaterThan(500);
  });
});
