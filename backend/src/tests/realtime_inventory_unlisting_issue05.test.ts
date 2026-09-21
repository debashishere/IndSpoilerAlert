import request from 'supertest';
import mongoose from 'mongoose';
import app from '../index';

// Mock AWS S3 & SQS
jest.mock('../utils/aws', () => ({
  uploadToS3: jest.fn().mockResolvedValue(undefined),
  sendSQSMessage: jest.fn().mockResolvedValue(undefined),
}));

// Mock Email Service to avoid network delays
jest.mock('../services/emailService', () => ({
  ...jest.requireActual('../services/emailService'),
  sendEmailHelper: jest.fn().mockResolvedValue({
    success: true,
    messageId: 'mock-msg-id-123',
    previewUrl: 'https://ethereal.email/message/mock'
  }),
  sendCampaignEmail: jest.fn().mockResolvedValue({
    success: true,
    messageId: 'mock-campaign-msg-123'
  })
}));

describe('Issue 05 — Real-time Inventory Volume Recalculation & Automated Unlisting', () => {
  let supplierId: string;
  let activeListingId: string;
  let expiredListingId: string;

  let seam2LotId: string;
  let seam2ListingId: string;
  let seam2BuyerId: string;
  let seam2Offer1Id: string;
  let seam2Offer2Id: string;

  beforeAll(async () => {
    const Supplier = mongoose.model('Supplier');
    const MarketplaceListing = mongoose.model('MarketplaceListing');
    const DistributionCenter = mongoose.model('DistributionCenter');
    const ProductMaster = mongoose.model('ProductMaster');
    const InventoryLot = mongoose.model('InventoryLot');
    const Buyer = mongoose.model('Buyer');
    const Offer = mongoose.model('Offer');

    await Supplier.deleteMany({ companyCode: 'SUP_ISSUE05' });
    const supplier = await Supplier.create({
      name: 'Issue 05 Supplier',
      companyCode: 'SUP_ISSUE05',
      preferredDisposition: 'sell'
    });
    supplierId = supplier._id.toString();

    // Clean any prior test listings
    await MarketplaceListing.deleteMany({ supplierId });

    // 1. Unexpired active listing
    const activeListing = await MarketplaceListing.create({
      sellerId: supplier._id,
      supplierId: supplier._id,
      publicTitle: 'Fresh Organic Apples',
      category: 'Produce',
      availableQuantity: 50,
      publicPrice: 12.00,
      status: 'published',
      expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000) // 7 days in future
    });
    activeListingId = activeListing._id.toString();

    // 2. Expired active listing (has availableQuantity > 0, status 'published', but expiresAt is in the past)
    const expiredListing = await MarketplaceListing.create({
      sellerId: supplier._id,
      supplierId: supplier._id,
      publicTitle: 'Expired Dairy Yogurt',
      category: 'Dairy',
      availableQuantity: 50,
      publicPrice: 8.00,
      status: 'published',
      expiresAt: new Date(Date.now() - 24 * 3600 * 1000) // 1 day in past
    });
    expiredListingId = expiredListing._id.toString();

    // 3. Seam 2 Setup: Lot with linked MarketplaceListing and Offers
    const dc = await DistributionCenter.create({
      supplierId: supplier._id,
      name: 'Seam 2 DC',
      code: 'DC_SEAM2',
      address: '123 Logistics Way, Chicago, IL',
      coordinates: { lat: 41.8781, lng: -87.6298 },
      coldStorage: false
    });

    const prod = await ProductMaster.create({
      supplierId: supplier._id,
      sku: 'SKU_SEAM2_01',
      category: 'Produce',
      description: 'Organic Honeycrisp Apples'
    });

    const lot = await InventoryLot.create({
      supplierId: supplier._id,
      distributionCenterId: dc._id,
      productId: prod._id,
      lotNumber: 'LOT_SEAM2_01',
      quantityCases: 100,
      availableQty: 100,
      costPerCase: 10.00,
      standardSellPrice: 15.00,
      status: 'active',
      expirationDate: new Date(Date.now() + 14 * 24 * 3600 * 1000)
    });
    seam2LotId = lot._id.toString();

    const seam2Listing = await MarketplaceListing.create({
      sellerId: supplier._id,
      supplierId: supplier._id,
      lotId: lot._id,
      publicTitle: 'Organic Honeycrisp Apples - 100 Cases',
      category: 'Produce',
      availableQuantity: 100,
      publicPrice: 20.00,
      status: 'published',
      expiresAt: new Date(Date.now() + 14 * 24 * 3600 * 1000)
    });
    seam2ListingId = seam2Listing._id.toString();

    const buyer = await Buyer.create({
      companyName: 'Seam 2 Buyer',
      email: 'buyer.seam2@test.com',
      isVerified: true
    });
    seam2BuyerId = buyer._id.toString();

    const offer1 = await Offer.create({
      listingId: seam2Listing._id,
      lotId: lot._id,
      buyerId: buyer._id,
      quantity: 40,
      price: 18.00,
      status: 'pending',
      messages: [{ sender: 'buyer', content: 'Offer 40 cases at $18.00' }]
    });
    seam2Offer1Id = offer1._id.toString();

    const offer2 = await Offer.create({
      listingId: seam2Listing._id,
      lotId: lot._id,
      buyerId: buyer._id,
      quantity: 60,
      price: 18.00,
      status: 'pending',
      messages: [{ sender: 'buyer', content: 'Offer remaining 60 cases at $18.00' }]
    });
    seam2Offer2Id = offer2._id.toString();
  });

  afterAll(async () => {
    const Supplier = mongoose.model('Supplier');
    const MarketplaceListing = mongoose.model('MarketplaceListing');
    const DistributionCenter = mongoose.model('DistributionCenter');
    const ProductMaster = mongoose.model('ProductMaster');
    const InventoryLot = mongoose.model('InventoryLot');
    const Buyer = mongoose.model('Buyer');
    const Offer = mongoose.model('Offer');
    const Award = mongoose.model('Award');

    await Supplier.deleteMany({ companyCode: 'SUP_ISSUE05' });
    await MarketplaceListing.deleteMany({ supplierId });
    await DistributionCenter.deleteMany({ supplierId });
    await ProductMaster.deleteMany({ supplierId });
    await InventoryLot.deleteMany({ supplierId });
    await Buyer.deleteMany({ email: 'buyer.seam2@test.com' });
    await Offer.deleteMany({ lotId: seam2LotId });
    await Award.deleteMany({ lotId: seam2LotId });
    await mongoose.disconnect();
  });

  describe('Seam 1: Public Marketplace Catalog Query (GET /api/v1/marketplace/listings)', () => {
    it('automatically excludes listings with expired shelf life (expiresAt <= now) from public marketplace catalog', async () => {
      const res = await request(app).get('/api/v1/marketplace/listings');

      expect(res.status).toBe(200);
      const listings = res.body.listings || [];
      const listingIds = listings.map((l: any) => l._id.toString());

      // Active unexpired listing must be present
      expect(listingIds).toContain(activeListingId);

      // Expired listing must be filtered out
      expect(listingIds).not.toContain(expiredListingId);
    });
  });

  describe('Seam 2: Bid Acceptance & Volume Projection (POST /api/bids/:id/accept)', () => {
    it('Slice 2A: partial bid acceptance decrements MarketplaceListing.availableQuantity to match remaining lot volume', async () => {
      const res = await request(app)
        .post(`/api/bids/${seam2Offer1Id}/accept`)
        .send({ awardedQuantity: 40 });

      expect(res.status).toBe(200);

      // Verify lot availableQty decremented from 100 to 60
      const InventoryLot = mongoose.model('InventoryLot');
      const lot = await InventoryLot.findById(seam2LotId);
      expect(lot?.availableQty).toBe(60);
      expect(lot?.status).toBe('active');

      // Verify MarketplaceListing availableQuantity decremented from 100 to 60
      const MarketplaceListing = mongoose.model('MarketplaceListing');
      const listing = await MarketplaceListing.findById(seam2ListingId);
      expect(listing?.availableQuantity).toBe(60);
      expect(listing?.status).toBe('published');
    });

    it('Slice 2B: accepting remaining inventory sets listing availableQuantity to 0, sets status to closed, and unlists from catalog', async () => {
      const res = await request(app)
        .post(`/api/bids/${seam2Offer2Id}/accept`)
        .send({ awardedQuantity: 60 });

      expect(res.status).toBe(200);

      // Verify lot availableQty decremented to 0 and status is sold
      const InventoryLot = mongoose.model('InventoryLot');
      const lot = await InventoryLot.findById(seam2LotId);
      expect(lot?.availableQty).toBe(0);
      expect(lot?.status).toBe('sold');

      // Verify MarketplaceListing availableQuantity decremented to 0 and status is closed
      const MarketplaceListing = mongoose.model('MarketplaceListing');
      const listing = await MarketplaceListing.findById(seam2ListingId);
      expect(listing?.availableQuantity).toBe(0);
      expect(['closed', 'unlisted']).toContain(listing?.status);

      // Verify listing is excluded from public marketplace catalog
      const marketRes = await request(app).get('/api/v1/marketplace/listings');
      expect(marketRes.status).toBe(200);
      const listingIds = (marketRes.body.listings || []).map((l: any) => l._id.toString());
      expect(listingIds).not.toContain(seam2ListingId);
    });
  });

  describe('Seam 3: Award Revocation & Volume Restoration (POST /api/bids/:id/decline)', () => {
    it('declining an accepted offer restores MarketplaceListing.availableQuantity and reverts status to published', async () => {
      const res = await request(app)
        .post(`/api/bids/${seam2Offer2Id}/decline`)
        .send({
          reason: 'Inventory committed',
          rationale: 'Revoking accepted award to re-open volume'
        });

      expect(res.status).toBe(200);

      // Verify lot volume restored to 60 and status active
      const InventoryLot = mongoose.model('InventoryLot');
      const lot = await InventoryLot.findById(seam2LotId);
      expect(lot?.availableQty).toBe(60);
      expect(lot?.status).toBe('active');

      // Verify MarketplaceListing volume restored to 60 and status published
      const MarketplaceListing = mongoose.model('MarketplaceListing');
      const listing = await MarketplaceListing.findById(seam2ListingId);
      expect(listing?.availableQuantity).toBe(60);
      expect(listing?.status).toBe('published');

      // Verify listing is restored in public marketplace catalog
      const marketRes = await request(app).get('/api/v1/marketplace/listings');
      expect(marketRes.status).toBe(200);
      const listingIds = (marketRes.body.listings || []).map((l: any) => l._id.toString());
      expect(listingIds).toContain(seam2ListingId);
    });
  });

  describe('Seam 4: Direct Purchase Volume Recalculation & Unlisting (POST /api/marketplace/listing/:id/bids)', () => {
    let seam4LotId: string;
    let seam4ListingId: string;

    beforeAll(async () => {
      const DistributionCenter = mongoose.model('DistributionCenter');
      const ProductMaster = mongoose.model('ProductMaster');
      const InventoryLot = mongoose.model('InventoryLot');
      const MarketplaceListing = mongoose.model('MarketplaceListing');

      const dc = await DistributionCenter.create({
        supplierId,
        name: 'Seam 4 DC',
        code: 'DC_SEAM4',
        address: '456 Logistics Way, Chicago, IL',
        coordinates: { lat: 41.8781, lng: -87.6298 },
        coldStorage: false
      });

      const prod = await ProductMaster.create({
        supplierId,
        sku: 'SKU_SEAM4_01',
        category: 'Pantry',
        description: 'Direct Purchase Organic Oats'
      });

      const lot = await InventoryLot.create({
        supplierId,
        distributionCenterId: dc._id,
        productId: prod._id,
        lotNumber: 'LOT_SEAM4_01',
        quantityCases: 50,
        availableQty: 50,
        costPerCase: 5.00,
        standardSellPrice: 10.00,
        status: 'active',
        expirationDate: new Date(Date.now() + 20 * 24 * 3600 * 1000)
      });
      seam4LotId = lot._id.toString();

      const listing = await MarketplaceListing.create({
        sellerId: supplierId,
        supplierId,
        lotId: lot._id,
        publicTitle: 'Direct Purchase Organic Oats - 50 Cases',
        category: 'Pantry',
        availableQuantity: 50,
        publicPrice: 10.00,
        status: 'published',
        expiresAt: new Date(Date.now() + 20 * 24 * 3600 * 1000)
      });
      seam4ListingId = listing._id.toString();
    });

    it('direct purchase depleting volume sets MarketplaceListing availableQuantity to 0, sets status to closed, and unlists from public catalog', async () => {
      const res = await request(app)
        .post(`/api/marketplace/listing/${seam4ListingId}/bids`)
        .send({
          buyerId: seam2BuyerId,
          quantity: 50,
          price: 10.00,
          directPurchase: true
        });

      expect(res.status).toBe(201);

      // Verify lot availableQty is 0 and status is sold
      const InventoryLot = mongoose.model('InventoryLot');
      const lot = await InventoryLot.findById(seam4LotId);
      expect(lot?.availableQty).toBe(0);
      expect(lot?.status).toBe('sold');

      // Verify MarketplaceListing availableQuantity is 0 and status is closed
      const MarketplaceListing = mongoose.model('MarketplaceListing');
      const listing = await MarketplaceListing.findById(seam4ListingId);
      expect(listing?.availableQuantity).toBe(0);
      expect(['closed', 'unlisted']).toContain(listing?.status);

      // Verify unlisting from public marketplace catalog
      const marketRes = await request(app).get('/api/v1/marketplace/listings');
      expect(marketRes.status).toBe(200);
      const listingIds = (marketRes.body.listings || []).map((l: any) => l._id.toString());
      expect(listingIds).not.toContain(seam4ListingId);
    });
  });
});
