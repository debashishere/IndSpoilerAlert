import request from 'supertest';
import mongoose from 'mongoose';
import app from '../index';

describe('Liquidation Cycles API Endpoints', () => {
  afterAll(async () => {
    await mongoose.disconnect();
  });

  it('should create a new liquidation cycle with status active', async () => {
    const supplierId = new mongoose.Types.ObjectId();
    const cycleData = {
      supplierId: supplierId.toString(),
      name: 'Test Q3 Closeouts',
      startDate: new Date('2026-07-01').toISOString(),
      endDate: new Date('2026-07-31').toISOString(),
    };

    const res = await request(app)
      .post('/api/liquidation-cycles')
      .send(cycleData);

    expect(res.status).toBe(201);
    expect(res.body).toBeDefined();
    expect(res.body.name).toBe('Test Q3 Closeouts');
    expect(res.body.status).toBe('active');
    expect(res.body.supplierId).toBe(supplierId.toString());

    // Clean up created cycle
    const LiquidationCycle = mongoose.model('LiquidationCycle');
    await LiquidationCycle.findByIdAndDelete(res.body._id);
  });

  it('should retrieve liquidation cycles for a specific supplier only', async () => {
    const supplierA = new mongoose.Types.ObjectId();
    const supplierB = new mongoose.Types.ObjectId();

    const LiquidationCycle = mongoose.model('LiquidationCycle');
    const cycle1 = await LiquidationCycle.create({
      supplierId: supplierA,
      name: 'Cycle A1',
      startDate: new Date(),
      endDate: new Date(),
      status: 'active'
    });
    const cycle2 = await LiquidationCycle.create({
      supplierId: supplierA,
      name: 'Cycle A2',
      startDate: new Date(),
      endDate: new Date(),
      status: 'closed'
    });
    const cycle3 = await LiquidationCycle.create({
      supplierId: supplierB,
      name: 'Cycle B1',
      startDate: new Date(),
      endDate: new Date(),
      status: 'active'
    });

    const res = await request(app)
      .get(`/api/liquidation-cycles?supplierId=${supplierA.toString()}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
    const names = res.body.map((c: any) => c.name);
    expect(names).toContain('Cycle A1');
    expect(names).toContain('Cycle A2');
    expect(names).not.toContain('Cycle B1');

    // Clean up
    await LiquidationCycle.deleteMany({ _id: { $in: [cycle1._id, cycle2._id, cycle3._id] } });
  });

  it('should filter inventory lots by liquidationCycleId', async () => {
    const supplierId = new mongoose.Types.ObjectId();
    const dcId = new mongoose.Types.ObjectId();
    const productId = new mongoose.Types.ObjectId();
    const cycleA = new mongoose.Types.ObjectId();
    const cycleB = new mongoose.Types.ObjectId();

    const InventoryLot = mongoose.model('InventoryLot');

    const lot1 = await InventoryLot.create({
      supplierId,
      distributionCenterId: dcId,
      productId,
      liquidationCycleId: cycleA,
      lotNumber: 'LOT-A1',
      expirationDate: new Date(),
      quantityCases: 100,
      availableQty: 100,
      costPerCase: 10,
      standardSellPrice: 15,
      status: 'active'
    });

    const lot2 = await InventoryLot.create({
      supplierId,
      distributionCenterId: dcId,
      productId,
      liquidationCycleId: cycleA,
      lotNumber: 'LOT-A2',
      expirationDate: new Date(),
      quantityCases: 200,
      availableQty: 200,
      costPerCase: 12,
      standardSellPrice: 18,
      status: 'active'
    });

    const lot3 = await InventoryLot.create({
      supplierId,
      distributionCenterId: dcId,
      productId,
      liquidationCycleId: cycleB,
      lotNumber: 'LOT-B1',
      expirationDate: new Date(),
      quantityCases: 300,
      availableQty: 300,
      costPerCase: 15,
      standardSellPrice: 22,
      status: 'active'
    });

    const res = await request(app)
      .get(`/api/inventory?liquidationCycleId=${cycleA.toString()}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
    const lotNumbers = res.body.map((l: any) => l.lotNumber);
    expect(lotNumbers).toContain('LOT-A1');
    expect(lotNumbers).toContain('LOT-A2');
    expect(lotNumbers).not.toContain('LOT-B1');

    // Clean up
    await InventoryLot.deleteMany({ _id: { $in: [lot1._id, lot2._id, lot3._id] } });
  });
});
