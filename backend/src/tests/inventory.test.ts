import request from 'supertest';
import mongoose from 'mongoose';
import app from '../index';

describe('Inventory, Bidding, and Diversion API Endpoints', () => {
  let supplierId: string;
  let buyerId: string;
  let distributionCenterId: string;
  let productId: string;

  let lot1Id: string;
  let lot2Id: string;
  let lot3Id: string;
  let lot4Id: string;

  let opportunityId: string;
  let listingId: string;

  beforeAll(async () => {
    const Supplier = mongoose.model('Supplier');
    const Buyer = mongoose.model('Buyer');
    const DistributionCenter = mongoose.model('DistributionCenter');
    const ProductMaster = mongoose.model('ProductMaster');
    const InventoryLot = mongoose.model('InventoryLot');

    // Seed Supplier
    const supp = await Supplier.create({
      name: 'Test Supplier Inventory',
      companyCode: 'TSUPINV',
      preferredDisposition: 'sell'
    });
    supplierId = supp._id.toString();

    // Seed Buyer
    const buyer = await Buyer.create({
      companyName: 'Test Buyer Inventory',
      email: 'testbuyer_inv@indspoileralert.com',
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
      name: 'Test DC Inventory',
      code: 'TSUPINV-DC',
      address: '100 Logistics Way, Chicago, IL',
      coordinates: { lat: 41.8781, lng: -87.6298 },
      coldStorage: true
    });
    distributionCenterId = dc._id.toString();

    // Seed Product
    const prod = await ProductMaster.create({
      supplierId: supp._id,
      sku: 'SKU-INV-001',
      category: 'Dry Goods',
      description: 'Test Product Inventory',
      shelfLifeDays: 30
    });
    productId = prod._id.toString();

    // Seed 4 Lots
    const today = new Date();
    const expDate = new Date(today.getTime() + 15 * 24 * 3600 * 1000); // 15 days from now

    const lot1 = await InventoryLot.create({
      supplierId: supp._id,
      distributionCenterId: dc._id,
      productId: prod._id,
      lotNumber: 'LOT-INV-001',
      expirationDate: expDate,
      remainingShelfLife: 0.5,
      quantityCases: 100,
      availableQty: 100,
      costPerCase: 2.50,
      standardSellPrice: 3.00,
      status: 'pending'
    });
    lot1Id = lot1._id.toString();

    const lot2 = await InventoryLot.create({
      supplierId: supp._id,
      distributionCenterId: dc._id,
      productId: prod._id,
      lotNumber: 'LOT-INV-002',
      expirationDate: expDate,
      remainingShelfLife: 0.5,
      quantityCases: 100,
      availableQty: 100,
      costPerCase: 3.50,
      standardSellPrice: 4.00,
      status: 'pending'
    });
    lot2Id = lot2._id.toString();

    const lot3 = await InventoryLot.create({
      supplierId: supp._id,
      distributionCenterId: dc._id,
      productId: prod._id,
      lotNumber: 'LOT-INV-003',
      expirationDate: expDate,
      remainingShelfLife: 0.5,
      quantityCases: 50,
      availableQty: 50,
      costPerCase: 4.50,
      standardSellPrice: 5.00,
      status: 'pending'
    });
    lot3Id = lot3._id.toString();

    const lot4 = await InventoryLot.create({
      supplierId: supp._id,
      distributionCenterId: dc._id,
      productId: prod._id,
      lotNumber: 'LOT-INV-004',
      expirationDate: expDate,
      remainingShelfLife: 0.5,
      quantityCases: 80,
      availableQty: 80,
      costPerCase: 5.50,
      standardSellPrice: 6.00,
      status: 'pending'
    });
    lot4Id = lot4._id.toString();

    // Perform risk assessment on lot2Id to generate Opportunity and Listing for bidding tests
    await request(app).post(`/api/inventory/lot/${lot2Id}/assess-risk`).send();
  });

  afterAll(async () => {
    const Supplier = mongoose.model('Supplier');
    const Buyer = mongoose.model('Buyer');
    const DistributionCenter = mongoose.model('DistributionCenter');
    const ProductMaster = mongoose.model('ProductMaster');
    const InventoryLot = mongoose.model('InventoryLot');
    const InventoryRisk = mongoose.model('InventoryRisk');
    const Opportunity = mongoose.model('Opportunity');
    const PricingRecommendation = mongoose.model('PricingRecommendation');
    const MarketplaceListing = mongoose.model('MarketplaceListing');
    const Offer = mongoose.model('Offer');
    const Award = mongoose.model('Award');
    const Shipment = mongoose.model('Shipment');
    const Donation = mongoose.model('Donation');
    const Disposal = mongoose.model('Disposal');
    const Activity = mongoose.model('Activity');

    await Supplier.deleteMany({ name: 'Test Supplier Inventory' });
    await Buyer.deleteMany({ companyName: 'Test Buyer Inventory' });
    await DistributionCenter.deleteMany({ supplierId });
    await ProductMaster.deleteMany({ supplierId });
    await InventoryLot.deleteMany({ supplierId });
    await InventoryRisk.deleteMany({ lotId: { $in: [lot1Id, lot2Id, lot3Id, lot4Id] } });
    
    // Opportunities and listings
    const opps = await Opportunity.find({ lotId: { $in: [lot1Id, lot2Id, lot3Id, lot4Id] } });
    const oppIds = opps.map(o => o._id);
    await Opportunity.deleteMany({ _id: { $in: oppIds } });
    await MarketplaceListing.deleteMany({ opportunityId: { $in: oppIds } });
    await PricingRecommendation.deleteMany({ lotId: { $in: [lot1Id, lot2Id, lot3Id, lot4Id] } });

    await Offer.deleteMany({});
    await Award.deleteMany({});
    await Shipment.deleteMany({});
    await Donation.deleteMany({ lotId: { $in: [lot1Id, lot2Id, lot3Id, lot4Id] } });
    await Disposal.deleteMany({ lotId: { $in: [lot1Id, lot2Id, lot3Id, lot4Id] } });
    await Activity.deleteMany({ lotId: { $in: [lot1Id, lot2Id, lot3Id, lot4Id] } });

    await mongoose.disconnect();
  });

  it('should return inventory list including populated details', async () => {
    const res = await request(app).get('/api/inventory');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const lot = res.body.find((item: any) => item._id === lot1Id);
    expect(lot).toBeTruthy();
    expect(lot.supplierId.name).toBe('Test Supplier Inventory');
    expect(lot.productId.sku).toBe('SKU-INV-001');
  });

  it('should assess risk and transition status to active', async () => {
    const res = await request(app)
      .post(`/api/inventory/lot/${lot1Id}/assess-risk`)
      .send();

    expect(res.status).toBe(200);
    expect(res.body.risk).toBeTruthy();
    expect(res.body.risk.lotId).toBe(lot1Id);
    expect(res.body.opportunity).toBeTruthy();
    expect(res.body.listing).toBeTruthy();
    expect(res.body.lotStatus).toBe('active');

    opportunityId = res.body.opportunity._id;
    listingId = res.body.listing._id;
  });

  it('should enable bidding on inventory item', async () => {
    const res = await request(app)
      .post(`/api/inventory/${lot2Id}/bids/enable`)
      .send();

    expect(res.status).toBe(200);
    expect(res.body.listing).toBeTruthy();
    expect(res.body.listing.allowBidding).toBe(true);
  });

  it('should retrieve bids list for inventory item', async () => {
    const OfferModel = mongoose.model('Offer');
    // Ensure listing exists first
    const listingRes = await request(app).post(`/api/inventory/lot/${lot2Id}/assess-risk`).send();
    const lId = listingRes.body.listing._id;

    await OfferModel.create({
      listingId: lId,
      buyerId,
      quantity: 100,
      price: 2.50,
      status: 'pending'
    });

    const res = await request(app).get(`/api/inventory/${lot2Id}/bids`);
    expect(res.status).toBe(200);
    expect(res.body.bids.length).toBeGreaterThanOrEqual(1);
    const testBid = res.body.bids.find((b: any) => b.price === 2.50 && b.quantity === 100);
    expect(testBid).toBeTruthy();
    expect(testBid.buyerId.companyName).toBe('Test Buyer Inventory');
  });

  it('should award bidding listing to a specific bid', async () => {
    const bidsRes = await request(app).get(`/api/inventory/${lot2Id}/bids`);
    const testBid = bidsRes.body.bids.find((b: any) => b.price === 2.50 && b.quantity === 100);
    const bidId = testBid._id;

    const res = await request(app)
      .post(`/api/inventory/${lot2Id}/bids/${bidId}/award`)
      .send();

    expect(res.status).toBe(200);
    expect(res.body.offer.status).toBe('fully_accepted');
    expect(res.body.award).toBeTruthy();
    expect(res.body.shipment).toBeTruthy();
    expect(res.body.lotStatus).toBe('sold');
  });

  it('should divert inventory item to donation', async () => {
    const res = await request(app)
      .post(`/api/inventory/${lot3Id}/donate`)
      .send();

    expect(res.status).toBe(200);
    expect(res.body.lotStatus).toBe('donated');
    expect(res.body.donation).toBeTruthy();
    expect(res.body.logs).toHaveLength(4);
  });

  it('should divert inventory item to recycling', async () => {
    const res = await request(app)
      .post(`/api/inventory/${lot4Id}/recycle`)
      .send();

    expect(res.status).toBe(200);
    expect(res.body.lotStatus).toBe('recycled');
    expect(res.body.disposal).toBeTruthy();
    expect(res.body.logs).toHaveLength(4);
  });

  it('should manage custom activity creation and list them', async () => {
    // Create activity
    const createRes = await request(app)
      .post(`/api/inventory/${lot1Id}/activities`)
      .send({
        type: 'call',
        subject: 'Ops Call',
        content: 'Talked to dispatcher.',
        recipient: 'Logistics Team',
        sender: 'Supplier Admins'
      });
    expect(createRes.status).toBe(201);
    expect(createRes.body.type).toBe('call');

    // Get activities list
    const listRes = await request(app).get(`/api/inventory/${lot1Id}/activities`);
    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body)).toBe(true);
    expect(listRes.body.length).toBeGreaterThanOrEqual(1);
    expect(listRes.body[0].subject).toBe('Ops Call');
  });

  it('should dynamically discover available semantic attributes and aggregate facets without many-to-many connections via GET /api/inventory/facets', async () => {
    const InventoryLot = mongoose.model('InventoryLot');

    await InventoryLot.create({
      supplierId,
      distributionCenterId,
      productId,
      lotNumber: 'LOT-FACET-001',
      expirationDate: new Date(Date.now() + 20 * 24 * 3600 * 1000),
      quantityCases: 50,
      availableQty: 50,
      costPerCase: 10,
      standardSellPrice: 15,
      status: 'active',
      attributes: {
        tempMinF: 14,
        certifications: ['kosher', 'organic'],
        palletTiHi: '10x5'
      }
    });

    await InventoryLot.create({
      supplierId,
      distributionCenterId,
      productId,
      lotNumber: 'LOT-FACET-002',
      expirationDate: new Date(Date.now() + 20 * 24 * 3600 * 1000),
      quantityCases: 30,
      availableQty: 30,
      costPerCase: 10,
      standardSellPrice: 15,
      status: 'active',
      attributes: {
        tempMinF: -10,
        certifications: ['kosher'],
        palletTiHi: '10x5'
      }
    });

    const res = await request(app).get('/api/inventory/facets');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    const certFacet = res.body.find((f: any) => f.attribute === 'certifications');
    expect(certFacet).toBeDefined();

    const kosherValue = certFacet.values.find((v: any) => v.value === 'kosher');
    expect(kosherValue).toBeDefined();
    expect(kosherValue.count).toBeGreaterThanOrEqual(2);

    const palletFacet = res.body.find((f: any) => f.attribute === 'palletTiHi');
    expect(palletFacet).toBeDefined();
    const palletVal = palletFacet.values.find((v: any) => v.value === '10x5');
    expect(palletVal).toBeDefined();
    expect(palletVal.count).toBeGreaterThanOrEqual(2);
  });

  it('should return createdAt and updatedAt timestamps on inventory lots from GET /api/inventory', async () => {
    const res = await request(app).get('/api/inventory');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);

    const firstLot = res.body[0];
    expect(firstLot.createdAt).toBeDefined();
    expect(firstLot.updatedAt).toBeDefined();
    expect(new Date(firstLot.createdAt).toString()).not.toBe('Invalid Date');
    expect(new Date(firstLot.updatedAt).toString()).not.toBe('Invalid Date');
    expect(new Date(firstLot.updatedAt).getTime()).toBeGreaterThanOrEqual(new Date(firstLot.createdAt).getTime());
  });

  it('should update updatedAt timestamp when PUT /api/inventory/lot/:id is called', async () => {
    const resList = await request(app).get('/api/inventory');
    const targetLot = resList.body[0];
    const initialUpdatedAt = new Date(targetLot.updatedAt).getTime();

    // Small delay so timestamp advances by at least 10ms if updatedAt changes
    await new Promise(resolve => setTimeout(resolve, 20));

    const resUpdate = await request(app)
      .put(`/api/inventory/lot/${targetLot._id}`)
      .send({ fdaRegulated: !targetLot.fdaRegulated });

    expect(resUpdate.status).toBe(200);
    expect(resUpdate.body.updatedAt).toBeDefined();
    const newUpdatedAt = new Date(resUpdate.body.updatedAt).getTime();
    expect(newUpdatedAt).toBeGreaterThan(initialUpdatedAt);
  });
});


