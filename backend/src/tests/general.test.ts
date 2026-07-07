import request from 'supertest';
import mongoose from 'mongoose';
import app from '../index';

describe('General API Endpoints', () => {
  afterAll(async () => {
    await mongoose.disconnect();
  });

  it('should return 200 for health check', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      status: 'OK',
      message: 'Express backend is healthy.'
    });
  });

  it('should return active suppliers list', async () => {
    const res = await request(app).get('/api/suppliers');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('should return buyers list', async () => {
    const res = await request(app).get('/api/buyers');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('should create a new buyer via POST /api/buyers', async () => {
    const testEmail = `newbuyer_${Date.now()}@example.com`;
    const res = await request(app)
      .post('/api/buyers')
      .send({
        companyName: 'New Test Buyer Co',
        email: testEmail,
        tier: 'tier1'
      });
    expect(res.status).toBe(201);
    expect(res.body.companyName).toBe('New Test Buyer Co');
    expect(res.body.email).toBe(testEmail);

    // Clean up created buyer
    if (res.body._id) {
      const Buyer = mongoose.model('Buyer');
      await Buyer.findByIdAndDelete(res.body._id);
    }
  });

  it('should return document imports list', async () => {
    const res = await request(app).get('/api/imports');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('should update product allergens', async () => {
    const ProductMaster = mongoose.model('ProductMaster');
    const tempProduct = await ProductMaster.create({
      supplierId: new mongoose.Types.ObjectId(),
      sku: 'TEMP-TEST-SKU',
      category: 'Dry Goods',
      description: 'Temp Test Product',
      shelfLifeDays: 30
    });

    const res = await request(app)
      .put(`/api/products/${tempProduct._id}/allergens`)
      .send({ allergens: ['dairy', 'nuts'] });

    expect(res.status).toBe(200);
    expect(res.body.allergens).toContain('dairy');
    expect(res.body.allergens).toContain('nuts');

    await ProductMaster.findByIdAndDelete(tempProduct._id);
  });

  it('should update buyer allergen exclusions', async () => {
    const Buyer = mongoose.model('Buyer');
    const tempBuyer = await Buyer.create({
      companyName: 'Temp Test Buyer',
      email: 'temp.buyer@test.com',
      acceptsShortDated: true,
      minShelfLife: 7,
      categories: ['Dry Goods'],
      transportRadius: 50,
      warehouseLocations: [{ lat: 40, lng: -80 }]
    });

    const res = await request(app)
      .put(`/api/buyers/${tempBuyer._id}/exclusions`)
      .send({ excludedAllergens: ['milk'] });

    expect(res.status).toBe(200);
    expect(res.body.excludedAllergens).toContain('milk');

    await Buyer.findByIdAndDelete(tempBuyer._id);
  });

  it('should return 200 for sidecar health check at root /sidecar/health', async () => {
    const res = await request(app).get('/sidecar/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('OK');
    expect(res.body.message).toContain('healthy');
  });

  it('should return 200 for sidecar health check under /api/sidecar/health', async () => {
    const res = await request(app).get('/api/sidecar/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('OK');
    expect(res.body.message).toContain('healthy');
  });
});
