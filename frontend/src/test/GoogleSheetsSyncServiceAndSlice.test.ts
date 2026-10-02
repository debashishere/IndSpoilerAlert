import { describe, it, expect, beforeEach, vi } from 'vitest';
import { googleSheetsSyncService } from '../services/googleSheetsSyncService';
import { configureStore } from '@reduxjs/toolkit';
import ingestionReducer, {
  setGoogleSheetsConfig,
  fetchGoogleSheetsScriptThunk,
  testGoogleSheetsPingThunk,
  hydrateGoogleSheetsHandshakeThunk,
  hydrateGoogleSheetsHandshakeMappingThunk,
} from '../store/slices/ingestionSlice';

describe('Slice 1: Google Sheets Sync Service & Redux Seam', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('googleSheetsSyncService unit tests', () => {
    it('fetches script template for a given supplierId', async () => {
      const mockResponse = {
        success: true,
        supplierId: 'sup-123',
        spreadsheetId: 'sheet-xyz',
        sheetName: 'Sheet1',
        ingressKey: 'ing-key-789',
        webhookUrl: 'http://localhost:5000/api/v1/ingestion/google-sheets/webhook',
        testPingUrl: 'http://localhost:5000/api/v1/ingestion/google-sheets/test-ping',
        script: '// Google Apps Script Code\nfunction onEdit(e) {}',
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as any);

      const result = await googleSheetsSyncService.fetchScriptTemplate('sup-123');

      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/ingestion/google-sheets/script-template?supplierId=sup-123'),
        expect.objectContaining({ method: 'GET' })
      );
      expect(result.script).toContain('function onEdit(e)');
      expect(result.ingressKey).toBe('ing-key-789');
    });

    it('throws error when script template fetch fails', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Sync configuration not found' }),
      } as any);

      await expect(
        googleSheetsSyncService.fetchScriptTemplate('non-existent')
      ).rejects.toThrow('Sync configuration not found');
    });

    it('sends test ping with X-Ingress-Key header and returns latency telemetry', async () => {
      const mockPingRes = {
        success: true,
        status: 'connected',
        supplierName: 'Acme Organics',
        spreadsheetId: 'sheet-xyz',
        sheetName: 'Sheet1',
        message: 'Connection verified. Ready for sync.',
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockPingRes,
      } as any);

      const res = await googleSheetsSyncService.testPing({
        ingressKey: 'test-key-456',
        spreadsheetId: 'sheet-xyz',
        sheetName: 'Sheet1',
      });

      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/ingestion/google-sheets/test-ping'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'x-ingress-key': 'test-key-456',
          }),
        })
      );
      expect(res.status).toBe('connected');
      expect(typeof res.latencyMs).toBe('number');
      expect(res.latencyMs).toBeGreaterThanOrEqual(0);
    });

    it('fetches sample rows handshake and transforms into IngestionParsedResult format', async () => {
      const mockHandshakeData = {
        success: true,
        fileName: 'Google Sheets: Inventory Master (Sheet1)',
        rawGrid: [
          ['SKU', 'Description', 'Quantity', 'Exp Date', 'Price'],
          ['SKU-100', 'Organic Almond Milk', '150', '2026-12-31', '3.49'],
          ['SKU-200', 'Oat Drink Barista', '80', '2026-11-15', '4.20'],
        ],
        suggestedMapping: {
          sku: 'SKU',
          description: 'Description',
          quantity: 'Quantity',
          expirationDate: 'Exp Date',
          originalPrice: 'Price',
        },
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockHandshakeData,
      } as any);

      const parsed = await googleSheetsSyncService.fetchSampleRows({
        supplierId: 'sup-123',
        spreadsheetId: 'sheet-xyz',
        sheetName: 'Sheet1',
      });

      expect(parsed.rawGrid.length).toBe(3);
      expect(parsed.suggestedMapping.sku).toBe('SKU');
      expect(parsed.fileName).toContain('Google Sheets');
    });

    it('fetches connected sheets roster for a given supplierId', async () => {
      const mockRosterResponse = {
        success: true,
        supplierId: 'sup-123',
        ingressKey: 'ing-key-789',
        connectedSheets: [
          {
            spreadsheetId: 'sheet-1',
            spreadsheetTitle: 'Produce Inventory',
            sheetName: 'Sheet1',
            syncStatus: 'success',
            lastSyncedAt: '2026-10-01T10:00:00.000Z',
            lotCount: 42,
          },
        ],
        totalSheets: 1,
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockRosterResponse,
      } as any);

      const result = await (googleSheetsSyncService as any).fetchRoster('sup-123');

      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/ingestion/google-sheets/roster?supplierId=sup-123'),
        expect.objectContaining({ method: 'GET' })
      );
      expect(result.connectedSheets.length).toBe(1);
      expect(result.connectedSheets[0].spreadsheetTitle).toBe('Produce Inventory');
    });

    it('fetches connected sheets roster using ingressKey header if supplied', async () => {
      const mockRosterResponse = {
        success: true,
        supplierId: 'sup-123',
        ingressKey: 'ing-key-custom',
        connectedSheets: [],
        totalSheets: 0,
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockRosterResponse,
      } as any);

      await (googleSheetsSyncService as any).fetchRoster({ ingressKey: 'ing-key-custom' });

      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/ingestion/google-sheets/roster'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-ingress-key': 'ing-key-custom',
          }),
        })
      );
    });
  });

  describe('Redux Thunks & IngestionSlice state transitions', () => {
    let store: ReturnType<typeof configureStore>;

    beforeEach(() => {
      store = configureStore({
        reducer: {
          ingestion: ingestionReducer,
        },
      });
    });

    it('updates google sheets config state via setGoogleSheetsConfig', () => {
      store.dispatch(
        setGoogleSheetsConfig({
          spreadsheetId: 'sheet-abc',
          sheetName: 'Inventory_Q3',
          connectedEmail: 'supplier@brand.com',
          oauthConnected: true,
        })
      );

      const state = (store.getState() as any).ingestion;
      expect(state.googleSheetsConfig.spreadsheetId).toBe('sheet-abc');
      expect(state.googleSheetsConfig.sheetName).toBe('Inventory_Q3');
      expect(state.googleSheetsConfig.connectedEmail).toBe('supplier@brand.com');
      expect(state.googleSheetsConfig.oauthConnected).toBe(true);
    });

    it('handles testGoogleSheetsPingThunk success lifecycle with latency tracking', async () => {
      vi.spyOn(googleSheetsSyncService, 'testPing').mockResolvedValueOnce({
        success: true,
        status: 'connected',
        supplierName: 'Acme Organics',
        spreadsheetId: 'sheet-xyz',
        sheetName: 'Sheet1',
        message: 'Connection verified.',
        latencyMs: 125,
      });

      await store.dispatch(
        testGoogleSheetsPingThunk({
          ingressKey: 'key-123',
          spreadsheetId: 'sheet-xyz',
          sheetName: 'Sheet1',
        }) as any
      );

      const state = (store.getState() as any).ingestion;
      expect(state.googleSheetsPingStatus).toBe('connected');
      expect(state.googleSheetsPingLatencyMs).toBe(125);
      expect(state.googleSheetsPingError).toBeNull();
    });

    it('handles testGoogleSheetsPingThunk failure lifecycle', async () => {
      vi.spyOn(googleSheetsSyncService, 'testPing').mockRejectedValueOnce(
        new Error('Unauthorized: Invalid X-Ingress-Key.')
      );

      await store.dispatch(
        testGoogleSheetsPingThunk({
          ingressKey: 'invalid-key',
        }) as any
      );

      const state = (store.getState() as any).ingestion;
      expect(state.googleSheetsPingStatus).toBe('error');
      expect(state.googleSheetsPingError).toContain('Unauthorized');
    });

    it('handles hydrateGoogleSheetsHandshakeThunk and populates inventoryParsedResult for GridMapperTable', async () => {
      const mockParsedResult = {
        documentId: 'gsheet-handshake-1',
        fileName: 'Google Sheets (Live Handshake)',
        rawGrid: [
          ['Item Code', 'Product', 'Cases'],
          ['A1', 'Apple Cider', '50'],
        ],
        suggestedMapping: {
          sku: 'Item Code',
          description: 'Product',
          quantity: 'Cases',
        },
      };

      vi.spyOn(googleSheetsSyncService, 'fetchSampleRows').mockResolvedValueOnce(mockParsedResult);

      await store.dispatch(
        hydrateGoogleSheetsHandshakeThunk({
          supplierId: 'sup-1',
          spreadsheetId: 'sheet-1',
          sheetName: 'Sheet1',
        }) as any
      );

      const state = (store.getState() as any).ingestion;
      expect(state.inventoryParsedResult).toEqual(mockParsedResult);
      expect(state.inventoryMappings).toEqual({
        sku: 'Item Code',
        description: 'Product',
        quantity: 'Cases',
      });
    });

    it('supports hydrateGoogleSheetsHandshakeMappingThunk alias identically', async () => {
      expect(hydrateGoogleSheetsHandshakeMappingThunk).toBe(hydrateGoogleSheetsHandshakeThunk);
    });

    it('supports positional argument signatures for testPing and fetchSampleRows', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true, status: 'connected', latencyMs: 50, rawGrid: [] }),
      } as any);

      // Positional testPing(ingressKey, payload)
      await googleSheetsSyncService.testPing('pos-key', { spreadsheetId: 'pos-sheet', sheetName: 'Sheet1' });
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test-ping'),
        expect.objectContaining({
          headers: expect.objectContaining({ 'x-ingress-key': 'pos-key' }),
        })
      );

      // Positional fetchSampleRows(supplierId, spreadsheetId, sheetName)
      await googleSheetsSyncService.fetchSampleRows('sup-pos', 'sheet-pos', 'Tab1');
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('supplierId=sup-pos&spreadsheetId=sheet-pos&sheetName=Tab1'),
        expect.objectContaining({ method: 'GET' })
      );
    });
  });

  describe('Issue 04: Google Sheets Sync State & On-Demand Dispatch Seam', () => {
    it('googleSheetsSyncService.syncNow calls POST /api/v1/ingestion/google-sheets/sync-now', async () => {
      const mockSyncRes = {
        success: true,
        syncStatus: 'success',
        lastSyncedAt: '2026-09-29T12:00:00.000Z',
        syncedLotCount: 142,
        metrics: { totalRows: 150, inserted: 142, updated: 0, depleted: 0, errors: [] },
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockSyncRes,
      } as any);

      const res = await (googleSheetsSyncService as any).syncNow({ supplierId: 'sup-101' });

      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/ingestion/google-sheets/sync-now'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ supplierId: 'sup-101' }),
        })
      );
      expect(res.syncedLotCount).toBe(142);
      expect(res.syncStatus).toBe('success');
    });

    it('initializes ingestionSlice with googleSheetsSync default state', () => {
      const store = configureStore({
        reducer: { ingestion: ingestionReducer },
      });
      const state = (store.getState() as any).ingestion;

      expect(state.googleSheetsSync).toEqual({
        connectionStatus: 'unconnected',
        lastSyncedAt: null,
        syncedLotCount: 0,
        isSyncing: false,
        error: null,
      });
    });

    it('handles syncGoogleSheetsNowThunk lifecycle (pending -> fulfilled)', async () => {
      const store = configureStore({
        reducer: { ingestion: ingestionReducer },
      });

      const mockSyncResult = {
        success: true,
        syncStatus: 'success',
        lastSyncedAt: '2026-09-29T12:00:00.000Z',
        syncedLotCount: 88,
        metrics: { totalRows: 88, inserted: 88, updated: 0, depleted: 0, errors: [] },
      };

      vi.spyOn((googleSheetsSyncService as any), 'syncNow').mockResolvedValueOnce(mockSyncResult);

      const { syncGoogleSheetsNowThunk } = await import('../store/slices/ingestionSlice');
      await store.dispatch((syncGoogleSheetsNowThunk as any)({ supplierId: 'sup-101' }));

      const state = (store.getState() as any).ingestion;
      expect(state.googleSheetsSync.isSyncing).toBe(false);
      expect(state.googleSheetsSync.connectionStatus).toBe('connected');
      expect(state.googleSheetsSync.lastSyncedAt).toBe('2026-09-29T12:00:00.000Z');
      expect(state.googleSheetsSync.syncedLotCount).toBe(88);
      expect(state.googleSheetsSync.error).toBeNull();
    });

    it('handles syncGoogleSheetsNowThunk failure (pending -> rejected)', async () => {
      const store = configureStore({
        reducer: { ingestion: ingestionReducer },
      });

      vi.spyOn((googleSheetsSyncService as any), 'syncNow').mockRejectedValueOnce(
        new Error('Google Sheets API rate limit exceeded')
      );

      const { syncGoogleSheetsNowThunk } = await import('../store/slices/ingestionSlice');
      await store.dispatch((syncGoogleSheetsNowThunk as any)({ supplierId: 'sup-101' }));

      const state = (store.getState() as any).ingestion;
      expect(state.googleSheetsSync.isSyncing).toBe(false);
      expect(state.googleSheetsSync.error).toContain('Google Sheets API rate limit exceeded');
    });

    it('handles fetchGoogleSheetsRosterThunk lifecycle (pending -> fulfilled)', async () => {
      const store = configureStore({
        reducer: { ingestion: ingestionReducer },
      });

      const mockRosterResult = {
        success: true,
        supplierId: 'sup-101',
        ingressKey: 'ing-key-101',
        connectedSheets: [
          {
            spreadsheetId: 'sheet-abc',
            spreadsheetTitle: 'Bakery Inventory',
            sheetName: 'Sheet1',
            syncStatus: 'success',
            lastSyncedAt: '2026-10-01T11:00:00.000Z',
            lotCount: 15,
          },
        ],
        totalSheets: 1,
      };

      vi.spyOn((googleSheetsSyncService as any), 'fetchRoster').mockResolvedValueOnce(mockRosterResult);

      const { fetchGoogleSheetsRosterThunk } = await import('../store/slices/ingestionSlice');
      await store.dispatch((fetchGoogleSheetsRosterThunk as any)('sup-101'));

      const state = (store.getState() as any).ingestion;
      expect(state.connectedSheetsLoading).toBe(false);
      expect(state.connectedSheets).toHaveLength(1);
      expect(state.connectedSheets[0].spreadsheetId).toBe('sheet-abc');
      expect(state.connectedSheets[0].lotCount).toBe(15);
      expect(state.googleSheetsConfig.ingressKey).toBe('ing-key-101');
    });

    it('handles fetchGoogleSheetsRosterThunk failure lifecycle (pending -> rejected)', async () => {
      const store = configureStore({
        reducer: { ingestion: ingestionReducer },
      });

      vi.spyOn((googleSheetsSyncService as any), 'fetchRoster').mockRejectedValueOnce(
        new Error('Failed to load roster')
      );

      const { fetchGoogleSheetsRosterThunk } = await import('../store/slices/ingestionSlice');
      await store.dispatch((fetchGoogleSheetsRosterThunk as any)('sup-101'));

      const state = (store.getState() as any).ingestion;
      expect(state.connectedSheetsLoading).toBe(false);
      expect(state.connectedSheetsError).toBe('Failed to load roster');
    });

    it('disconnectSheet calls DELETE /api/v1/ingestion/google-sheets/disconnect with payload', async () => {
      const mockDisconnectRes = {
        success: true,
        message: 'Spreadsheet sheet-123 disconnected successfully.',
        remainingSheets: 0,
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockDisconnectRes,
      } as any);

      const res = await googleSheetsSyncService.disconnectSheet({
        supplierId: 'sup-101',
        spreadsheetId: 'sheet-123',
        sheetName: 'Sheet1',
      });

      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/ingestion/google-sheets/disconnect'),
        expect.objectContaining({
          method: 'DELETE',
          body: JSON.stringify({
            supplierId: 'sup-101',
            spreadsheetId: 'sheet-123',
            sheetName: 'Sheet1',
          }),
        })
      );
      expect(res.success).toBe(true);
      expect(res.remainingSheets).toBe(0);
    });

    it('disconnectGoogleSheetThunk removes sheet from state.connectedSheets on success', async () => {
      const store = configureStore({
        reducer: { ingestion: ingestionReducer },
        preloadedState: {
          ingestion: {
            connectedSheets: [
              { spreadsheetId: 'sheet-1', sheetName: 'Tab1', lotCount: 10 },
              { spreadsheetId: 'sheet-2', sheetName: 'Tab2', lotCount: 20 },
            ],
          } as any,
        },
      });

      vi.spyOn(googleSheetsSyncService, 'disconnectSheet').mockResolvedValueOnce({
        success: true,
        message: 'Spreadsheet sheet-1 disconnected successfully.',
        remainingSheets: 1,
      });

      const { disconnectGoogleSheetThunk } = await import('../store/slices/ingestionSlice');
      await store.dispatch(
        (disconnectGoogleSheetThunk as any)({
          supplierId: 'sup-101',
          spreadsheetId: 'sheet-1',
          sheetName: 'Tab1',
        })
      );

      const state = (store.getState() as any).ingestion;
      expect(state.connectedSheets).toHaveLength(1);
      expect(state.connectedSheets[0].spreadsheetId).toBe('sheet-2');
    });

    it('disconnectGoogleSheetThunk records error on failure', async () => {
      const store = configureStore({
        reducer: { ingestion: ingestionReducer },
        preloadedState: {
          ingestion: {
            connectedSheets: [
              { spreadsheetId: 'sheet-1', sheetName: 'Tab1', lotCount: 10 },
            ],
          } as any,
        },
      });

      vi.spyOn(googleSheetsSyncService, 'disconnectSheet').mockRejectedValueOnce(
        new Error('Failed to disconnect spreadsheet')
      );

      const { disconnectGoogleSheetThunk } = await import('../store/slices/ingestionSlice');
      const actionResult = await store.dispatch(
        (disconnectGoogleSheetThunk as any)({
          supplierId: 'sup-101',
          spreadsheetId: 'sheet-1',
        })
      );

      expect(actionResult.type).toBe('ingestion/disconnectGoogleSheet/rejected');
      const state = (store.getState() as any).ingestion;
      expect(state.connectedSheets).toHaveLength(1);
      expect(state.connectedSheetsError).toBe('Failed to disconnect spreadsheet');
    });

    it('saveMapping calls POST /api/v1/ingestion/google-sheets/save-mapping with per-sheet schema', async () => {
      const mockSaveMappingRes = {
        success: true,
        supplierTemplateId: 'tmpl-produce-999',
        message: 'Google Sheets column mapping saved.',
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockSaveMappingRes,
      } as any);

      const res = await (googleSheetsSyncService as any).saveMapping({
        supplierId: 'sup-101',
        spreadsheetId: 'sheet-produce',
        sheetName: 'Fruits',
        templateName: 'Produce Dept Mapping',
        columnMappings: { sku: 'Item Code', description: 'Fruit Name' },
      });

      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/ingestion/google-sheets/save-mapping'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            supplierId: 'sup-101',
            spreadsheetId: 'sheet-produce',
            sheetName: 'Fruits',
            templateName: 'Produce Dept Mapping',
            columnMappings: { sku: 'Item Code', description: 'Fruit Name' },
          }),
        })
      );
      expect(res.success).toBe(true);
      expect(res.supplierTemplateId).toBe('tmpl-produce-999');
    });

    it('saveGoogleSheetsMappingThunk updates connectedSheets subdocument template binding in Redux state', async () => {
      const store = configureStore({
        reducer: { ingestion: ingestionReducer },
        preloadedState: {
          ingestion: {
            connectedSheets: [
              { spreadsheetId: 'sheet-produce', sheetName: 'Fruits', lotCount: 25 },
              { spreadsheetId: 'sheet-dairy', sheetName: 'Milk', lotCount: 10 },
            ],
          } as any,
        },
      });

      vi.spyOn(googleSheetsSyncService as any, 'saveMapping').mockResolvedValueOnce({
        success: true,
        supplierTemplateId: 'tmpl-produce-999',
        message: 'Google Sheets column mapping saved.',
      });

      const { saveGoogleSheetsMappingThunk } = await import('../store/slices/ingestionSlice');
      await store.dispatch(
        (saveGoogleSheetsMappingThunk as any)({
          supplierId: 'sup-101',
          spreadsheetId: 'sheet-produce',
          sheetName: 'Fruits',
          templateName: 'Produce Dept Mapping',
          columnMappings: { sku: 'Item Code', description: 'Fruit Name' },
        })
      );

      const state = (store.getState() as any).ingestion;
      const produceSheet = state.connectedSheets.find((s: any) => s.spreadsheetId === 'sheet-produce');
      expect(produceSheet?.supplierTemplateId).toBe('tmpl-produce-999');
    });
  });
});

