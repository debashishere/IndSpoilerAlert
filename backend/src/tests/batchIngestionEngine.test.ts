import mongoose from 'mongoose';
import app from '../index';
import Supplier from '../models/Supplier';
import DistributionCenter from '../models/DistributionCenter';
import ProductMaster from '../models/ProductMaster';
import InventoryLot from '../models/InventoryLot';
import SupplierTemplate from '../models/SupplierTemplate';
import Buyer from '../models/Buyer';
import Offer from '../models/Offer';
import Award from '../models/Award';
import Activity from '../models/Activity';
import GoogleSheetsSyncConfig from '../models/GoogleSheetsSyncConfig';
import { processBatch, recordSyncCompletion } from '../services/ingestService';
import { IngestionBatch } from '../utils/ingestionNormalization';

describe('Batch Ingestion Engine - Slice 1: Column Mapping Alignment & Basic Insertion', () => {
  jest.setTimeout(25000);
  let supplierId: string;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ind-spoiler-alert-test');
    }

    await Supplier.deleteMany({ companyCode: 'TSUPBATCH1' });
    const supplier = await Supplier.create({
      name: 'Test Batch Supplier',
      companyCode: 'TSUPBATCH1',
      preferredDisposition: 'sell'
    });
    supplierId = supplier._id.toString();
  });

  afterAll(async () => {
    await InventoryLot.deleteMany({ supplierId });
    await ProductMaster.deleteMany({ supplierId });
    await DistributionCenter.deleteMany({ supplierId });
    await Supplier.deleteMany({ _id: supplierId });
  });

  it('successfully processes a single-row batch with explicit column mappings and auto-creates DC', async () => {
    const batch: IngestionBatch = {
      supplierId,
      headers: ['SKU_Col', 'Desc_Col', 'Qty_Col', 'Exp_Col', 'Price_Col'],
      rows: [['SKU-BATCH-001', 'Organic Oat Milk 32oz', '50', '2026-12-15', '3.50']],
      columnMappings: {
        sku: 'SKU_Col',
        description: 'Desc_Col',
        quantityCases: 'Qty_Col',
        expirationDate: 'Exp_Col',
        originalPrice: 'Price_Col'
      },
      source: 'csv'
    };

    const result = await processBatch(batch);

    expect(result.totalRows).toBe(1);
    expect(result.inserted).toBe(1);
    expect(result.updated).toBe(0);
    expect(result.depleted).toBe(0);
    expect(result.errors).toEqual([]);
    expect(result.lotIds.length).toBe(1);

    // Verify Distribution Center auto-created
    const dc = await DistributionCenter.findOne({ supplierId });
    expect(dc).not.toBeNull();
    expect(dc?.name).toContain('Test Batch Supplier');

    // Verify ProductMaster created
    const product = await ProductMaster.findOne({ supplierId, sku: 'SKU-BATCH-001' });
    expect(product).not.toBeNull();
    expect(['Organic Oat Milk 32oz', 'Organic Oat Milk']).toContain(product?.description);

    // Verify InventoryLot created
    const lot = await InventoryLot.findById(result.lotIds[0]);
    expect(lot).not.toBeNull();
    expect(lot?.supplierId.toString()).toBe(supplierId);
    expect(lot?.productId.toString()).toBe(product?._id.toString());
    expect(lot?.distributionCenterId.toString()).toBe(dc?._id.toString());
    expect(lot?.quantityCases).toBe(50);
    expect(lot?.availableQty).toBe(50);
    expect(lot?.costPerCase).toBe(3.50);
    expect(lot?.standardSellPrice).toBe(3.50);
    expect(lot?.status).toBe('pending');
  });

  it('falls back to suggestMappings when columnMappings is empty', async () => {
    const batch: IngestionBatch = {
      supplierId,
      headers: ['SKU', 'Description', 'Quantity Cases', 'Expiration Date', 'Cost Per Case'],
      rows: [['SKU-BATCH-002', 'Almond Milk Vanilla 64oz', '20', '2026-11-20', '4.25']],
      columnMappings: {},
      source: 'google-sheets'
    };

    const result = await processBatch(batch);

    expect(result.totalRows).toBe(1);
    expect(result.inserted).toBe(1);
    expect(result.errors).toEqual([]);
    expect(result.lotIds.length).toBe(1);

    const product = await ProductMaster.findOne({ supplierId, sku: 'SKU-BATCH-002' });
    expect(product).not.toBeNull();
    expect(['Almond Milk Vanilla 64oz', 'Almond Milk Vanilla']).toContain(product?.description);

    const lot = await InventoryLot.findById(result.lotIds[0]);
    expect(lot).not.toBeNull();
    expect(lot?.quantityCases).toBe(20);
    expect(lot?.costPerCase).toBe(4.25);
  });

  it('deduplicates ProductMaster across multiple rows using a single batched $in pre-index query', async () => {
    // Pre-seed an existing product
    await ProductMaster.create({
      supplierId,
      sku: 'SKU-PRELOAD-01',
      description: 'Old Preloaded Name',
      category: 'Dry Goods',
      shelfLifeDays: 30
    });

    const findSpy = jest.spyOn(ProductMaster, 'find');
    const findOneSpy = jest.spyOn(ProductMaster, 'findOne');

    const batch: IngestionBatch = {
      supplierId,
      headers: ['SKU', 'Description', 'Category', 'Quantity', 'ExpDate', 'Lot'],
      rows: [
        ['SKU-PRELOAD-01', 'Updated Preloaded Name', 'Beverages', '25', '2026-12-01', 'LOT-PRE-1'],
        ['SKU-MULTI-02', 'Multi Lot Item', 'Dairy', '10', '2026-12-01', 'LOT-M-1'],
        ['SKU-MULTI-02', 'Multi Lot Item Renamed', 'Dairy', '15', '2026-12-05', 'LOT-M-2'],
        ['', 'Fallback Match Item', 'Produce', '5', '2026-10-15', 'LOT-FB-1'],
        ['', 'Fallback Match Item', 'Produce', '8', '2026-10-20', 'LOT-FB-2']
      ],
      columnMappings: {
        sku: 'SKU',
        description: 'Description',
        category: 'Category',
        quantityCases: 'Quantity',
        expirationDate: 'ExpDate',
        lotNumber: 'Lot'
      },
      source: 'csv'
    };

    const result = await processBatch(batch);

    expect(result.totalRows).toBe(5);
    expect(result.inserted).toBe(5);
    expect(result.errors).toEqual([]);
    expect(result.lotIds.length).toBe(5);

    // Verify batched $in was called for ProductMaster lookup
    expect(findSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        supplierId,
        sku: expect.objectContaining({
          $in: expect.arrayContaining(['SKU-PRELOAD-01', 'SKU-MULTI-02', 'FALLBACK-MATCH-ITEM'])
        })
      })
    );

    // Verify findOne was NOT called per-row for ProductMaster lookups
    const productFindOneCalls = findOneSpy.mock.calls.filter(call => {
      const query = call[0] as any;
      return query && query.sku !== undefined;
    });
    expect(productFindOneCalls.length).toBe(0);

    // Verify preloaded product was updated
    const preloadedProduct = await ProductMaster.findOne({ supplierId, sku: 'SKU-PRELOAD-01' });
    expect(preloadedProduct?.description).toBe('Updated Preloaded Name');
    expect(preloadedProduct?.category).toBe('Beverages');
    expect(preloadedProduct?.shelfLifeDays).toBe(120); // Beverages default

    // Verify multi-lot items share the same ProductMaster
    const multiLots = await InventoryLot.find({
      supplierId,
      lotNumber: { $in: ['LOT-M-1', 'LOT-M-2'] }
    });
    expect(multiLots.length).toBe(2);
    expect(multiLots[0].productId.toString()).toBe(multiLots[1].productId.toString());

    // Verify fallback items share the same ProductMaster
    const fallbackLots = await InventoryLot.find({
      supplierId,
      lotNumber: { $in: ['LOT-FB-1', 'LOT-FB-2'] }
    });
    expect(fallbackLots.length).toBe(2);
    expect(fallbackLots[0].productId.toString()).toBe(fallbackLots[1].productId.toString());

    // Clean up spies
    findSpy.mockRestore();
    findOneSpy.mockRestore();
  });

  it('reconciles inventory lots by natural key (distributionCenterId, productId, lotNumber): inserts, updates, and depletes', async () => {
    // Initial batch inserting 2 lots
    const batch1: IngestionBatch = {
      supplierId,
      headers: ['SKU', 'Description', 'Quantity', 'Price', 'ExpDate', 'Lot'],
      rows: [
        ['SKU-RECON-01', 'Reconciliation Oat Milk', '100', '5.00', '2026-12-31', 'LOT-RECON-01'],
        ['SKU-RECON-02', 'Reconciliation Butter', '50', '10.00', '2026-11-30', 'LOT-RECON-02']
      ],
      columnMappings: {
        sku: 'SKU',
        description: 'Description',
        quantityCases: 'Quantity',
        originalPrice: 'Price',
        expirationDate: 'ExpDate',
        lotNumber: 'Lot'
      },
      source: 'csv'
    };

    const res1 = await processBatch(batch1);
    expect(res1.totalRows).toBe(2);
    expect(res1.inserted).toBe(2);
    expect(res1.updated).toBe(0);
    expect(res1.depleted).toBe(0);

    // Follow-up batch: update LOT-RECON-01, deplete LOT-RECON-02, insert LOT-RECON-03
    const batch2: IngestionBatch = {
      supplierId,
      headers: ['SKU', 'Description', 'Quantity', 'Price', 'ExpDate', 'Lot'],
      rows: [
        ['SKU-RECON-01', 'Reconciliation Oat Milk', '80', '5.50', '2027-01-15', 'LOT-RECON-01'],
        ['SKU-RECON-02', 'Reconciliation Butter', '0', '10.00', '2026-11-30', 'LOT-RECON-02'],
        ['SKU-RECON-03', 'Reconciliation Cheese', '30', '8.00', '2026-10-31', 'LOT-RECON-03']
      ],
      columnMappings: {
        sku: 'SKU',
        description: 'Description',
        quantityCases: 'Quantity',
        originalPrice: 'Price',
        expirationDate: 'ExpDate',
        lotNumber: 'Lot'
      },
      source: 'csv'
    };

    const res2 = await processBatch(batch2);
    expect(res2.totalRows).toBe(3);
    expect(res2.inserted).toBe(1);
    expect(res2.updated).toBe(1);
    expect(res2.depleted).toBe(1);
    expect(res2.errors).toEqual([]);
    expect(res2.lotIds.length).toBe(3);

    // Verify Lot 1 was updated
    const lot1 = await InventoryLot.findOne({ supplierId, lotNumber: 'LOT-RECON-01' });
    expect(lot1).not.toBeNull();
    expect(lot1?.quantityCases).toBe(80);
    expect(lot1?.availableQty).toBe(80);
    expect(lot1?.costPerCase).toBe(5.50);
    expect(lot1?.expirationDate.toISOString()).toContain('2027-01-15');

    // Verify Lot 2 was depleted
    const lot2 = await InventoryLot.findOne({ supplierId, lotNumber: 'LOT-RECON-02' });
    expect(lot2).not.toBeNull();
    expect(lot2?.quantityCases).toBe(0);
    expect(lot2?.availableQty).toBe(0);
    expect(lot2?.status).toBe('depleted');

    // Verify Lot 3 was inserted
    const lot3 = await InventoryLot.findOne({ supplierId, lotNumber: 'LOT-RECON-03' });
    expect(lot3).not.toBeNull();
    expect(lot3?.quantityCases).toBe(30);
    expect(lot3?.availableQty).toBe(30);
    expect(lot3?.costPerCase).toBe(8.00);
  });

  it('collects non-fatal row validation errors into ledger without aborting batch execution', async () => {
    const batch: IngestionBatch = {
      supplierId,
      headers: ['SKU', 'Description', 'Quantity', 'ExpDate', 'Price'],
      rows: [
        ['SKU-VALID-01', 'Valid Organic Apple Juice', '40', '2026-11-20', '3.00'],
        ['', '', '50', '2026-11-20', '2.50'], // Missing SKU and Description
        ['SKU-MAL-02', 'Item with Bad Quantity', 'NOT_A_NUMBER', '2026-11-20', '4.00'], // Malformed quantity
        ['', 'Fallback SKU Item Valid', '15', '12/25/2026', '6.00'], // Valid fallback SKU and slash date
        ['', '', '', '', ''] // Entirely empty row (skipped, not an error)
      ],
      columnMappings: {
        sku: 'SKU',
        description: 'Description',
        quantityCases: 'Quantity',
        expirationDate: 'ExpDate',
        originalPrice: 'Price'
      },
      source: 'csv'
    };

    const result = await processBatch(batch);

    // 4 rows evaluated (5th empty row ignored)
    expect(result.totalRows).toBe(4);
    expect(result.inserted).toBe(2); // Valid rows committed
    expect(result.updated).toBe(0);
    expect(result.depleted).toBe(0);
    expect(result.errors.length).toBe(2);

    expect(result.errors[0]).toContain('Row 2: Missing SKU or Description');
    expect(result.errors[1]).toContain('Row 3: Malformed quantity');

    expect(result.lotIds.length).toBe(2);

    // Valid lots were committed
    const lot1 = await InventoryLot.findOne({ supplierId, quantityCases: 40 });
    expect(lot1).not.toBeNull();

    const fallbackProduct = await ProductMaster.findOne({ supplierId, sku: 'FALLBACK-SKU-ITEM-VALID' });
    expect(fallbackProduct).not.toBeNull();
    const lot2 = await InventoryLot.findOne({ supplierId, productId: fallbackProduct?._id });
    expect(lot2).not.toBeNull();
    expect(lot2?.quantityCases).toBe(15);
  });

  it('dynamically resolves or creates named warehouse DistributionCenters and scopes lots accordingly', async () => {
    const dcFindOneSpy = jest.spyOn(DistributionCenter, 'findOne');

    const batch: IngestionBatch = {
      supplierId,
      headers: ['SKU', 'Description', 'Quantity', 'Warehouse', 'Lot', 'ExpDate'],
      rows: [
        ['SKU-WH-01', 'Dallas Cream Cheese', '60', 'Dallas Regional Facility', 'LOT-DAL-1', '2026-12-01'],
        ['SKU-WH-01', 'Dallas Cream Cheese Pack 2', '40', 'Dallas Regional Facility', 'LOT-DAL-2', '2026-12-05'],
        ['SKU-WH-02', 'Chicago Frozen Peas', '80', 'Chicago Cold Hub', 'LOT-ORD-1', '2027-02-15']
      ],
      columnMappings: {
        sku: 'SKU',
        description: 'Description',
        quantityCases: 'Quantity',
        warehouse: 'Warehouse',
        lotNumber: 'Lot',
        expirationDate: 'ExpDate'
      },
      source: 'google-sheets'
    };

    const result = await processBatch(batch);

    // Verify dcCache prevented duplicate lookups for Dallas facility on row 2
    const dallasLookups = dcFindOneSpy.mock.calls.filter(call => {
      const q = call[0] as any;
      return q && q.name === 'Dallas Regional Facility';
    });
    expect(dallasLookups.length).toBe(1);
    dcFindOneSpy.mockRestore();

    expect(result.totalRows).toBe(3);
    expect(result.inserted).toBe(3);
    expect(result.errors).toEqual([]);

    // Check DCs created
    const dallasDc = await DistributionCenter.findOne({ supplierId, name: 'Dallas Regional Facility' });
    expect(dallasDc).not.toBeNull();
    expect(dallasDc?.code).toContain('DALLAS-REGIONAL-FACILITY');

    const chicagoDc = await DistributionCenter.findOne({ supplierId, name: 'Chicago Cold Hub' });
    expect(chicagoDc).not.toBeNull();
    expect(chicagoDc?.code).toContain('CHICAGO-COLD-HUB');

    // Verify lots are scoped to respective DCs
    const dalLot1 = await InventoryLot.findOne({ supplierId, lotNumber: 'LOT-DAL-1' });
    const dalLot2 = await InventoryLot.findOne({ supplierId, lotNumber: 'LOT-DAL-2' });
    const ordLot = await InventoryLot.findOne({ supplierId, lotNumber: 'LOT-ORD-1' });

    expect(dalLot1?.distributionCenterId.toString()).toBe(dallasDc?._id.toString());
    expect(dalLot2?.distributionCenterId.toString()).toBe(dallasDc?._id.toString());
    expect(ordLot?.distributionCenterId.toString()).toBe(chicagoDc?._id.toString());
  });

  it('applies sidecar normalization when available and falls back gracefully when sidecar is offline', async () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const axios = require('axios');
    const axiosPostSpy = jest.spyOn(axios, 'post');

    // Simulate sidecar responding for first item, throwing error for second item
    axiosPostSpy.mockImplementation((async (...args: any[]) => {
      const [url, data] = args;
      if (typeof url === 'string' && url.includes('/normalize-product-name')) {
        if (data && data.name && data.name.includes('Sidecar Success')) {
          return {
            data: {
              clean_name: 'Normalized Golden Honey',
              category: 'Dry Goods'
            }
          };
        } else {
          throw new Error('Sidecar connection refused (simulated offline)');
        }
      }
      return { data: {} };
    }) as any);

    const batch: IngestionBatch = {
      supplierId,
      headers: ['SKU', 'Description', 'Quantity', 'ExpDate', 'Lot'],
      rows: [
        ['SKU-SIDECAR-01', 'Sidecar Success Raw Name 12oz', '30', '2027-01-01', 'LOT-SC-01'],
        ['SKU-SIDECAR-02', 'Offline Sidecar Item 16oz', '20', '2026-12-01', 'LOT-SC-02']
      ],
      columnMappings: {
        sku: 'SKU',
        description: 'Description',
        quantityCases: 'Quantity',
        expirationDate: 'ExpDate',
        lotNumber: 'Lot'
      },
      source: 'csv'
    };

    const result = await processBatch(batch);

    expect(result.totalRows).toBe(2);
    expect(result.inserted).toBe(2);
    expect(result.errors).toEqual([]);

    // Verify first product used sidecar normalization
    const prod1 = await ProductMaster.findOne({ supplierId, sku: 'SKU-SIDECAR-01' });
    expect(prod1?.description).toBe('Normalized Golden Honey');
    expect(prod1?.category).toBe('Dry Goods');

    // Verify second product used in-process fallback
    const prod2 = await ProductMaster.findOne({ supplierId, sku: 'SKU-SIDECAR-02' });
    expect(prod2?.description).toBe('Offline Sidecar Item 16oz');
    expect(prod2?.category).toBe('Dry Goods'); // in-process default fallback

    axiosPostSpy.mockRestore();
  });
});

