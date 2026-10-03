import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import coreReducer from '../store/slices/coreSlice';
import ingestionReducer, {
  setPipelineTab,
  setInventoryParsedResult,
} from '../store/slices/ingestionSlice';
import inventoryReducer from '../store/slices/inventorySlice';
import workflowReducer from '../store/slices/workflowSlice';
import logisticsReducer from '../store/slices/logisticsSlice';
import authReducer from '../store/slices/authSlice';
import { IngestionView } from '../views/IngestionView';
import googleSheetsSyncService from '../services/googleSheetsSyncService';

vi.mock('../services/googleSheetsSyncService', () => {
  const mockService = {
    fetchScriptTemplate: vi.fn().mockResolvedValue({
      success: true,
      script: 'function onEdit(e) {}',
      ingressKey: 'spoileralert_sec_live_key_999',
      webhookUrl: 'http://localhost:5000/api/v1/ingestion/google-sheets/webhook',
    }),
    testPing: vi.fn(),
    fetchSampleRows: vi.fn(),
    fetchRoster: vi.fn().mockResolvedValue({
      success: true,
      connectedSheets: [],
      totalSheets: 0,
    }),
    saveMapping: vi.fn().mockResolvedValue({
      success: true,
      supplierTemplateId: 'tmpl-produce-created',
      message: 'Mapping updated successfully',
    }),
    syncNow: vi.fn(),
    disconnectSheet: vi.fn(),
  };
  return {
    default: mockService,
    googleSheetsSyncService: mockService,
  };
});

// Mock AuthContext
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { email: 'ops@acmeorganics.com' },
    token: 'test-token',
  }),
}));

const createTestStore = (preloadedState?: any) => {
  return configureStore({
    reducer: {
      core: coreReducer,
      ingestion: ingestionReducer,
      inventory: inventoryReducer,
      workflow: workflowReducer,
      logistics: logisticsReducer,
      auth: authReducer,
    },
    preloadedState,
  });
};

