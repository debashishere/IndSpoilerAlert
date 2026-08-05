import request from 'supertest';
import mongoose from 'mongoose';
import app from '../index';
import { uploadToS3, sendSQSMessage } from '../utils/aws';
import { getRedisClient } from '../utils/redis';

// Mock S3, SQS, and Redis
jest.mock('../utils/aws', () => ({
  uploadToS3: jest.fn().mockResolvedValue(undefined),
  sendSQSMessage: jest.fn().mockResolvedValue(undefined),
  s3: { send: jest.fn() },
  sqs: { send: jest.fn() }
}));

jest.mock('../utils/redis', () => {
  const mockRedis = {
    isOpen: true,
    get: jest.fn(),
    set: jest.fn(),
    connect: jest.fn().mockResolvedValue(undefined),
    quit: jest.fn().mockResolvedValue(undefined)
  };
  return {
    redisClient: mockRedis,
    getRedisClient: jest.fn().mockResolvedValue(mockRedis),
    closeRedisConnection: jest.fn().mockResolvedValue(undefined)
  };
});

describe('V2 Platform Features Integration Tests', () => {
  let supplierId = '';
  let buyerId = '';
  let lotId = '';
  let listingId = '';
  let bidId = '';

  beforeAll(async () => {
    const Supplier = mongoose.model('Supplier');
    const Buyer = mongoose.model('Buyer');
    const DistributionCenter = mongoose.model('DistributionCenter');
    const ProductMaster = mongoose.model('ProductMaster');
    const InventoryLot = mongoose.model('InventoryLot');
    const MarketplaceListing = mongoose.model('MarketplaceListing');
    const Opportunity = mongoose.model('Opportunity');

    // Create supplier
    const supp = await Supplier.create({
      name: 'V2 Test Supplier',
      companyCode: 'V2SUP',
      preferredDisposition: 'sell'
    });
    // Clean up existing test buyer if any
    await Buyer.deleteMany({ email: 'v2buyer@retail.com' });

    // Create buyer with milk allergy exclusion
    const buy = await Buyer.create({
      companyName: 'V2 Test Buyer',
      email: 'v2buyer@retail.com',
      acceptsShortDated: true,
      minShelfLife: 5,
      categories: ['Dairy', 'Produce'],
      transportRadius: 100,
      warehouseLocations: [{ lat: 41.8781, lng: -87.6298 }],
      excludedAllergens: ['milk']
    });
    buyerId = buy._id.toString();

    // Create DC
    const dc = await DistributionCenter.create({
      supplierId: supp._id,
      name: 'V2 DC',
      code: 'V2SUP-DC',
      address: '123 Logistics Ave, Chicago, IL',
      coordinates: { lat: 41.8781, lng: -87.6298 },
      coldStorage: true
    });

    // Create milk-containing product
    const product = await ProductMaster.create({
      supplierId: supp._id,
      sku: 'MILK-V2',
      category: 'Dairy',
      description: 'V2 Whole Milk',
      shelfLifeDays: 14,
      allergens: ['milk']
    });

    // Create pending lot
    const lot = await InventoryLot.create({
      supplierId: supp._id,
      distributionCenterId: dc._id,
      productId: product._id,
      lotNumber: 'LOT-MILK-V2',
      expirationDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      remainingShelfLife: 0.7,
      quantityCases: 100,
      availableQty: 100,
      costPerCase: 3.50,
      standardSellPrice: 5.00,
      status: 'pending',
      fdaRegulated: true
    });
    lotId = lot._id.toString();

    // Create Opportunity and Listing
    const opp = await Opportunity.create({
      lotId: lot._id,
      opportunityType: 'sell',
      priority: 'medium',
      recommendedAction: 'Sell it',
      status: 'draft'
    });

    const listing = await MarketplaceListing.create({
      opportunityId: opp._id,
      sellerId: supp._id,
      allowBidding: true,
      startingPrice: 3.50,
      minimumPrice: 2.00,
      status: 'active',
      expiresAt: lot.expirationDate
    });
    listingId = listing._id.toString();
  });

  afterAll(async () => {
    const Supplier = mongoose.model('Supplier');
    const Buyer = mongoose.model('Buyer');
    const DistributionCenter = mongoose.model('DistributionCenter');
    const ProductMaster = mongoose.model('ProductMaster');
    const InventoryLot = mongoose.model('InventoryLot');
    const MarketplaceListing = mongoose.model('MarketplaceListing');
    const Opportunity = mongoose.model('Opportunity');
    const DocumentImport = mongoose.model('DocumentImport');
    const ComplianceDocument = mongoose.model('ComplianceDocument');
    const Offer = mongoose.model('Offer');
    const Award = mongoose.model('Award');
    const Shipment = mongoose.model('Shipment');

    await Supplier.deleteMany({ name: 'V2 Test Supplier' });
    await Buyer.deleteMany({ companyName: 'V2 Test Buyer' });
    await DistributionCenter.deleteMany({ code: 'V2SUP-DC' });
    await ProductMaster.deleteMany({ sku: 'MILK-V2' });
    await InventoryLot.deleteMany({ lotNumber: 'LOT-MILK-V2' });
    await MarketplaceListing.deleteMany({ _id: listingId });
    await Opportunity.deleteMany({ lotId });
    await DocumentImport.deleteMany({});
    await ComplianceDocument.deleteMany({});
    await Offer.deleteMany({});
    await Award.deleteMany({});
    await Shipment.deleteMany({});

    await mongoose.disconnect();
  });

  describe('Asynchronous Ingestion API', () => {
    let ingestionJobId: string;

    it('should upload ingest file asynchronously, return HTTP 202, and queue job', async () => {
      // Mock SQS publishing
      (sendSQSMessage as jest.Mock).mockResolvedValueOnce(undefined);

      const res = await request(app)
        .post('/api/ingest/upload')
        .attach('file', Buffer.from('sku,description,quantity\nSKU1,Test Item,10'), 'test.csv')
        .field('supplierId', supplierId);

      expect(res.status).toBe(202);
      expect(res.body.ingestionJobId).toBeDefined();
      ingestionJobId = res.body.ingestionJobId;

      const DocumentImport = mongoose.model('DocumentImport');
      const doc = await DocumentImport.findById(ingestionJobId);
      expect(doc).toBeTruthy();
      expect(doc?.status).toBe('queued');
      expect(doc?.s3Bucket).toBe('ind-spoiler-alert-surplus');
    });

    it('should query job status endpoint', async () => {
      const res = await request(app)
        .get(`/api/ingest/jobs/${ingestionJobId}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('queued');
    });

    it('should process webhook callback and update status to parsed', async () => {
      const res = await request(app)
        .post('/api/ingest/callback')
        .send({
          ingestionJobId,
          status: 'parsed',
          rawGrid: [
            ['sku', 'description', 'quantity'],
            ['SKU1', 'Test Item', '10']
          ]
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const DocumentImport = mongoose.model('DocumentImport');
      const doc = await DocumentImport.findById(ingestionJobId);
      expect(doc?.status).toBe('parsed');
      expect(doc?.rawGrid).toHaveLength(2);
      expect(doc?.suggestedMapping).toBeDefined();
    });
  });

  describe('FDA Compliance and Activation Block', () => {
    it('should update FDA regulation flag and temperature thresholds', async () => {
      // 1. Initially fdaRegulated is true. Let's update it to false and set temp thresholds.
      let updateRes = await request(app)
        .put(`/api/inventory/lot/${lotId}`)
        .send({
          fdaRegulated: false,
          temperatureMin: 32,
          temperatureMax: 40
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.fdaRegulated).toBe(false);
      expect(updateRes.body.temperatureMin).toBe(32);
      expect(updateRes.body.temperatureMax).toBe(40);

      // 2. Set it back to true for the subsequent tests
      updateRes = await request(app)
        .put(`/api/inventory/lot/${lotId}`)
        .send({
          fdaRegulated: true
        });
      expect(updateRes.status).toBe(200);
      expect(updateRes.body.fdaRegulated).toBe(true);
    });

    it('should block activation of FDA-regulated lot if compliance docs are missing', async () => {
      const res = await request(app)
        .post(`/api/inventory/${lotId}/bids/enable`);

      expect(res.status).toBe(500);
      expect(res.body.error).toContain('FDA regulated lots require both a Certificate of Analysis (COA) and a Batch Record before activation.');
    });

    it('should allow upload of compliance documents and then activate the lot', async () => {
      // 1. Upload COA
      const coaRes = await request(app)
        .post(`/api/inventory/lot/${lotId}/compliance`)
        .attach('file', Buffer.from('COA content'), 'coa.pdf')
        .field('docType', 'COA');

      expect(coaRes.status).toBe(201);
      expect(coaRes.body.docType).toBe('COA');

      // 2. Upload BATCH_RECORD
      const brRes = await request(app)
        .post(`/api/inventory/lot/${lotId}/compliance`)
        .attach('file', Buffer.from('Batch Record content'), 'batch.pdf')
        .field('docType', 'BATCH_RECORD');

      expect(brRes.status).toBe(201);
      expect(brRes.body.docType).toBe('BATCH_RECORD');

      // 3. Try to enable bidding/activate again
      const actRes = await request(app)
        .post(`/api/inventory/${lotId}/bids/enable`);

      expect(actRes.status).toBe(200);
      expect(actRes.body.listing.status).toBe('active');

      const InventoryLot = mongoose.model('InventoryLot');
      const lot = await InventoryLot.findById(lotId);
      expect(lot?.status).toBe('active');
    });
  });

  describe('Allergen Matching Filter', () => {
    it('should exclude buyer with milk allergen exclusion from recommended matches', async () => {
      const res = await request(app)
        .get(`/api/marketplace/listing/${listingId}/matches`);

      expect(res.status).toBe(200);
      const matchedBuyerIds = res.body.matches.map((m: any) => m.buyer_id);
      expect(matchedBuyerIds).not.toContain(buyerId);
    });
  });

  describe('B2B Negotiation and Bidding', () => {
    it('should create a bid and support counter-proposals with status transitioned to countered', async () => {
      const Offer = mongoose.model('Offer');

      // 1. Place a bid
      const bidRes = await request(app)
        .post(`/api/marketplace/listing/${listingId}/bids`)
        .send({
          buyerId,
          quantity: 20,
          price: 3.80
        });

      expect(bidRes.status).toBe(201);
      expect(bidRes.body.status).toBe('pending');
      bidId = bidRes.body._id;

      // 2. Supplier counter-offers
      const counterRes = await request(app)
        .post(`/api/offers/${bidId}/message`)
        .send({
          sender: 'supplier',
          content: 'How about $4.20/cs for 20 cases?',
          proposedPrice: 4.20,
          proposedQuantity: 20
        });

      expect(counterRes.status).toBe(200);
      expect(counterRes.body.status).toBe('countered');
      
      const lastMsg = counterRes.body.messages[counterRes.body.messages.length - 1];
      expect(lastMsg.sender).toBe('buyer');
      expect(lastMsg.proposedPrice).toBeDefined();
    });

    it('should support partial awards, update lot quantity, and enforce One-Shot Decision block', async () => {
      const Offer = mongoose.model('Offer');
      const Award = mongoose.model('Award');
      const InventoryLot = mongoose.model('InventoryLot');

      // Award 15 cases (out of the 20 bid cases)
      const awardRes = await request(app)
        .post(`/api/inventory/${lotId}/bids/${bidId}/award`)
        .send({
          awardedQty: 15,
          emailSent: 'You got 15 cases!',
          emailSubject: 'Partial Award'
        });

      expect(awardRes.status).toBe(200);
      expect(awardRes.body.offer.status).toBe('partially_accepted');
      expect(awardRes.body.offer.awardedQty).toBe(15);
      expect(awardRes.body.award.poPdfUrl).toBeDefined();

      // Check remaining lot availableQty
      const lot = await InventoryLot.findById(lotId);
      expect(lot?.availableQty).toBe(85);

      // Verify One-Shot Decision: try to award the same bid again
      const failRes = await request(app)
        .post(`/api/inventory/${lotId}/bids/${bidId}/award`)
        .send({
          awardedQty: 5
        });

      expect(failRes.status).toBe(500);
      expect(failRes.body.error).toContain('This bid has already been decided and cannot be awarded again.');
    });
  });

  describe('Logistics and Freight Integration', () => {
    let shipmentId: string;

    it('should transition shipment status sequentially', async () => {
      const Shipment = mongoose.model('Shipment');
      let ship = await Shipment.findOne({ status: 'scheduled' });
      if (!ship) {
        ship = await Shipment.create({
          supplierId: new mongoose.Types.ObjectId(),
          buyerId: new mongoose.Types.ObjectId(),
          lotId: new mongoose.Types.ObjectId(),
          status: 'scheduled',
          bolPdfUrl: '/downloads/bol/test.pdf',
          temperatureLogs: []
        });
      }
      expect(ship).toBeTruthy();
      shipmentId = ship!._id.toString();
      expect(ship!.status).toBe('scheduled');
      expect(ship!.bolPdfUrl).toBeDefined();

      // 1. Try to jump to in_transit directly: should fail
      const badRes = await request(app)
        .post(`/api/shipments/${shipmentId}/status`)
        .send({ status: 'in_transit' });

      expect(badRes.status).toBe(500);
      expect(badRes.body.error).toContain('Invalid status transition');

      // 2. Confirm dock appointment: should succeed and transition to confirmed
      const confirmRes = await request(app)
        .post(`/api/shipments/${shipmentId}/confirm-appointment`)
        .send({
          pickupWindowStart: new Date(),
          pickupWindowEnd: new Date(Date.now() + 3600000),
          carrierName: 'Fast Freight',
          carrierDotNumber: 'DOT-999888'
        });

      expect(confirmRes.status).toBe(200);
      expect(confirmRes.body.status).toBe('confirmed');

      // 3. Now transition to in_transit: should succeed
      const goodRes = await request(app)
        .post(`/api/shipments/${shipmentId}/status`)
        .send({ status: 'in_transit' });

      expect(goodRes.status).toBe(200);
      expect(goodRes.body.status).toBe('in_transit');
    });

    it('should add temperature logs to shipment', async () => {
      const tempRes = await request(app)
        .post(`/api/shipments/${shipmentId}/temperature`)
        .send({ temperature: 38.5 });

      expect(tempRes.status).toBe(200);
      expect(tempRes.body.temperatureLogs.length).toBeGreaterThan(0);
      const lastLog = tempRes.body.temperatureLogs[tempRes.body.temperatureLogs.length - 1];
      expect(lastLog.temperature).toBe(38.5);
    });
  });

  describe('Real-time Analytics cached in Redis', () => {
    it('should cache analytics summary in Redis and return cached results on subsequent requests', async () => {
      const mockRedis = await getRedisClient() as any;

      // Mock Redis hit scenario
      (mockRedis.get as jest.Mock).mockResolvedValueOnce(JSON.stringify({
        summary: { cogsRecoveryRate: 42.5 },
        trends: [],
        categoryBreakdown: []
      }));

      const res = await request(app)
        .get('/api/analytics/summary');

      expect(res.status).toBe(200);
      expect(res.body.summary.cogsRecoveryRate).toBe(42.5);
      expect(mockRedis.get).toHaveBeenCalledWith('analytics:summary');
    });

    it('should fall back gracefully to MongoDB when Redis throws an error', async () => {
      const mockRedis = await getRedisClient() as any;
      (mockRedis.get as jest.Mock).mockRejectedValueOnce(new Error('Redis connection down'));

      const res = await request(app)
        .get('/api/analytics/summary');

      expect(res.status).toBe(200);
      expect(res.body.summary).toBeDefined();
      expect(res.body.summary.cogsRecoveryRate).toBeDefined();
    });
  });
});
