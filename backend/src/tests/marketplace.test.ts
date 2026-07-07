import request from 'supertest';
import mongoose from 'mongoose';
import app from '../index';

describe('Marketplace API Endpoints', () => {
  let supplierId: string;
  let buyerId: string;
  let distributionCenterId: string;
  let productId: string;
  let lotId: string;
  let opportunityId: string;
  let listingId: string;

  beforeAll(async () => {
    const Supplier = mongoose.model('Supplier');
    const Buyer = mongoose.model('Buyer');
    const DistributionCenter = mongoose.model('DistributionCenter');
    const ProductMaster = mongoose.model('ProductMaster');
    const InventoryLot = mongoose.model('InventoryLot');
    const Opportunity = mongoose.model('Opportunity');
    const MarketplaceListing = mongoose.model('MarketplaceListing');

    // Seed Supplier
    await Supplier.deleteMany({ companyCode: 'TSUPMKT' });
    const supp = await Supplier.create({
      name: 'Test Supplier Marketplace',
      companyCode: 'TSUPMKT',
      preferredDisposition: 'sell'
    });
    supplierId = supp._id.toString();

    // Seed Buyer
    const buyer = await Buyer.create({
      companyName: 'Test Buyer Marketplace',
      email: 'testbuyer_mkt@spoileralert.com',
      acceptsShortDated: true,
      minShelfLife: 5,
      categories: ['Dry Goods'],
      transportRadius: 200,
      warehouseLocations: [{ lat: 41.8781, lng: -87.6298 }]
    });
    buyerId = buyer._id.toString();

    // Seed DC
    const dc = await DistributionCenter.create({
      supplierId: supp._id,
      name: 'Test DC Marketplace',
      code: 'TSUPMKT-DC',
      address: '100 Logistics Way, Chicago, IL',
      coordinates: { lat: 41.8781, lng: -87.6298 },
      coldStorage: true
    });
    distributionCenterId = dc._id.toString();

    // Seed Product
    const prod = await ProductMaster.create({
      supplierId: supp._id,
      sku: 'SKU-MKT-001',
      category: 'Dry Goods',
      description: 'Test Product Marketplace',
      shelfLifeDays: 30
    });
    productId = prod._id.toString();

    // Seed Lot
    const lot = await InventoryLot.create({
      supplierId: supp._id,
      distributionCenterId: dc._id,
      productId: prod._id,
      lotNumber: 'LOT-MKT-001',
      expirationDate: new Date(Date.now() + 15 * 24 * 3600 * 1000),
      remainingShelfLife: 0.5,
      quantityCases: 100,
      availableQty: 100,
      costPerCase: 2.50,
      standardSellPrice: 3.00,
      status: 'pending'
    });
    lotId = lot._id.toString();

    // Seed Opportunity
    const opp = await Opportunity.create({
      lotId: lot._id,
      opportunityType: 'sell',
      priority: 'medium',
      recommendedAction: 'Liquidate',
      status: 'draft'
    });
    opportunityId = opp._id.toString();

    // Seed Listing
    const listing = await MarketplaceListing.create({
      opportunityId: opp._id,
      sellerId: supp._id,
      allowBidding: true,
      startingPrice: 2.50,
      minimumPrice: 1.25,
      status: 'active',
      expiresAt: new Date(Date.now() + 15 * 24 * 3600 * 1000)
    });
    listingId = listing._id.toString();
  });

  afterAll(async () => {
    const Supplier = mongoose.model('Supplier');
    const Buyer = mongoose.model('Buyer');
    const DistributionCenter = mongoose.model('DistributionCenter');
    const ProductMaster = mongoose.model('ProductMaster');
    const InventoryLot = mongoose.model('InventoryLot');
    const Opportunity = mongoose.model('Opportunity');
    const MarketplaceListing = mongoose.model('MarketplaceListing');
    const PricingRecommendation = mongoose.model('PricingRecommendation');
    const Offer = mongoose.model('Offer');
    const Award = mongoose.model('Award');
    const Shipment = mongoose.model('Shipment');

    await Supplier.deleteMany({ name: 'Test Supplier Marketplace' });
    await Buyer.deleteMany({ companyName: { $in: ['Test Buyer Marketplace', 'New Auto registered buyer'] } });
    await DistributionCenter.deleteMany({ supplierId });
    await ProductMaster.deleteMany({ supplierId });
    await InventoryLot.deleteMany({ supplierId });
    await Opportunity.deleteMany({ _id: opportunityId });
    await MarketplaceListing.deleteMany({ opportunityId });
    await PricingRecommendation.deleteMany({ lotId });
    await Offer.deleteMany({ listingId });
    await Award.deleteMany({ listingId });
    await Shipment.deleteMany({});

    await mongoose.disconnect();
  });

  it('should return pricing recommendations from sidecar', async () => {
    const res = await request(app)
      .post(`/api/inventory/opportunity/${opportunityId}/pricing/recommend`)
      .send({
        daysRemaining: 15,
        quantity: 100
      });

    expect(res.status).toBe(200);
    expect(res.body.recommendedDiscount).toBeDefined();
    expect(res.body.recommendedPrice).toBeDefined();
    expect(res.body.expectedSellThrough).toBeDefined();
  });

  it('should get matching buyers for listing', async () => {
    const res = await request(app).get(`/api/marketplace/listing/${listingId}/matches`);
    expect(res.status).toBe(200);
    expect(res.body.matches).toBeDefined();
    expect(Array.isArray(res.body.matches)).toBe(true);
  });

  it('should execute direct purchase transaction', async () => {
    const res = await request(app)
      .post(`/api/marketplace/listing/${listingId}/bids`)
      .send({
        buyerId,
        quantity: 50,
        price: 2.20,
        directPurchase: true
      });

    expect(res.status).toBe(201);
    expect(res.body.offer).toBeTruthy();
    expect(res.body.offer.status).toBe('fully_accepted');
    expect(res.body.award).toBeTruthy();
    expect(res.body.shipment).toBeTruthy();
    expect(res.body.lotStatus).toBe('sold');
  });

  it('should auto-register a buyer when bid is submitted by unrecognized email', async () => {
    const res = await request(app)
      .post(`/api/marketplace/listing/${listingId}/bids`)
      .send({
        buyerEmail: 'autoreg@buyercompany.com',
        quantity: 10,
        price: 2.00
      });

    expect(res.status).toBe(201);
    expect(res.body._id).toBeDefined();

    // Verify buyer exists in db now
    const Buyer = mongoose.model('Buyer');
    const autoBuyer = await Buyer.findOne({ email: 'autoreg@buyercompany.com' });
    expect(autoBuyer).toBeTruthy();
    expect(autoBuyer?.companyName).toBe('Buyercompany');
  });
});
