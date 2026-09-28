import request from 'supertest';
import mongoose from 'mongoose';
import app from '../index';
import { getRedisClient } from '../utils/redis';

describe('Sales Analytics API Endpoint (GET /api/analytics/sales)', () => {
  jest.setTimeout(30000);
  const validToken = 'mock-firebase-id-token-mock-uid-YXV0aHRlc3RAaW5kc3BvaWxlcmFsZXJ0LmNvbQ';
  let supplierId: string;
  let otherSupplierId: string;
  let lotId: string;

  beforeAll(async () => {
    // Wait for connection if needed
    if (mongoose.connection.readyState !== 1) {
      await new Promise((resolve) => mongoose.connection.once('connected', resolve));
    }

    const Supplier = mongoose.model('Supplier');
    const ProductMaster = mongoose.model('ProductMaster');
    const InventoryLot = mongoose.model('InventoryLot');
    const Sale = mongoose.model('Sale');
    const Buyer = mongoose.model('Buyer');

    // Clean up test collections
    await Supplier.deleteMany({ name: { $in: ['Sales Analytics Test Supplier', 'Other Supplier'] } });
    await Sale.deleteMany({ sku: { $in: ['SKU-SALES-001', 'SKU-SALES-002', 'SKU-OTHER-001'] } });
    await Buyer.deleteMany({ email: { $in: ['buyer-offprice@test.com', 'buyer-liquidator@test.com'] } });

    // Seed Suppliers
    const supp = await Supplier.create({
      name: 'Sales Analytics Test Supplier',
      companyCode: 'SATS',
      preferredDisposition: 'sell'
    });
    supplierId = supp._id.toString();

    const otherSupp = await Supplier.create({
      name: 'Other Supplier',
      companyCode: 'OTHR',
      preferredDisposition: 'sell'
    });
    otherSupplierId = otherSupp._id.toString();

    // Seed Buyers with segments
    const buyer1 = await Buyer.create({
      supplierId: supp._id,
      companyName: 'Off-Price Wholesalers LLC',
      email: 'buyer-offprice@test.com',
      segment: 'Off-Price Wholesalers',
      isActive: true,
      warehouseLocations: [{ lat: 41.8781, lng: -87.6298 }]
    });

    const buyer2 = await Buyer.create({
      supplierId: supp._id,
      companyName: 'Regional Liquidators Inc',
      email: 'buyer-liquidator@test.com',
      segment: 'Regional Liquidators',
      isActive: true,
      warehouseLocations: [{ lat: 32.7767, lng: -96.7970 }]
    });

    // Seed Products
    const prod1 = await ProductMaster.create({
      supplierId: supp._id,
      sku: 'SKU-SALES-001',
      category: 'Beverages',
      description: 'Organic Cold Brew 12pk',
      shelfLifeDays: 60
    });

    const prod2 = await ProductMaster.create({
      supplierId: supp._id,
      sku: 'SKU-SALES-002',
      category: 'Snacks',
      description: 'Gluten Free Chips',
      shelfLifeDays: 90
    });

    // Seed Lots
    const lot = await InventoryLot.create({
      supplierId: supp._id,
      distributionCenterId: new mongoose.Types.ObjectId(),
      productId: prod1._id,
      lotNumber: 'LOT-SALES-101',
      expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      remainingShelfLife: 0.5,
      quantityCases: 500,
      availableQty: 200,
      costPerCase: 10.00,
      standardSellPrice: 15.00,
      status: 'sold'
    });
    lotId = lot._id.toString();

    const lot2 = await InventoryLot.create({
      supplierId: supp._id,
      distributionCenterId: new mongoose.Types.ObjectId(),
      productId: prod2._id,
      lotNumber: 'LOT-SALES-102',
      expirationDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      remainingShelfLife: 0.7,
      quantityCases: 100,
      availableQty: 50,
      costPerCase: 16.00,
      standardSellPrice: 20.00,
      status: 'sold'
    });

    // Seed Sales for Supplier 1:
    // Current period (last 7 days):
    // Sale 1: Reconciled with lotId, Beverages, Chicago DC, $3,000, 200 cases ($15/cs), buyer1
    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const fourDaysAgo = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);
    // Prior period (8-14 days ago for 7d window, or 31-60 days ago for 30d window):
    const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);

    await Sale.create({
      supplierId: supp._id,
      buyerId: buyer1._id,
      lotId: lot._id,
      lotNumber: 'LOT-SALES-101',
      sku: 'SKU-SALES-001',
      description: 'Organic Cold Brew 12pk',
      quantityCases: 200,
      pricePerCase: 15.00,
      totalValue: 3000.00,
      revenue: 3000.00,
      saleDate: twoDaysAgo,
      status: 'delivered',
      warehouse: 'Chicago DC'
    });

    // Sale 2: Unreconciled (no lotId), Snacks, Dallas DC, $1,000, 50 cases ($20/cs), buyer2
    await Sale.create({
      supplierId: supp._id,
      buyerId: buyer2._id,
      lotNumber: 'LOT-SALES-102',
      sku: 'SKU-SALES-002',
      description: 'Gluten Free Chips',
      quantityCases: 50,
      pricePerCase: 20.00,
      totalValue: 1000.00,
      revenue: 1000.00,
      saleDate: fourDaysAgo,
      status: 'scheduled',
      warehouse: 'Dallas DC'
    });

    // Sale 3 (Prior period - 10 days ago): $2,000, 100 cases
    await Sale.create({
      supplierId: supp._id,
      lotNumber: 'LOT-SALES-PREV',
      sku: 'SKU-SALES-001',
      description: 'Organic Cold Brew 12pk',
      quantityCases: 100,
      pricePerCase: 20.00,
      totalValue: 2000.00,
      revenue: 2000.00,
      saleDate: tenDaysAgo,
      status: 'delivered',
      warehouse: 'Chicago DC'
    });

    // Other supplier sale to verify supplier scoping
    await Sale.create({
      supplierId: otherSupp._id,
      lotNumber: 'LOT-OTHER-999',
      sku: 'SKU-OTHER-001',
      description: 'Other Supplier Product',
      quantityCases: 1000,
      pricePerCase: 50.00,
      totalValue: 50000.00,
      revenue: 50000.00,
      saleDate: twoDaysAgo,
      status: 'delivered',
      warehouse: 'Atlanta DC'
    });
  });

  afterAll(async () => {
    const Supplier = mongoose.model('Supplier');
    const ProductMaster = mongoose.model('ProductMaster');
    const InventoryLot = mongoose.model('InventoryLot');
    const Sale = mongoose.model('Sale');
    const Buyer = mongoose.model('Buyer');

    await Supplier.deleteMany({ name: { $in: ['Sales Analytics Test Supplier', 'Other Supplier'] } });
    await ProductMaster.deleteMany({ sku: { $in: ['SKU-SALES-001', 'SKU-SALES-002', 'SKU-OTHER-001'] } });
    await InventoryLot.deleteMany({ lotNumber: { $in: ['LOT-SALES-101', 'LOT-SALES-102'] } });
    await Sale.deleteMany({ sku: { $in: ['SKU-SALES-001', 'SKU-SALES-002', 'SKU-OTHER-001'] } });
    await Buyer.deleteMany({ email: { $in: ['buyer-offprice@test.com', 'buyer-liquidator@test.com'] } });

    try {
      const redis = await getRedisClient();
      if (redis && redis.isOpen) {
        const keys = await redis.keys('analytics:sales:*');
        if (keys.length > 0) {
          await redis.del(keys);
        }
      }
    } catch (e) {
      // ignore
    }

    await mongoose.disconnect();
  });

  it('rejects unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/analytics/sales');
    expect(res.status).toBe(401);
  });

  it('calculates sales telemetry KPIs, PoP velocity, and filter values with supplier scoping', async () => {
    // Clear Redis cache before calling
    try {
      const redis = await getRedisClient();
      if (redis && redis.isOpen) {
        const keys = await redis.keys('analytics:sales:*');
        if (keys.length > 0) {
          await redis.del(keys);
        }
      }
    } catch (e) {
      // ignore
    }

    // Query for 7d window
    const res = await request(app)
      .get(`/api/analytics/sales?timeframe=7d&supplierId=${supplierId}`)
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);

    // Current 7d window has Sale 1 ($3,000, 200 cases) + Sale 2 ($1,000, 50 cases)
    // Total Revenue = 4000
    // Total Volume = 250
    // Avg Price = 4000 / 250 = 16.00
    // Reconciled count = 1 (Sale 1 has lotId)
    // Total count = 2
    // Prior 7d window (days 7..14) has Sale 3 ($2,000)
    // PoP Revenue Growth = ((4000 - 2000) / 2000) * 100 = +100.0%
    expect(res.body.totalRevenue).toBe(4000);
    expect(res.body.totalVolume).toBe(250);
    expect(res.body.avgPrice).toBe(16);
    expect(res.body.reconciledCount).toBe(1);
    expect(res.body.totalCount).toBe(2);
    expect(res.body.revenueGrowthPct).toBe(100);

    // Trajectory checks for 7d
    expect(res.body.trajectory).toBeDefined();
    expect(res.body.trajectory).toHaveLength(7);
    expect(res.body.trajectory[0].period).toBe('Day 1');
    expect(res.body.trajectory[6].period).toBe('Day 7');
    const totalTrajectoryRev = res.body.trajectory.reduce((acc: number, b: any) => acc + b.revenue, 0);
    const totalTrajectoryVol = res.body.trajectory.reduce((acc: number, b: any) => acc + b.volume, 0);
    expect(totalTrajectoryRev).toBe(4000);
    expect(totalTrajectoryVol).toBe(250);

    // Filter values
    expect(res.body.warehouses).toEqual(expect.arrayContaining(['Chicago DC', 'Dallas DC']));
    expect(res.body.warehouses).not.toContain('Atlanta DC'); // other supplier
  });

  it('aggregates trajectory buckets for 30d, 90d, and ytd timeframes', async () => {
    // 30d timeframe should return 5 weekly buckets
    const res30d = await request(app)
      .get(`/api/analytics/sales?timeframe=30d&supplierId=${supplierId}`)
      .set('Authorization', `Bearer ${validToken}`);
    expect(res30d.status).toBe(200);
    expect(res30d.body.trajectory).toHaveLength(5);
    expect(res30d.body.trajectory[0].period).toBe('Week 1');
    expect(res30d.body.trajectory[4].period).toBe('Week 5');

    // 90d timeframe should return 3 monthly buckets
    const res90d = await request(app)
      .get(`/api/analytics/sales?timeframe=90d&supplierId=${supplierId}`)
      .set('Authorization', `Bearer ${validToken}`);
    expect(res90d.status).toBe(200);
    expect(res90d.body.trajectory).toHaveLength(3);
    expect(res90d.body.trajectory[0].period).toBe('Month 1');
    expect(res90d.body.trajectory[2].period).toBe('Month 3');

    // ytd timeframe should return quarterly buckets
    const resYtd = await request(app)
      .get(`/api/analytics/sales?timeframe=ytd&supplierId=${supplierId}`)
      .set('Authorization', `Bearer ${validToken}`);
    expect(resYtd.status).toBe(200);
    expect(resYtd.body.trajectory.length).toBeGreaterThanOrEqual(1);
    expect(resYtd.body.trajectory[0].period).toMatch(/^Q[1-4]$/);
  });

  it('filters trajectory and telemetry by category and warehouse', async () => {
    // Filter by category: Beverages (Sale 1 only)
    const resBev = await request(app)
      .get(`/api/analytics/sales?timeframe=7d&category=Beverages&supplierId=${supplierId}`)
      .set('Authorization', `Bearer ${validToken}`);
    expect(resBev.status).toBe(200);
    expect(resBev.body.totalRevenue).toBe(3000);
    expect(resBev.body.totalVolume).toBe(200);
    const bevTrajRev = resBev.body.trajectory.reduce((acc: number, b: any) => acc + b.revenue, 0);
    expect(bevTrajRev).toBe(3000);

    // Filter by warehouse: Dallas DC (Sale 2 only)
    const resDallas = await request(app)
      .get(`/api/analytics/sales?timeframe=7d&warehouse=Dallas%20DC&supplierId=${supplierId}`)
      .set('Authorization', `Bearer ${validToken}`);
    expect(resDallas.status).toBe(200);
    expect(resDallas.body.totalRevenue).toBe(1000);
    expect(resDallas.body.totalVolume).toBe(50);
    const dallasTrajRev = resDallas.body.trajectory.reduce((acc: number, b: any) => acc + b.revenue, 0);
    expect(dallasTrajRev).toBe(1000);
  });

  it('calculates category COGS recovery yield and sales channel revenue distribution', async () => {
    // Clear Redis cache before calling
    try {
      const redis = await getRedisClient();
      if (redis && redis.isOpen) {
        const keys = await redis.keys('analytics:sales:*');
        if (keys.length > 0) {
          await redis.del(keys);
        }
      }
    } catch (e) {
      // ignore
    }

    const res = await request(app)
      .get(`/api/analytics/sales?timeframe=7d&supplierId=${supplierId}`)
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);

    // Category Recovery Yield
    // Beverages: 200 cases @ $10 costPerCase = $2,000 COGS; revenue = $3,000; recoveryPct = (3000 / 2000) * 100 = 150%
    // Snacks: 50 cases @ $16 costPerCase = $800 COGS; revenue = $1,000; recoveryPct = (1000 / 800) * 100 = 125%
    expect(res.body.categoryRecovery).toBeDefined();
    expect(res.body.categoryRecovery.length).toBe(2);

    const bevCat = res.body.categoryRecovery.find((c: any) => c.category === 'Beverages');
    expect(bevCat).toBeDefined();
    expect(bevCat.revenue).toBe(3000);
    expect(bevCat.cogs).toBe(2000);
    expect(bevCat.recoveryPct).toBe(150);

    const snackCat = res.body.categoryRecovery.find((c: any) => c.category === 'Snacks');
    expect(snackCat).toBeDefined();
    expect(snackCat.revenue).toBe(1000);
    expect(snackCat.cogs).toBe(800);
    expect(snackCat.recoveryPct).toBe(125);

    // Sales Channel Revenue Share
    // Total Revenue = 4000
    // Off-Price Wholesalers: revenue = 3000, pct = (3000 / 4000) * 100 = 75%
    // Regional Liquidators: revenue = 1000, pct = (1000 / 4000) * 100 = 25%
    expect(res.body.channelDistribution).toBeDefined();
    expect(res.body.channelDistribution.length).toBe(2);

    const offPrice = res.body.channelDistribution.find((ch: any) => ch.channel === 'Off-Price Wholesalers');
    expect(offPrice).toBeDefined();
    expect(offPrice.revenue).toBe(3000);
    expect(offPrice.pct).toBe(75);

    const regional = res.body.channelDistribution.find((ch: any) => ch.channel === 'Regional Liquidators');
    expect(regional).toBeDefined();
    expect(regional.revenue).toBe(1000);
    expect(regional.pct).toBe(25);
  });

  it('aggregates up to 50 recent closeout sales with calculated RSL days, price, and COGS recovery', async () => {
    const res = await request(app)
      .get(`/api/analytics/sales?timeframe=7d&supplierId=${supplierId}`)
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.recentCloseouts).toBeDefined();
    expect(Array.isArray(res.body.recentCloseouts)).toBe(true);
    // There are 2 sales in the last 7 days for supplierId
    expect(res.body.recentCloseouts.length).toBe(2);

    // Most recent sale first (Sale 1 was twoDaysAgo, Sale 2 was fourDaysAgo)
    const sale1 = res.body.recentCloseouts[0];
    expect(sale1.sku).toBe('SKU-SALES-001');
    expect(sale1.product).toBe('Organic Cold Brew 12pk');
    expect(sale1.buyer).toBe('Off-Price Wholesalers LLC');
    expect(sale1.price).toBe(15.00);
    // Lot 1 cost is $10.00, price is $15.00 -> recoveryPct = round((15 / 10) * 100) = 150%
    expect(sale1.recoveryPct).toBe(150);
    // rslDays: lot1 expiration is 30 days from test run, saleDate was 2 days ago -> ~32 days RSL
    expect(sale1.rslDays).toBeGreaterThanOrEqual(30);

    const sale2 = res.body.recentCloseouts[1];
    expect(sale2.sku).toBe('SKU-SALES-002');
    expect(sale2.product).toBe('Gluten Free Chips');
    expect(sale2.buyer).toBe('Regional Liquidators Inc');
    expect(sale2.price).toBe(20.00);
    // Lot 2 cost is $16.00, price is $20.00 -> recoveryPct = round((20 / 16) * 100) = 125%
    expect(sale2.recoveryPct).toBe(125);
    // rslDays: lot2 expiration is 45 days from test run, saleDate was 4 days ago -> ~49 days RSL
    expect(sale2.rslDays).toBeGreaterThanOrEqual(45);
  });

  it('returns clean mathematical zero-state with zeroed trajectory when no sales exist', async () => {
    const emptySupplierId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .get(`/api/analytics/sales?timeframe=30d&supplierId=${emptySupplierId}`)
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.totalRevenue).toBe(0);
    expect(res.body.revenueGrowthPct).toBe(0);
    expect(res.body.totalVolume).toBe(0);
    expect(res.body.avgPrice).toBe(0);
    expect(res.body.reconciledCount).toBe(0);
    expect(res.body.totalCount).toBe(0);
    expect(res.body.categories).toEqual([]);
    expect(res.body.warehouses).toEqual([]);
    expect(res.body.categoryRecovery).toEqual([]);
    expect(res.body.channelDistribution).toEqual([]);
    expect(res.body.recentCloseouts).toEqual([]);
    expect(res.body.trajectory).toBeDefined();
    expect(res.body.trajectory).toHaveLength(5);
    res.body.trajectory.forEach((bucket: any) => {
      expect(bucket.revenue).toBe(0);
      expect(bucket.volume).toBe(0);
    });
  });
});