describe('Vertical Slice 3: Ingestion View & GridMapperTable Handoff Integration', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    vi.clearAllMocks();
    window.history.pushState({}, '', '/');
    store = createTestStore({
      core: {
        suppliers: [{ _id: 'sup-1', name: 'Acme Organics' }],
      },
      ingestion: {
        pipelineTab: 'inventory',
        selectedSupplier: 'sup-1',
        inventoryParsedResult: null,
        inventoryMappings: {},
        inventorySemanticRules: [],
        inventoryIsImported: false,
        inventoryImportCount: 0,
        inventoryImportedLotIds: [],
        googleSheetsConfig: {
          spreadsheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
          sheetName: 'Inventory Master',
          connectedEmail: 'ops@acmeorganics.com',
          oauthConnected: true,
          ingressKey: 'spoileralert_sec_live_key_999',
        },
        googleSheetsScript: 'function onEdit(e) {}',
        googleSheetsScriptLoading: false,
        googleSheetsPingStatus: 'idle',
        googleSheetsPingLatencyMs: null,
        googleSheetsPingError: null,
        googleSheetsHandshakeLoading: false,
      },
    });
  });

  it('clicking "Connect Sheets" on IngestionHubConnectors transitions to full-page GoogleSheetsIntegrationView', async () => {
    render(
      <Provider store={store}>
        <IngestionView />
      </Provider>
    );

    // Initial state: pipeline workbench is present
    expect(document.querySelector('#panel-inventory')).toBeDefined();

    // Click "Connect Sheets" button on Card 2
    const connectSheetsBtn = screen.getByRole('button', { name: /Connect Sheets/i });
    expect(connectSheetsBtn).toBeDefined();
    fireEvent.click(connectSheetsBtn);

    // Verify full-page integration management suite opened
    expect(await screen.findByText('Google Sheets Ingestion Suite')).toBeDefined();
    expect(screen.getByTestId('gsheet-quadrant-1-telemetry')).toBeDefined();
    expect(screen.getByTestId('gsheet-quadrant-2-credentials')).toBeDefined();
    expect(screen.getByTestId('gsheet-quadrant-3-roster')).toBeDefined();
    expect(screen.getByTestId('gsheet-quadrant-4-mapper')).toBeDefined();
  });

  it('clicking Back to Ingestion Pipeline returns to pipeline view without breaking pipeline state', async () => {
    render(
      <Provider store={store}>
        <IngestionView />
      </Provider>
    );

    // Open full-page integration view
    const connectSheetsBtn = screen.getByRole('button', { name: /Connect Sheets/i });
    fireEvent.click(connectSheetsBtn);
    expect(await screen.findByText('Google Sheets Ingestion Suite')).toBeDefined();

    // Click Back to Ingestion Pipeline button
    const backBtn = screen.getByRole('button', { name: /Back to Ingestion Pipeline/i });
    fireEvent.click(backBtn);

    // Full page connector view should be closed and inventory workbench visible
    await waitFor(() => {
      expect(screen.queryByText('Google Sheets Ingestion Suite')).toBeNull();
    });
    expect(document.querySelector('#panel-inventory')).toBeDefined();
  });

  it('recalculates live Ingestion Telemetry metrics when sheet lots are synced into the pipeline', async () => {
    const { setInventoryList } = await import('../store/slices/inventorySlice');
    const { useIngestionTelemetry } = await import('../components/domain/ingestion/hooks/useIngestionTelemetry');
    const { renderHook } = await import('@testing-library/react');

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );

    const { result } = renderHook(() => useIngestionTelemetry(), { wrapper });

    // Initial state: 0 critical lots
    expect(result.current.metrics.criticalRsl).toBe('0 Lots');

    // Simulate Google Sheets sync updating inventory with critical and standard lots
    const now = new Date();
    const criticalExpiry = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(); // 5 days remaining
    const normalExpiry = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString();

    const { act } = await import('@testing-library/react');
    act(() => {
      store.dispatch(
        setInventoryList([
          {
            _id: 'lot-gs-1',
            lotNumber: 'LOT-GS-001',
            sku: 'GS-ALMOND-101',
            description: 'Organic Almond Milk 1L',
            quantityCases: 100,
            availableQty: 100,
            costPerCase: 20,
            standardSellPrice: 25,
            expirationDate: criticalExpiry,
            status: 'critical',
          },
          {
            _id: 'lot-gs-2',
            lotNumber: 'LOT-GS-002',
            sku: 'GS-OAT-102',
            description: 'Barista Oat Milk 1L',
            quantityCases: 200,
            availableQty: 200,
            costPerCase: 15,
            standardSellPrice: 18,
            expirationDate: normalExpiry,
            status: 'active',
          },
        ])
      );
    });

    // After sheet sync hydration, telemetry hook recalculates to show 1 Critical Lot (<14 Days)
    await waitFor(() => {
      expect(result.current.metrics.criticalRsl).toBe('1 Lot');
    });
  });

  it('handles Google Sheets sync failure gracefully without crashing the pipeline UI', async () => {
    const { setGoogleSheetsSyncState } = await import('../store/slices/ingestionSlice');

    render(
      <Provider store={store}>
        <IngestionView />
      </Provider>
    );

    store.dispatch(
      setGoogleSheetsSyncState({
        connectionStatus: 'connected',
        lastSyncedAt: new Date().toISOString(),
        syncedLotCount: 0,
        isSyncing: false,
        error: 'Network timeout syncing sheet with backend webhook',
      })
    );

    // Pipeline should remain mounted and operational
    expect(screen.getByTestId('data-source-chip-google-sheets')).toBeDefined();
    expect(screen.getByText('Google Sheets')).toBeDefined();
    expect(screen.getByText('Surplus Ingestion Pipeline')).toBeDefined();
  });

  it('verifies end-to-end per-sheet column re-mapping and ingestion reconciliation from roster through in-situ workbench', async () => {
    const mockSampleResult = {
      documentId: 'gsheet-handshake-produce-master',
      fileName: 'Google Sheets: Produce Master',
      rawGrid: [
        ['Item Code', 'Fruit Description', 'Case Count', 'Expiry Date'],
        ['FRUIT-101', 'Organic Apples', '100', '2026-11-20'],
      ],
      suggestedMapping: {
        sku: 'Item Code',
        description: 'Fruit Description',
        quantity: 'Case Count',
        expirationDate: 'Expiry Date',
      },
    };

    (googleSheetsSyncService.fetchSampleRows as any).mockResolvedValue(mockSampleResult);
    (googleSheetsSyncService.fetchRoster as any).mockResolvedValue({
      success: true,
      connectedSheets: [
        {
          spreadsheetId: 'sheet-produce-01',
          spreadsheetTitle: 'Produce Master',
          sheetName: 'ProduceTab',
          syncStatus: 'success',
          lastSyncedAt: new Date().toISOString(),
          lotCount: 45,
        },
      ],
      totalSheets: 1,
    });
    (googleSheetsSyncService.saveMapping as any).mockResolvedValue({
      success: true,
      supplierTemplateId: 'tmpl-produce-custom-001',
      message: 'Column mapping saved successfully.',
    });

    render(
      <Provider store={store}>
        <IngestionView />
      </Provider>
    );

    // Open full-page connector
    const connectSheetsBtn = screen.getByRole('button', { name: /Connect Sheets/i });
    fireEvent.click(connectSheetsBtn);
    expect(await screen.findByText('Google Sheets Ingestion Suite')).toBeDefined();

    // Verify roster displays Produce Master
    expect(await screen.findByText('Produce Master')).toBeDefined();

    // Click "Edit Mapping" on that row
    const editMappingBtn = await screen.findByRole('button', { name: /Edit Mapping/i });
    fireEvent.click(editMappingBtn);

    // In-situ workbench mounts with breadcrumbs and table preview
    expect(await screen.findByText(/Produce Master Mapping/i)).toBeDefined();
    expect(screen.getAllByText('Item Code').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Fruit Description').length).toBeGreaterThan(0);

    // Save Sheet Mapping
    const saveBtn = screen.getByRole('button', { name: /Save Sheet Mapping/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(googleSheetsSyncService.saveMapping).toHaveBeenCalledWith(
        expect.objectContaining({
          supplierId: 'sup-1',
          spreadsheetId: 'sheet-produce-01',
          sheetName: 'ProduceTab',
        })
      );
    });

    expect(await screen.findByText(/Mapping Saved ✓/i)).toBeDefined();
  });
});

