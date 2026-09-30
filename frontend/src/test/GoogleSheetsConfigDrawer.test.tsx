import { describe, it, expect, beforeEach, vi } from 'vitest';

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
          spreadsheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
          sheetName: 'Inventory Master',
          connectedEmail: 'ops@acmeorganics.com',
          oauthConnected: true,
          ingressKey: 'spoileralert_sec_live_key_999',
        },
        googleSheetsScript: 'function onEdit(e) {\n  // Auto Sync Code\n}',
        googleSheetsScriptLoading: false,
        googleSheetsScriptError: null,
        googleSheetsPingStatus: 'idle',
        googleSheetsPingLatencyMs: null,
        googleSheetsPingError: null,
        googleSheetsHandshakeLoading: false,
      },
    });

    // Mock clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('renders drawer header, OAuth status, and spreadsheet configuration fields when open', () => {
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

    // Title and supplier context
    expect(screen.getByText('Google Sheets Integration & Sync')).toBeDefined();
    expect(screen.getByText(/Configure live bidirectional spreadsheet synchronization/i)).toBeDefined();

    // OAuth status badge & connected email
    expect(screen.getByText(/Connected: ops@acmeorganics.com/i)).toBeDefined();
    expect(screen.getByText('OAuth Active')).toBeDefined();

    // Input fields
    const spreadsheetInput = screen.getByLabelText(/Spreadsheet ID or URL/i) as HTMLInputElement;
    expect(spreadsheetInput.value).toBe('1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms');

    const sheetTabInput = screen.getByLabelText(/Worksheet Tab Name/i) as HTMLInputElement;
    expect(sheetTabInput.value).toBe('Inventory Master');
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
});

