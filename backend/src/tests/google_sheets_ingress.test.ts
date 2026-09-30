import request from 'supertest';
import mongoose from 'mongoose';
import app from '../index';
import GoogleSheetsSyncConfig from '../models/GoogleSheetsSyncConfig';
import Supplier from '../models/Supplier';
import Buyer from '../models/Buyer';
import Offer from '../models/Offer';
import Activity from '../models/Activity';

describe('Google Sheets Ingress Webhook and Idempotent Engine (/api/v1/ingestion/google-sheets/webhook)', () => {
  let supplierId: string;
  const testIngressKey = 'test-ingress-key-sec-12345';

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ind-spoiler-alert-test');
    }

    // Clean up test data
    await Buyer.deleteMany({ email: 'depletion_buyer_test@domain.org' });
    await Supplier.deleteMany({ companyCode: 'GSHEET_TEST' });
    const supplier = await Supplier.create({
      name: 'Google Sheets Ingress Test Supplier',
      companyCode: 'GSHEET_TEST',
      preferredDisposition: 'sell',
      active: true
    });
    supplierId = supplier._id.toString();

    await GoogleSheetsSyncConfig.deleteMany({ supplierId });
    await GoogleSheetsSyncConfig.create({
      supplierId,
      spreadsheetId: 'sheet-abc-123',
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
    await Buyer.deleteMany({ email: 'depletion_buyer_test@domain.org' });
    await GoogleSheetsSyncConfig.deleteMany({ supplierId });
    await Supplier.deleteMany({ companyCode: 'GSHEET_TEST' });
  });

  describe('Slice 1: Ingress Authentication Gate', () => {
    it('returns 401 Unauthorized when X-Ingress-Key header is missing', async () => {
      const res = await request(app)
        .post('/api/v1/ingestion/google-sheets/webhook')
        .send({
          spreadsheetId: 'sheet-abc-123',
          sheetName: 'Live Inventory',
          headers: ['SKU', 'Description', 'Quantity', 'Price'],
          rows: []
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/unauthorized|ingress key/i);
    });

    it('returns 401 Unauthorized when X-Ingress-Key header is invalid', async () => {
      const res = await request(app)
        .post('/api/v1/ingestion/google-sheets/webhook')
        .set('X-Ingress-Key', 'invalid-key-99999')
        .send({
          spreadsheetId: 'sheet-abc-123',
          sheetName: 'Live Inventory',
          headers: ['SKU', 'Description', 'Quantity', 'Price'],
          rows: []
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/unauthorized|invalid/i);
    });

    it('returns 200 OK with sync receipt when X-Ingress-Key header is valid', async () => {
      const res = await request(app)
        .post('/api/v1/ingestion/google-sheets/webhook')
        .set('X-Ingress-Key', testIngressKey)
        .send({
          spreadsheetId: 'sheet-abc-123',
          sheetName: 'Live Inventory',
          headers: ['SKU', 'Description', 'Quantity', 'Price'],
          rows: []
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.syncStatus).toBe('success');
      expect(res.body.metrics).toBeDefined();
      expect(res.body.metrics.totalRows).toBe(0);
      expect(res.body.lastSyncedAt).toBeDefined();
    });
  });

  describe('Slice 2: Direct Grid Parsing & Novel Lot Creation', () => {
    it('parses grid payload and idempotently inserts novel active inventory lots and product master', async () => {
      const headers = ['SKU Code', 'Item Description', 'Lot Number', 'Quantity Cases', 'Unit Price', 'Expiry Date', 'Category'];
      const rows = [
        ['GS-SKU-100', 'Organic Almond Milk 1L', 'LOT-ALM-001', '150', '3.50', '2026-12-31', 'Dairy'],
        ['GS-SKU-200', 'Gluten-Free Oats 500g', 'LOT-OAT-002', '300', '2.25', '2027-01-15', 'Dry Goods']
      ];

      const res = await request(app)
        .post('/api/v1/ingestion/google-sheets/webhook')
        .set('X-Ingress-Key', testIngressKey)
        .send({
          spreadsheetId: 'sheet-abc-123',
          sheetName: 'Live Inventory',
          headers,
          rows
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.metrics.totalRows).toBe(2);
      expect(res.body.metrics.inserted).toBe(2);
      expect(res.body.metrics.updated).toBe(0);
      expect(res.body.metrics.depleted).toBe(0);
      expect(res.body.metrics.errors).toEqual([]);

      // Verify ProductMaster records were created
      const ProductMaster = mongoose.model('ProductMaster');
      const prod1 = await ProductMaster.findOne({ supplierId, sku: 'GS-SKU-100' });
      expect(prod1).toBeDefined();
      expect(prod1?.description).toBe('Organic Almond Milk 1L');
      expect(prod1?.category).toBe('Dairy');

      // Verify InventoryLot records were created
      const InventoryLot = mongoose.model('InventoryLot');
      const lot1 = await InventoryLot.findOne({ supplierId, lotNumber: 'LOT-ALM-001' });
      expect(lot1).toBeDefined();
      expect(lot1?.quantityCases).toBe(150);
      expect(lot1?.availableQty).toBe(150);
      expect(lot1?.costPerCase).toBe(3.5);
      expect(lot1?.standardSellPrice).toBe(3.5);
      expect(lot1?.status).toBe('active');
      expect(new Date(lot1?.expirationDate).getFullYear()).toBe(2026);

      const lot2 = await InventoryLot.findOne({ supplierId, lotNumber: 'LOT-OAT-002' });
      expect(lot2).toBeDefined();
      expect(lot2?.quantityCases).toBe(300);
      expect(lot2?.availableQty).toBe(300);
      expect(lot2?.costPerCase).toBe(2.25);
      expect(lot2?.status).toBe('active');
    });
  });

  describe('Slice 3: Idempotent Update & Quantity Drift Reconciliation', () => {
    it('idempotently updates mutable fields (quantity, price, expiration) on existing lots without duplicate creation', async () => {
      const InventoryLot = mongoose.model('InventoryLot');
      const originalLot = await InventoryLot.findOne({ supplierId, lotNumber: 'LOT-ALM-001' });
      expect(originalLot).toBeDefined();
      const originalLotId = originalLot!._id.toString();

      // Submit updated row: quantity increased to 220, price dropped to 3.10, new expiration date
      const headers = ['SKU Code', 'Item Description', 'Lot Number', 'Quantity Cases', 'Unit Price', 'Expiry Date', 'Category'];
      const rows = [
        ['GS-SKU-100', 'Organic Almond Milk 1L', 'LOT-ALM-001', '220', '3.10', '2027-06-30', 'Dairy']
      ];

      const res = await request(app)
        .post('/api/v1/ingestion/google-sheets/webhook')
        .set('X-Ingress-Key', testIngressKey)
        .send({
          spreadsheetId: 'sheet-abc-123',
          sheetName: 'Live Inventory',
          headers,
          rows
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.metrics.totalRows).toBe(1);
      expect(res.body.metrics.inserted).toBe(0);
      expect(res.body.metrics.updated).toBe(1);
      expect(res.body.metrics.depleted).toBe(0);

      // Verify the lot was updated in-place (ID preserved)
      const updatedLot = await InventoryLot.findById(originalLotId);
      expect(updatedLot).toBeDefined();
      expect(updatedLot?.lotNumber).toBe('LOT-ALM-001');
      expect(updatedLot?.quantityCases).toBe(220);
      expect(updatedLot?.availableQty).toBe(220);
      expect(updatedLot?.standardSellPrice).toBe(3.10);
      expect(updatedLot?.costPerCase).toBe(3.10);
      expect(new Date(updatedLot?.expirationDate).getFullYear()).toBe(2027);

      // Verify no duplicate lots exist for this lotNumber
      const totalLotsForBatch = await InventoryLot.countDocuments({ supplierId, lotNumber: 'LOT-ALM-001' });
      expect(totalLotsForBatch).toBe(1);
    });

    it('normalizes columns using bound SupplierTemplate when configured on GoogleSheetsSyncConfig', async () => {
      const SupplierTemplate = mongoose.model('SupplierTemplate');
      const template = await SupplierTemplate.create({
        supplierId,
        templateName: 'Custom Warehouse ERP Template',
        columnMappings: new Map<string, string>([
          ['sku', 'Custom_SKU_Col'],
          ['description', 'Custom_Desc_Col'],
          ['lotNumber', 'Custom_Batch_Col'],
          ['quantityCases', 'Custom_Qty_Col'],
          ['standardSellPrice', 'Custom_Price_Col'],
          ['expirationDate', 'Custom_Expiry_Col'],
          ['category', 'Custom_Category_Col']
        ])
      });

      // Bind template to sync config
      await GoogleSheetsSyncConfig.findOneAndUpdate(
        { ingressKey: testIngressKey },
        { supplierTemplateId: template._id }
      );

      const headers = ['Custom_SKU_Col', 'Custom_Desc_Col', 'Custom_Batch_Col', 'Custom_Qty_Col', 'Custom_Price_Col', 'Custom_Expiry_Col', 'Custom_Category_Col'];
      const rows = [
        ['GS-SKU-TEMPLATE-1', 'Greek Yogurt 500g', 'LOT-YOG-777', '80', '1.95', '2026-11-20', 'Dairy']
      ];

      const res = await request(app)
        .post('/api/v1/ingestion/google-sheets/webhook')
        .set('X-Ingress-Key', testIngressKey)
        .send({
          spreadsheetId: 'sheet-abc-123',
          sheetName: 'Live Inventory',
          headers,
          rows
        });

      expect(res.status).toBe(200);
      expect(res.body.metrics.inserted).toBe(1);

      const InventoryLot = mongoose.model('InventoryLot');
      const createdLot = await InventoryLot.findOne({ supplierId, lotNumber: 'LOT-YOG-777' });
      expect(createdLot).toBeDefined();
      expect(createdLot?.quantityCases).toBe(80);
      expect(createdLot?.standardSellPrice).toBe(1.95);

      await SupplierTemplate.deleteMany({ supplierId });
    });
  });

  describe('Slice 4: Zero-Quantity Depletion & Bid / Audit Preservation', () => {
    it('transitions existing lot to depleted status when quantity drops to 0, strictly preserving active workflow stage bids and audit history', async () => {
      const InventoryLot = mongoose.model('InventoryLot');
      const lot = await InventoryLot.findOne({ supplierId, lotNumber: 'LOT-ALM-001' });
      expect(lot).toBeDefined();
      const lotId = lot!._id;

      // Seed an active buyer
      const buyer = await Buyer.create({
        companyName: 'Depletion Buyer LLC',
        email: 'depletion_buyer_test@domain.org',
        tier: 'direct_retailer',
        isActive: true
      });

      // Seed an active workflow stage bid / offer on this lot
      const offer = await Offer.create({
        lotId,
        buyerId: buyer._id,
        quantity: 50,
        price: 2.80,
        status: 'pending',
        messages: [{
          sender: 'buyer',
          content: 'Bidding 50 cases at $2.80',
          timestamp: new Date()
        }]
      });

      // Seed CRM audit history on this lot
      const activity = await Activity.create({
        lotId,
        type: 'note',
        subject: 'Audit Note: Inspection cleared',
        content: 'Lot inspected and approved by QC officer',
        timestamp: new Date()
      });

      // Now push Google Sheet payload with quantity = 0 for this lot
      const headers = ['SKU Code', 'Item Description', 'Lot Number', 'Quantity Cases', 'Unit Price', 'Expiry Date', 'Category'];
      const rows = [
        ['GS-SKU-100', 'Organic Almond Milk 1L', 'LOT-ALM-001', '0', '3.10', '2027-06-30', 'Dairy']
      ];

      const res = await request(app)
        .post('/api/v1/ingestion/google-sheets/webhook')
        .set('X-Ingress-Key', testIngressKey)
        .send({
          spreadsheetId: 'sheet-abc-123',
          sheetName: 'Live Inventory',
          headers,
          rows
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.metrics.totalRows).toBe(1);
      expect(res.body.metrics.inserted).toBe(0);
      expect(res.body.metrics.updated).toBe(0);
      expect(res.body.metrics.depleted).toBe(1);

      // Verify lot was transitioned to depleted with 0 available quantity
      const depletedLot = await InventoryLot.findById(lotId);
      expect(depletedLot).toBeDefined();
      expect(depletedLot?.status).toBe('depleted');
      expect(depletedLot?.availableQty).toBe(0);
      expect(depletedLot?.quantityCases).toBe(0);

      // Verify the associated Offer is strictly preserved and still pending
      const preservedOffer = await Offer.findById(offer._id);
      expect(preservedOffer).toBeDefined();
      expect(preservedOffer?.lotId?.toString()).toBe(lotId.toString());
      expect(preservedOffer?.quantity).toBe(50);
      expect(preservedOffer?.price).toBe(2.80);
      expect(preservedOffer?.status).toBe('pending');
      expect(preservedOffer?.messages.length).toBe(1);

      // Verify CRM activity log is preserved intact
      const preservedActivity = await Activity.findById(activity._id);
      expect(preservedActivity).toBeDefined();
      expect(preservedActivity?.lotId?.toString()).toBe(lotId.toString());
      expect(preservedActivity?.content).toBe('Lot inspected and approved by QC officer');

      // Clean up seeded offer and buyer
      await Offer.findByIdAndDelete(offer._id);
      await Activity.findByIdAndDelete(activity._id);
      await Buyer.findByIdAndDelete(buyer._id);
    });

    it('creates novel lot with quantity 0 directly in depleted status and records depleted metric', async () => {
      const headers = ['SKU Code', 'Item Description', 'Lot Number', 'Quantity Cases', 'Unit Price', 'Expiry Date', 'Category'];
      const rows = [
        ['GS-SKU-ZERO', 'Zero Stock Snack Bar', 'LOT-ZERO-001', '0', '1.50', '2027-08-31', 'Dry Goods']
      ];

      const res = await request(app)
        .post('/api/v1/ingestion/google-sheets/webhook')
        .set('X-Ingress-Key', testIngressKey)
        .send({
          spreadsheetId: 'sheet-abc-123',
          sheetName: 'Live Inventory',
          headers,
          rows
        });

      expect(res.status).toBe(200);
      expect(res.body.metrics.totalRows).toBe(1);
      expect(res.body.metrics.inserted).toBe(0);
      expect(res.body.metrics.depleted).toBe(1);

      const InventoryLot = mongoose.model('InventoryLot');
      const zeroLot = await InventoryLot.findOne({ supplierId, lotNumber: 'LOT-ZERO-001' });
      expect(zeroLot).toBeDefined();
      expect(zeroLot?.status).toBe('depleted');
      expect(zeroLot?.availableQty).toBe(0);
      expect(zeroLot?.quantityCases).toBe(0);
    });
  });

  describe('Slice 4: Handshake Mapping Persistence (POST /api/v1/ingestion/google-sheets/mapping)', () => {
    it('returns 400 Bad Request when supplierId or columnMappings is missing', async () => {
      const res = await request(app)
        .post('/api/v1/ingestion/google-sheets/mapping')
        .send({
          spreadsheetId: 'sheet-abc-123'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/supplierId and columnMappings are required/i);
    });

    it('persists SupplierTemplate and updates GoogleSheetsSyncConfig.supplierTemplateId', async () => {
      const mappings = {
        sku: 'Custom_SKU',
        description: 'Item_Title',
        quantity: 'Available_Stock',
        expirationDate: 'Best_Before',
        originalPrice: 'Base_Price'
      };

      const res = await request(app)
        .post('/api/v1/ingestion/google-sheets/mapping')
        .send({
          supplierId,
          spreadsheetId: 'sheet-abc-123',
          sheetName: 'Live Inventory',
          templateName: 'Google Sheets Custom Template',
          columnMappings: mappings
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.supplierTemplateId).toBeDefined();

      const config = await GoogleSheetsSyncConfig.findOne({ supplierId });
      expect(config?.supplierTemplateId).toBeDefined();
      expect(config?.supplierTemplateId?.toString()).toBe(res.body.supplierTemplateId);

      const SupplierTemplate = mongoose.model('SupplierTemplate');
      const template = await SupplierTemplate.findById(res.body.supplierTemplateId);
      expect(template).toBeDefined();
      expect(template?.templateName).toBe('Google Sheets Custom Template');
      expect(template?.columnMappings.get('sku')).toBe('Custom_SKU');
    });
  });
});


