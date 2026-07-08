import request from 'supertest';
import mongoose from 'mongoose';
import app from '../index';
import Supplier from '../models/Supplier';
import ProductMaster from '../models/ProductMaster';
import InventoryLot from '../models/InventoryLot';
import MarketplaceListing from '../models/MarketplaceListing';

describe('0085 — Public Buyer Marketplace Listings API (GET /api/v1/marketplace/listings)', () => {
  let supplierId: string;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/spoiler-alert-test';
      await mongoose.connect(mongoUri);
    }

    const supplier = await Supplier.create({ name: 'Fresh Foods Co', companyCode: 'FFC1' });
    supplierId = supplier._id.toString();

    // Create seed listings
    await MarketplaceListing.create([
      {
        opportunityId: new mongoose.Types.ObjectId(),
        supplierId: new mongoose.Types.ObjectId(supplierId),
        publicTitle: 'Organic Whole Milk 1 Gallon',
        category: 'Dairy',
        remainingShelfLife: 0.85,
        availableQuantity: 400,
        publicPrice: 15.00,
        startingPrice: 15.00,
        minimumPrice: 12.00,
        coaVerified: true,
        sanitized: true,
        status: 'published',
        allowBidding: true,
        warehouseRegion: 'Midwest',
        discountTier: 'steep',
        allergens: ['Dairy'],
        certifications: ['USDA Organic', 'Non-GMO']
      },
      {
        opportunityId: new mongoose.Types.ObjectId(),
        supplierId: new mongoose.Types.ObjectId(supplierId),
        publicTitle: 'Cold Pressed Orange Juice 12oz',
        category: 'Beverages',
        remainingShelfLife: 0.40,
        availableQuantity: 1500,
        publicPrice: 8.50,
        startingPrice: 8.50,
        minimumPrice: 6.00,
        coaVerified: true,
        sanitized: true,
        status: 'published',
        allowBidding: true,
        warehouseRegion: 'East Coast',
        discountTier: 'moderate',
        allergens: [],
        certifications: ['Kosher']
      },
      {
        opportunityId: new mongoose.Types.ObjectId(),
        supplierId: new mongoose.Types.ObjectId(supplierId),
        publicTitle: 'Unlisted Test Item',
        category: 'Dry Goods',
        remainingShelfLife: 0.10,
        availableQuantity: 10,
        publicPrice: 2.00,
        startingPrice: 2.00,
        minimumPrice: 1.00,
        coaVerified: false,
        sanitized: true,
        status: 'unlisted',
        allowBidding: false,
        warehouseRegion: 'West Coast',
        discountTier: 'steep'
      }
    ]);
  });

  afterAll(async () => {
    await Supplier.deleteMany({});
    await ProductMaster.deleteMany({});
    await InventoryLot.deleteMany({});
    await MarketplaceListing.deleteMany({});
    await mongoose.connection.close();
  });

  it('should fetch public published marketplace listings without authentication', async () => {
    const res = await request(app).get('/api/v1/marketplace/listings');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.listings)).toBe(true);
    // Should include published/active listings, excluding unlisted
    expect(res.body.listings.length).toBe(2);
    expect(res.body.listings.some((l: any) => l.publicTitle === 'Unlisted Test Item')).toBe(false);
  });

  it('should filter listings by public text search query', async () => {
    const res = await request(app)
      .get('/api/v1/marketplace/listings')
      .query({ search: 'Orange Juice' });

    expect(res.status).toBe(200);
    expect(res.body.listings.length).toBe(1);
    expect(res.body.listings[0].publicTitle).toBe('Cold Pressed Orange Juice 12oz');
  });

  it('should filter listings by dynamic category, region, and discount tier facets', async () => {
    const res = await request(app)
      .get('/api/v1/marketplace/listings')
      .query({ category: 'Dairy', region: 'Midwest' });

    expect(res.status).toBe(200);
    expect(res.body.listings.length).toBe(1);
    expect(res.body.listings[0].category).toBe('Dairy');
    expect(res.body.listings[0].warehouseRegion).toBe('Midwest');
  });
});
