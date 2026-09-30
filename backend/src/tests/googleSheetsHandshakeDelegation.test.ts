import mongoose from 'mongoose';
import * as ingestService from '../services/ingestService';
import Supplier from '../models/Supplier';
import SupplierTemplate from '../models/SupplierTemplate';
import GoogleSheetsSyncConfig from '../models/GoogleSheetsSyncConfig';

describe('Slice 1: ingestService Template Mapping Persistence and Dynamic Sample Rows', () => {
  let supplierId: string;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ind-spoiler-alert-test');
    }

    await Supplier.deleteMany({ companyCode: 'HANDSHAKE_SUP' });
    const supplier = await Supplier.create({
      name: 'Handshake Test Supplier',
      companyCode: 'HANDSHAKE_SUP',
      preferredDisposition: 'sell',
      active: true
    });
    supplierId = supplier._id.toString();

    await GoogleSheetsSyncConfig.deleteMany({ supplierId });
    await GoogleSheetsSyncConfig.create({
      supplierId,
      spreadsheetId: 'sheet-handshake-123',
      sheetName: 'Inventory Sheet',
      ingressKey: 'test-handshake-sec-key-1',
      syncStatus: 'idle'
    });
  });

  afterAll(async () => {
    await GoogleSheetsSyncConfig.deleteMany({ supplierId });
    await SupplierTemplate.deleteMany({ supplierId });
    await Supplier.deleteMany({ _id: supplierId });
  });

  it('saveGoogleSheetsMapping creates or updates SupplierTemplate and binds to GoogleSheetsSyncConfig', async () => {
    const columnMappings = {
      sku: 'Item Code',
      description: 'Product Title',
      quantity: 'Case Count',
      expirationDate: 'Best Before',
      originalPrice: 'Unit Price'
    };

    const result = await (ingestService as any).saveGoogleSheetsMapping({
      supplierId,
      spreadsheetId: 'sheet-handshake-123',
      sheetName: 'Inventory Sheet',
      templateName: 'Google Sheets Template',
      columnMappings
    });

    expect(result).toBeDefined();
    expect(result.supplierTemplateId).toBeDefined();

    const template = await SupplierTemplate.findById(result.supplierTemplateId);
    expect(template).toBeDefined();
    expect(template?.supplierId.toString()).toBe(supplierId);
    expect(template?.columnMappings.get('sku') || (template?.columnMappings as any)?.sku).toBe('Item Code');

    const config = await GoogleSheetsSyncConfig.findOne({ supplierId });
    expect(config?.supplierTemplateId?.toString()).toBe(result.supplierTemplateId.toString());
  });

  it('getGoogleSheetsSampleRows returns dynamic schema sampling and incorporates SupplierTemplate mappings', async () => {
    const sampleResult = await (ingestService as any).getGoogleSheetsSampleRows({
      supplierId,
      spreadsheetId: 'sheet-handshake-123',
      sheetName: 'Inventory Sheet'
    });

    expect(sampleResult).toBeDefined();
    expect(sampleResult.documentId).toContain('gsheet-handshake');
    expect(sampleResult.fileName).toContain('Inventory Sheet');
    expect(Array.isArray(sampleResult.rawGrid)).toBe(true);
    expect(sampleResult.rawGrid.length).toBeGreaterThan(1);

    // Headers should match either template or canonical schema
    const headers = sampleResult.rawGrid[0];
    expect(headers).toContain('Item Code');
    expect(headers).toContain('Product Title');

    // suggestedMapping should reflect the saved template mapping
    expect(sampleResult.suggestedMapping).toBeDefined();
    expect(sampleResult.suggestedMapping.sku).toBe('Item Code');
    expect(sampleResult.suggestedMapping.description).toBe('Product Title');
    expect(sampleResult.suggestedMapping.quantity).toBe('Case Count');
  });
});
