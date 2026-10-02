import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import coreReducer from '../store/slices/coreSlice';
import ingestionReducer from '../store/slices/ingestionSlice';
import inventoryReducer from '../store/slices/inventorySlice';
import workflowReducer from '../store/slices/workflowSlice';
import logisticsReducer from '../store/slices/logisticsSlice';
import authReducer from '../store/slices/authSlice';
import { GoogleSheetsIntegrationView } from '../components/domain/ingestion/subcomponents/GoogleSheetsIntegrationView';
import googleSheetsSyncService from '../services/googleSheetsSyncService';

vi.mock('../services/googleSheetsSyncService', () => {
  const mockService = {
    fetchScriptTemplate: vi.fn().mockResolvedValue({
      success: true,
      script: 'function onEdit(e) {\n  // Auto Sync Script\n}',
      ingressKey: 'sec_live_mock_key_888',
      webhookUrl: 'http://localhost:5000/api/v1/ingestion/google-sheets/webhook',
    }),
    testPing: vi.fn().mockResolvedValue({
      success: true,
      status: 'connected',
      latencyMs: 42,
    }),
    fetchRoster: vi.fn().mockResolvedValue({
      success: true,
      connectedSheets: [
        {
          spreadsheetId: 'sheet-111',
          spreadsheetTitle: 'Fresh Produce Inflow',
          sheetName: 'WeeklyBatches',
          syncStatus: 'success',
          lastSyncedAt: '2026-10-02T10:00:00.000Z',
          lotCount: 140,
        },
      ],
      totalSheets: 1,
    }),
    syncNow: vi.fn().mockResolvedValue({
      success: true,
      syncStatus: 'success',
      lastSyncedAt: '2026-10-02T12:00:00.000Z',
      syncedLotCount: 140,
    }),
    disconnectSheet: vi.fn().mockResolvedValue({
      success: true,
      message: 'Sheet disconnected.',
    }),
    fetchSampleRows: vi.fn().mockResolvedValue({
      documentId: 'doc-gsheet-test',
      fileName: 'Regional Surplus Ledger - DallasHub',
      rawGrid: [
        ['Product Description', 'Inventory SKU', 'Available Cases', 'Unit Price'],
        ['Organic Apples 40lb', 'APP-ORG-40', '150', '24.50'],
        ['Navel Oranges 30lb', 'ORA-NAV-30', '80', '18.00'],
      ],
      suggestedMapping: {
        description: 'Product Description',
        sku: 'Inventory SKU',
        quantity: 'Available Cases',
        standardSellPrice: 'Unit Price',
      },
    }),
    saveMapping: vi.fn().mockResolvedValue({
      success: true,
      supplierTemplateId: 'tmpl-mock-999',
      message: 'Column mapping saved successfully.',
    }),
  };
  return {
    default: mockService,
    googleSheetsSyncService: mockService,
  };
});

const createTestStore = (preloadedState?: any) => {
  const defaultIngestion = ingestionReducer(undefined, { type: '@@INIT' } as any);
  const mergedPreloaded = preloadedState
    ? {
        ...preloadedState,
        ingestion: {
          ...defaultIngestion,
          ...(preloadedState.ingestion || {}),
        },
      }
    : undefined;

  return configureStore({
    reducer: {
      core: coreReducer,
      ingestion: ingestionReducer,
      inventory: inventoryReducer,
      workflow: workflowReducer,
      logistics: logisticsReducer,
      auth: authReducer,
    },
    preloadedState: mergedPreloaded,
  });
};

