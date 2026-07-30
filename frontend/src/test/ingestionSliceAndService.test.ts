import { describe, it, expect, vi } from 'vitest';
import { store } from '../store';

describe('Issue #37 Tracer Bullet 1: Ingestion Slice State & Actions', () => {
  it('should initialize store with ingestionSlice containing default inventory pipeline state', async () => {
    const { setPipelineTab, updateInventoryMapping, addSemanticRule, removeSemanticRule } = await import('../store/slices/ingestionSlice');

    const state = (store.getState() as any).ingestion;
    expect(state).toBeDefined();
    expect(state.pipelineTab).toBe('inventory');
    expect(state.inventoryMappings).toEqual({});
    expect(state.inventorySemanticRules).toEqual([]);
    expect(state.inventoryParsedResult).toBe(null);

    // Dispatch setPipelineTab
    store.dispatch(setPipelineTab('sales'));
    expect((store.getState() as any).ingestion.pipelineTab).toBe('sales');

    // Dispatch updateInventoryMapping
    store.dispatch(updateInventoryMapping({ dbField: 'sku', headerName: 'Product SKU' }));
    expect((store.getState() as any).ingestion.inventoryMappings.sku).toBe('Product SKU');

    // Dispatch addSemanticRule
    const rule = { sourceKey: 'Temp', targetKey: 'minStorageTemp', transform: 'toNumber' };
    store.dispatch(addSemanticRule(rule));
    expect((store.getState() as any).ingestion.inventorySemanticRules).toEqual([rule]);

    // Dispatch removeSemanticRule
    store.dispatch(removeSemanticRule(0));
    expect((store.getState() as any).ingestion.inventorySemanticRules).toEqual([]);
  });
});

