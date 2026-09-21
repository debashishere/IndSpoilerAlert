import request from 'supertest';
import mongoose from 'mongoose';
import app from '../index';
import Sale from '../models/Sale';
import SupplierTemplate from '../models/SupplierTemplate';
import DocumentImport from '../models/DocumentImport';
import Supplier from '../models/Supplier';

describe('Sales Ingestion Semantic Rules & Aggregation Pipeline', () => {
  let supplierId: string;
  let documentId: string;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ind-spoiler-alert-test');
    }

    const supp = await Supplier.create({
      name: 'Sales Rules Supplier',
      companyCode: 'SRSUP',
      preferredDisposition: 'sell'
    });
    supplierId = supp._id.toString();

    const doc = await DocumentImport.create({
      fileName: 'sales_with_rules.csv',
      status: 'parsed',
      rawGrid: [
        ['Item_SKU', 'Lot_Code', 'Units', 'Unit_Rate', 'Transaction_Gross', 'Customer_Note'],
        ['SKU-A', 'LOT-A1', '10', '10.00', '$100.00', 'Special handling'],
        ['SKU-B', 'LOT-B1', '20', '15.00', '$300.00', 'Standard dock delivery']
      ],
      suggestedMapping: {}
    });
    documentId = doc._id.toString();
  });

  afterAll(async () => {
    await Supplier.deleteMany({ companyCode: 'SRSUP' });
    await DocumentImport.deleteMany({ fileName: 'sales_with_rules.csv' });
    await Sale.deleteMany({ sku: { $in: ['SKU-A', 'SKU-B'] } });
    await SupplierTemplate.deleteMany({ templateName: 'Sales_Template_With_Rules' });
  });

  it('should accept semanticRules in confirm-sales endpoint, calculate statistical aggregates, and persist attributes and template', async () => {
    const semanticRules = [
      { sourceKey: 'Transaction_Gross', targetKey: 'meanGross', transform: 'mean' },
      { sourceKey: 'Transaction_Gross', targetKey: 'shareOfGrossPct', transform: 'percentage' },
      { sourceKey: 'Customer_Note', targetKey: 'customerNote' }
    ];

    const res = await request(app)
      .post('/api/ingest/confirm-sales')
      .send({
        documentId,
        supplierId,
        mappings: {
          sku: 'Item_SKU',
          lotNumber: 'Lot_Code',
          quantity: 'Units',
          price: 'Unit_Rate'
        },
        saveTemplate: true,
        templateName: 'Sales_Template_With_Rules',
        semanticRules
      });

    expect(res.status).toBe(200);
    expect(res.body.countImported).toBe(2);

    // Verify Sales records with attributes
    // Total sum = 100 + 300 = 400. Mean = 200.
    // SKU-A share = 100/400 * 100 = 25%
    // SKU-B share = 300/400 * 100 = 75%
    const saleA = await Sale.findOne({ sku: 'SKU-A' });
    expect(saleA).toBeTruthy();
    expect(saleA!.attributes).toBeDefined();
    expect(saleA!.attributes?.get('meanGross')).toBe(200);
    expect(saleA!.attributes?.get('shareOfGrossPct')).toBe(25);
    expect(saleA!.attributes?.get('customerNote')).toBe('Special handling');
    expect(saleA!.rawAttributes?.get('Customer_Note')).toBe('Special handling');

    const saleB = await Sale.findOne({ sku: 'SKU-B' });
    expect(saleB).toBeTruthy();
    expect(saleB!.attributes).toBeDefined();
    expect(saleB!.attributes?.get('meanGross')).toBe(200);
    expect(saleB!.attributes?.get('shareOfGrossPct')).toBe(75);
    expect(saleB!.attributes?.get('customerNote')).toBe('Standard dock delivery');

    // Verify template persistence
    const savedTemplate = await SupplierTemplate.findOne({ templateName: 'Sales_Template_With_Rules' });
    expect(savedTemplate).toBeTruthy();
    expect(savedTemplate!.semanticRules).toHaveLength(3);
    expect(savedTemplate!.semanticRules?.[0].targetKey).toBe('meanGross');
  });
});
