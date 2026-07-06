import request from 'supertest';
import mongoose from 'mongoose';
import app from '../index';
import { getRedisClient } from '../utils/redis';

describe('Analytics API Endpoint', () => {
  let supplierId: string;
  let lotId1: string;
  let lotId2: string;
  let lotId3: string;
  let lotId4: string;

  beforeAll(async () => {
    // Clear Redis cache before testing to ensure MongoDB is queried
    try {
      const redis = await getRedisClient();
      if (redis && redis.isOpen) {
        await redis.del('analytics:summary');
      }
    } catch (e) {
      console.warn('Could not clear Redis cache for tests:', e);
    }

    const Supplier = mongoose.model('Supplier');
    const DistributionCenter = mongoose.model('DistributionCenter');
    const ProductMaster = mongoose.model('ProductMaster');
    const InventoryLot = mongoose.model('InventoryLot');
    const Award = mongoose.model('Award');
    const Donation = mongoose.model('Donation');
    const Disposal = mongoose.model('Disposal');

    // Seed Supplier
    const supp = await Supplier.create({
      name: 'Test Supplier Analytics',
      companyCode: 'TSUPANA',
      preferredDisposition: 'sell'
    });
    supplierId = supp._id.toString();

    // Seed DC
    const dc = await DistributionCenter.create({
      supplierId: supp._id,
      name: 'Test DC Analytics',
      code: 'TSUPANA-DC',
      address: '100 Logistics Way, Chicago, IL',
      coordinates: { lat: 41.8781, lng: -87.6298 },
      coldStorage: true
    });

    // Seed Product
    const prod = await ProductMaster.create({
      supplierId: supp._id,
      sku: 'SKU-ANA-001',
      category: 'Dry Goods',
      description: 'Test Product Analytics',
      shelfLifeDays: 30
    });

    // Seed Lots with different statuses
    const lot1 = await InventoryLot.create({
      supplierId: supp._id,
      distributionCenterId: dc._id,
      productId: prod._id,
      lotNumber: 'LOT-ANA-001',
      expirationDate: new Date(),
      remainingShelfLife: 0.1,
      quantityCases: 100,
      availableQty: 0,
      costPerCase: 10.00,
      standardSellPrice: 12.00,
      status: 'sold'
    });
    lotId1 = lot1._id.toString();

    const lot2 = await InventoryLot.create({
      supplierId: supp._id,
      distributionCenterId: dc._id,
      productId: prod._id,
      lotNumber: 'LOT-ANA-002',
      expirationDate: new Date(),
      remainingShelfLife: 0.1,
      quantityCases: 50,
      availableQty: 0,
      costPerCase: 10.00,
      standardSellPrice: 12.00,
      status: 'donated'
    });
    lotId2 = lot2._id.toString();

    const lot3 = await InventoryLot.create({
      supplierId: supp._id,
      distributionCenterId: dc._id,
      productId: prod._id,
      lotNumber: 'LOT-ANA-003',
      expirationDate: new Date(),
      remainingShelfLife: 0.1,
      quantityCases: 40,
      availableQty: 0,
      costPerCase: 10.00,
      standardSellPrice: 12.00,
      status: 'recycled'
    });
    lotId3 = lot3._id.toString();

    const lot4 = await InventoryLot.create({
      supplierId: supp._id,
      distributionCenterId: dc._id,
      productId: prod._id,
      lotNumber: 'LOT-ANA-004',
      expirationDate: new Date(),
      remainingShelfLife: 0.1,
      quantityCases: 10,
      availableQty: 0,
      costPerCase: 10.00,
      standardSellPrice: 12.00,
      status: 'expired'
    });
    lotId4 = lot4._id.toString();

    // Seed Award for lot1 (sold)
    await Award.create({
      listingId: new mongoose.Types.ObjectId(),
      offerId: new mongoose.Types.ObjectId(),
      buyerId: new mongoose.Types.ObjectId(),
      awardedQty: 100,
      price: 8.00
    });

    // Seed Donation for lot2
    await Donation.create({
      lotId: lot2._id,
      foodBankName: 'Test Food Bank',
      quantity: 50,
      taxBenefit: 250,
      landfillAvoided: 0.375,
      co2Saved: 0.938,
      pickupDate: new Date()
    });

    // Seed Recycling Disposal for lot3
    await Disposal.create({
      lotId: lot3._id,
      method: 'recycle',
      facility: 'Test Recycler',
      landfillFee: 60,
      recyclingFee: 12,
      completedDate: new Date()
    });
  });

  afterAll(async () => {
    const Supplier = mongoose.model('Supplier');
    const DistributionCenter = mongoose.model('DistributionCenter');
    const ProductMaster = mongoose.model('ProductMaster');
    const InventoryLot = mongoose.model('InventoryLot');
    const Award = mongoose.model('Award');
    const Donation = mongoose.model('Donation');
    const Disposal = mongoose.model('Disposal');

    await Supplier.deleteMany({ name: 'Test Supplier Analytics' });
    await DistributionCenter.deleteMany({ supplierId });
    await ProductMaster.deleteMany({ supplierId });
    await InventoryLot.deleteMany({ supplierId });
    await Award.deleteMany({});
    await Donation.deleteMany({ lotId: { $in: [lotId1, lotId2, lotId3, lotId4] } });
    await Disposal.deleteMany({ lotId: { $in: [lotId1, lotId2, lotId3, lotId4] } });

    await mongoose.disconnect();
  });

  it('should retrieve Distressed Analytics summary', async () => {
    const res = await request(app).get('/api/analytics/summary');
    expect(res.status).toBe(200);
    expect(res.body.summary).toBeTruthy();
    expect(res.body.trends).toBeTruthy();
    expect(res.body.categoryBreakdown).toBeTruthy();
    expect(res.body.summary.wasteDivertedTons).toBeGreaterThan(0);
    expect(res.body.summary.landfillFeesSaved).toBeGreaterThan(0);
  });
});
