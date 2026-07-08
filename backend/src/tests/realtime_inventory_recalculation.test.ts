import request from 'supertest';
import mongoose from 'mongoose';
import app from '../index';

// Mock AWS S3 & SQS
jest.mock('../utils/aws', () => ({
  uploadToS3: jest.fn().mockResolvedValue(undefined),
  sendSQSMessage: jest.fn().mockResolvedValue(undefined),
}));

// Mock Email Service to avoid external network timeouts
jest.mock('../services/emailService', () => ({
  ...jest.requireActual('../services/emailService'),
  sendEmailHelper: jest.fn().mockResolvedValue({
    success: true,
    messageId: 'mock-msg-id-123',
    previewUrl: 'https://ethereal.email/message/mock'
  })
}));

describe('0088 — Real-Time Inventory Volume Recalculation & Automated Unlisting API', () => {
  let supplierId: string;
  let lotId: string;
  let opportunityId: string;
  let listingId: string;
  let buyerId: string;
  let offerId1: string;
  let offerId2: string;

  beforeAll(async () => {
    const Supplier = mongoose.model('Supplier');
    const DistributionCenter = mongoose.model('DistributionCenter');
    const ProductMaster = mongoose.model('ProductMaster');
    const InventoryLot = mongoose.model('InventoryLot');
    const Opportunity = mongoose.model('Opportunity');
    const MarketplaceListing = mongoose.model('MarketplaceListing');
    const Buyer = mongoose.model('Buyer');
    const Offer = mongoose.model('Offer');

    // Clean up previous test runs
    await Supplier.deleteMany({ companyCode: 'TSUP_SLICE6' });
    await Buyer.deleteMany({ email: 'buyer.slice6@test.com' });

    const supp = await Supplier.create({
      name: 'Slice 6 Supplier',
      companyCode: 'TSUP_SLICE6',
      preferredDisposition: 'sell'
    });
    supplierId = supp._id.toString();

    const dc = await DistributionCenter.create({
      supplierId: supp._id,
      name: 'Slice 6 DC',
      code: 'TSUP-DC6',
      address: '600 Logistics Way, Chicago, IL',
      coordinates: { lat: 41.8781, lng: -87.6298 },
      coldStorage: true
    });

    const prod = await ProductMaster.create({
      supplierId: supp._id,
      sku: 'SKU-SLICE6-001',
      category: 'Beverages',
      description: 'Slice 6 Sparkling Cold Brew',
      shelfLifeDays: 30
    });

    const lot = await InventoryLot.create({
      supplierId: supp._id,
      distributionCenterId: dc._id,
      productId: prod._id,
      lotNumber: 'LOT-SLICE6-001',
      expirationDate: new Date(Date.now() + 15 * 24 * 3600 * 1000),
      remainingShelfLife: 0.75,
      quantityCases: 100,
      availableQty: 100,
      costPerCase: 4.00,
      standardSellPrice: 6.00,
      status: 'active'
    });
    lotId = lot._id.toString();

    const opp = await Opportunity.create({
      lotId: lot._id,
      opportunityType: 'sell',
      priority: 'high',
      recommendedAction: 'Liquidate',
      status: 'approved'
    });
    opportunityId = opp._id.toString();

    const listing = await MarketplaceListing.create({
      opportunityId: opp._id,
      sellerId: supp._id,
      supplierId: supp._id,
      lotId: lot._id,
      publicTitle: 'Slice 6 Sparkling Cold Brew',
      category: 'Beverages',
      remainingShelfLife: 0.75,
      availableQuantity: 100,
      publicPrice: 6.00,
      allowBidding: true,
      startingPrice: 5.00,
      minimumPrice: 4.00,
      status: 'published'
    });
    listingId = listing._id.toString();

    const buyer = await Buyer.create({
      companyName: 'Slice 6 Wholesale Retailers',
      email: 'buyer.slice6@test.com',
      isVerified: true,
      acceptsShortDated: true,
      categories: ['Beverages']
    });
    buyerId = buyer._id.toString();

    // Create 2 offers
    const offer1 = await Offer.create({
      listingId: listing._id,
      buyerId: buyer._id,
      quantity: 40,
      price: 5.50,
      status: 'pending',
      messages: [{ sender: 'buyer', content: 'Bid 40 cases at $5.50', timestamp: new Date() }]
    });
    offerId1 = offer1._id.toString();

    const offer2 = await Offer.create({
      listingId: listing._id,
      buyerId: buyer._id,
      quantity: 60,
      price: 5.80,
      status: 'pending',
      messages: [{ sender: 'buyer', content: 'Bid 60 cases at $5.80', timestamp: new Date() }]
    });
    offerId2 = offer2._id.toString();
  });

  afterAll(async () => {
    const Supplier = mongoose.model('Supplier');
    const Buyer = mongoose.model('Buyer');
    const DistributionCenter = mongoose.model('DistributionCenter');
    const ProductMaster = mongoose.model('ProductMaster');
    const InventoryLot = mongoose.model('InventoryLot');
    const Opportunity = mongoose.model('Opportunity');
    const MarketplaceListing = mongoose.model('MarketplaceListing');
    const Offer = mongoose.model('Offer');
    const Award = mongoose.model('Award');
    const Shipment = mongoose.model('Shipment');
    const Activity = mongoose.model('Activity');

    await Supplier.deleteMany({ companyCode: 'TSUP_SLICE6' });
    await Buyer.deleteMany({ email: 'buyer.slice6@test.com' });
    await DistributionCenter.deleteMany({ supplierId });
    await ProductMaster.deleteMany({ supplierId });
    await InventoryLot.deleteMany({ supplierId });
    await Opportunity.deleteMany({ _id: opportunityId });
    await MarketplaceListing.deleteMany({ _id: listingId });
    await Offer.deleteMany({ listingId });
    await Award.deleteMany({ listingId });
    await Shipment.deleteMany({ pickupLocation: { $regex: /600 Logistics Way/i } });
    await Activity.deleteMany({ lotId });

    await mongoose.disconnect();
  });

  it('POST /api/v1/supplier/bids/:id/award - partial award recalculates remaining lot volume and projects to MarketplaceListing', async () => {
    const res = await request(app)
      .post(`/api/v1/supplier/bids/${offerId1}/award`)
      .send({
        awardedQty: 40,
        emailSent: 'Congratulations, your bid of 40 cases has been awarded.',
        emailSubject: 'Bid Awarded - Slice 6 Sparkling Cold Brew'
      });

    expect(res.status).toBe(200);
    expect(res.body.availableQty).toBe(60);
    expect(res.body.lotStatus).toBe('active');

    // Verify SurplusInventoryLot remaining volume
    const InventoryLot = mongoose.model('InventoryLot');
    const lot = await InventoryLot.findById(lotId);
    expect(lot?.availableQty).toBe(60);
    expect(lot?.status).toBe('active');

    // Verify MarketplaceListing projection volume update
    const MarketplaceListing = mongoose.model('MarketplaceListing');
    const listing = await MarketplaceListing.findById(listingId);
    expect(listing?.availableQuantity).toBe(60);
    expect(listing?.status).toBe('published');
  });

  it('verifies PO PDF, BOL freight records, and email notification activity logs generated upon award', async () => {
    const Award = mongoose.model('Award');
    const Shipment = mongoose.model('Shipment');
    const Activity = mongoose.model('Activity');

    // Verify Award Record & PO PDF
    const award = await Award.findOne({ offerId: offerId1 });
    expect(award).toBeTruthy();
    expect(award?.awardedQty).toBe(40);
    expect(award?.poPdfUrl).toMatch(/^https:\/\/.*purchase-orders\/po-/);

    // Verify Freight Shipment & BOL PDF
    const shipment = await Shipment.findOne({ awardId: award?._id });
    expect(shipment).toBeTruthy();
    expect(shipment?.bolNumber).toMatch(/^BOL-\d+/);
    expect(shipment?.bolPdfUrl).toMatch(/^https:\/\/.*bills-of-lading\/bol-/);
    expect(shipment?.temperature).toMatch(/Refrigerated/);

    // Verify Email Dispatch Activity Log
    const activity = await Activity.findOne({ lotId, recipient: 'buyer.slice6@test.com' });
    expect(activity).toBeTruthy();
    expect(activity?.subject).toBe('Bid Awarded - Slice 6 Sparkling Cold Brew');
  });

  it('POST /api/v1/supplier/bids/:id/award - full award reduces remaining volume to 0, marks listing as closed/unlisted, and excludes from public marketplace search facets', async () => {
    const res = await request(app)
      .post(`/api/v1/supplier/bids/${offerId2}/award`)
      .send({
        awardedQty: 60,
        emailSent: 'Final award notice for remaining 60 cases.',
        emailSubject: 'Bid Awarded - Sold Out'
      });

    expect(res.status).toBe(200);
    expect(res.body.availableQty).toBe(0);
    expect(res.body.lotStatus).toBe('sold');

    // Verify SurplusInventoryLot status
    const InventoryLot = mongoose.model('InventoryLot');
    const lot = await InventoryLot.findById(lotId);
    expect(lot?.availableQty).toBe(0);
    expect(lot?.status).toBe('sold');

    // Verify MarketplaceListing status and availableQuantity
    const MarketplaceListing = mongoose.model('MarketplaceListing');
    const listing = await MarketplaceListing.findById(listingId);
    expect(listing?.availableQuantity).toBe(0);
    expect(['closed', 'unlisted']).toContain(listing?.status);

    // Verify unlisting from public buyer marketplace search facets API
    const marketRes = await request(app)
      .get('/api/v1/marketplace/listings');

    expect(marketRes.status).toBe(200);
    const listedIds = (marketRes.body.listings || []).map((l: any) => l._id.toString());
    expect(listedIds).not.toContain(listingId);
  });
});
