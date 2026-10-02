import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../services/googleSheetsSyncService', () => {
  const mockService = {
    fetchScriptTemplate: vi.fn().mockResolvedValue({
      success: true,
      script: 'function onEdit(e) {\n  // Auto Sync Code\n}',
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
    syncNow: vi.fn().mockResolvedValue({
      success: true,
      syncStatus: 'success',
      lastSyncedAt: '2026-10-01T12:00:00.000Z',
      syncedLotCount: 45,
    }),
    disconnectSheet: vi.fn().mockResolvedValue({
      success: true,
      message: 'Sheet disconnected successfully.',
      remainingSheets: 0,
    }),
    saveMapping: vi.fn().mockResolvedValue({
      success: true,
      supplierTemplateId: 'tmpl-saved-123',
      message: 'Column mapping saved successfully.',
    }),
  };
  return {
    default: mockService,
    googleSheetsSyncService: mockService,
  };
});

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import coreReducer from '../store/slices/coreSlice';
import ingestionReducer, {
  setGoogleSheetsConfig,
  setGoogleSheetsScript,
} from '../store/slices/ingestionSlice';
import inventoryReducer from '../store/slices/inventorySlice';
import workflowReducer from '../store/slices/workflowSlice';
import logisticsReducer from '../store/slices/logisticsSlice';
import authReducer from '../store/slices/authSlice';
import { GoogleSheetsConfigDrawer } from '../components/domain/ingestion/GoogleSheetsConfigDrawer';
import googleSheetsSyncService from '../services/googleSheetsSyncService';

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

