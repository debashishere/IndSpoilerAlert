import request from 'supertest';
import mongoose from 'mongoose';
import app from '../index';
import GoogleSheetsSyncConfig from '../models/GoogleSheetsSyncConfig';
import Supplier from '../models/Supplier';
import InventoryLot from '../models/InventoryLot';
import ProductMaster from '../models/ProductMaster';
import DistributionCenter from '../models/DistributionCenter';
import * as ingestService from '../services/ingestService';

describe('Slice 2: Controller Decoupling & IngestService Delegation', () => {
  let supplierId: string;
  const testIngressKey = 'test-ctrl-decouple-sec-999';

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ind-spoiler-alert-test');
    }

    await Supplier.deleteMany({ companyCode: 'CTRL_DECOUPLE_SUP' });
    const supplier = await Supplier.create({
      name: 'Controller Decouple Supplier',
      companyCode: 'CTRL_DECOUPLE_SUP',
      preferredDisposition: 'sell',
      active: true
    });
    supplierId = supplier._id.toString();

    const dc = await DistributionCenter.create({
      supplierId,
      name: 'Decouple DC',
      code: 'CTRL-DEC-DC',
      address: '123 Test Ave, Chicago, IL',
      coordinates: { lat: 41.8781, lng: -87.6298 },
      coldStorage: true
    });

    const prod = await ProductMaster.create({
      supplierId,
      sku: 'SKU-CTRL-DEC-1',
      description: 'Decouple Test Product',
      category: 'Dry Goods',
      shelfLifeDays: 90
    });

    await InventoryLot.create({
      supplierId,
      distributionCenterId: dc._id,
      productId: prod._id,
      lotNumber: 'LOT-CTRL-DEC-01',
      expirationDate: new Date('2027-01-01'),
      quantityCases: 100,
      availableQty: 100,
      costPerCase: 5.0,
      standardSellPrice: 5.0,
      status: 'active'
    });

    await GoogleSheetsSyncConfig.deleteMany({ supplierId });
    await GoogleSheetsSyncConfig.create({
      supplierId,
      spreadsheetId: 'sheet-ctrl-dec-123',
      sheetName: 'Live Inventory',
      ingressKey: testIngressKey,
      syncStatus: 'idle',
      lastSyncMetrics: {
        totalRows: 0,
        inserted: 0,
        updated: 0,
        depleted: 0,
        errors: []
      }
    });
  });

  afterAll(async () => {
    await GoogleSheetsSyncConfig.deleteMany({ supplierId });
    await InventoryLot.deleteMany({ supplierId });
    await ProductMaster.deleteMany({ supplierId });
    await DistributionCenter.deleteMany({ supplierId });
    await Supplier.deleteMany({ _id: supplierId });
  });

  it('syncNowGoogleSheets delegates state persistence and active lot count query to ingestService', async () => {
    const recordSyncCompletionSpy = jest.spyOn(ingestService, 'recordSyncCompletion');
    const getActiveLotCountSpy = jest.spyOn(ingestService, 'getActiveLotCount');

    const res = await request(app)
      .post('/api/v1/ingestion/google-sheets/sync-now')
      .set('X-Ingress-Key', testIngressKey)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.syncStatus).toBe('success');
    expect(res.body.syncedLotCount).toBe(1);

    // Verify delegation to ingestService methods instead of controller DB mutations
    expect(recordSyncCompletionSpy).toHaveBeenCalledTimes(1);
    expect(getActiveLotCountSpy).toHaveBeenCalledTimes(1);
    expect(getActiveLotCountSpy).toHaveBeenCalledWith(expect.anything());

    recordSyncCompletionSpy.mockRestore();
    getActiveLotCountSpy.mockRestore();
  });

  it('getScriptTemplate executes with top-level imports without throwing dynamic import errors', async () => {
    const res = await request(app)
      .get(`/api/v1/ingestion/google-sheets/script-template?supplierId=${supplierId}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.script).toContain('function syncToPlatform');
  });

  it('testPingGoogleSheets executes with top-level imports and returns connected status', async () => {
    const res = await request(app)
      .post('/api/v1/ingestion/google-sheets/test-ping')
      .set('X-Ingress-Key', testIngressKey)
      .send({
        spreadsheetId: 'sheet-ctrl-dec-123',
        sheetName: 'Live Inventory'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.status).toBe('connected');
    expect(res.body.supplierName).toBe('Controller Decouple Supplier');
  });

  it('syncNowGoogleSheets delegates batch reconciliation directly to ingestService.processBatch when rows are supplied', async () => {
    const processBatchSpy = jest.spyOn(ingestService, 'processBatch');

    const payload = {
      headers: ['SKU / Item Code', 'Product Title', 'Cases Available', 'Expiry Date', 'Unit Price ($)', 'Warehouse Location'],
      rows: [
        ['SKU-CTRL-DEC-1', 'Decouple Test Product', '150', '2027-01-01', '5.00', 'Decouple DC']
      ]
    };

    const res = await request(app)
      .post('/api/v1/ingestion/google-sheets/sync-now')
      .set('X-Ingress-Key', testIngressKey)
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.syncStatus).toBe('success');
    expect(processBatchSpy).toHaveBeenCalledTimes(1);
    expect(processBatchSpy).toHaveBeenCalledWith(expect.objectContaining({
      source: 'google-sheets',
      supplierId: supplierId.toString()
    }));

    processBatchSpy.mockRestore();
  });
});
