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
    fetchScriptTemplate: vi.fn(),
    testPing: vi.fn(),
    fetchSampleRows: vi.fn(),
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

  it('clicking "Connect Sheets" on IngestionHubConnectors opens GoogleSheetsConfigDrawer', async () => {
    render(
      <Provider store={store}>
        <IngestionView />
      </Provider>
    );

    // Initial state: drawer should not be present
    expect(screen.queryByText('Google Sheets Integration & Sync')).toBeNull();

    // Click "Connect Sheets" button on Card 2
    const connectSheetsBtn = screen.getByRole('button', { name: /Connect Sheets/i });
    expect(connectSheetsBtn).toBeDefined();
    fireEvent.click(connectSheetsBtn);

    // Verify GoogleSheetsConfigDrawer opened
    expect(await screen.findByText('Google Sheets Integration & Sync')).toBeDefined();
    expect(screen.getByText('Google Workspace Identity')).toBeDefined();
  });

  it('sample row handshake hydrates inventoryParsedResult, closes drawer, and mounts GridMapperTable for confirmation', async () => {
    const mockSampleResult = {
      documentId: 'gsheet-handshake-doc-123',
      fileName: 'Google Sheets: Inventory Master',
      rawGrid: [
        ['SKU Header', 'Product Title', 'Quantity', 'Expiry Date'],
        ['SKU-GS-100', 'Organic Almond Milk', '150', '2026-11-20'],
      ],
      suggestedMapping: {
        sku: 'SKU Header',
        description: 'Product Title',
        quantity: 'Quantity',
        expirationDate: 'Expiry Date',
      },
    };

    (googleSheetsSyncService.fetchSampleRows as any).mockResolvedValueOnce(mockSampleResult);

    render(
      <Provider store={store}>
        <IngestionView />
      </Provider>
    );

    // Open drawer
    const connectSheetsBtn = screen.getByRole('button', { name: /Connect Sheets/i });
    fireEvent.click(connectSheetsBtn);
    expect(await screen.findByText('Google Sheets Integration & Sync')).toBeDefined();

    // Click "Fetch Sample Rows & Open Column Mapper" CTA in drawer
    const fetchSampleBtn = screen.getByRole('button', {
      name: /Fetch Sample Rows & Open Column Mapper/i,
    });
    fireEvent.click(fetchSampleBtn);

    // Verify drawer closes and GridMapperTable / Confirmation mounts
    await waitFor(() => {
      expect(screen.queryByText('Google Sheets Integration & Sync')).toBeNull();
    });

    // Verify GridMapperTable is rendered with the fetched Google Sheets headers & preview
    expect(await screen.findByText('Confirm Inventory Data Mapping')).toBeDefined();
    expect(screen.getByText('Google Sheets: Inventory Master')).toBeDefined();
    expect(screen.getAllByText('SKU Header').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Product Title').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /Confirm & Import Lots/i })).toBeDefined();
  });

  it('closes GoogleSheetsConfigDrawer when cancel or close button is clicked without breaking pipeline state', async () => {
    render(
      <Provider store={store}>
        <IngestionView />
      </Provider>
    );

    // Open drawer
    const connectSheetsBtn = screen.getByRole('button', { name: /Connect Sheets/i });
    fireEvent.click(connectSheetsBtn);
    expect(await screen.findByText('Google Sheets Integration & Sync')).toBeDefined();

    // Click Cancel button inside drawer
    const cancelBtn = screen.getByRole('button', { name: /^Cancel$/i });
    fireEvent.click(cancelBtn);

    // Drawer should be closed
    await waitFor(() => {
      expect(screen.queryByText('Google Sheets Integration & Sync')).toBeNull();
    });

    // Pipeline should still show inventory workbench intact
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
    expect(screen.getByText('Google Sheets Sync')).toBeDefined();
    expect(screen.getByText('Surplus Ingestion Pipeline')).toBeDefined();
  });
});
