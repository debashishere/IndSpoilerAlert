import request from 'supertest';
import mongoose from 'mongoose';
import app from '../index';

describe('Bid Decline and Lifecycle Reset Endpoints (Issue #02)', () => {
  jest.setTimeout(25000);

  let supplierId: string;
  let buyerId: string;
  let dcId: string;
  let productId: string;
  let lotId: string;
  let offerId: string;

  beforeAll(async () => {
    const Supplier = mongoose.model('Supplier');
    const Buyer = mongoose.model('Buyer');
    const DistributionCenter = mongoose.model('DistributionCenter');
    const ProductMaster = mongoose.model('ProductMaster');
    const InventoryLot = mongoose.model('InventoryLot');
    const Offer = mongoose.model('Offer');

    const supp = await Supplier.create({
      name: 'Decline Flow Test Supplier',
      companyCode: 'DFTSUP',
      preferredDisposition: 'sell'
    });
    supplierId = supp._id.toString();

    const buyer = await Buyer.create({
      companyName: 'Decline Flow Test Buyer Co',
      email: 'declinebuyer@test-sample.org',
      acceptsShortDated: true,
      minShelfLife: 3,
      categories: ['Bakery'],
      transportRadius: 100,
      warehouseLocations: [{ lat: 41.8781, lng: -87.6298 }]
    });
    buyerId = buyer._id.toString();

    const dc = await DistributionCenter.create({
      supplierId: supp._id,
      name: 'Decline Flow DC',
      code: 'DFT-DC',
      address: '100 Warehouse Way, Boston, MA',
      coordinates: { lat: 42.3601, lng: -71.0589 },
      coldStorage: false
    });
    dcId = dc._id.toString();

    const prod = await ProductMaster.create({
      supplierId: supp._id,
      sku: 'SKU-DEC-001',
      category: 'Bakery',
      description: 'Artisan Sourdough Loaves',
      shelfLifeDays: 14
    });
    productId = prod._id.toString();

    const lot = await InventoryLot.create({
      supplierId: supp._id,
      distributionCenterId: dc._id,
      productId: prod._id,
      lotNumber: 'LOT-DEC-01',
      expirationDate: new Date(Date.now() + 15 * 24 * 3600 * 1000),
      remainingShelfLife: 0.6,
      quantityCases: 100,
      availableQty: 100,
      costPerCase: 4.00,
      standardSellPrice: 8.00,
      status: 'active'
    });
    lotId = lot._id.toString();

    const offer = await Offer.create({
      lotId: lot._id,
      buyerId: buyer._id,
      quantity: 50,
      price: 5.00,
      status: 'pending',
      submittedAt: new Date()
    });
    offerId = offer._id.toString();
  });

  afterAll(async () => {
    const Supplier = mongoose.model('Supplier');
    const Buyer = mongoose.model('Buyer');
    const DistributionCenter = mongoose.model('DistributionCenter');
    const ProductMaster = mongoose.model('ProductMaster');
    const InventoryLot = mongoose.model('InventoryLot');
    const Offer = mongoose.model('Offer');
    const Activity = mongoose.model('Activity');

    await Supplier.deleteMany({ _id: supplierId });
    await Buyer.deleteMany({ _id: buyerId });
    await DistributionCenter.deleteMany({ _id: dcId });
    await ProductMaster.deleteMany({ _id: productId });
    await InventoryLot.deleteMany({ _id: lotId });
    await Offer.deleteMany({ buyerId });
    await Activity.deleteMany({ lotId });
  });

  it('should return 400 when declining without a mandatory reason', async () => {
    const res = await request(app)
      .post(`/api/bids/${offerId}/decline`)
      .send({ rationale: 'Some optional note without reason' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/reason is required/i);
  });

  it('should decline offer, set status to rejected, record decline rationale in offer history, and create CRM timeline activity', async () => {
    const res = await request(app)
      .post(`/api/bids/${offerId}/decline`)
      .send({
        reason: 'Price below minimum recovery floor',
        rationale: 'The target floor is $6.50/cs for this bakery surplus.'
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('rejected');

    // Verify Offer in database
    const Offer = mongoose.model('Offer');
    const updatedOffer = await Offer.findById(offerId);
    expect(updatedOffer).toBeDefined();
    expect(updatedOffer?.status).toBe('rejected');

    const lastMessage = updatedOffer?.messages[updatedOffer.messages.length - 1];
    expect(lastMessage).toBeDefined();
    expect(lastMessage?.content).toContain('Price below minimum recovery floor');
    expect(lastMessage?.content).toContain('The target floor is $6.50/cs');

    // Verify Lot CRM Timeline Activity in database
    const Activity = mongoose.model('Activity');
    const activities = await Activity.find({ lotId });
    expect(activities.length).toBeGreaterThanOrEqual(1);

    const declineActivity = activities.find((a: any) =>
      a.subject.toLowerCase().includes('bid declined') ||
      a.content.toLowerCase().includes('price below minimum recovery floor')
    );
    expect(declineActivity).toBeDefined();
    expect(declineActivity?.content).toContain('Price below minimum recovery floor');
    expect(declineActivity?.metadata?.offerId?.toString()).toBe(offerId);
  });

  it('should reset rejected bid back to pending via POST /api/bids/:id/reset test override', async () => {
    const res = await request(app)
      .post(`/api/bids/${offerId}/reset`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('pending');

    const Offer = mongoose.model('Offer');
    const resetOffer = await Offer.findById(offerId);
    expect(resetOffer?.status).toBe('pending');
  });
});