describe('GoogleSheetsIntegrationView - Quadrant 1: Health & Telemetry Seam', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    vi.clearAllMocks();
    store = createTestStore({
      ingestion: {
        googleSheetsConfig: {
          spreadsheetId: 'sheet-111',
          sheetName: 'WeeklyBatches',
          connectedEmail: '',
          oauthConnected: false,
          ingressKey: 'sec_live_mock_key_888',
        },
        googleSheetsScript: 'function onEdit(e) {\n  // Auto Sync Script\n}',
        googleSheetsScriptLoading: false,
        googleSheetsScriptError: null,
        googleSheetsPingStatus: 'connected',
        googleSheetsPingLatencyMs: 42,
        googleSheetsPingError: null,
        googleSheetsHandshakeLoading: false,
        connectedSheets: [
          {
            spreadsheetId: 'sheet-111',
            spreadsheetTitle: 'Fresh Produce Inflow',
            sheetName: 'WeeklyBatches',
            syncStatus: 'success',
            lastSyncedAt: '2026-10-02T10:00:00.000Z',
            lotCount: 140,
          },
        ],
        connectedSheetsLoading: false,
        connectedSheetsError: null,
        googleSheetsSync: {
          status: 'idle',
          lastSyncedAt: '2026-10-02T10:00:00.000Z',
          syncedLotCount: 140,
        },
      },
    });
  });

  it('renders connection status pill, ping latency ms, last sync timestamp, and total lot counts', () => {
    render(
      <Provider store={store}>
        <GoogleSheetsIntegrationView supplierId="sup-test-1" supplierName="Organic Valley" />
      </Provider>
    );

    // Quadrant 1: Telemetry indicators
    const q1 = screen.getByTestId('gsheet-quadrant-1-telemetry');
    expect(q1).toBeInTheDocument();
    expect(within(q1).getByText(/Active Trigger/i)).toBeInTheDocument();
    expect(within(q1).getByText(/42\s*ms/i)).toBeInTheDocument();
    expect(within(q1).getByText('140')).toBeInTheDocument();
    expect(within(q1).getByRole('button', { name: /Sync Now/i })).toBeInTheDocument();
    expect(within(q1).getByRole('button', { name: /Test Ping/i })).toBeInTheDocument();
  });

  it('dispatches syncGoogleSheetsNowThunk when global Sync Now button is clicked', async () => {
    render(
      <Provider store={store}>
        <GoogleSheetsIntegrationView supplierId="sup-test-1" supplierName="Organic Valley" />
      </Provider>
    );

    const syncButton = screen.getByRole('button', { name: /Sync Now/i });
    fireEvent.click(syncButton);

    expect(googleSheetsSyncService.syncNow).toHaveBeenCalled();
  });

  it('dispatches testGoogleSheetsPingThunk when Test Ping button is clicked', async () => {
    render(
      <Provider store={store}>
        <GoogleSheetsIntegrationView supplierId="sup-test-1" supplierName="Organic Valley" />
      </Provider>
    );

    const pingButton = screen.getByRole('button', { name: /Test Ping/i });
    fireEvent.click(pingButton);

    expect(googleSheetsSyncService.testPing).toHaveBeenCalled();
  });
});

describe('GoogleSheetsIntegrationView - Quadrant 2: Credentials & Setup Guide Seam', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    vi.clearAllMocks();
    store = createTestStore({
      ingestion: {
        googleSheetsConfig: {
          spreadsheetId: '',
          sheetName: '',
          connectedEmail: '',
          oauthConnected: false,
          ingressKey: 'sec_live_mock_key_888',
        },
        googleSheetsScript: 'function onEdit(e) {\n  // Auto Sync Script Code\n}',
        googleSheetsScriptLoading: false,
        googleSheetsScriptError: null,
        googleSheetsPingStatus: 'idle',
        googleSheetsPingLatencyMs: null,
        googleSheetsPingError: null,
        googleSheetsHandshakeLoading: false,
        connectedSheets: [],
        connectedSheetsLoading: false,
        connectedSheetsError: null,
        googleSheetsSync: {
          status: 'idle',
          lastSyncedAt: null,
          syncedLotCount: 0,
        },
      },
    });

    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('renders Ingress Webhook URL and supplier Ingress Key', () => {
    render(
      <Provider store={store}>
        <GoogleSheetsIntegrationView supplierId="sup-test-1" supplierName="Organic Valley" />
      </Provider>
    );

    expect(screen.getByTestId('gsheet-quadrant-2-credentials')).toBeInTheDocument();
    expect(screen.getByText(/sec_live_mock_key_888/)).toBeInTheDocument();
    expect(screen.getByText(/\/api\/v1\/ingestion\/google-sheets\/webhook/)).toBeInTheDocument();
  });

  it('toggles expandable Google Apps Script code block and copies script to clipboard', async () => {
    render(
      <Provider store={store}>
        <GoogleSheetsIntegrationView supplierId="sup-test-1" supplierName="Organic Valley" />
      </Provider>
    );

    // Expand script block
    const toggleButton = screen.getByRole('button', { name: /View Google Apps Script/i });
    fireEvent.click(toggleButton);

    // Verify script content is shown
    expect(screen.getByText(/Auto Sync Script Code/)).toBeInTheDocument();

    // Copy script
    const copyButton = screen.getByRole('button', { name: /Copy Script/i });
    fireEvent.click(copyButton);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining('Auto Sync Script Code')
    );
    expect(await screen.findByText(/Copied/i)).toBeInTheDocument();
  });
});