describe('Issue #37 Tracer Bullet 2: IngestionService & Async Thunks', () => {
  it('should upload inventory file, poll job status if 202, confirm inventory, upload sales, confirm sales, and add buyer via IngestionService with exact headers', async () => {
    // Dynamically import service so test fails RED when file is missing
    const ingestionServiceModule = await import('../services/ingestionService');
    const ingestionService = ingestionServiceModule.default || ingestionServiceModule.ingestionService;

    const fetchCalls: Array<{ url: string; options: any }> = [];
    let pollCount = 0;

    vi.stubGlobal('fetch', async (url: any, options: any) => {
      fetchCalls.push({ url: url.toString(), options });

      if (url.toString().includes('/ingest/upload') && options?.method === 'POST') {
        // Check if it's sales or inventory based on body or URL
        return {
          ok: true,
          status: 202,
          json: async () => ({ ingestionJobId: 'job-123' }),
        } as Response;
      }

      if (url.toString().includes('/ingest/jobs/job-123')) {
        pollCount++;
        if (pollCount === 1) {
          return {
            ok: true,
            status: 200,
            json: async () => ({ status: 'parsing' }),
          } as Response;
        }
        return {
          ok: true,
          status: 200,
          json: async () => ({
            status: 'parsed',
            documentId: 'doc-999',
            fileName: 'test.csv',
            rawGrid: [['sku', 'qty'], ['SKU1', '100']],
            suggestedMapping: { sku: 'sku', quantity: 'qty' },
          }),
        } as Response;
      }

      if (url.toString().includes('/ingest/confirm-sales') && options?.method === 'POST') {
        return {
          ok: true,
          status: 200,
          json: async () => ({ countImported: 3, warnings: ['Warning 1'] }),
        } as Response;
      }

      if (url.toString().includes('/ingest/confirm') && !url.toString().includes('/confirm-sales') && options?.method === 'POST') {
        return {
          ok: true,
          status: 200,
          json: async () => ({ countImported: 5, importedLotIds: ['lot-1', 'lot-2'] }),
        } as Response;
      }

      if (url.toString().includes('/sales') && options?.method !== 'POST') {
        return {
          ok: true,
          status: 200,
          json: async () => ([{ _id: 'sale-1', sku: 'SKU1' }]),
        } as Response;
      }

      if (url.toString().includes('/buyers') && options?.method === 'POST') {
        return {
          ok: true,
          status: 201,
          json: async () => ({ _id: 'buyer-new', companyName: 'Costco', email: 'c@costco.com' }),
        } as Response;
      }

      return { ok: false, status: 404 } as Response;
    });

    try {
      const mockFile = new File(['test'], 'test.csv', { type: 'text/csv' });
      const progressSteps: string[] = [];
      const parsed = await ingestionService.uploadInventoryFile(mockFile, 'sup-1', (step) => progressSteps.push(step));

      expect(parsed.documentId).toBe('doc-999');
      expect(parsed.rawGrid).toEqual([['sku', 'qty'], ['SKU1', '100']]);
      expect(progressSteps).toContain('Queued for processing. Polling job status...');
      expect(progressSteps).toContain('Python Sidecar worker is actively parsing table structures...');

      const confirmed = await ingestionService.confirmInventoryIngestion({
        documentId: 'doc-999',
        supplierId: 'sup-1',
        mappings: { sku: 'sku' },
        saveTemplate: true,
        templateName: 'Danone Template',
        semanticRules: [],
      });
      expect(confirmed.countImported).toBe(5);
      expect(confirmed.importedLotIds).toEqual(['lot-1', 'lot-2']);

      const salesConfirmed = await ingestionService.confirmSalesIngestion({
        documentId: 'doc-999',
        supplierId: 'sup-1',
        mappings: { sku: 'sku' },
        saveTemplate: false,
      });
      expect(salesConfirmed.countImported).toBe(3);
      expect(salesConfirmed.warnings).toEqual(['Warning 1']);

      const buyerAdded = await ingestionService.addBuyer({
        companyName: 'Costco',
        email: 'c@costco.com',
        tier: 'tier1',
      });
      expect(buyerAdded.companyName).toBe('Costco');

      // Verify exact headers preservation on GET calls and JSON POST calls (`Cache-Control: no-cache, no-store`, `Pragma: no-cache`)
      for (const call of fetchCalls) {
        expect(call.options?.headers?.['Cache-Control']).toBe('no-cache, no-store');
        expect(call.options?.headers?.['Pragma']).toBe('no-cache');
      }
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('should dispatch uploadInventoryThunk and confirmInventoryThunk to update store state', async () => {
    const { uploadInventoryThunk, confirmInventoryThunk } = await import('../store/slices/ingestionSlice');

    vi.stubGlobal('fetch', async (url: any, _options: any) => {
      if (url.toString().includes('/ingest/upload')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            documentId: 'thunk-doc',
            fileName: 'thunk.csv',
            rawGrid: [['a', 'b'], ['1', '2']],
            suggestedMapping: { a: 'sku' },
          }),
        } as Response;
      }
      if (url.toString().includes('/ingest/confirm')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ countImported: 10, importedLotIds: ['lot-thunk'] }),
        } as Response;
      }
      return { ok: false, status: 404 } as Response;
    });

    try {
      const mockFile = new File(['data'], 'thunk.csv', { type: 'text/csv' });
      await store.dispatch(uploadInventoryThunk({ file: mockFile, supplierId: 'sup-thunk' }) as any);

      const state = (store.getState() as any).ingestion;
      expect(state.inventoryParsedResult?.documentId).toBe('thunk-doc');
      expect(state.inventoryMappings).toEqual({ a: 'sku' });
      expect(state.inventoryLoading).toBe(false);

      await store.dispatch(confirmInventoryThunk({
        documentId: 'thunk-doc',
        supplierId: 'sup-thunk',
        mappings: { a: 'sku' },
        saveTemplate: true,
      }) as any);

      const updatedState = (store.getState() as any).ingestion;
      expect(updatedState.inventoryIsImported).toBe(true);
      expect(updatedState.inventoryImportCount).toBe(10);
      expect(updatedState.inventoryImportedLotIds).toEqual(['lot-thunk']);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('should upload buyer file and confirm buyer ingestion via IngestionService', async () => {
    const ingestionServiceModule = await import('../services/ingestionService');
    const ingestionService = ingestionServiceModule.default || ingestionServiceModule.ingestionService;

    const fetchCalls: Array<{ url: string; options: any }> = [];

    vi.stubGlobal('fetch', async (url: any, options: any) => {
      fetchCalls.push({ url: url.toString(), options });

      if (url.toString().includes('/ingest/upload') && options?.method === 'POST') {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            documentId: 'buyer-doc-123',
            fileName: 'buyers.csv',
            rawGrid: [['Company Name', 'Email'], ['Acme Corp', 'b1@acme.com']],
            suggestedMapping: { companyName: 'Company Name', email: 'Email' },
          }),
        } as Response;
      }

      if (url.toString().includes('/ingest/confirm-buyer') && options?.method === 'POST') {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            createdCount: 2,
            updatedCount: 1,
            buyerIds: ['b-1', 'b-2', 'b-3'],
          }),
        } as Response;
      }

      return { ok: false, status: 404 } as Response;
    });

    try {
      const mockFile = new File(['Company Name,Email\nAcme,b1@acme.com'], 'buyers.csv', { type: 'text/csv' });
      const progressSteps: string[] = [];
      const parsed = await ingestionService.uploadBuyerFile(mockFile, undefined, (step) => progressSteps.push(step));

      expect(parsed.documentId).toBe('buyer-doc-123');
      expect(parsed.suggestedMapping).toEqual({ companyName: 'Company Name', email: 'Email' });
      expect(progressSteps).toContain('Uploading buyer file to backend...');

      const confirmed = await ingestionService.confirmBuyerIngestion({
        documentId: 'buyer-doc-123',
        mappings: { companyName: 'Company Name', email: 'Email' },
      });
      expect(confirmed.createdCount).toBe(2);
      expect(confirmed.updatedCount).toBe(1);
      expect(confirmed.buyerIds).toEqual(['b-1', 'b-2', 'b-3']);

      // Check standard headers
      for (const call of fetchCalls) {
        expect(call.options?.headers?.['Cache-Control']).toBe('no-cache, no-store');
        expect(call.options?.headers?.['Pragma']).toBe('no-cache');
      }
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('should dispatch uploadBuyerThunk and confirmBuyerThunk to update ingestion store state', async () => {
    const { uploadBuyerThunk, confirmBuyerThunk, updateBuyerMapping } = await import('../store/slices/ingestionSlice');

    vi.stubGlobal('fetch', async (url: any, options: any) => {
      if (url.toString().includes('/ingest/upload') && options?.method === 'POST') {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            documentId: 'buyer-thunk-doc',
            fileName: 'buyers_list.csv',
            rawGrid: [['Company', 'Email'], ['Target', 'buyer@target.com']],
            suggestedMapping: { companyName: 'Company', email: 'Email' },
          }),
        } as Response;
      }

      if (url.toString().includes('/ingest/confirm-buyer') && options?.method === 'POST') {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            createdCount: 5,
            updatedCount: 2,
            buyerIds: ['id1', 'id2'],
          }),
        } as Response;
      }

      return { ok: false, status: 404 } as Response;
    });

    try {
      const mockFile = new File(['data'], 'buyers_list.csv', { type: 'text/csv' });
      await store.dispatch(uploadBuyerThunk({ file: mockFile }) as any);

      let state = (store.getState() as any).ingestion;
      expect(state.buyerParsedResult?.documentId).toBe('buyer-thunk-doc');
      expect(state.buyerMappings).toEqual({ companyName: 'Company', email: 'Email' });
      expect(state.buyerLoading).toBe(false);

      // Dispatch manual mapping update
      store.dispatch(updateBuyerMapping({ dbField: 'tier', headerName: 'Tier Level' }));
      state = (store.getState() as any).ingestion;
      expect(state.buyerMappings.tier).toBe('Tier Level');

      // Dispatch confirm thunk
      await store.dispatch(confirmBuyerThunk({
        documentId: 'buyer-thunk-doc',
        mappings: state.buyerMappings,
      }) as any);

      const updatedState = (store.getState() as any).ingestion;
      expect(updatedState.buyerIsImported).toBe(true);
      expect(updatedState.buyerImportCount).toBe(5);
      expect(updatedState.buyerLoading).toBe(false);
      expect(updatedState.buyerSuccess).toContain('Successfully ingested 5 new buyers (2 updated)!');
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

