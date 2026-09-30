import mongoose from 'mongoose';
import GoogleSheetsSyncConfig from '../models/GoogleSheetsSyncConfig';
import Supplier from '../models/Supplier';
import SupplierTemplate from '../models/SupplierTemplate';
import * as ingestService from '../services/ingestService';
import * as googleSheetsIngressService from '../services/googleSheetsIngressService';

describe('Slice 1: Google Sheets Adapter Contraction & IngestService Delegation', () => {
  let supplierId: string;
  let config: any;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ind-spoiler-alert-test');
    }

    await Supplier.deleteMany({ companyCode: 'GSHEET_DELEGATE_SUP' });
    const supplier = await Supplier.create({
      name: 'Google Sheets Delegation Supplier',
      companyCode: 'GSHEET_DELEGATE_SUP',
      preferredDisposition: 'sell'
    });
    supplierId = supplier._id.toString();

    await GoogleSheetsSyncConfig.deleteMany({ supplierId });
    config = await GoogleSheetsSyncConfig.create({
      supplierId,
      spreadsheetId: 'sheet-delegate-xyz',
      sheetName: 'Live Inventory',
      ingressKey: 'delegate-ingress-key-12345',
      syncStatus: 'idle'
    });
  });

  afterAll(async () => {
    await GoogleSheetsSyncConfig.deleteMany({ supplierId });
    await SupplierTemplate.deleteMany({ supplierId });
    await Supplier.deleteMany({ _id: supplierId });
  });

  it('delegates webhook processing directly to ingestService.processBatch and records sync completion', async () => {
    const processBatchSpy = jest.spyOn(ingestService, 'processBatch');
    const recordSyncCompletionSpy = jest.spyOn(ingestService, 'recordSyncCompletion');

    const payload: googleSheetsIngressService.IngressPayload = {
      spreadsheetId: 'sheet-delegate-xyz',
      sheetName: 'Live Inventory',
      headers: ['Item SKU', 'Product Description', 'Batch #', 'Quantity', 'Price', 'Best Before', 'Category'],
      rows: [
        ['GS-DEL-101', 'Oat Milk Organic 1L', 'LOT-DEL-101', '50', '3.25', '2026-12-01', 'Dairy']
      ]
    };

    const result = await googleSheetsIngressService.processGoogleSheetsWebhook(config, payload);

    expect(processBatchSpy).toHaveBeenCalledTimes(1);
    const passedBatch = processBatchSpy.mock.calls[0][0];
    expect(passedBatch.supplierId).toBe(supplierId);
    expect(passedBatch.source).toBe('google-sheets');
    expect(passedBatch.headers).toEqual(payload.headers);
    expect(passedBatch.rows).toEqual(payload.rows);
    expect(passedBatch.columnMappings).toBeDefined();

    expect(recordSyncCompletionSpy).toHaveBeenCalledTimes(1);

    expect(result.success).toBe(true);
    expect(result.syncStatus).toBe('success');
    expect(result.metrics.totalRows).toBe(1);
    expect(result.metrics.inserted).toBe(1);

    processBatchSpy.mockRestore();
    recordSyncCompletionSpy.mockRestore();
  });
});