describe('GoogleSheetsIntegrationView - Quadrant 3: Connected Sheets Roster Seam', () => {
  let store: ReturnType<typeof createTestStore>;

  const mockSheets = [
    {
      spreadsheetId: 'sheet-alpha',
      spreadsheetTitle: 'Regional Surplus Ledger',
      sheetName: 'DallasHub',
      syncStatus: 'success',
      lastSyncedAt: '2026-10-02T10:00:00.000Z',
      lotCount: 95,
    },
    {
      spreadsheetId: 'sheet-beta',
      spreadsheetTitle: 'Austin Inflow',
      sheetName: 'LiveBatch',
      syncStatus: 'idle',
      lastSyncedAt: null,
      lotCount: 0,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    store = createTestStore({
      ingestion: {
        googleSheetsConfig: {
          spreadsheetId: '',
          sheetName: '',
          connectedEmail: '',
          oauthConnected: false,
          ingressKey: 'sec_live_mock_key_888',
        },
        googleSheetsScript: 'function onEdit(e) {}',
        googleSheetsScriptLoading: false,
        googleSheetsScriptError: null,
        googleSheetsPingStatus: 'connected',
        googleSheetsPingLatencyMs: 35,
        googleSheetsPingError: null,
        googleSheetsHandshakeLoading: false,
        connectedSheets: mockSheets,
        connectedSheetsLoading: false,
        connectedSheetsError: null,
        googleSheetsSync: {
          status: 'idle',
          lastSyncedAt: null,
          syncedLotCount: 95,
        },
      },
    });
  });

  it('renders the interactive Connected Sheets Roster table with sheet details and status badges', () => {
    render(
      <Provider store={store}>
        <GoogleSheetsIntegrationView supplierId="sup-test-1" supplierName="Organic Valley" />
      </Provider>
    );

    const q3 = screen.getByTestId('gsheet-quadrant-3-roster');
    expect(q3).toBeInTheDocument();
    expect(within(q3).getByText('Regional Surplus Ledger')).toBeInTheDocument();
    expect(within(q3).getByText('DallasHub')).toBeInTheDocument();
    expect(within(q3).getByText('95')).toBeInTheDocument();
    expect(within(q3).getByText('Austin Inflow')).toBeInTheDocument();
    expect(within(q3).getByText('LiveBatch')).toBeInTheDocument();
  });

  it('dispatches syncGoogleSheetsNowThunk on per-sheet sync trigger', () => {
    render(
      <Provider store={store}>
        <GoogleSheetsIntegrationView supplierId="sup-test-1" supplierName="Organic Valley" />
      </Provider>
    );

    const sheetSyncBtns = screen.getAllByRole('button', { name: /Sync Sheet/i });
    expect(sheetSyncBtns.length).toBeGreaterThan(0);
    fireEvent.click(sheetSyncBtns[0]);

    expect(googleSheetsSyncService.syncNow).toHaveBeenCalled();
  });

  it('opens confirmation modal and dispatches disconnectGoogleSheetThunk on confirmation', async () => {
    render(
      <Provider store={store}>
        <GoogleSheetsIntegrationView supplierId="sup-test-1" supplierName="Organic Valley" />
      </Provider>
    );

    const disconnectBtns = screen.getAllByRole('button', { name: /Disconnect/i });
    expect(disconnectBtns.length).toBeGreaterThan(0);
    fireEvent.click(disconnectBtns[0]);

    // Modal pops up
    expect(screen.getByText(/Disconnect Spreadsheet/i)).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to disconnect/i)).toBeInTheDocument();

    // Confirm button
    const confirmBtn = screen.getByRole('button', { name: /Confirm Disconnect/i });
    fireEvent.click(confirmBtn);

    expect(googleSheetsSyncService.disconnectSheet).toHaveBeenCalledWith(
      expect.objectContaining({
        spreadsheetId: 'sheet-alpha',
        sheetName: 'DallasHub',
      })
    );
  });

  it('renders helpful empty state when no sheets are connected', () => {
    const emptyStore = createTestStore({
      ingestion: {
        googleSheetsConfig: {
          ingressKey: 'sec_live_mock_key_888',
        },
        googleSheetsScript: 'function onEdit(e) {}',
        googleSheetsPingStatus: 'idle',
        connectedSheets: [],
      },
    });

    render(
      <Provider store={emptyStore}>
        <GoogleSheetsIntegrationView supplierId="sup-test-1" supplierName="Organic Valley" />
      </Provider>
    );

    expect(screen.getByText(/No Connected Spreadsheets Yet/i)).toBeInTheDocument();
  });

  it('dispatches hydrateGoogleSheetsHandshakeThunk when Edit Mapping button is clicked on a sheet', async () => {
    render(
      <Provider store={store}>
        <GoogleSheetsIntegrationView supplierId="sup-test-1" supplierName="Organic Valley" />
      </Provider>
    );

    const editMappingBtns = screen.getAllByRole('button', { name: /Edit Mapping/i });
    expect(editMappingBtns.length).toBeGreaterThan(0);
    fireEvent.click(editMappingBtns[0]);

    expect(googleSheetsSyncService.fetchSampleRows).toHaveBeenCalledWith(
      expect.objectContaining({
        supplierId: 'sup-test-1',
        spreadsheetId: 'sheet-alpha',
        sheetName: 'DallasHub',
      })
    );
  });
});

