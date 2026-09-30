import mongoose from 'mongoose';
import request from 'supertest';
import app from '../index';
import Supplier from '../models/Supplier';
import ProductMaster from '../models/ProductMaster';
import InventoryLot from '../models/InventoryLot';
import DocumentImport from '../models/DocumentImport';
import GoogleSheetsSyncConfig from '../models/GoogleSheetsSyncConfig';
import SupplierTemplate from '../models/SupplierTemplate';
import DistributionCenter from '../models/DistributionCenter';

describe('Issue 05 Slice 1: Cross-Channel Ingress Integration & Equivalence Suite', () => {
  jest.setTimeout(30000);

  let csvSupplierId: string;
  let gsheetsSupplierId: string;
  const testIngressKey = 'test-cross-channel-ingress-key-999';

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ind-spoiler-alert-test');
    }

    // Clean up any remnants
    await Supplier.deleteMany({ companyCode: { $in: ['CROSS_CSV_SUP', 'CROSS_GS_SUP'] } });

    const csvSupplier = await Supplier.create({
      name: 'Cross Channel CSV Supplier',
      companyCode: 'CROSS_CSV_SUP',
      preferredDisposition: 'sell',
    });
    csvSupplierId = csvSupplier._id.toString();

    const gsheetsSupplier = await Supplier.create({
      name: 'Cross Channel Sheets Supplier',
      companyCode: 'CROSS_GS_SUP',
      preferredDisposition: 'sell',
    });
    gsheetsSupplierId = gsheetsSupplier._id.toString();

    await GoogleSheetsSyncConfig.deleteMany({ supplierId: gsheetsSupplierId });
    await GoogleSheetsSyncConfig.create({
      supplierId: gsheetsSupplierId,
      spreadsheetId: 'cross-channel-sheet-123',
      sheetName: 'Inventory',
      ingressKey: testIngressKey,
      syncStatus: 'idle',
    });
  });

  afterAll(async () => {
    await InventoryLot.deleteMany({ supplierId: { $in: [csvSupplierId, gsheetsSupplierId] } });
    await ProductMaster.deleteMany({ supplierId: { $in: [csvSupplierId, gsheetsSupplierId] } });
    await DistributionCenter.deleteMany({ supplierId: { $in: [csvSupplierId, gsheetsSupplierId] } });
    await SupplierTemplate.deleteMany({ supplierId: { $in: [csvSupplierId, gsheetsSupplierId] } });
    await GoogleSheetsSyncConfig.deleteMany({ ingressKey: testIngressKey });
    await DocumentImport.deleteMany({ supplierId: csvSupplierId });
    await Supplier.deleteMany({ _id: { $in: [csvSupplierId, gsheetsSupplierId] } });
  });

  it('generates identical ProductMaster and InventoryLot structures across CSV upload and Google Sheets webhook', async () => {
    const canonicalRows = [
      {
        sku: 'CROSS-SKU-101',
        desc: 'Organic Cold Brew Coffee 32oz',
        qty: '120',
        price: '4.50',
        expiry: '2027-06-30',
        lotNumber: 'LOT-CB-101',
      },
      {
        sku: 'CROSS-SKU-102',
        desc: 'Sprouted Chia Granola 16oz',
        qty: '80',
        price: '5.25',
        expiry: '2027-09-15',
        lotNumber: 'LOT-GR-102',
      }
    ];

    // 1. Ingest via CSV Route (DocumentImport + POST /api/ingest/confirm)
    const csvDoc = await DocumentImport.create({
      fileName: 'cross_channel_inventory.csv',
      status: 'parsed',
      rawGrid: [
        ['Item SKU', 'Product Description', 'Cases Available', 'Cost Per Case', 'Expiration Date', 'Lot #'],
        [canonicalRows[0].sku, canonicalRows[0].desc, canonicalRows[0].qty, canonicalRows[0].price, canonicalRows[0].expiry, canonicalRows[0].lotNumber],
        [canonicalRows[1].sku, canonicalRows[1].desc, canonicalRows[1].qty, canonicalRows[1].price, canonicalRows[1].expiry, canonicalRows[1].lotNumber],
      ],
      supplierId: csvSupplierId,
    });

    const csvConfirmRes = await request(app)
      .post('/api/ingest/confirm')
      .send({
        documentId: csvDoc._id.toString(),
        supplierId: csvSupplierId,
        mappings: {
          sku: 'Item SKU',
          description: 'Product Description',
          quantityCases: 'Cases Available',
          originalPrice: 'Cost Per Case',
          expirationDate: 'Expiration Date',
          lotNumber: 'Lot #',
        },
        saveTemplate: true,
        templateName: 'Cross Channel CSV Template',
      });

    expect(csvConfirmRes.status).toBe(200);
    expect(csvConfirmRes.body.countImported).toBe(2);

    // 2. Ingest via Google Sheets Webhook Route (POST /api/v1/ingestion/google-sheets/webhook)
    const sheetsWebhookRes = await request(app)
      .post('/api/v1/ingestion/google-sheets/webhook')
      .set('X-Ingress-Key', testIngressKey)
      .send({
        spreadsheetId: 'cross-channel-sheet-123',
        sheetName: 'Inventory',
        headers: ['Item SKU', 'Product Description', 'Cases Available', 'Cost Per Case', 'Expiration Date', 'Lot #'],
        rows: [
          [canonicalRows[0].sku, canonicalRows[0].desc, canonicalRows[0].qty, canonicalRows[0].price, canonicalRows[0].expiry, canonicalRows[0].lotNumber],
          [canonicalRows[1].sku, canonicalRows[1].desc, canonicalRows[1].qty, canonicalRows[1].price, canonicalRows[1].expiry, canonicalRows[1].lotNumber],
        ],
      });

    expect(sheetsWebhookRes.status).toBe(200);
    expect(sheetsWebhookRes.body.success).toBe(true);
    expect(sheetsWebhookRes.body.metrics.inserted).toBe(2);

    // 3. Query ProductMasters for both suppliers
    const csvProducts = await ProductMaster.find({ supplierId: csvSupplierId }).sort({ sku: 1 });
    const sheetsProducts = await ProductMaster.find({ supplierId: gsheetsSupplierId }).sort({ sku: 1 });

    expect(csvProducts).toHaveLength(2);
    expect(sheetsProducts).toHaveLength(2);

    // Validate parity of ProductMaster domain entities
    for (let i = 0; i < 2; i++) {
      expect(csvProducts[i].sku).toBe(sheetsProducts[i].sku);
      expect(csvProducts[i].description).toBe(sheetsProducts[i].description);
      expect(csvProducts[i].category).toBe(sheetsProducts[i].category);
      expect(csvProducts[i].shelfLifeDays).toBe(sheetsProducts[i].shelfLifeDays);
    }

    // 4. Query InventoryLots for both suppliers
    const csvLots = await InventoryLot.find({ supplierId: csvSupplierId }).sort({ lotNumber: 1 });
    const sheetsLots = await InventoryLot.find({ supplierId: gsheetsSupplierId }).sort({ lotNumber: 1 });

    expect(csvLots).toHaveLength(2);
    expect(sheetsLots).toHaveLength(2);

    // Validate parity of InventoryLot domain entities
    for (let i = 0; i < 2; i++) {
      expect(csvLots[i].lotNumber).toBe(sheetsLots[i].lotNumber);
      expect(csvLots[i].quantityCases).toBe(sheetsLots[i].quantityCases);
      expect(csvLots[i].availableQty).toBe(sheetsLots[i].availableQty);
      expect(csvLots[i].costPerCase).toBe(sheetsLots[i].costPerCase);
      expect(new Date(csvLots[i].expirationDate).toISOString().slice(0, 10))
        .toBe(new Date(sheetsLots[i].expirationDate).toISOString().slice(0, 10));
    }

    // 5. Downstream operational valuation parity
    const csvPortfolioValue = csvLots.reduce((sum, lot) => sum + lot.quantityCases * lot.costPerCase, 0);
    const sheetsPortfolioValue = sheetsLots.reduce((sum, lot) => sum + lot.quantityCases * lot.costPerCase, 0);

    expect(csvPortfolioValue).toBe(sheetsPortfolioValue);
    expect(csvPortfolioValue).toBe(120 * 4.50 + 80 * 5.25);
  });

  it('supports idempotent cross-channel updates when a Google Sheets sync runs for an existing lot', async () => {
    // Send updated quantities for the existing Google Sheets inventory
    const updateRes = await request(app)
      .post('/api/v1/ingestion/google-sheets/webhook')
      .set('X-Ingress-Key', testIngressKey)
      .send({
        spreadsheetId: 'cross-channel-sheet-123',
        sheetName: 'Inventory',
        headers: ['Item SKU', 'Product Description', 'Cases Available', 'Cost Per Case', 'Expiration Date', 'Lot #'],
        rows: [
          ['CROSS-SKU-101', 'Organic Cold Brew Coffee 32oz', '95', '4.50', '2027-06-30', 'LOT-CB-101'],
        ],
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.metrics.updated).toBe(1);

    const updatedLot = await InventoryLot.findOne({ supplierId: gsheetsSupplierId, lotNumber: 'LOT-CB-101' });
    expect(updatedLot).toBeDefined();
    expect(updatedLot?.quantityCases).toBe(95);
    expect(updatedLot?.availableQty).toBe(95);

    // ProductMaster count must remain 2 (no duplicate created)
    const productCount = await ProductMaster.countDocuments({ supplierId: gsheetsSupplierId });
    expect(productCount).toBe(2);
  });
});
