import request from 'supertest';
import mongoose from 'mongoose';
import app from '../index';

describe('0087 — Open-Browsing Buyer Bid Submission & Verification-Linked Bidding API (/api/v1/marketplace/bids)', () => {
  let supplierId: string;
  let lotId: string;
  let opportunityId: string;
  let listingId: string;

  beforeAll(async () => {
    const Supplier = mongoose.model('Supplier');
    const DistributionCenter = mongoose.model('DistributionCenter');
    const ProductMaster = mongoose.model('ProductMaster');
    const InventoryLot = mongoose.model('InventoryLot');
    const Opportunity = mongoose.model('Opportunity');
    const MarketplaceListing = mongoose.model('MarketplaceListing');

    // Clean up
    await Supplier.deleteMany({ companyCode: 'TSUP_SLICE5' });
    const supp = await Supplier.create({
      name: 'Slice 5 Supplier',
      companyCode: 'TSUP_SLICE5',
      preferredDisposition: 'sell'
    });
    supplierId = supp._id.toString();

    const dc = await DistributionCenter.create({
      supplierId: supp._id,
      name: 'Slice 5 DC',
      code: 'TSUP-DC5',
      address: '500 Logistics Hub, Chicago, IL',
      coordinates: { lat: 41.8781, lng: -87.6298 },
      coldStorage: false
    });

    const prod = await ProductMaster.create({
      supplierId: supp._id,
      sku: 'SKU-SLICE5-001',
      category: 'Dairy',
      description: 'Slice 5 Organic Whole Milk',
      shelfLifeDays: 20
    });

    const lot = await InventoryLot.create({
      supplierId: supp._id,
      distributionCenterId: dc._id,
      productId: prod._id,
      lotNumber: 'LOT-SLICE5-001',
      expirationDate: new Date(Date.now() + 10 * 24 * 3600 * 1000),
      remainingShelfLife: 0.5,
      quantityCases: 200,
      availableQty: 200,
      costPerCase: 3.00,
      standardSellPrice: 4.50,
      status: 'pending'
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
      lotId: lot._id,
      publicTitle: 'Slice 5 Organic Whole Milk',
      category: 'Dairy',
      remainingShelfLife: 0.5,
      availableQuantity: 200,
      publicPrice: 4.50,
      allowBidding: true,
      startingPrice: 3.50,
      minimumPrice: 2.50,
      status: 'published'
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
    const Offer = mongoose.model('Offer');
    const Activity = mongoose.model('Activity');

    await Supplier.deleteMany({ companyCode: 'TSUP_SLICE5' });
    await Buyer.deleteMany({ email: { $in: ['verified.buyer@acmeretail.com', 'newbuyer@freshmarket.com'] } });
    await DistributionCenter.deleteMany({ supplierId });
    await ProductMaster.deleteMany({ supplierId });
    await InventoryLot.deleteMany({ supplierId });
    await Opportunity.deleteMany({ _id: opportunityId });
    await MarketplaceListing.deleteMany({ _id: listingId });
    await Offer.deleteMany({ listingId });
    await Activity.deleteMany({ lotId });

    await mongoose.disconnect();
  });

  it('POST /api/v1/marketplace/bids - submits bid for existing verified buyer and logs activity in Lot Operations Hub', async () => {
    const Buyer = mongoose.model('Buyer');
    const verifiedBuyer = await Buyer.create({
      companyName: 'Acme Retail Chain',
      email: 'verified.buyer@acmeretail.com',
      isVerified: true,
      acceptsShortDated: true,
      categories: ['Dairy']
    });

    const res = await request(app)
      .post('/api/v1/marketplace/bids')
      .send({
        listingId,
        buyerEmail: 'verified.buyer@acmeretail.com',
        quantity: 50,
        price: 4.00
      });

    expect(res.status).toBe(201);
    expect(res.body._id).toBeDefined();
    expect(res.body.quantity).toBe(50);
    expect(res.body.price).toBe(4.00);

    // Verify Lot Operations Hub activity log created
    const Activity = mongoose.model('Activity');
    const activity = await Activity.findOne({ lotId, type: 'bid_submission' });
    expect(activity).toBeTruthy();
    expect(activity?.subject).toMatch(/Acme Retail Chain/i);
  });

  it('POST /api/v1/marketplace/bids - auto-registers new buyer profile via ADR 0006 and submits bid', async () => {
    const res = await request(app)
      .post('/api/v1/marketplace/bids')
      .send({
        listingId,
        buyerEmail: 'newbuyer@freshmarket.com',
        quantity: 30,
        price: 3.80
      });

    expect(res.status).toBe(201);
    expect(res.body._id).toBeDefined();

    // Verify auto-registered buyer profile
    const Buyer = mongoose.model('Buyer');
    const newBuyer = await Buyer.findOne({ email: 'newbuyer@freshmarket.com' });
    expect(newBuyer).toBeTruthy();
    expect(newBuyer?.companyName).toBe('Freshmarket');

    // Verify Lot Operations Hub activity log
    const Activity = mongoose.model('Activity');
    const activity = await Activity.findOne({ lotId, sender: 'newbuyer@freshmarket.com' });
    expect(activity).toBeTruthy();
  });
});
