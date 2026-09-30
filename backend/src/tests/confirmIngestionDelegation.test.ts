import mongoose from 'mongoose';
import app from '../index';
import Supplier from '../models/Supplier';
import DistributionCenter from '../models/DistributionCenter';
import ProductMaster from '../models/ProductMaster';
import InventoryLot from '../models/InventoryLot';
import DocumentImport from '../models/DocumentImport';
import SupplierTemplate from '../models/SupplierTemplate';
import * as ingestService from '../services/ingestService';
import { IngestionBatch } from '../utils/ingestionNormalization';

describe('01C: CSV Confirm Ingestion Adapter & Delegation Seam', () => {
  jest.setTimeout(25000);
  let supplierId: string;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ind-spoiler-alert-test');
    }

    await Supplier.deleteMany({ companyCode: 'TSUPCONFIRM1' });
    const supplier = await Supplier.create({
      name: 'Test Confirm Supplier',
      companyCode: 'TSUPCONFIRM1',
      preferredDisposition: 'sell'
    });
    supplierId = supplier._id.toString();
  });

  afterAll(async () => {
    await SupplierTemplate.deleteMany({ supplierId });
    await InventoryLot.deleteMany({ supplierId });
    await ProductMaster.deleteMany({ supplierId });
    await DistributionCenter.deleteMany({ supplierId });
    await DocumentImport.deleteMany({ fileName: { $in: ['delegate_test.csv', 'empty_grid.csv', 'unmapped_attrs.csv'] } });
    await Supplier.deleteMany({ _id: supplierId });
  });

  it('delegates confirmIngestion to processBatch, saves SupplierTemplate, and updates DocumentImport status', async () => {
    const doc = await DocumentImport.create({
      fileName: 'delegate_test.csv',
      status: 'parsed',
      rawGrid: [
        ['ItemCode', 'ItemDesc', 'CaseCount', 'BestBy', 'UnitCost'],
        ['SKU-CONF-001', 'Oatmilk Vanilla 64oz', '150', '2027-02-15', '3.75'],
        ['SKU-CONF-002', 'Almond Butter 16oz', '80', '2027-05-20', '5.20']
      ],
      supplierId
    });

    const mappings = {
      sku: 'ItemCode',
      description: 'ItemDesc',
      quantityCases: 'CaseCount',
      expirationDate: 'BestBy',
      originalPrice: 'UnitCost'
    };

    const result = await ingestService.confirmIngestion(
      doc._id.toString(),
      supplierId,
      mappings,
      true,
      'Delegate Test Template'
    );

    // Verify lots were imported in the database
    const lots = await InventoryLot.find({ _id: { $in: result.lotIds } });
    expect(lots).toHaveLength(2);
    const sku1Lot = lots.find(l => l.quantityCases === 150);
    expect(sku1Lot).toBeDefined();
    expect(sku1Lot?.costPerCase).toBe(3.75);

    // Verify backward-compatible result shape
    expect(result).toBeDefined();
    expect(result.countImported).toBe(2);
    expect(result.lotIds).toHaveLength(2);
    expect(result.errors).toEqual([]);

    // Verify DocumentImport status updated to 'imported'
    const updatedDoc = await DocumentImport.findById(doc._id);
    expect(updatedDoc?.status).toBe('imported');
    expect(updatedDoc?.recordsParsed).toBe(2);
    expect(updatedDoc?.importErrors).toEqual([]);

    // Verify SupplierTemplate saved
    const template = await SupplierTemplate.findOne({ supplierId, templateName: 'Delegate Test Template' });
    expect(template).toBeTruthy();
    expect(template?.columnMappings.get('sku')).toBe('ItemCode');
  });

  it('translates unmapped columns and semantic rules into lot attributes when delegating to processBatch', async () => {
    const doc = await DocumentImport.create({
      fileName: 'unmapped_attrs.csv',
      status: 'parsed',
      rawGrid: [
        ['ItemCode', 'ItemDesc', 'CaseCount', 'BestBy', 'UnitCost', 'StorageTemp_C', 'Kosher Status'],
        ['SKU-ATTR-001', 'Frozen Waffles 12ct', '60', '2027-06-30', '4.10', '-18', 'YES']
      ],
      supplierId
    });

    const semanticRules = [
      { sourceKey: 'StorageTemp_C', targetKey: 'tempMinF', transform: 'celsiusToFahrenheit' }
    ];

    const mappings = {
      sku: 'ItemCode',
      description: 'ItemDesc',
      quantityCases: 'CaseCount',
      expirationDate: 'BestBy',
      originalPrice: 'UnitCost'
    };

    const result = await ingestService.confirmIngestion(
      doc._id.toString(),
      supplierId,
      mappings,
      true,
      'Attr Test Template',
      semanticRules
    );

    expect(result.countImported).toBe(1);

    const lot = await InventoryLot.findById(result.lotIds[0]);
    expect(lot).toBeTruthy();
    expect(lot?.attributes).toBeDefined();
    expect(lot?.attributes?.get('tempMinF')).toBeCloseTo(-0.4, 1);
    expect(lot?.attributes?.get('certifications')).toEqual(expect.arrayContaining(['kosher']));
    expect(lot?.rawAttributes).toBeDefined();
    expect(lot?.rawAttributes?.get('StorageTemp_C')).toBe('-18');
    expect(lot?.rawAttributes?.get('Kosher Status')).toBe('YES');
  });

  it('throws an error if DocumentImport has no data rows', async () => {
    const doc = await DocumentImport.create({
      fileName: 'empty_grid.csv',
      status: 'parsed',
      rawGrid: [['Header1', 'Header2']],
      supplierId
    });

    await expect(
      ingestService.confirmIngestion(
        doc._id.toString(),
        supplierId,
        { sku: 'Header1', description: 'Header2' },
        false
      )
    ).rejects.toThrow('Document does not contain any data rows.');
  });
});