describe('Slice 2: GoogleSheetsConfigDrawer Component Tests', () => {
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
          ingressKey: 'spoileralert_sec_live_key_999',
        },
        googleSheetsScript: 'function onEdit(e) {\n  // Auto Sync Code\n}',
        googleSheetsScriptLoading: false,
        googleSheetsScriptError: null,
        googleSheetsPingStatus: 'idle',
        googleSheetsPingLatencyMs: null,
        googleSheetsPingError: null,
        googleSheetsHandshakeLoading: false,
        connectedSheets: [],
        connectedSheetsLoading: false,
        connectedSheetsError: null,
      },
    });

    // Mock clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });

    (googleSheetsSyncService.fetchScriptTemplate as any).mockResolvedValue({
      success: true,
      script: 'function onEdit(e) {\n  // Auto Sync Code\n}',
      ingressKey: 'spoileralert_sec_live_key_999',
      webhookUrl: 'http://localhost:5000/api/v1/ingestion/google-sheets/webhook',
    });
    (googleSheetsSyncService.fetchRoster as any).mockResolvedValue({
      success: true,
      connectedSheets: [],
      totalSheets: 0,
    });
    (googleSheetsSyncService.syncNow as any).mockResolvedValue({
      success: true,
      syncStatus: 'success',
      lastSyncedAt: '2026-10-01T12:00:00.000Z',
      syncedLotCount: 45,
    });
    (googleSheetsSyncService.disconnectSheet as any).mockResolvedValue({
      success: true,
      message: 'Sheet disconnected successfully.',
      remainingSheets: 0,
    });
    (googleSheetsSyncService.fetchSampleRows as any).mockResolvedValue({
      documentId: 'gsheet-default-doc',
      fileName: 'Google Sheets: Sample',
      rawGrid: [
        ['SKU', 'Description', 'Quantity'],
        ['SKU-1', 'Product 1', '10'],
      ],
      suggestedMapping: {
        sku: 'SKU',
        description: 'Description',
        quantity: 'Quantity',
      },
    });
  });

  it('purges obsolete Google Workspace OAuth cards and manual coordinate inputs', () => {
    render(
      <Provider store={store}>
        <GoogleSheetsConfigDrawer
          isOpen={true}
          onClose={vi.fn()}
          supplierId="sup-1"
          supplierName="Acme Organics"
        />
      </Provider>
    );

    // Title and supplier context render properly
    expect(screen.getByText('Google Sheets Integration & Sync')).toBeDefined();
    expect(screen.getByText(/Configure live bidirectional spreadsheet synchronization/i)).toBeDefined();

    // Verify obsolete OAuth elements are purged
    expect(screen.queryByText(/Google Workspace Identity/i)).toBeNull();
    expect(screen.queryByText(/OAuth Active/i)).toBeNull();
    expect(screen.queryByText(/OAuth Pending/i)).toBeNull();
    expect(screen.queryByRole('link', { name: /Manage Account/i })).toBeNull();

    // Verify manual spreadsheet coordinate inputs are purged
    expect(screen.queryByLabelText(/Spreadsheet ID or URL/i)).toBeNull();
    expect(screen.queryByLabelText(/Worksheet Tab Name/i)).toBeNull();
    expect(screen.queryByPlaceholderText(/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/i)).toBeNull();
  });

  it('renders Master Apps Script Setup Hero with ingress key, webhook URL, 3-step setup guide, and local dev callout', () => {
    render(
      <Provider store={store}>
        <GoogleSheetsConfigDrawer
          isOpen={true}
          onClose={vi.fn()}
          supplierId="sup-1"
          supplierName="Acme Organics"
        />
      </Provider>
    );

    // Master Ingress Key & Webhook URL Hero elements
    expect(screen.getByText('Master Ingress Key')).toBeDefined();
    expect(screen.getByText('spoileralert_sec_live_key_999')).toBeDefined();
    expect(screen.getByText('Webhook Endpoint URL')).toBeDefined();
    expect(screen.getByText(/api\/v1\/ingestion\/google-sheets\/webhook/i)).toBeDefined();

    // 3-step setup instructions
    expect(screen.getByText(/Extensions > Apps Script/i)).toBeDefined();
    expect(screen.getByText(/Paste & Save/i)).toBeDefined();
    expect(screen.getByText(/SpoilerAlert OS ⚡ > Sync to Platform Now/i)).toBeDefined();

    // Local development tunnel callout (ngrok helper)
    expect(screen.getByText(/Local Development Tunnel Notice/i)).toBeDefined();
    expect(screen.getAllByText(/ngrok/i).length).toBeGreaterThan(0);
  });

  it('dispatches both script template and connected sheets roster thunks when opened', async () => {
    render(
      <Provider store={store}>
        <GoogleSheetsConfigDrawer
          isOpen={true}
          onClose={vi.fn()}
          supplierId="sup-1"
          supplierName="Acme Organics"
        />
      </Provider>
    );

    await waitFor(() => {
      expect(googleSheetsSyncService.fetchRoster).toHaveBeenCalledWith('sup-1');
    });
  });

  it('copies generated Google Apps Script to clipboard and gives visual feedback', async () => {
    render(
      <Provider store={store}>
        <GoogleSheetsConfigDrawer
          isOpen={true}
          onClose={vi.fn()}
          supplierId="sup-1"
          supplierName="Acme Organics"
        />
      </Provider>
    );

    // Verify script box is visible
    expect(screen.getByText(/function onEdit\(e\)/i)).toBeDefined();

    const copyBtn = screen.getByRole('button', { name: /Copy Script/i });
    fireEvent.click(copyBtn);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining('function onEdit(e)')
    );

    // Feedback message appears
    await waitFor(() => {
      expect(screen.getByText(/Copied to Clipboard!/i)).toBeDefined();
    });
  });

  it('dispatches test connection ping and renders visual confirmation with latency telemetry', async () => {
    (googleSheetsSyncService.testPing as any).mockResolvedValueOnce({
      success: true,
      status: 'connected',
      supplierName: 'Acme Organics',
      spreadsheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
      sheetName: 'Inventory Master',
      latencyMs: 142,
      message: 'Connection verified. Ready for sync.',
    });

    render(
      <Provider store={store}>
        <GoogleSheetsConfigDrawer
          isOpen={true}
          onClose={vi.fn()}
          supplierId="sup-1"
          supplierName="Acme Organics"
        />
      </Provider>
    );

    const pingBtn = screen.getByRole('button', { name: /Test Connection Ping/i });
    fireEvent.click(pingBtn);

    await waitFor(() => {
      expect(screen.getByText(/Connected: Google Sheets webhook ready/i)).toBeDefined();
      expect(screen.getByText(/142ms latency/i)).toBeDefined();
    });
  });

  it('triggers handshake action, fetches sample rows, and notifies mapping handoff', async () => {
    const handleMappingHandoff = vi.fn();
    const mockSampleResult = {
      documentId: 'gsheet-handshake-001',
      fileName: 'Google Sheets: Inventory Master',
      rawGrid: [
        ['SKU', 'Description', 'Quantity', 'Exp Date'],
        ['SKU-1', 'Organic Milk', '100', '2026-10-15'],
      ],
      suggestedMapping: {
        sku: 'SKU',
        description: 'Description',
        quantity: 'Quantity',
        expirationDate: 'Exp Date',
      },
    };

    (googleSheetsSyncService.fetchSampleRows as any).mockResolvedValueOnce(mockSampleResult);

    render(
      <Provider store={store}>
        <GoogleSheetsConfigDrawer
          isOpen={true}
          onClose={vi.fn()}
          supplierId="sup-1"
          supplierName="Acme Organics"
          onMappingHandoff={handleMappingHandoff}
        />
      </Provider>
    );

    const handshakeBtn = screen.getByRole('button', {
      name: /Fetch Sample Rows & Open Column Mapper/i,
    });
    fireEvent.click(handshakeBtn);

    await waitFor(() => {
      expect(handleMappingHandoff).toHaveBeenCalledWith(mockSampleResult);
    });
  });

  it('closes drawer on Close button click, Escape key press, or backdrop click', () => {
    const onClose = vi.fn();
    render(
      <Provider store={store}>
        <GoogleSheetsConfigDrawer
          isOpen={true}
          onClose={onClose}
          supplierId="sup-1"
        />
      </Provider>
    );

    const closeBtn = screen.getByRole('button', { name: /Close Drawer/i });
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(2);

    const backdrop = screen.getByTestId('drawer-backdrop');
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it('adheres to enterprise design system palette tokens for primary CTA and alert containers', () => {
    const errorStore = createTestStore({
      ingestion: {
        googleSheetsConfig: {
          spreadsheetId: 'sheet-1',
          sheetName: 'Sheet1',
        },
        googleSheetsPingStatus: 'error',
        googleSheetsPingError: 'Auth failure',
        googleSheetsScript: 'function onEdit() {}',
      },
    });

    render(
      <Provider store={errorStore}>
        <GoogleSheetsConfigDrawer
          isOpen={true}
          onClose={vi.fn()}
          supplierId="sup-1"
        />
      </Provider>
    );

    const primaryCta = screen.getByRole('button', {
      name: /Fetch Sample Rows & Open Column Mapper/i,
    });
    expect(primaryCta.className).toContain('bg-[#0f4cc9]');
    expect(primaryCta.className).toContain('hover:bg-[#1a42a0]');

    const errorBanner = screen.getByText(/Auth failure/i).parentElement;
    expect(errorBanner?.className).toContain('bg-[#fef2f2]');
    expect(errorBanner?.className).toContain('text-[#b91c1c]');
  });

  it('verifies dynamic handshake mapping handoff through unified ingestion seam', async () => {
    const handleMappingHandoff = vi.fn();
    const dynamicSampleRows = {
      documentId: 'gsheet-handshake-1BxiMVs0',
      fileName: 'Google Sheets: Inventory Master',
      rawGrid: [
        ['SKU / Item Code', 'Product Title', 'Cases Available', 'Expiry Date', 'Unit Price ($)', 'Warehouse Location'],
        ['SKU-ORG-101', 'Organic Almond Milk 1L', '240', '2026-11-30', '3.85', 'Cold Facility A']
      ],
      suggestedMapping: {
        sku: 'SKU / Item Code',
        description: 'Product Title',
        quantity: 'Cases Available',
        expirationDate: 'Expiry Date',
        originalPrice: 'Unit Price ($)',
        warehouse: 'Warehouse Location'
      }
    };

    (googleSheetsSyncService.fetchSampleRows as any).mockResolvedValueOnce(dynamicSampleRows);

    render(
      <Provider store={store}>
        <GoogleSheetsConfigDrawer
          isOpen={true}
          onClose={vi.fn()}
          supplierId="sup-1"
          supplierName="Acme Organics"
          onMappingHandoff={handleMappingHandoff}
        />
      </Provider>
    );

    const handshakeBtn = screen.getByRole('button', {
      name: /Fetch Sample Rows & Open Column Mapper/i,
    });
    fireEvent.click(handshakeBtn);

    await waitFor(() => {
      expect(handleMappingHandoff).toHaveBeenCalledWith(dynamicSampleRows);
    });

    // Check that Redux store inventoryParsedResult is populated with dynamic sample rows
    const state = store.getState().ingestion;
    expect(state.inventoryParsedResult).toEqual(dynamicSampleRows);
  });

  it('renders friendly onboarding empty state when no connected sheets exist', () => {
    const emptyStore = createTestStore({
      ingestion: {
        googleSheetsConfig: {
          spreadsheetId: '',
          sheetName: '',
          ingressKey: 'spoileralert_sec_live_key_999',
        },
        googleSheetsScript: 'function onEdit() {}',
        connectedSheets: [],
        connectedSheetsLoading: false,
      },
    });

    render(
      <Provider store={emptyStore}>
        <GoogleSheetsConfigDrawer
          isOpen={true}
          onClose={vi.fn()}
          supplierId="sup-1"
          supplierName="Acme Organics"
        />
      </Provider>
    );

    // Empty state container and guidance
    expect(screen.getByText('Connected Sheets Roster')).toBeDefined();
    expect(screen.getByText(/No spreadsheets connected yet/i)).toBeDefined();
    expect(
      screen.getByText(/Follow the 3-step setup guide above to link your first Google Sheet/i)
    ).toBeDefined();
  });

  it('renders connected sheets roster table with ID, tab, lot count, relative time, and status badge', async () => {
    const mockSheets = [
      {
        spreadsheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
        spreadsheetTitle: 'Acme Fresh Produce Inventory',
        sheetName: 'Produce Master',
        syncStatus: 'success',
        lastSyncedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 mins ago
        lotCount: 142,
      },
      {
        spreadsheetId: '2CxiNVs1YSA6nGMdKwCeCAkgmUVrqtlcs85PhwF3vqnt',
        spreadsheetTitle: 'Bakery Stock Daily',
        sheetName: 'Bakery Log',
        syncStatus: 'error',
        lastSyncedAt: new Date(Date.now() - 3600 * 1000).toISOString(), // 1 hour ago
        lotCount: 38,
        lastSyncMetrics: {
          totalRows: 40,
          inserted: 0,
          updated: 0,
          depleted: 0,
          errors: ['Invalid date format in row 12'],
        },
      },
    ];

    (googleSheetsSyncService.fetchRoster as any).mockResolvedValueOnce({
      success: true,
      connectedSheets: mockSheets,
      totalSheets: 2,
    });

    const populatedStore = createTestStore({
      ingestion: {
        googleSheetsConfig: {
          spreadsheetId: 'sheet-xyz',
          sheetName: 'Sheet1',
          ingressKey: 'spoileralert_sec_live_key_999',
        },
        googleSheetsScript: 'function onEdit() {}',
        connectedSheets: mockSheets,
        connectedSheetsLoading: false,
      },
    });

    render(
      <Provider store={populatedStore}>
        <GoogleSheetsConfigDrawer
          isOpen={true}
          onClose={vi.fn()}
          supplierId="sup-1"
          supplierName="Acme Organics"
        />
      </Provider>
    );

    // Roster header and sheet rows
    expect(screen.getByText('Connected Sheets Roster')).toBeDefined();
    expect(await screen.findByText('Acme Fresh Produce Inventory')).toBeDefined();
    expect(screen.getByText('Produce Master')).toBeDefined();
    expect(screen.getByText('142 lots')).toBeDefined();
    expect(screen.getByText('Live')).toBeDefined(); // Status badge

    expect(screen.getByText('Bakery Stock Daily')).toBeDefined();
    expect(screen.getByText('Bakery Log')).toBeDefined();
    expect(screen.getByText('38 lots')).toBeDefined();
    expect(screen.getByText('Error')).toBeDefined(); // Error status badge
  });

  it('triggers on-demand sync pass from row action button', async () => {
    (googleSheetsSyncService.fetchRoster as any).mockResolvedValueOnce({
      success: true,
      connectedSheets: [
        {
          spreadsheetId: 'sheet-123',
          spreadsheetTitle: 'Produce Master',
          sheetName: 'Sheet1',
          syncStatus: 'success',
          lastSyncedAt: new Date().toISOString(),
          lotCount: 50,
        },
      ],
      totalSheets: 1,
    });

    const populatedStore = createTestStore({
      ingestion: {
        googleSheetsConfig: {
          spreadsheetId: 'sheet-xyz',
          sheetName: 'Sheet1',
          ingressKey: 'spoileralert_sec_live_key_999',
        },
        googleSheetsScript: 'function onEdit() {}',
        connectedSheets: [
          {
            spreadsheetId: 'sheet-123',
            spreadsheetTitle: 'Produce Master',
            sheetName: 'Sheet1',
            syncStatus: 'success',
            lastSyncedAt: new Date().toISOString(),
            lotCount: 50,
          },
        ],
      },
    });

    render(
      <Provider store={populatedStore}>
        <GoogleSheetsConfigDrawer
          isOpen={true}
          onClose={vi.fn()}
          supplierId="sup-1"
          supplierName="Acme Organics"
        />
      </Provider>
    );

    const syncNowBtn = await screen.findByRole('button', { name: /Sync Sheet Now/i });
    fireEvent.click(syncNowBtn);

    await waitFor(() => {
      expect(googleSheetsSyncService.syncNow).toHaveBeenCalledWith(
        expect.objectContaining({
          supplierId: 'sup-1',
          ingressKey: 'spoileralert_sec_live_key_999',
        })
      );
    });
  });

  it('disconnect action shows confirmation dialog and removes sheet when confirmed', async () => {
    (googleSheetsSyncService.fetchRoster as any).mockResolvedValueOnce({
      success: true,
      connectedSheets: [
        {
          spreadsheetId: 'sheet-to-delete',
          spreadsheetTitle: 'Old Surplus Sheet',
          sheetName: 'Discontinued',
          syncStatus: 'success',
          lastSyncedAt: new Date().toISOString(),
          lotCount: 12,
        },
      ],
      totalSheets: 1,
    });

    const populatedStore = createTestStore({
      ingestion: {
        googleSheetsConfig: {
          spreadsheetId: 'sheet-xyz',
          sheetName: 'Sheet1',
          ingressKey: 'spoileralert_sec_live_key_999',
        },
        googleSheetsScript: 'function onEdit() {}',
        connectedSheets: [
          {
            spreadsheetId: 'sheet-to-delete',
            spreadsheetTitle: 'Old Surplus Sheet',
            sheetName: 'Discontinued',
            syncStatus: 'success',
            lastSyncedAt: new Date().toISOString(),
            lotCount: 12,
          },
        ],
      },
    });

    render(
      <Provider store={populatedStore}>
        <GoogleSheetsConfigDrawer
          isOpen={true}
          onClose={vi.fn()}
          supplierId="sup-1"
          supplierName="Acme Organics"
        />
      </Provider>
    );

    const disconnectBtn = await screen.findByRole('button', { name: /Disconnect Sheet/i });
    fireEvent.click(disconnectBtn);

    // Confirmation prompt appears
    expect(screen.getByText(/Are you sure you want to disconnect/i)).toBeDefined();

    // Confirm disconnection
    const confirmBtn = screen.getByRole('button', { name: /Confirm Disconnect/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(googleSheetsSyncService.disconnectSheet).toHaveBeenCalledWith(
        expect.objectContaining({
          supplierId: 'sup-1',
          spreadsheetId: 'sheet-to-delete',
          sheetName: 'Discontinued',
        })
      );
    });
  });

  it('renders an "Edit Column Mapping" action button for each connected sheet entry', async () => {
    const populatedStore = createTestStore({
      ingestion: {
        googleSheetsConfig: {
          spreadsheetId: 'sheet-xyz',
          sheetName: 'Sheet1',
          ingressKey: 'spoileralert_sec_live_key_999',
        },
        connectedSheets: [
          {
            spreadsheetId: 'sheet-mapped-1',
            spreadsheetTitle: 'Bakery Sheet',
            sheetName: 'Breads',
            syncStatus: 'success',
            lastSyncedAt: new Date().toISOString(),
            lotCount: 20,
          },
        ],
      },
    });

    render(
      <Provider store={populatedStore}>
        <GoogleSheetsConfigDrawer
          isOpen={true}
          onClose={vi.fn()}
          supplierId="sup-1"
          supplierName="Acme Organics"
        />
      </Provider>
    );

    const editMappingBtn = await screen.findByRole('button', { name: /Edit Column Mapping/i });
    expect(editMappingBtn).toBeDefined();
  });

  it('clicking "Edit Column Mapping" opens the in-situ mapping workbench with sheet headers, sample rows, and breadcrumb navigation', async () => {
    const mockSampleResult = {
      documentId: 'gsheet-handshake-produce',
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

    const populatedStore = createTestStore({
      ingestion: {
        googleSheetsConfig: {
          spreadsheetId: 'sheet-xyz',
          sheetName: 'Sheet1',
          ingressKey: 'spoileralert_sec_live_key_999',
        },
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
      },
    });

    render(
      <Provider store={populatedStore}>
        <GoogleSheetsConfigDrawer
          isOpen={true}
          onClose={vi.fn()}
          supplierId="sup-1"
          supplierName="Acme Organics"
        />
      </Provider>
    );

    const editMappingBtn = await screen.findByRole('button', { name: /Edit Column Mapping/i });
    fireEvent.click(editMappingBtn);

    // Verify fetchSampleRows called with the specific sheet
    await waitFor(() => {
      expect(googleSheetsSyncService.fetchSampleRows).toHaveBeenCalledWith(
        expect.objectContaining({
          supplierId: 'sup-1',
          spreadsheetId: 'sheet-produce-01',
          sheetName: 'ProduceTab',
        })
      );
    });

    // In-situ mapping workbench surfaces with breadcrumbs
    expect(await screen.findByText(/Connected Sheets Roster/i)).toBeDefined();
    expect(screen.getByText(/Produce Master Mapping/i)).toBeDefined();
    expect(screen.getByText('Item Code')).toBeDefined();
    expect(screen.getByText('Fruit Description')).toBeDefined();

    // Breadcrumb or "Back to Roster" returns to roster view
    const backBtn = screen.getByRole('button', { name: /Back to Roster/i });
    fireEvent.click(backBtn);

    // Verify back on roster view
    expect(await screen.findByText('Master Apps Script Setup Guide')).toBeDefined();
  });

  it('saving mapping in in-situ workbench persists SupplierTemplate to that sheet and returns to roster', async () => {
    const mockSampleResult = {
      documentId: 'gsheet-handshake-produce',
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
      supplierTemplateId: 'tmpl-produce-created',
      message: 'Mapping updated successfully',
    });

    const populatedStore = createTestStore({
      ingestion: {
        googleSheetsConfig: {
          spreadsheetId: 'sheet-xyz',
          sheetName: 'Sheet1',
          ingressKey: 'spoileralert_sec_live_key_999',
        },
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
      },
    });

    render(
      <Provider store={populatedStore}>
        <GoogleSheetsConfigDrawer
          isOpen={true}
          onClose={vi.fn()}
          supplierId="sup-1"
          supplierName="Acme Organics"
        />
      </Provider>
    );

    const editMappingBtn = await screen.findByRole('button', { name: /Edit Column Mapping/i });
    fireEvent.click(editMappingBtn);

    expect(await screen.findByText(/Produce Master Mapping/i)).toBeDefined();

    // Click "Save Sheet Mapping" button
    const saveMappingBtn = screen.getByRole('button', { name: /Save Sheet Mapping/i });
    fireEvent.click(saveMappingBtn);

    await waitFor(() => {
      expect(googleSheetsSyncService.saveMapping).toHaveBeenCalledWith(
        expect.objectContaining({
          supplierId: 'sup-1',
          spreadsheetId: 'sheet-produce-01',
          sheetName: 'ProduceTab',
        })
      );
    });

    // Should return to roster view and display success feedback
    expect(await screen.findByText('Master Apps Script Setup Guide')).toBeDefined();
    expect(await screen.findByText(/Column mapping saved successfully/i)).toBeDefined();
  });
});