describe('Batch Ingestion Engine - Slice 2: Attribute Support & Dynamic Data Translation', () => {
  let supplierId: string;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ind-spoiler-alert-test');
    }

    await Supplier.deleteMany({ companyCode: 'TSUPBATCH2' });
    const supplier = await Supplier.create({
      name: 'Test Batch Supplier 2',
      companyCode: 'TSUPBATCH2',
      preferredDisposition: 'sell'
    });
    supplierId = supplier._id.toString();
  });

  afterAll(async () => {
    await InventoryLot.deleteMany({ supplierId });
    await ProductMaster.deleteMany({ supplierId });
    await DistributionCenter.deleteMany({ supplierId });
    await SupplierTemplate.deleteMany({ supplierId });
    await Supplier.deleteMany({ _id: supplierId });
  });

  it('translates unmapped columns into attributes and rawAttributes using batch semantic rules and grid aggregates', async () => {
    const batch: IngestionBatch = {
      supplierId,
      headers: ['SKU', 'Description', 'Quantity', 'ExpDate', 'Storage Temp C', 'Kosher Certified', 'Defect Count'],
      rows: [
        ['SKU-ATTR-01', 'Artisan Cheese Wheel', '50', '2026-12-31', '4', 'Yes', '10'],
        ['SKU-ATTR-02', 'Artisan Butter Block', '30', '2026-11-30', '10', 'No', '30']
      ],
      columnMappings: {
        sku: 'SKU',
        description: 'Description',
        quantityCases: 'Quantity',
        expirationDate: 'ExpDate'
      },
      metadata: {
        semanticRules: [
          { sourceKey: 'Storage Temp C', targetKey: 'storageTempF', transform: 'celsiusToFahrenheit' },
          { sourceKey: 'Kosher Certified', targetKey: 'isKosher', transform: 'toBoolean' },
          { sourceKey: 'Defect Count', targetKey: 'defectPct', transform: 'percentage' }
        ]
      },
      source: 'csv'
    };

    const result = await processBatch(batch);
    expect(result.totalRows).toBe(2);
    expect(result.inserted).toBe(2);
    expect(result.errors).toEqual([]);
    expect(result.lotIds.length).toBe(2);

    const lot1 = await InventoryLot.findById(result.lotIds[0]);
    expect(lot1).not.toBeNull();
    // Raw attributes preserve pristine input strings
    expect(lot1?.rawAttributes?.get('Storage Temp C')).toBe('4');
    expect(lot1?.rawAttributes?.get('Kosher Certified')).toBe('Yes');
    expect(lot1?.rawAttributes?.get('Defect Count')).toBe('10');
    // Semantic translated attributes
    expect(lot1?.attributes?.get('storageTempF')).toBe(39.2);
    expect(lot1?.attributes?.get('isKosher')).toBe(true);
    expect(lot1?.attributes?.get('defectPct')).toBe(25); // 10 / (10 + 30) * 100 = 25%

    const lot2 = await InventoryLot.findById(result.lotIds[1]);
    expect(lot2).not.toBeNull();
    expect(lot2?.rawAttributes?.get('Storage Temp C')).toBe('10');
    expect(lot2?.rawAttributes?.get('Kosher Certified')).toBe('No');
    expect(lot2?.rawAttributes?.get('Defect Count')).toBe('30');
    expect(lot2?.attributes?.get('storageTempF')).toBe(50);
    expect(lot2?.attributes?.get('isKosher')).toBe(false);
    expect(lot2?.attributes?.get('defectPct')).toBe(75); // 30 / (10 + 30) * 100 = 75%
  });

  it('updates attributes and rawAttributes when reconciling existing lots', async () => {
    // 1. Initial insert of a lot
    const initialBatch: IngestionBatch = {
      supplierId,
      headers: ['SKU', 'Description', 'Quantity', 'ExpDate', 'Lot', 'Storage Temp C'],
      rows: [
        ['SKU-RECON-ATTR', 'Recon Milk', '40', '2026-12-15', 'LOT-ATTR-RECON-1', '5']
      ],
      columnMappings: {
        sku: 'SKU',
        description: 'Description',
        quantityCases: 'Quantity',
        expirationDate: 'ExpDate',
        lotNumber: 'Lot'
      },
      metadata: {
        semanticRules: [
          { sourceKey: 'Storage Temp C', targetKey: 'storageTempF', transform: 'celsiusToFahrenheit' }
        ]
      },
      source: 'csv'
    };

    const res1 = await processBatch(initialBatch);
    expect(res1.inserted).toBe(1);

    const initialLot = await InventoryLot.findById(res1.lotIds[0]);
    expect(initialLot?.attributes?.get('storageTempF')).toBe(41); // 5 C -> 41 F
    expect(initialLot?.rawAttributes?.get('Storage Temp C')).toBe('5');

    // 2. Reconciliation update with updated unmapped value
    const updateBatch: IngestionBatch = {
      supplierId,
      headers: ['SKU', 'Description', 'Quantity', 'ExpDate', 'Lot', 'Storage Temp C'],
      rows: [
        ['SKU-RECON-ATTR', 'Recon Milk', '35', '2026-12-20', 'LOT-ATTR-RECON-1', '0']
      ],
      columnMappings: {
        sku: 'SKU',
        description: 'Description',
        quantityCases: 'Quantity',
        expirationDate: 'ExpDate',
        lotNumber: 'Lot'
      },
      metadata: {
        semanticRules: [
          { sourceKey: 'Storage Temp C', targetKey: 'storageTempF', transform: 'celsiusToFahrenheit' }
        ]
      },
      source: 'csv'
    };

    const res2 = await processBatch(updateBatch);
    expect(res2.updated).toBe(1);
    expect(res2.lotIds[0]).toBe(res1.lotIds[0]);

    const updatedLot = await InventoryLot.findById(res1.lotIds[0]);
    expect(updatedLot?.quantityCases).toBe(35);
    expect(updatedLot?.attributes?.get('storageTempF')).toBe(32); // 0 C -> 32 F
    expect(updatedLot?.rawAttributes?.get('Storage Temp C')).toBe('0');
  });

  it('falls back to SupplierTemplate semanticRules when batch.metadata.semanticRules is not provided', async () => {
    // Pre-create SupplierTemplate with semanticRules
    await SupplierTemplate.create({
      supplierId,
      templateName: 'Default Supplier Template with Rules',
      columnMappings: {
        sku: 'SKU',
        description: 'Description',
        quantity: 'Quantity',
        expirationDate: 'ExpDate'
      },
      semanticRules: [
        { sourceKey: 'Celsius', targetKey: 'fahrenheit', transform: 'celsiusToFahrenheit' }
      ]
    });

    const batch: IngestionBatch = {
      supplierId,
      headers: ['SKU', 'Description', 'Quantity', 'ExpDate', 'Celsius'],
      rows: [
        ['SKU-TEMPL-ATTR', 'Template Rule Item', '25', '2026-12-01', '20']
      ],
      columnMappings: {
        sku: 'SKU',
        description: 'Description',
        quantityCases: 'Quantity',
        expirationDate: 'ExpDate'
      },
      source: 'csv'
    };

    const result = await processBatch(batch);
    expect(result.inserted).toBe(1);

    const lot = await InventoryLot.findById(result.lotIds[0]);
    expect(lot?.attributes?.get('fahrenheit')).toBe(68); // 20 C -> 68 F
    expect(lot?.rawAttributes?.get('Celsius')).toBe('20');
  });

  it('defaults missing expiration date using resolved category shelfLifeDays instead of static 30 days', async () => {
    const batch: IngestionBatch = {
      supplierId,
      headers: ['SKU', 'Description', 'Category', 'Quantity'],
      rows: [
        ['SKU-CAT-EXP-1', 'Organic Whole Milk', 'Dairy', '30'], // Dairy default: 45 days
        ['SKU-CAT-EXP-2', 'Basmati White Rice', 'Dry Goods', '50'] // Dry Goods default: 180 days
      ],
      columnMappings: {
        sku: 'SKU',
        description: 'Description',
        category: 'Category',
        quantityCases: 'Quantity'
      },
      source: 'csv'
    };

    const beforeTime = Date.now();
    const result = await processBatch(batch);
    expect(result.inserted).toBe(2);

    const lotDairy = await InventoryLot.findById(result.lotIds[0]);
    const lotDry = await InventoryLot.findById(result.lotIds[1]);

    expect(lotDairy).not.toBeNull();
    expect(lotDry).not.toBeNull();

    // Check expiration date offsets from now
    const dairyDays = Math.round((lotDairy!.expirationDate.getTime() - beforeTime) / (1000 * 60 * 60 * 24));
    const dryDays = Math.round((lotDry!.expirationDate.getTime() - beforeTime) / (1000 * 60 * 60 * 24));

    expect(dairyDays).toBe(45);
    expect(dryDays).toBe(180);
  });

  it('increments depleted metric instead of inserted for brand new zero-quantity lots', async () => {
    const batch: IngestionBatch = {
      supplierId,
      headers: ['SKU', 'Description', 'Quantity', 'ExpDate'],
      rows: [
        ['SKU-NEW-ZERO-1', 'Zero Quantity New Lot', '0', '2026-11-20']
      ],
      columnMappings: {
        sku: 'SKU',
        description: 'Description',
        quantityCases: 'Quantity',
        expirationDate: 'ExpDate'
      },
      source: 'manual'
    };

    const result = await processBatch(batch);
    expect(result.totalRows).toBe(1);
    expect(result.inserted).toBe(0);
    expect(result.depleted).toBe(1);

    const lot = await InventoryLot.findById(result.lotIds[0]);
    expect(lot).not.toBeNull();
    expect(lot?.status).toBe('depleted');
    expect(lot?.quantityCases).toBe(0);
  });

  it('processes batches identically across source tags (csv, google-sheets, manual)', async () => {
    const sources: Array<'csv' | 'google-sheets' | 'manual'> = ['csv', 'google-sheets', 'manual'];

    for (const src of sources) {
      const batch: IngestionBatch = {
        supplierId,
        headers: ['SKU', 'Description', 'Quantity', 'ExpDate'],
        rows: [
          [`SKU-SRC-${src.toUpperCase()}`, `Test Item for ${src}`, '10', '2026-12-15']
        ],
        columnMappings: {
          sku: 'SKU',
          description: 'Description',
          quantityCases: 'Quantity',
          expirationDate: 'ExpDate'
        },
        source: src
      };

      const res = await processBatch(batch);
      expect(res.inserted).toBe(1);
      expect(res.errors).toEqual([]);
      expect(res.lotIds).toHaveLength(1);
    }
  });
});

