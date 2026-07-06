import request from 'supertest';
import mongoose from 'mongoose';
import app from '../index';
import Buyer from '../models/Buyer';

describe('Slice 4: POST /api/emails/broadcast-preview', () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/spoileralert_test');
    }
  });

  afterAll(async () => {
    await Buyer.deleteMany({ companyName: /Test Preview Buyer/i });
  });

  it('should return matched buyer counts, case totals, and compiled preview payload', async () => {
    const buyer = await Buyer.create({
      companyName: 'Test Preview Buyer 101',
      email: 'preview101@testbuyer.com',
      acceptsShortDated: true,
      minShelfLife: 10,
      categories: ['dairy'],
      transportRadius: 150,
      warehouseLocations: [{ lat: 40.7128, lng: -74.006 }]
    });

    const response = await request(app)
      .post('/api/emails/broadcast-preview')
      .send({
        supplierId: 'sup-preview-101',
        buyerSegment: 'short_dated_grocers',
        explicitBuyerIds: [buyer._id.toString()],
        lotIds: [],
        templateId: 'clearance-starter-v1',
        emailSubject: 'Clearance Alert for {{buyer_name}}',
        emailBodyHtml: '<p>Dear {{buyer_name}},</p>{{inventory_table}}'
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.recipientCount).toBeGreaterThanOrEqual(1);
    expect(response.body.matchedBuyers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ email: 'preview101@testbuyer.com' })
      ])
    );
    expect(response.body.previewSubject).toContain('Test Preview Buyer 101');
    expect(response.body.previewBodyHtml).toContain('<table');
  });
});
