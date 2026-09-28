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
    const Sale = mongoose.model('Sale');

    // Clean up test collections before starting
    await Supplier.deleteMany({ name: 'Test Supplier Analytics' });
    await InventoryLot.deleteMany({});
    await Award.deleteMany({});
    await Donation.deleteMany({});
    await Disposal.deleteMany({});
    await Sale.deleteMany({});

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
    const Sale = mongoose.model('Sale');

    await Supplier.deleteMany({ name: 'Test Supplier Analytics' });
    await DistributionCenter.deleteMany({ supplierId });
    await ProductMaster.deleteMany({ supplierId });
    await InventoryLot.deleteMany({});
    await Award.deleteMany({});
    await Donation.deleteMany({});
    await Disposal.deleteMany({});
    await Sale.deleteMany({});

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

  it('should calculate dynamic COGS recovery rate and waste diverted trends from real BE transactions', async () => {
    // Clear Redis cache to ensure fresh computation
    try {
      const redis = await getRedisClient();
      if (redis && redis.isOpen) {
        await redis.del('analytics:summary');
      }
    } catch (e) {
      console.warn('Could not clear Redis cache:', e);
    }

    const InventoryLot = mongoose.model('InventoryLot');
    const Sale = mongoose.model('Sale');
    const Donation = mongoose.model('Donation');
    const Disposal = mongoose.model('Disposal');

    const now = new Date();
    // Four months ago (isolated from July 2026 seeded database entries)
    const fourMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 4, 15);
    const fourMonthsAgoMonthName = fourMonthsAgo.toLocaleString('en-US', { month: 'short' });
    const currentMonthName = now.toLocaleString('en-US', { month: 'short' });

    // Seed Lot for four months ago
    const pastLot = await InventoryLot.create({
      supplierId,
      distributionCenterId: new mongoose.Types.ObjectId(),
      productId: new mongoose.Types.ObjectId(),
      lotNumber: 'LOT-ANA-PAST',
      expirationDate: new Date(),
      remainingShelfLife: 0.1,
      quantityCases: 200,
      availableQty: 0,
      costPerCase: 10.00,
      standardSellPrice: 20.00,
      status: 'sold',
      latestSalesDate: fourMonthsAgo
    });

    // Seed Sale four months ago: 200 cases @ $15 = $3,000 revenue. Cost = 200 * $10 = $2,000. Recovery = 150%
    const pastSale = await Sale.create({
      supplierId,
      lotId: pastLot._id,
      lotNumber: 'LOT-ANA-PAST',
      sku: 'SKU-ANA-PAST',
      description: 'Past Sale Product',
      quantityCases: 200,
      pricePerCase: 15.00,
      totalValue: 3000.00,
      saleDate: fourMonthsAgo,
      status: 'delivered'
    });

    // Seed Donation four months ago: 5.5 tons landfill avoided
    const pastDonation = await Donation.create({
      lotId: pastLot._id,
      foodBankName: 'Past Food Bank',
      quantity: 100,
      taxBenefit: 1000,
      landfillAvoided: 5.5,
      co2Saved: 12.0,
      pickupDate: fourMonthsAgo
    });

    // Seed Disposal four months ago: recycling tons = (200 / 1.50) * 0.0075 = 1.0 ton
    const pastDisposal = await Disposal.create({
      lotId: pastLot._id,
      method: 'recycle',
      facility: 'Past Recycler',
      landfillFee: 200,
      recyclingFee: 50,
      completedDate: fourMonthsAgo
    });

    const res = await request(app).get('/api/analytics/summary');
    expect(res.status).toBe(200);
    expect(res.body.trends).toBeInstanceOf(Array);
    expect(res.body.trends).toHaveLength(6);

    // Verify four months ago data point
    const pastTrend = res.body.trends.find((t: any) => t.month === fourMonthsAgoMonthName);
    expect(pastTrend).toBeDefined();
    expect(pastTrend.recoveryRate).toBe(150);
    expect(pastTrend.divertedTons).toBe(6.5); // 5.5 + 1.0

    // Verify current month data point
    const currentTrend = res.body.trends.find((t: any) => t.month === currentMonthName);
    expect(currentTrend).toBeDefined();
    expect(currentTrend.recoveryRate).toBe(80); // 800 / 1000 * 100
    expect(currentTrend.divertedTons).toBe(0.7); // 0.375 + 0.3 = 0.675 -> 0.7

    // Clean up past records
    await InventoryLot.deleteOne({ _id: pastLot._id });
    await Sale.deleteOne({ _id: pastSale._id });
    await Donation.deleteOne({ _id: pastDonation._id });
    await Disposal.deleteOne({ _id: pastDisposal._id });
  });

  it('should return clean zero-filled 6-month trajectory without NaN for months with no transactions', async () => {
    try {
      const redis = await getRedisClient();
      if (redis && redis.isOpen) {
        await redis.del('analytics:summary');
      }
    } catch (e) {
      console.warn('Could not clear Redis cache:', e);
    }

    const res = await request(app).get('/api/analytics/summary');
    expect(res.status).toBe(200);
    expect(res.body.trends).toHaveLength(6);

    res.body.trends.forEach((point: any) => {
      expect(typeof point.month).toBe('string');
      expect(point.month.length).toBeGreaterThan(0);
      expect(typeof point.recoveryRate).toBe('number');
      expect(Number.isNaN(point.recoveryRate)).toBe(false);
      expect(typeof point.divertedTons).toBe('number');
      expect(Number.isNaN(point.divertedTons)).toBe(false);
      expect(point.recoveryRate).toBeGreaterThanOrEqual(0);
      expect(point.divertedTons).toBeGreaterThanOrEqual(0);
    });
  });
});

