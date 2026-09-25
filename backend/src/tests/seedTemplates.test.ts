import mongoose from 'mongoose';
import EmailTemplate from '../models/EmailTemplate';
import Supplier from '../models/Supplier';
import { seedTemplates } from '../scripts/seedTemplates';

describe('Seed Script: seedTemplates.ts', () => {
  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ind-spoiler-alert-test-seedtemplates';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }
  });

  afterAll(async () => {
    await EmailTemplate.deleteMany({});
    await Supplier.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await EmailTemplate.deleteMany({});
    await Supplier.deleteMany({});
  });

  it('seeds standard B2B transaction and deal notification templates into MongoDB', async () => {
    // 1. Create mock suppliers
    const supplier1 = await Supplier.create({ name: 'Supplier A', companyCode: 'SUPA' });
    const supplier2 = await Supplier.create({ name: 'Supplier B', companyCode: 'SUPB' });

    // 2. Run seed script
    const result = await seedTemplates();

    expect(result.success).toBe(true);

    // 3. Verify templates created for supplier 1
    const templatesSup1 = await EmailTemplate.find({ supplierId: supplier1._id });
    expect(templatesSup1.length).toBeGreaterThanOrEqual(4);

    const categories = templatesSup1.map((t) => t.category);
    expect(categories).toContain('clearance');
    expect(categories).toContain('auction');
    expect(categories).toContain('award');

    // Verify template attributes
    const clearanceTpl = templatesSup1.find((t) => t.category === 'clearance');
    expect(clearanceTpl).toBeDefined();
    expect(clearanceTpl?.name).toBeTruthy();
    expect(clearanceTpl?.subject).toBeTruthy();
    expect(clearanceTpl?.bodyHtml).toBeTruthy();
    expect(clearanceTpl?.availableTokens).toEqual(
      expect.arrayContaining(['buyer_name', 'lot_title', 'inventory_table', 'quick_bid_link', 'supplier_name'])
    );

    // 4. Verify templates created for supplier 2
    const templatesSup2 = await EmailTemplate.find({ supplierId: supplier2._id });
    expect(templatesSup2.length).toBeGreaterThanOrEqual(4);
  });

  it('is idempotent: running seedTemplates twice does not duplicate templates', async () => {
    const supplier = await Supplier.create({ name: 'Supplier Idempotent', companyCode: 'IDEM' });

    await seedTemplates();
    const countFirstRun = await EmailTemplate.countDocuments({ supplierId: supplier._id });

    await seedTemplates();
    const countSecondRun = await EmailTemplate.countDocuments({ supplierId: supplier._id });

    expect(countSecondRun).toBe(countFirstRun);
  });
});
