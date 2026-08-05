import request from 'supertest';
import mongoose from 'mongoose';
import app from '../index';
import BuyerList from '../models/BuyerList';
import Buyer from '../models/Buyer';

describe('BuyerList Backend Model & REST APIs', () => {
  let supplierId: mongoose.Types.ObjectId;
  let buyerId1: mongoose.Types.ObjectId;
  let buyerId2: mongoose.Types.ObjectId;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ind-spoiler-alert';
      await mongoose.connect(uri);
    }

    supplierId = new mongoose.Types.ObjectId();
    
    // Create test buyers
    const buyer1 = await Buyer.create({
      companyName: 'Test Outlet Alpha',
      email: `alpha_${Date.now()}@testbuyer.com`,
      acceptsShortDated: true,
      minShelfLife: 5,
      categories: ['Dairy', 'Dry Goods'],
      transportRadius: 50,
      warehouseLocations: [{ lat: 40.7128, lng: -74.006 }]
    });
    buyerId1 = buyer1._id as mongoose.Types.ObjectId;

    const buyer2 = await Buyer.create({
      companyName: 'Test Surplus Beta',
      email: `beta_${Date.now()}@testbuyer.com`,
      acceptsShortDated: false,
      minShelfLife: 14,
      categories: ['Produce'],
      transportRadius: 100,
      warehouseLocations: [{ lat: 41.8781, lng: -87.6298 }]
    });
    buyerId2 = buyer2._id as mongoose.Types.ObjectId;
  }, 15000);

  afterAll(async () => {
    if (buyerId1) await Buyer.findByIdAndDelete(buyerId1);
    if (buyerId2) await Buyer.findByIdAndDelete(buyerId2);
    if (supplierId) await BuyerList.deleteMany({ supplierId });
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  it('POST /api/buyer-lists - should create a new custom buyer list', async () => {
    const res = await request(app)
      .post('/api/buyer-lists')
      .send({
        name: 'Northeast Regional Liquidation',
        description: 'Vetted buyers in NYC and Boston',
        supplierId: supplierId.toString(),
        buyerIds: [buyerId1.toString()]
      });

    expect(res.status).toBe(201);
    expect(res.body).toBeDefined();
    expect(res.body._id).toBeDefined();
    expect(res.body.name).toBe('Northeast Regional Liquidation');
    expect(res.body.type).toBe('custom');
    expect(res.body.buyerIds).toHaveLength(1);
  });

  it('GET /api/buyer-lists - should retrieve all buyer lists for supplier', async () => {
    await BuyerList.create({
      name: 'Primary Buyers',
      type: 'primary',
      supplierId,
      buyerIds: [buyerId1]
    });

    const res = await request(app)
      .get(`/api/buyer-lists?supplierId=${supplierId.toString()}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
  });

  it('GET /api/buyer-lists/:id - should fetch a single buyer list with populated buyers', async () => {
    const list = await BuyerList.create({
      name: 'Secondary Buyers',
      type: 'secondary',
      supplierId,
      buyerIds: [buyerId1, buyerId2]
    });

    const res = await request(app)
      .get(`/api/buyer-lists/${list._id}`);

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Secondary Buyers');
    expect(res.body.buyerIds).toHaveLength(2);
  });

  it('PUT /api/buyer-lists/:id - should update custom list name and description', async () => {
    const list = await BuyerList.create({
      name: 'Old List Name',
      description: 'Old Description',
      type: 'custom',
      supplierId,
      buyerIds: [buyerId1]
    });

    const res = await request(app)
      .put(`/api/buyer-lists/${list._id}`)
      .send({
        name: 'Updated List Name',
        description: 'Updated Description'
      });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Updated List Name');
    expect(res.body.description).toBe('Updated Description');
  });

  it('DELETE /api/buyer-lists/:id - should delete custom list successfully', async () => {
    const list = await BuyerList.create({
      name: 'Temporary List',
      type: 'custom',
      supplierId,
      buyerIds: []
    });

    const res = await request(app)
      .delete(`/api/buyer-lists/${list._id}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);

    const deleted = await BuyerList.findById(list._id);
    expect(deleted).toBeNull();
  });

  it('DELETE /api/buyer-lists/:id - should reject deletion of system default lists (primary/secondary)', async () => {
    const primaryList = await BuyerList.create({
      name: 'Primary Buyers Default',
      type: 'primary',
      supplierId,
      buyerIds: []
    });

    const res = await request(app)
      .delete(`/api/buyer-lists/${primaryList._id}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/default/i);

    // Verify list was not deleted
    const check = await BuyerList.findById(primaryList._id);
    expect(check).not.toBeNull();
  });

  it('PUT /api/buyer-lists/:id/members - should update member buyer IDs for a list', async () => {
    const list = await BuyerList.create({
      name: 'Member List',
      type: 'custom',
      supplierId,
      buyerIds: [buyerId1]
    });

    const res = await request(app)
      .put(`/api/buyer-lists/${list._id}/members`)
      .send({
        buyerIds: [buyerId1.toString(), buyerId2.toString()]
      });

    expect(res.status).toBe(200);
    expect(res.body.buyerIds).toHaveLength(2);
  });
});
