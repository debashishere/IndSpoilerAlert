import request from 'supertest';
import mongoose from 'mongoose';
import app from '../index';
import GoogleSheetsSyncConfig from '../models/GoogleSheetsSyncConfig';
import Supplier from '../models/Supplier';
import InventoryLot from '../models/InventoryLot';

describe('Google Sheets Sync Now Endpoint (POST /api/v1/ingestion/google-sheets/sync-now)', () => {
  let supplierId: string;
  const testIngressKey = 'sync-now-ingress-key-test-99';

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ind-spoiler-alert-test');
    }

    await Supplier.deleteMany({ companyCode: 'GSHEET_SYNC_NOW_TEST' });
    const supplier = await Supplier.create({
      name: 'Google Sheets Sync Now Supplier',
      companyCode: 'GSHEET_SYNC_NOW_TEST',
      preferredDisposition: 'sell',
      active: true,
    });
    supplierId = supplier._id.toString();

    await GoogleSheetsSyncConfig.deleteMany({ supplierId });
    await GoogleSheetsSyncConfig.create({
      supplierId,
      spreadsheetId: 'sheet-syncnow-101',
      sheetName: 'SyncNowSheet',
      ingressKey: testIngressKey,
      syncStatus: 'idle',
      lastSyncMetrics: {
        totalRows: 0,
        inserted: 0,
        updated: 0,
        depleted: 0,
        errors: [],
      },
    });
  });

  afterAll(async () => {
    await InventoryLot.deleteMany({ supplierId: supplierId });
    await GoogleSheetsSyncConfig.deleteMany({ supplierId });
    await Supplier.deleteMany({ companyCode: 'GSHEET_SYNC_NOW_TEST' });
  });


  it('fails with 401 when neither X-Ingress-Key nor supplierId is provided', async () => {
    const res = await request(app)
      .post('/api/v1/ingestion/google-sheets/sync-now')
      .send({});

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('fails with 404 when supplierId has no Google Sheets sync config', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .post('/api/v1/ingestion/google-sheets/sync-now')
      .send({ supplierId: fakeId });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('successfully triggers sync-now with X-Ingress-Key header and returns updated sync metrics', async () => {
    const res = await request(app)
      .post('/api/v1/ingestion/google-sheets/sync-now')
      .set('X-Ingress-Key', testIngressKey)
      .send({
        headers: ['SKU', 'Description', 'Cases Available', 'Unit Price ($)', 'Expiry Date'],
        rows: [
          ['SNOW-SKU-1', 'Cold Press Orange Juice', '50', '3.50', '2026-12-31'],
          ['SNOW-SKU-2', 'Organic Almond Milk', '75', '4.20', '2026-11-30'],
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.syncStatus).toBe('success');
    expect(res.body.lastSyncedAt).toBeDefined();
    expect(res.body.syncedLotCount).toBeGreaterThanOrEqual(2);
    expect(res.body.metrics.inserted).toBe(2);

    // Verify database state updated
    const config = await GoogleSheetsSyncConfig.findOne({ ingressKey: testIngressKey });
    expect(config?.syncStatus).toBe('success');
    expect(config?.lastSyncedAt).toBeDefined();
  });

  it('successfully triggers sync-now with supplierId in body/query when ingressKey header is omitted', async () => {
    const res = await request(app)
      .post(`/api/v1/ingestion/google-sheets/sync-now?supplierId=${supplierId}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.syncStatus).toBe('success');
    expect(res.body.syncedLotCount).toBeDefined();
  });
});