describe('GoogleSheetsIntegrationView - Quadrant 4: In-Situ Schema Field Mapper Seam', () => {
  let store: ReturnType<typeof createTestStore>;

  const mockSheets = [
    {
      spreadsheetId: 'sheet-alpha',
      spreadsheetTitle: 'Regional Surplus Ledger',
      sheetName: 'DallasHub',
      syncStatus: 'success',
      lastSyncedAt: '2026-10-02T10:00:00.000Z',
      lotCount: 95,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    store = createTestStore({
      ingestion: {
        googleSheetsConfig: {
          ingressKey: 'sec_live_mock_key_888',
        },
        googleSheetsScript: 'function onEdit(e) {}',
        googleSheetsPingStatus: 'connected',
        connectedSheets: mockSheets,
        inventoryParsedResult: null,
        inventoryMappings: {},
        inventorySemanticRules: [],
      },
    });
  });

  it('renders Quadrant 4 empty state prompt when no sheet is selected for mapping', () => {
    render(
      <Provider store={store}>
        <GoogleSheetsIntegrationView supplierId="sup-test-1" supplierName="Organic Valley" />
      </Provider>
    );

    const q4 = screen.getByTestId('gsheet-quadrant-4-mapper');
    expect(q4).toBeInTheDocument();
    expect(within(q4).getByText(/Select a Connected Sheet to Configure Mapping/i)).toBeInTheDocument();
  });

  it('renders active sheet title, tab, and GridMapperTable headers upon clicking Edit Mapping', async () => {
    render(
      <Provider store={store}>
        <GoogleSheetsIntegrationView supplierId="sup-test-1" supplierName="Organic Valley" />
      </Provider>
    );

    const editBtn = screen.getByRole('button', { name: /Edit Mapping/i });
    fireEvent.click(editBtn);

    const q4 = screen.getByTestId('gsheet-quadrant-4-mapper');
    expect(await within(q4).findByText(/Regional Surplus Ledger/i)).toBeInTheDocument();
    expect(within(q4).getAllByText(/DallasHub/i).length).toBeGreaterThan(0);
    expect((await within(q4).findAllByText('Product Description')).length).toBeGreaterThan(0);
    expect(within(q4).getAllByText('Inventory SKU').length).toBeGreaterThan(0);
  });

  it('allows reassigning column mappings via dropdown and updates store inventoryMappings', async () => {
    render(
      <Provider store={store}>
        <GoogleSheetsIntegrationView supplierId="sup-test-1" supplierName="Organic Valley" />
      </Provider>
    );

    const editBtn = screen.getByRole('button', { name: /Edit Mapping/i });
    fireEvent.click(editBtn);

    const q4 = screen.getByTestId('gsheet-quadrant-4-mapper');
    await within(q4).findAllByText('Product Description');

    // Find the select within the table header
    const table = within(q4).getByRole('table');
    const tableSelects = within(table).getAllByRole('combobox');
    expect(tableSelects.length).toBeGreaterThan(0);

    // Change mapping on first column
    fireEvent.change(tableSelects[0], { target: { value: 'lotNumber' } });

    const state = store.getState().ingestion;
    expect(state.inventoryMappings.lotNumber).toBe('Product Description');
  });

  it('dispatches saveGoogleSheetsMappingThunk and shows success feedback when Save Sheet Mapping is clicked', async () => {
    render(
      <Provider store={store}>
        <GoogleSheetsIntegrationView supplierId="sup-test-1" supplierName="Organic Valley" />
      </Provider>
    );

    const editBtn = screen.getByRole('button', { name: /Edit Mapping/i });
    fireEvent.click(editBtn);

    const q4 = screen.getByTestId('gsheet-quadrant-4-mapper');
    await within(q4).findAllByText('Product Description');

    const saveBtn = within(q4).getByRole('button', { name: /Save Sheet Mapping/i });
    fireEvent.click(saveBtn);

    expect(googleSheetsSyncService.saveMapping).toHaveBeenCalledWith(
      expect.objectContaining({
        supplierId: 'sup-test-1',
        spreadsheetId: 'sheet-alpha',
        sheetName: 'DallasHub',
        columnMappings: expect.any(Object),
      })
    );

    expect(await within(q4).findByText(/Mapping Saved ✓/i)).toBeInTheDocument();
  });
});


