import request from 'supertest';
import mongoose from 'mongoose';
import app from '../index';
import Supplier from '../models/Supplier';
import LiquidationAutomation from '../models/LiquidationAutomation';
import LiquidationCycle from '../models/LiquidationCycle';

describe('Supplier Dynamic Provisioning & Data Isolation (TDD)', () => {
  const userAEmail = 'debashisroe1996@gmail.com';
  const userBEmail = 'debashishere007@gmail.com';

  beforeAll(async () => {
    // Clean up any test suppliers/automations for these emails
    await Supplier.deleteMany({ email: { $in: [userAEmail, userBEmail] } });
    await mongoose.model('InventoryLot').deleteMany({ lotNumber: 'LOT-USER-A-999' });
    await mongoose.model('ProductMaster').deleteMany({ sku: 'SKU-USER-A-001' });
    await mongoose.model('DistributionCenter').deleteMany({ code: 'DC-A-01' });
    await mongoose.model('Buyer').deleteMany({ email: { $in: ['buyer-user-a@example.com', 'buyer-user-b@example.com'] } });
    await mongoose.model('BuyerList').deleteMany({ name: { $in: ['List for User A', 'List for User B'] } });
  });

  afterAll(async () => {
    await Supplier.deleteMany({ email: { $in: [userAEmail, userBEmail] } });
    await LiquidationAutomation.deleteMany({
      name: { $in: ['Workflow for User A', 'Workflow for User B'] }
    });
    await LiquidationCycle.deleteMany({
      name: { $in: ['Cycle for User A', 'Cycle for User B'] }
    });
    await mongoose.model('InventoryLot').deleteMany({ lotNumber: 'LOT-USER-A-999' });
    await mongoose.model('ProductMaster').deleteMany({ sku: 'SKU-USER-A-001' });
    await mongoose.model('DistributionCenter').deleteMany({ code: 'DC-A-01' });
    await mongoose.model('Buyer').deleteMany({ email: { $in: ['buyer-user-a@example.com', 'buyer-user-b@example.com'] } });
    await mongoose.model('BuyerList').deleteMany({ name: { $in: ['List for User A', 'List for User B'] } });
    await mongoose.disconnect();
  });

  let supplierAId: string;
  let supplierBId: string;

  it('1. GET /api/v1/supplier/current should dynamically provision a unique supplier for User A', async () => {
    const res = await request(app)
      .get(`/api/v1/supplier/current?email=${encodeURIComponent(userAEmail)}`)
      .set('Authorization', `Bearer mock-firebase-id-token-mock-uid-${Buffer.from(userAEmail).toString('base64')}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('_id');
    expect(res.body.email).toBe(userAEmail);
    expect(res.body.name).toBeTruthy();
    expect(res.body.companyCode).toBeTruthy();

    supplierAId = res.body._id;
  });

  it('2. GET /api/v1/supplier/current should return the same existing supplier for User A on subsequent calls without duplicates', async () => {
    const res = await request(app)
      .get(`/api/v1/supplier/current?email=${encodeURIComponent(userAEmail)}`);

    expect(res.status).toBe(200);
    expect(res.body._id).toBe(supplierAId);
    expect(res.body.email).toBe(userAEmail);

    const count = await Supplier.countDocuments({ email: userAEmail });
    expect(count).toBe(1);
  });

  it('3. GET /api/v1/supplier/current should dynamically provision a distinct unique supplier for User B', async () => {
    const res = await request(app)
      .get(`/api/v1/supplier/current?email=${encodeURIComponent(userBEmail)}`)
      .set('Authorization', `Bearer mock-firebase-id-token-mock-uid-${Buffer.from(userBEmail).toString('base64')}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('_id');
    expect(res.body.email).toBe(userBEmail);
    expect(res.body._id).not.toBe(supplierAId);

    supplierBId = res.body._id;
  });

  it('4. Workflow created under Supplier A should be saved and returned only for Supplier A', async () => {
    const createRes = await request(app)
      .post('/api/liquidation-automations')
      .send({
        supplierId: supplierAId,
        name: 'Workflow for User A',
        templateName: 'Short-Dated Clearance',
        isActive: true,
        createdBy: userAEmail
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.supplierId).toBe(supplierAId);
    expect(createRes.body.name).toBe('Workflow for User A');

    // Query workflows for Supplier A
    const listARes = await request(app)
      .get(`/api/liquidation-automations?supplierId=${supplierAId}`);

    expect(listARes.status).toBe(200);
    const workflowsA = listARes.body;
    expect(workflowsA.some((w: any) => w.name === 'Workflow for User A')).toBe(true);
  });

  it('5. Fetching workflows for Supplier B must return ZERO workflows from Supplier A (data isolation)', async () => {
    const listBRes = await request(app)
      .get(`/api/liquidation-automations?supplierId=${supplierBId}`);

    expect(listBRes.status).toBe(200);
    const workflowsB = listBRes.body;
    expect(workflowsB.some((w: any) => w.name === 'Workflow for User A')).toBe(false);
    expect(workflowsB.length).toBe(0);
  });

  it('6. Creating a workflow under Supplier B maintains complete isolation across both accounts', async () => {
    const createBRes = await request(app)
      .post('/api/liquidation-automations')
      .send({
        supplierId: supplierBId,
        name: 'Workflow for User B',
        templateName: 'Seasonal Batch Offload',
        isActive: true,
        createdBy: userBEmail
      });

    expect(createBRes.status).toBe(201);
    expect(createBRes.body.supplierId).toBe(supplierBId);

    // Verify Supplier A only sees Workflow A
    const listARes = await request(app)
      .get(`/api/liquidation-automations?supplierId=${supplierAId}`);
    expect(listARes.body.some((w: any) => w.name === 'Workflow for User A')).toBe(true);
    expect(listARes.body.some((w: any) => w.name === 'Workflow for User B')).toBe(false);

    // Verify Supplier B only sees Workflow B
    const listBRes = await request(app)
      .get(`/api/liquidation-automations?supplierId=${supplierBId}`);
    expect(listBRes.body.some((w: any) => w.name === 'Workflow for User B')).toBe(true);
    expect(listBRes.body.some((w: any) => w.name === 'Workflow for User A')).toBe(false);
  });

  it('7. Inventory created under Supplier A should be retrieved when querying with Supplier A scoping', async () => {
    const DistributionCenter = mongoose.model('DistributionCenter');
    const ProductMaster = mongoose.model('ProductMaster');
    const InventoryLot = mongoose.model('InventoryLot');

    const dcA = await DistributionCenter.create({
      supplierId: supplierAId,
      name: 'DC for User A',
      code: 'DC-A-01',
      address: '123 Main St, New York, NY',
      coordinates: { lat: 40.7128, lng: -74.0060 }
    });

    const prodA = await ProductMaster.create({
      supplierId: supplierAId,
      sku: 'SKU-USER-A-001',
      name: 'Product User A',
      description: 'Product User A Description',
      category: 'Dairy',
      palletTier: 5,
      caseTie: 10,
      shelfLifeDays: 30
    });

    await InventoryLot.create({
      supplierId: supplierAId,
      distributionCenterId: dcA._id,
      productId: prodA._id,
      lotNumber: 'LOT-USER-A-999',
      expirationDate: new Date(Date.now() + 15 * 86400000),
      quantityCases: 100,
      availableQty: 100,
      costPerCase: 20,
      standardSellPrice: 30,
      status: 'active'
    });

    // Query inventory with explicit supplierId
    const resA = await request(app)
      .get(`/api/inventory?supplierId=${supplierAId}`);

    expect(resA.status).toBe(200);
    expect(resA.body.some((lot: any) => lot.lotNumber === 'LOT-USER-A-999')).toBe(true);
  });

  it('8. Querying inventory for Supplier B must return ZERO lots from Supplier A', async () => {
    const resB = await request(app)
      .get(`/api/inventory?supplierId=${supplierBId}`);

    expect(resB.status).toBe(200);
    expect(resB.body.some((lot: any) => lot.lotNumber === 'LOT-USER-A-999')).toBe(false);
  });

  it('9. Querying inventory with User A Bearer token (no query param) automatically resolves Supplier A inventory', async () => {
    const resUserA = await request(app)
      .get('/api/inventory')
      .set('Authorization', `Bearer mock-firebase-id-token-mock-uid-${Buffer.from(userAEmail).toString('base64')}`);

    expect(resUserA.status).toBe(200);
    expect(resUserA.body.some((lot: any) => lot.lotNumber === 'LOT-USER-A-999')).toBe(true);

    const resUserB = await request(app)
      .get('/api/inventory')
      .set('Authorization', `Bearer mock-firebase-id-token-mock-uid-${Buffer.from(userBEmail).toString('base64')}`);

    expect(resUserB.status).toBe(200);
    expect(resUserB.body.some((lot: any) => lot.lotNumber === 'LOT-USER-A-999')).toBe(false);
  });

  it('10. Buyer created under Supplier A should be retrieved when querying with Supplier A scoping', async () => {
    const createRes = await request(app)
      .post('/api/buyers')
      .send({
        supplierId: supplierAId,
        companyName: 'Buyer For User A',
        email: 'buyer-user-a@example.com',
        tier: 'tier1',
        acceptsShortDated: true,
        minShelfLife: 10,
        categories: ['Dairy'],
        transportRadius: 50
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.supplierId).toBe(supplierAId);
    expect(createRes.body.email).toBe('buyer-user-a@example.com');

    // Query buyers with explicit supplierId
    const resA = await request(app)
      .get(`/api/buyers?supplierId=${supplierAId}`);

    expect(resA.status).toBe(200);
    expect(resA.body.some((b: any) => b.email === 'buyer-user-a@example.com')).toBe(true);
  });

  it('11. Querying buyers for Supplier B must return ZERO buyers from Supplier A (data isolation)', async () => {
    const resB = await request(app)
      .get(`/api/buyers?supplierId=${supplierBId}`);

    expect(resB.status).toBe(200);
    expect(resB.body.some((b: any) => b.email === 'buyer-user-a@example.com')).toBe(false);
  });

  it('12. Querying buyers with User A Bearer token (no query param) automatically resolves Supplier A buyers', async () => {
    const resUserA = await request(app)
      .get('/api/buyers')
      .set('Authorization', `Bearer mock-firebase-id-token-mock-uid-${Buffer.from(userAEmail).toString('base64')}`);

    expect(resUserA.status).toBe(200);
    expect(resUserA.body.some((b: any) => b.email === 'buyer-user-a@example.com')).toBe(true);

    const resUserB = await request(app)
      .get('/api/buyers')
      .set('Authorization', `Bearer mock-firebase-id-token-mock-uid-${Buffer.from(userBEmail).toString('base64')}`);

    expect(resUserB.status).toBe(200);
    expect(resUserB.body.some((b: any) => b.email === 'buyer-user-a@example.com')).toBe(false);
  });

  it('13. Buyer lists created under Supplier A are isolated from Supplier B', async () => {
    const createListRes = await request(app)
      .post('/api/buyer-lists')
      .send({
        name: 'List for User A',
        description: 'Exclusive list for Supplier A',
        supplierId: supplierAId,
        buyerIds: []
      });

    expect(createListRes.status).toBe(201);
    expect(createListRes.body.supplierId).toBe(supplierAId);

    // Supplier A query
    const resA = await request(app)
      .get(`/api/buyer-lists?supplierId=${supplierAId}`);
    expect(resA.status).toBe(200);
    expect(resA.body.some((l: any) => l.name === 'List for User A')).toBe(true);

    // Supplier B query
    const resB = await request(app)
      .get(`/api/buyer-lists?supplierId=${supplierBId}`);
    expect(resB.status).toBe(200);
    expect(resB.body.some((l: any) => l.name === 'List for User A')).toBe(false);

    // Token-based resolution for User A
    const resUserA = await request(app)
      .get('/api/buyer-lists')
      .set('Authorization', `Bearer mock-firebase-id-token-mock-uid-${Buffer.from(userAEmail).toString('base64')}`);
    expect(resUserA.status).toBe(200);
    expect(resUserA.body.some((l: any) => l.name === 'List for User A')).toBe(true);

    // Token-based resolution for User B
    const resUserB = await request(app)
      .get('/api/buyer-lists')
      .set('Authorization', `Bearer mock-firebase-id-token-mock-uid-${Buffer.from(userBEmail).toString('base64')}`);
    expect(resUserB.status).toBe(200);
    expect(resUserB.body.some((l: any) => l.name === 'List for User A')).toBe(false);
  });
});

