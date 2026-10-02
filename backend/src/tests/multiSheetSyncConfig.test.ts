import mongoose from 'mongoose';
import GoogleSheetsSyncConfig, { IConnectedSheet } from '../models/GoogleSheetsSyncConfig';
import Supplier from '../models/Supplier';

describe('GoogleSheetsSyncConfig Model Seam - Multi-Sheet Subdocument Array', () => {
  let supplierId: mongoose.Types.ObjectId;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ind-spoiler-alert-test');
    }

    const supplier = await Supplier.create({
      name: 'Multi Sheet Model Supplier',
      companyCode: 'MS_MODEL_SUPPLIER',
      preferredDisposition: 'sell',
      active: true
    });
    supplierId = supplier._id;
  });

  afterAll(async () => {
    await GoogleSheetsSyncConfig.deleteMany({ supplierId });
    await Supplier.deleteMany({ _id: supplierId });
  });

  it('persists connectedSheets array with subdocuments and default values', async () => {
    const config = await GoogleSheetsSyncConfig.create({
      supplierId,
      spreadsheetId: 'primary-sheet-id',
      sheetName: 'Main',
      ingressKey: 'ingress-key-multi-sheet-test-01',
      connectedSheets: [
        {
          spreadsheetId: 'sheet-111',
          spreadsheetTitle: 'Produce Inventory 2026',
          sheetName: 'Weekly Fresh',
          syncStatus: 'idle',
          lastSyncMetrics: {
            totalRows: 10,
            inserted: 8,
            updated: 2,
            depleted: 0,
            errors: []
          }
        },
        {
          spreadsheetId: 'sheet-222',
          spreadsheetTitle: 'Dairy Inventory 2026',
          sheetName: 'Yogurt & Milk',
          syncStatus: 'success',
          lastSyncedAt: new Date('2026-09-30T12:00:00Z'),
          lastSyncMetrics: {
            totalRows: 25,
            inserted: 25,
            updated: 0,
            depleted: 0,
            errors: []
          }
        }
      ]
    });

    const persisted = await GoogleSheetsSyncConfig.findById(config._id);
    expect(persisted).not.toBeNull();
    expect(persisted?.connectedSheets).toHaveLength(2);

    const sheet1 = persisted?.connectedSheets?.find((s: IConnectedSheet) => s.spreadsheetId === 'sheet-111');
    expect(sheet1).toBeDefined();
    expect(sheet1?.spreadsheetTitle).toBe('Produce Inventory 2026');
    expect(sheet1?.sheetName).toBe('Weekly Fresh');
    expect(sheet1?.syncStatus).toBe('idle');
    expect(sheet1?.lastSyncMetrics.inserted).toBe(8);

    const sheet2 = persisted?.connectedSheets?.find((s: IConnectedSheet) => s.spreadsheetId === 'sheet-222');
    expect(sheet2).toBeDefined();
    expect(sheet2?.spreadsheetTitle).toBe('Dairy Inventory 2026');
    expect(sheet2?.syncStatus).toBe('success');
    expect(sheet2?.lastSyncedAt).toEqual(new Date('2026-09-30T12:00:00Z'));
  });

  describe('Slice 2: Webhook Multi-Sheet Dynamic Registration & Metrics Recording', () => {
    const ingressKey = 'master-ingress-key-multi-999';

    beforeAll(async () => {
      await GoogleSheetsSyncConfig.create({
        supplierId,
        spreadsheetId: 'default-sheet-000',
        sheetName: 'Sheet1',
        ingressKey,
        syncStatus: 'idle',
        lastSyncMetrics: {
          totalRows: 0,
          inserted: 0,
          updated: 0,
          depleted: 0,
          errors: []
        },
        connectedSheets: []
      });
    });

    it('dynamically discovers and auto-registers a novel spreadsheet and sheetName under connectedSheets upon webhook sync', async () => {
      const request = require('supertest');
      const app = require('../index').default;

      const payload = {
        spreadsheetId: 'sheet-bakery-999',
        spreadsheetTitle: 'Bakery Distribution Master',
        sheetName: 'Croissants & Breads',
        headers: ['SKU Code', 'Item Description', 'Lot Number', 'Quantity Cases', 'Unit Price', 'Expiry Date', 'Category'],
        rows: [
          ['BKR-101', 'Almond Croissant', 'LOT-BKR-01', '40', '2.50', '2026-10-15', 'Bakery'],
          ['BKR-102', 'Sourdough Loaf', 'LOT-BKR-02', '60', '3.00', '2026-10-12', 'Bakery']
        ]
      };

      const res = await request(app)
        .post('/api/v1/ingestion/google-sheets/webhook')
        .set('X-Ingress-Key', ingressKey)
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.syncStatus).toBe('success');
      expect(res.body.metrics.inserted).toBe(2);

      // Verify GoogleSheetsSyncConfig updated connectedSheets subdocument array
      const config = await GoogleSheetsSyncConfig.findOne({ ingressKey });
      expect(config).not.toBeNull();
      expect(config?.connectedSheets).toHaveLength(1);

      const registeredSheet = config?.connectedSheets[0];
      expect(registeredSheet?.spreadsheetId).toBe('sheet-bakery-999');
      expect(registeredSheet?.spreadsheetTitle).toBe('Bakery Distribution Master');
      expect(registeredSheet?.sheetName).toBe('Croissants & Breads');
      expect(registeredSheet?.syncStatus).toBe('success');
      expect(registeredSheet?.lastSyncedAt).toBeDefined();
      expect(registeredSheet?.lastSyncMetrics.inserted).toBe(2);
      expect(registeredSheet?.lastSyncMetrics.totalRows).toBe(2);
    });

    it('updates existing connectedSheet entry in place without duplicating when subsequent sync occurs for same sheet', async () => {
      const request = require('supertest');
      const app = require('../index').default;

      const payload = {
        spreadsheetId: 'sheet-bakery-999',
        spreadsheetTitle: 'Bakery Distribution Master Updated',
        sheetName: 'Croissants & Breads',
        headers: ['SKU Code', 'Item Description', 'Lot Number', 'Quantity Cases', 'Unit Price', 'Expiry Date', 'Category'],
        rows: [
          ['BKR-102', 'Sourdough Loaf', 'LOT-BKR-02', '90', '3.00', '2026-10-12', 'Bakery'] // quantity updated
        ]
      };

      const res = await request(app)
        .post('/api/v1/ingestion/google-sheets/webhook')
        .set('X-Ingress-Key', ingressKey)
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const config = await GoogleSheetsSyncConfig.findOne({ ingressKey });
      expect(config?.connectedSheets).toHaveLength(1); // Not duplicated!
      const updatedSheet = config?.connectedSheets[0];
      expect(updatedSheet?.spreadsheetTitle).toBe('Bakery Distribution Master Updated');
      expect(updatedSheet?.lastSyncMetrics.updated).toBe(1);
    });

    it('handles concurrent webhook syncs for distinct spreadsheets atomically without clobbering', async () => {
      const request = require('supertest');
      const app = require('../index').default;

      const payload1 = {
        spreadsheetId: 'sheet-concurrent-A',
        spreadsheetTitle: 'Concurrent Sheet A',
        sheetName: 'Tab A',
        headers: ['SKU Code', 'Item Description', 'Lot Number', 'Quantity Cases', 'Unit Price', 'Expiry Date', 'Category'],
        rows: [
          ['SKU-A1', 'Concurrent Product A1', 'LOT-A1', '10', '5.00', '2026-11-01', 'Dry Goods']
        ]
      };

      const payload2 = {
        spreadsheetId: 'sheet-concurrent-B',
        spreadsheetTitle: 'Concurrent Sheet B',
        sheetName: 'Tab B',
        headers: ['SKU Code', 'Item Description', 'Lot Number', 'Quantity Cases', 'Unit Price', 'Expiry Date', 'Category'],
        rows: [
          ['SKU-B1', 'Concurrent Product B1', 'LOT-B1', '20', '8.00', '2026-11-01', 'Frozen']
        ]
      };

      // Execute concurrently
      const [res1, res2] = await Promise.all([
        request(app).post('/api/v1/ingestion/google-sheets/webhook').set('X-Ingress-Key', ingressKey).send(payload1),
        request(app).post('/api/v1/ingestion/google-sheets/webhook').set('X-Ingress-Key', ingressKey).send(payload2)
      ]);

      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);

      const config = await GoogleSheetsSyncConfig.findOne({ ingressKey });
      const sheetA = config?.connectedSheets?.find((s: IConnectedSheet) => s.spreadsheetId === 'sheet-concurrent-A');
      const sheetB = config?.connectedSheets?.find((s: IConnectedSheet) => s.spreadsheetId === 'sheet-concurrent-B');

      expect(sheetA).toBeDefined();
      expect(sheetB).toBeDefined();
      expect(sheetA?.sheetName).toBe('Tab A');
      expect(sheetB?.sheetName).toBe('Tab B');
    });
  });

  describe('Slice 3: GET /api/v1/ingestion/google-sheets/roster', () => {
    const ingressKey = 'roster-test-ingress-key-555';
    let rosterSupplierId: mongoose.Types.ObjectId;

    beforeAll(async () => {
      const supplier = await Supplier.create({
        name: 'Roster Test Supplier',
        companyCode: 'ROSTER_TEST_SUPPLIER',
        preferredDisposition: 'sell',
        active: true
      });
      rosterSupplierId = supplier._id;

      await GoogleSheetsSyncConfig.create({
        supplierId: rosterSupplierId,
        spreadsheetId: 'sheet-roster-default',
        sheetName: 'Sheet1',
        ingressKey,
        syncStatus: 'idle',
        lastSyncMetrics: {
          totalRows: 0,
          inserted: 0,
          updated: 0,
          depleted: 0,
          errors: []
        },
        connectedSheets: [
          {
            spreadsheetId: 'sheet-roster-1',
            spreadsheetTitle: 'Beverages Sheet',
            sheetName: 'Juices & Teas',
            syncStatus: 'success',
            lastSyncedAt: new Date('2026-09-30T10:00:00Z'),
            lastSyncMetrics: {
              totalRows: 12,
              inserted: 12,
              updated: 0,
              depleted: 0,
              errors: []
            }
          },
          {
            spreadsheetId: 'sheet-roster-2',
            spreadsheetTitle: 'Snacks Sheet',
            sheetName: 'Chips & Bars',
            syncStatus: 'idle',
            lastSyncMetrics: {
              totalRows: 0,
              inserted: 0,
              updated: 0,
              depleted: 0,
              errors: []
            }
          }
        ]
      });
    });

    afterAll(async () => {
      await GoogleSheetsSyncConfig.deleteMany({ supplierId: rosterSupplierId });
      await Supplier.deleteMany({ _id: rosterSupplierId });
    });

    it('returns 400 when neither supplierId query/header nor ingressKey is provided', async () => {
      const request = require('supertest');
      const app = require('../index').default;

      const res = await request(app).get('/api/v1/ingestion/google-sheets/roster');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns connected sheets roster with lot count, sync timestamps, and status using supplierId query', async () => {
      const request = require('supertest');
      const app = require('../index').default;

      const res = await request(app)
        .get(`/api/v1/ingestion/google-sheets/roster?supplierId=${rosterSupplierId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.connectedSheets).toHaveLength(2);
      expect(res.body.totalSheets).toBe(2);

      const sheet1 = res.body.connectedSheets.find((s: any) => s.spreadsheetId === 'sheet-roster-1');
      expect(sheet1).toBeDefined();
      expect(sheet1.spreadsheetTitle).toBe('Beverages Sheet');
      expect(sheet1.sheetName).toBe('Juices & Teas');
      expect(sheet1.syncStatus).toBe('success');
      expect(sheet1.lastSyncMetrics.inserted).toBe(12);
      expect(sheet1.lotCount).toBe(12);

      const sheet2 = res.body.connectedSheets.find((s: any) => s.spreadsheetId === 'sheet-roster-2');
      expect(sheet2).toBeDefined();
      expect(sheet2.spreadsheetTitle).toBe('Snacks Sheet');
      expect(sheet2.syncStatus).toBe('idle');
      expect(sheet2.lotCount).toBe(0);
    });

    it('returns connected sheets roster using X-Ingress-Key header', async () => {
      const request = require('supertest');
      const app = require('../index').default;

      const res = await request(app)
        .get('/api/v1/ingestion/google-sheets/roster')
        .set('X-Ingress-Key', ingressKey);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.connectedSheets).toHaveLength(2);
    });
  });

  describe('Slice 4: DELETE /api/v1/ingestion/google-sheets/disconnect', () => {
    const ingressKey = 'disconnect-test-ingress-key-777';
    let disconnectSupplierId: mongoose.Types.ObjectId;

    beforeAll(async () => {
      const supplier = await Supplier.create({
        name: 'Disconnect Test Supplier',
        companyCode: 'DISC_TEST_SUPPLIER',
        preferredDisposition: 'sell',
        active: true
      });
      disconnectSupplierId = supplier._id;

      await GoogleSheetsSyncConfig.create({
        supplierId: disconnectSupplierId,
        spreadsheetId: 'sheet-disc-default',
        sheetName: 'Sheet1',
        ingressKey,
        syncStatus: 'idle',
        lastSyncMetrics: {
          totalRows: 0,
          inserted: 0,
          updated: 0,
          depleted: 0,
          errors: []
        },
        connectedSheets: [
          {
            spreadsheetId: 'sheet-to-keep',
            spreadsheetTitle: 'Keep Sheet',
            sheetName: 'Tab 1',
            syncStatus: 'success',
            lastSyncMetrics: { totalRows: 5, inserted: 5, updated: 0, depleted: 0, errors: [] }
          },
          {
            spreadsheetId: 'sheet-multi-tab',
            spreadsheetTitle: 'Multi Tab Sheet',
            sheetName: 'Tab Keep',
            syncStatus: 'success',
            lastSyncMetrics: { totalRows: 3, inserted: 3, updated: 0, depleted: 0, errors: [] }
          },
          {
            spreadsheetId: 'sheet-multi-tab',
            spreadsheetTitle: 'Multi Tab Sheet',
            sheetName: 'Tab Delete',
            syncStatus: 'idle',
            lastSyncMetrics: { totalRows: 0, inserted: 0, updated: 0, depleted: 0, errors: [] }
          },
          {
            spreadsheetId: 'sheet-to-delete',
            spreadsheetTitle: 'Delete Sheet',
            sheetName: 'Tab Remove',
            syncStatus: 'error',
            lastSyncMetrics: { totalRows: 1, inserted: 0, updated: 0, depleted: 0, errors: ['Error'] }
          }
        ]
      });
    });

    afterAll(async () => {
      await GoogleSheetsSyncConfig.deleteMany({ supplierId: disconnectSupplierId });
      await Supplier.deleteMany({ _id: disconnectSupplierId });
    });

    it('returns 400 when spreadsheetId is missing from request body/query', async () => {
      const request = require('supertest');
      const app = require('../index').default;

      const res = await request(app)
        .delete('/api/v1/ingestion/google-sheets/disconnect')
        .send({ supplierId: disconnectSupplierId.toString() });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/spreadsheetId is required/i);
    });

    it('removes only the specified worksheet tab when sheetName is provided', async () => {
      const request = require('supertest');
      const app = require('../index').default;

      const res = await request(app)
        .delete('/api/v1/ingestion/google-sheets/disconnect')
        .set('X-Ingress-Key', ingressKey)
        .send({
          spreadsheetId: 'sheet-multi-tab',
          sheetName: 'Tab Delete'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const config = await GoogleSheetsSyncConfig.findOne({ ingressKey });
      const remainingTabs = config?.connectedSheets?.filter(s => s.spreadsheetId === 'sheet-multi-tab');
      expect(remainingTabs).toHaveLength(1);
      expect(remainingTabs?.[0].sheetName).toBe('Tab Keep');
    });

    it('successfully removes the entire specified spreadsheet when sheetName is omitted', async () => {
      const request = require('supertest');
      const app = require('../index').default;

      const res = await request(app)
        .delete('/api/v1/ingestion/google-sheets/disconnect')
        .set('X-Ingress-Key', ingressKey)
        .send({
          spreadsheetId: 'sheet-to-delete'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify DB state
      const config = await GoogleSheetsSyncConfig.findOne({ ingressKey });
      expect(config?.connectedSheets?.some(s => s.spreadsheetId === 'sheet-to-delete')).toBe(false);
      expect(config?.connectedSheets?.some(s => s.spreadsheetId === 'sheet-to-keep')).toBe(true);
    });
  });

  describe('Slice 5: Per-Sheet Schema Template Mapping & Ingestion Seam', () => {
    const ingressKey = 'per-sheet-template-key-777';
    let supplierId: mongoose.Types.ObjectId;

    beforeAll(async () => {
      const supplier = await Supplier.create({
        name: 'Per-Sheet Mapping Supplier',
        companyCode: 'PERSHEET_SUPPLIER',
        preferredDisposition: 'sell',
        active: true
      });
      supplierId = supplier._id;

      await GoogleSheetsSyncConfig.create({
        supplierId,
        spreadsheetId: 'sheet-primary',
        sheetName: 'Sheet1',
        ingressKey,
        syncStatus: 'idle',
        lastSyncMetrics: { totalRows: 0, inserted: 0, updated: 0, depleted: 0, errors: [] },
        connectedSheets: [
          {
            spreadsheetId: 'sheet-produce',
            spreadsheetTitle: 'Produce Dept',
            sheetName: 'Fruits',
            syncStatus: 'idle',
            lastSyncMetrics: { totalRows: 0, inserted: 0, updated: 0, depleted: 0, errors: [] }
          },
          {
            spreadsheetId: 'sheet-dairy',
            spreadsheetTitle: 'Dairy Dept',
            sheetName: 'Milk',
            syncStatus: 'idle',
            lastSyncMetrics: { totalRows: 0, inserted: 0, updated: 0, depleted: 0, errors: [] }
          }
        ]
      });
    });

    afterAll(async () => {
      const SupplierTemplate = mongoose.model('SupplierTemplate');
      await SupplierTemplate.deleteMany({ supplierId });
      await GoogleSheetsSyncConfig.deleteMany({ supplierId });
      await Supplier.deleteMany({ _id: supplierId });
    });

    it('POST /api/v1/ingestion/google-sheets/save-mapping binds SupplierTemplate specifically to the target connectedSheet', async () => {
      const request = require('supertest');
      const app = require('../index').default;

      const customProduceMappings = {
        sku: 'Item Code',
        description: 'Fruit Description',
        quantity: 'Case Count',
        expirationDate: 'Best Before',
        originalPrice: 'Cost ($)'
      };

      const res = await request(app)
        .post('/api/v1/ingestion/google-sheets/save-mapping')
        .send({
          supplierId: supplierId.toString(),
          spreadsheetId: 'sheet-produce',
          sheetName: 'Fruits',
          templateName: 'Produce Dept - Fruits Mapping',
          columnMappings: customProduceMappings
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.supplierTemplateId).toBeDefined();

      // Verify the target connected sheet in GoogleSheetsSyncConfig now points to this supplierTemplateId
      const config = await GoogleSheetsSyncConfig.findOne({ supplierId });
      const produceSheet = config?.connectedSheets?.find(
        s => s.spreadsheetId === 'sheet-produce' && s.sheetName === 'Fruits'
      );
      const dairySheet = config?.connectedSheets?.find(
        s => s.spreadsheetId === 'sheet-dairy' && s.sheetName === 'Milk'
      );

      expect(produceSheet?.supplierTemplateId?.toString()).toBe(res.body.supplierTemplateId);
      expect(dairySheet?.supplierTemplateId).toBeUndefined();
    });

    it('GET /api/v1/ingestion/google-sheets/sample-rows uses the sheet-specific SupplierTemplate when available', async () => {
      const request = require('supertest');
      const app = require('../index').default;

      const res = await request(app)
        .get(`/api/v1/ingestion/google-sheets/sample-rows?supplierId=${supplierId.toString()}&spreadsheetId=sheet-produce&sheetName=Fruits`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.suggestedMapping.sku).toBe('Item Code');
      expect(res.body.suggestedMapping.description).toBe('Fruit Description');
      expect(res.body.suggestedMapping.quantity).toBe('Case Count');
      expect(res.body.suggestedMapping.expirationDate).toBe('Best Before');
    });

    it('subsequent webhook sync parses batches using the customized sheet-specific column schema', async () => {
      const request = require('supertest');
      const app = require('../index').default;

      const webhookPayload = {
        spreadsheetId: 'sheet-produce',
        spreadsheetTitle: 'Produce Dept',
        sheetName: 'Fruits',
        headers: ['Item Code', 'Fruit Description', 'Case Count', 'Best Before', 'Cost ($)'],
        rows: [
          ['FRUIT-APL-01', 'Honeycrisp Apples', '50', '2026-11-15', '25.00'],
          ['FRUIT-ORG-02', 'Navel Oranges', '75', '2026-11-20', '18.50']
        ]
      };

      const res = await request(app)
        .post('/api/v1/ingestion/google-sheets/webhook')
        .set('X-Ingress-Key', ingressKey)
        .send(webhookPayload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.metrics.inserted).toBe(2);

      // Verify that InventoryLots were created with correct normalized fields
      const InventoryLot = mongoose.model('InventoryLot');
      const applesLot = await InventoryLot.findOne({
        supplierId,
        'attributes.spreadsheetId': 'sheet-produce',
        quantityCases: 50
      }).populate('productId');

      expect(applesLot).toBeDefined();
      expect(applesLot?.expirationDate).toBeDefined();
      expect((applesLot?.productId as any)?.description).toBe('Honeycrisp Apples');
      expect((applesLot?.productId as any)?.sku).toBe('FRUIT-APL-01');
    });
  });
});