describe('Batch Ingestion Engine - Slice 3: Unified Idempotent Reconciliation & Sync Lifecycle State', () => {
  jest.setTimeout(25000);
  let supplierId: string;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ind-spoiler-alert-test');
    }

    await Supplier.deleteMany({ companyCode: 'TSUPRECON1' });
    const supplier = await Supplier.create({
      name: 'Reconciliation Test Supplier',
      companyCode: 'TSUPRECON1',
      preferredDisposition: 'sell'
    });
    supplierId = supplier._id.toString();
  });

  afterAll(async () => {
    await GoogleSheetsSyncConfig.deleteMany({ supplierId });
    await Activity.deleteMany({});
    await Award.deleteMany({});
    await Offer.deleteMany({});
    await Buyer.deleteMany({ email: /recon_test/ });
    await InventoryLot.deleteMany({ supplierId });
    await ProductMaster.deleteMany({ supplierId });
    await DistributionCenter.deleteMany({ supplierId });
    await Supplier.deleteMany({ _id: supplierId });
  });

  it('Slice 1: reconciles by composite natural key (sku + lotNumber), updating quantity drift, price adjustments, and warehouse location without creating duplicates', async () => {
    // 1. Initial batch: lot inserted at default warehouse
    const initialBatch: IngestionBatch = {
      supplierId,
      headers: ['SKU', 'Description', 'Lot', 'Quantity', 'Price', 'ExpDate', 'Warehouse'],
      rows: [
        ['SKU-DRIFT-001', 'Organic Oat Milk', 'LOT-DRIFT-ALPHA', '100', '4.00', '2026-12-31', 'East Hub']
      ],
      columnMappings: {
        sku: 'SKU',
        description: 'Description',
        lotNumber: 'Lot',
        quantityCases: 'Quantity',
        originalPrice: 'Price',
        expirationDate: 'ExpDate',
        warehouse: 'Warehouse'
      },
      source: 'csv'
    };

    const initialRes = await processBatch(initialBatch);
    expect(initialRes.inserted).toBe(1);
    expect(initialRes.updated).toBe(0);
    const originalLotId = initialRes.lotIds[0];

    const initialLot = await InventoryLot.findById(originalLotId);
    expect(initialLot).not.toBeNull();
    expect(initialLot?.quantityCases).toBe(100);
    expect(initialLot?.costPerCase).toBe(4.00);

    const initialDc = await DistributionCenter.findById(initialLot?.distributionCenterId);
    expect(initialDc?.name).toBe('East Hub');

    // 2. Reconciliation batch: same SKU + lotNumber, but with quantity drift (100 -> 150), price adjustment (4.00 -> 4.75), and warehouse moved to West Hub
    const driftBatch: IngestionBatch = {
      supplierId,
      headers: ['SKU', 'Description', 'Lot', 'Quantity', 'Price', 'ExpDate', 'Warehouse'],
      rows: [
        ['SKU-DRIFT-001', 'Organic Oat Milk', 'LOT-DRIFT-ALPHA', '150', '4.75', '2027-01-15', 'West Hub']
      ],
      columnMappings: {
        sku: 'SKU',
        description: 'Description',
        lotNumber: 'Lot',
        quantityCases: 'Quantity',
        originalPrice: 'Price',
        expirationDate: 'ExpDate',
        warehouse: 'Warehouse'
      },
      source: 'csv'
    };

    const driftRes = await processBatch(driftBatch);
    expect(driftRes.totalRows).toBe(1);
    expect(driftRes.inserted).toBe(0);
    expect(driftRes.updated).toBe(1);
    expect(driftRes.depleted).toBe(0);
    expect(driftRes.lotIds[0]).toBe(originalLotId);

    // Verify existing lot was updated in-place (no new lot created)
    const totalLots = await InventoryLot.countDocuments({ supplierId, lotNumber: 'LOT-DRIFT-ALPHA' });
    expect(totalLots).toBe(1);

    const updatedLot = await InventoryLot.findById(originalLotId);
    expect(updatedLot).not.toBeNull();
    expect(updatedLot?.quantityCases).toBe(150);
    expect(updatedLot?.availableQty).toBe(150);
    expect(updatedLot?.costPerCase).toBe(4.75);
    expect(updatedLot?.standardSellPrice).toBe(4.75);
    expect(updatedLot?.expirationDate.toISOString()).toContain('2027-01-15');

    // Warehouse location was updated to West Hub
    const updatedDc = await DistributionCenter.findById(updatedLot?.distributionCenterId);
    expect(updatedDc?.name).toBe('West Hub');
  });

  it('Slice 2: re-activates a previously depleted lot when inbound quantity drifts above zero', async () => {
    // 1. Initial batch creates a depleted lot with 0 cases
    const initialBatch: IngestionBatch = {
      supplierId,
      headers: ['SKU', 'Description', 'Lot', 'Quantity', 'Price', 'ExpDate'],
      rows: [
        ['SKU-REACTIVE-01', 'Almond Butter Crunch', 'LOT-REACTIVE-01', '0', '6.50', '2026-11-30']
      ],
      columnMappings: {
        sku: 'SKU',
        description: 'Description',
        lotNumber: 'Lot',
        quantityCases: 'Quantity',
        originalPrice: 'Price',
        expirationDate: 'ExpDate'
      },
      source: 'csv'
    };

    const initialRes = await processBatch(initialBatch);
    expect(initialRes.inserted).toBe(0);
    expect(initialRes.depleted).toBe(1);
    const lotId = initialRes.lotIds[0];

    const initialLot = await InventoryLot.findById(lotId);
    expect(initialLot).not.toBeNull();
    expect(initialLot?.status).toBe('depleted');
    expect(initialLot?.quantityCases).toBe(0);
    expect(initialLot?.availableQty).toBe(0);

    // 2. Replenishment batch arrives with quantity 75
    const replenishBatch: IngestionBatch = {
      supplierId,
      headers: ['SKU', 'Description', 'Lot', 'Quantity', 'Price', 'ExpDate'],
      rows: [
        ['SKU-REACTIVE-01', 'Almond Butter Crunch', 'LOT-REACTIVE-01', '75', '6.25', '2027-02-15']
      ],
      columnMappings: {
        sku: 'SKU',
        description: 'Description',
        lotNumber: 'Lot',
        quantityCases: 'Quantity',
        originalPrice: 'Price',
        expirationDate: 'ExpDate'
      },
      source: 'google-sheets'
    };

    const replenishRes = await processBatch(replenishBatch);
    expect(replenishRes.totalRows).toBe(1);
    expect(replenishRes.inserted).toBe(0);
    expect(replenishRes.updated).toBe(1);
    expect(replenishRes.depleted).toBe(0);
    expect(replenishRes.lotIds[0]).toBe(lotId);

    const replenishedLot = await InventoryLot.findById(lotId);
    expect(replenishedLot).not.toBeNull();
    expect(replenishedLot?.status).toBe('active');
    expect(replenishedLot?.quantityCases).toBe(75);
    expect(replenishedLot?.availableQty).toBe(75);
    expect(replenishedLot?.costPerCase).toBe(6.25);
    expect(replenishedLot?.expirationDate.toISOString()).toContain('2027-02-15');
  });

  it('Slice 3: safe lot depletion preserves linked Offer, Award, and Activity audit records intact', async () => {
    // 1. Initial batch: create lot with active quantity
    const initialBatch: IngestionBatch = {
      supplierId,
      headers: ['SKU', 'Description', 'Lot', 'Quantity', 'Price', 'ExpDate'],
      rows: [
        ['SKU-PRESERVE-01', 'Artisan Cheddar Block', 'LOT-PRESERVE-01', '60', '8.00', '2026-12-31']
      ],
      columnMappings: {
        sku: 'SKU',
        description: 'Description',
        lotNumber: 'Lot',
        quantityCases: 'Quantity',
        originalPrice: 'Price',
        expirationDate: 'ExpDate'
      },
      source: 'csv'
    };

    const initialRes = await processBatch(initialBatch);
    expect(initialRes.inserted).toBe(1);
    const lotId = initialRes.lotIds[0];

    // 2. Seed linked Buyer, Offer (workflow stage bid), Award with execution audit, and Activity log
    const buyer = await Buyer.create({
      companyName: 'Preserve Buyer Corp',
      email: 'recon_test_buyer@domain.org',
      tier: 'direct_retailer',
      isActive: true
    });

    const offer = await Offer.create({
      lotId,
      buyerId: buyer._id,
      quantity: 25,
      price: 7.20,
      status: 'pending',
      messages: [
        {
          sender: 'buyer',
          content: 'Bid submitted for 25 cases',
          timestamp: new Date(),
          proposedPrice: 7.20,
          proposedQuantity: 25
        }
      ]
    });

    const award = await Award.create({
      lotId,
      offerId: offer._id,
      buyerId: buyer._id,
      awardedQty: 25,
      price: 7.20,
      executionAudit: {
        signerName: 'Jane Procurement',
        signerTitle: 'VP Supply Chain',
        signatureType: 'draw',
        signatureData: 'data:image/png;base64,auditSigHash',
        signedAt: new Date(),
        verificationHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
      }
    });

    const activity = await Activity.create({
      lotId,
      type: 'note',
      subject: 'Cold Chain QC Audit Passed',
      content: 'Temperature probe 38.2F verified by auditor',
      timestamp: new Date()
    });

    // 3. Batch arrives with quantity 0 for this lot
    const depletionBatch: IngestionBatch = {
      supplierId,
      headers: ['SKU', 'Description', 'Lot', 'Quantity', 'Price', 'ExpDate'],
      rows: [
        ['SKU-PRESERVE-01', 'Artisan Cheddar Block', 'LOT-PRESERVE-01', '0', '8.00', '2026-12-31']
      ],
      columnMappings: {
        sku: 'SKU',
        description: 'Description',
        lotNumber: 'Lot',
        quantityCases: 'Quantity',
        originalPrice: 'Price',
        expirationDate: 'ExpDate'
      },
      source: 'csv'
    };

    const depletionRes = await processBatch(depletionBatch);
    expect(depletionRes.totalRows).toBe(1);
    expect(depletionRes.inserted).toBe(0);
    expect(depletionRes.updated).toBe(0);
    expect(depletionRes.depleted).toBe(1);

    // 4. Verify lot transitioned to depleted
    const depletedLot = await InventoryLot.findById(lotId);
    expect(depletedLot).not.toBeNull();
    expect(depletedLot?.status).toBe('depleted');
    expect(depletedLot?.quantityCases).toBe(0);
    expect(depletedLot?.availableQty).toBe(0);

    // 5. Verify linked Offer is strictly preserved and intact
    const preservedOffer = await Offer.findById(offer._id);
    expect(preservedOffer).not.toBeNull();
    expect(preservedOffer?.lotId?.toString()).toBe(lotId.toString());
    expect(preservedOffer?.quantity).toBe(25);
    expect(preservedOffer?.price).toBe(7.20);
    expect(preservedOffer?.status).toBe('pending');
    expect(preservedOffer?.messages).toHaveLength(1);
    expect(preservedOffer?.messages[0].content).toBe('Bid submitted for 25 cases');

    // 6. Verify linked Award and execution audit certificate are preserved intact
    const preservedAward = await Award.findById(award._id);
    expect(preservedAward).not.toBeNull();
    expect(preservedAward?.lotId?.toString()).toBe(lotId.toString());
    expect(preservedAward?.awardedQty).toBe(25);
    expect(preservedAward?.executionAudit?.signerName).toBe('Jane Procurement');
    expect(preservedAward?.executionAudit?.verificationHash).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');

    // 7. Verify linked Activity audit log is preserved intact
    const preservedActivity = await Activity.findById(activity._id);
    expect(preservedActivity).not.toBeNull();
    expect(preservedActivity?.lotId?.toString()).toBe(lotId.toString());
    expect(preservedActivity?.subject).toBe('Cold Chain QC Audit Passed');
    expect(preservedActivity?.content).toBe('Temperature probe 38.2F verified by auditor');
  });

  it('Slice 4: recordSyncCompletion atomically persists syncStatus, lastSyncedAt, and lastSyncMetrics onto GoogleSheetsSyncConfig', async () => {
    // 1. Create a GoogleSheetsSyncConfig document in 'syncing' status
    const config = await GoogleSheetsSyncConfig.create({
      supplierId,
      spreadsheetId: 'test-sync-sheet-001',
      sheetName: 'InventoryLive',
      ingressKey: 'recon-ingress-key-999',
      syncStatus: 'syncing'
    });

    const metrics = {
      totalRows: 25,
      inserted: 15,
      updated: 8,
      depleted: 2,
      errors: []
    };

    // 2. Call recordSyncCompletion
    const updated = await recordSyncCompletion(config._id.toString(), metrics);
    expect(updated).not.toBeNull();
    expect(updated?.syncStatus).toBe('success');
    expect(updated?.lastSyncedAt).toBeInstanceOf(Date);
    expect(updated?.lastSyncMetrics.totalRows).toBe(25);
    expect(updated?.lastSyncMetrics.inserted).toBe(15);
    expect(updated?.lastSyncMetrics.updated).toBe(8);
    expect(updated?.lastSyncMetrics.depleted).toBe(2);
    expect(updated?.lastSyncMetrics.errors).toEqual([]);

    // Verify DB state
    const persisted = await GoogleSheetsSyncConfig.findById(config._id);
    expect(persisted?.syncStatus).toBe('success');
    expect(persisted?.lastSyncMetrics.inserted).toBe(15);

    // 3. Test with explicit error status and error messages
    const errorMetrics = {
      totalRows: 5,
      inserted: 0,
      updated: 0,
      depleted: 0,
      errors: ['Row 2: Missing SKU', 'Row 4: Invalid quantity']
    };

    const errorUpdated = await recordSyncCompletion(config._id.toString(), errorMetrics, 'error');
    expect(errorUpdated?.syncStatus).toBe('error');
    expect(errorUpdated?.lastSyncMetrics.errors).toHaveLength(2);

    // 4. Test non-existent config returns null
    const nonExistent = await recordSyncCompletion(new mongoose.Types.ObjectId().toString(), metrics);
    expect(nonExistent).toBeNull();
  });
});




