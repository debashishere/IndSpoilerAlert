import request from 'supertest';
import mongoose from 'mongoose';
import app from '../index';
import InventoryLot from '../models/InventoryLot';
import ProductMaster from '../models/ProductMaster';
import Supplier from '../models/Supplier';
import LiquidationAutomation from '../models/LiquidationAutomation';
import LiquidationCycle from '../models/LiquidationCycle';

import DistributionCenter from '../models/DistributionCenter';

describe('Workflow Builder RSL Filter and 10 Inventory Lots Test Suite', () => {
  let supplierId: string;
  let cycleId: string;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      try {
        const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ind-spoiler-alert-test';
        await mongoose.connect(uri);
      } catch (e) {}
    }
  });

  afterAll(async () => {
    if (mongoose.connection.readyState === 1) {
      try {
        await mongoose.disconnect();
      } catch (e) {}
    }
  });

  beforeEach(async () => {
    await InventoryLot.deleteMany({});
    await ProductMaster.deleteMany({});
    await Supplier.deleteMany({});
    await LiquidationAutomation.deleteMany({});
    await LiquidationCycle.deleteMany({});
    await DistributionCenter.deleteMany({});

    const supplier = await Supplier.create({
      name: 'Test Supplier RSL',
      companyCode: 'SUP-RSL-TEST-001',
      email: 'rsltest@supplier.com'
    });
    supplierId = supplier._id.toString();

    const dc = await DistributionCenter.create({
      supplierId,
      name: 'Test DC',
      code: 'DC-001',
      address: '123 Test St',
      coordinates: { lat: 40, lng: -70 }
    });

    const cycle = await LiquidationCycle.create({
      name: 'RSL Test Cycle',
      supplierId,
      startDate: new Date('2026-07-01'),
      endDate: new Date('2026-09-30'),
      status: 'active'
    });
    cycleId = cycle._id.toString();

    const prod = await ProductMaster.create({
      supplierId,
      sku: 'PROD-RSL-01',
      brand: 'TestBrand',
      category: 'Dairy',
      description: 'Test Yogurt Item',
      shelfLifeDays: 30
    });

    // Create 10 inventory lots with well-defined RSLs
    const rslValues = [0.08, 0.12, 0.15, 0.18, 0.20, 0.25, 0.35, 0.49, 0.65, 0.80];
    for (let i = 0; i < 10; i++) {
      await InventoryLot.create({
        supplierId,
        distributionCenterId: dc._id,
        productId: prod._id,
        liquidationCycleId: cycle._id,
        lotNumber: `LOT-RSL-TEST-${101 + i}`,
        productionDate: new Date('2026-06-01'),
        expirationDate: new Date('2026-08-30'),
        remainingShelfLife: rslValues[i],
        quantityCases: 100 * (i + 1),
        availableQty: 100 * (i + 1),
        costPerCase: 10,
        standardSellPrice: 20,
        status: 'active'
      });
    }
  });

  it('should verify 10 inventory lots exist in database', async () => {
    const count = await InventoryLot.countDocuments({ supplierId });
    expect(count).toBe(10);
  });

  it('should correctly filter inventory lots when maxRsl is 0.20 (decimal format)', async () => {
    const automation = await LiquidationAutomation.create({
      supplierId,
      liquidationCycleId: cycleId,
      name: 'RSL 20% Test Automation',
      templateName: 'short_dated_clearance',
      executionType: 'immediate',
      inventoryFilters: { maxRsl: 0.20 },
      stages: [{ stageNumber: 1, name: 'Stage 1', discountType: 'percentage_off_wholesale', discountValue: 20, waitHours: 24, buyerMode: 'all', autoExecute: true }]
    });

    const res = await request(app)
      .post(`/api/liquidation-automations/${automation._id}/trigger`)
      .send({});

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('_id');
    // Lots with RSL <= 0.20: 0.08, 0.12, 0.15, 0.18, 0.20 -> 5 lots
    expect(res.body.snapshotInventoryIds.length).toBe(5);
  });

  it('should correctly filter inventory lots when maxRsl is 20 (integer percentage format)', async () => {
    const automation = await LiquidationAutomation.create({
      supplierId,
      liquidationCycleId: cycleId,
      name: 'RSL 20 Percentage Test Automation',
      templateName: 'short_dated_clearance',
      executionType: 'immediate',
      inventoryFilters: { maxRsl: 20 },
      stages: [{ stageNumber: 1, name: 'Stage 1', discountType: 'percentage_off_wholesale', discountValue: 20, waitHours: 24, buyerMode: 'all', autoExecute: true }]
    });

    const res = await request(app)
      .post(`/api/liquidation-automations/${automation._id}/trigger`)
      .send({});

    expect(res.status).toBe(201);
    expect(res.body.snapshotInventoryIds.length).toBe(5);
  });

  it('should match all 10 lots when maxRsl is 1.0 or 100 (100% all RSLs)', async () => {
    const automation = await LiquidationAutomation.create({
      supplierId,
      liquidationCycleId: cycleId,
      name: 'RSL 100% Test Automation',
      templateName: 'short_dated_clearance',
      executionType: 'immediate',
      inventoryFilters: { maxRsl: 1.0 },
      stages: [{ stageNumber: 1, name: 'Stage 1', discountType: 'percentage_off_wholesale', discountValue: 20, waitHours: 24, buyerMode: 'all', autoExecute: true }]
    });

    const res = await request(app)
      .post(`/api/liquidation-automations/${automation._id}/trigger`)
      .send({});

    expect(res.status).toBe(201);
    expect(res.body.snapshotInventoryIds.length).toBe(10);
  });

  it('should match 3 lots when maxRsl is 0.15 (15%)', async () => {
    const automation = await LiquidationAutomation.create({
      supplierId,
      liquidationCycleId: cycleId,
      name: 'RSL 15% Test Automation',
      templateName: 'short_dated_clearance',
      executionType: 'immediate',
      inventoryFilters: { maxRsl: 0.15 },
      stages: [{ stageNumber: 1, name: 'Stage 1', discountType: 'percentage_off_wholesale', discountValue: 20, waitHours: 24, buyerMode: 'all', autoExecute: true }]
    });

    const res = await request(app)
      .post(`/api/liquidation-automations/${automation._id}/trigger`)
      .send({});

    expect(res.status).toBe(201);
    // Lots with RSL <= 0.15: 0.08, 0.12, 0.15 -> 3 lots
    expect(res.body.snapshotInventoryIds.length).toBe(3);
  });
});
