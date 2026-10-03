import React from 'react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import coreReducer from '../store/slices/coreSlice';
import ingestionReducer from '../store/slices/ingestionSlice';
import inventoryReducer from '../store/slices/inventorySlice';
import workflowReducer from '../store/slices/workflowSlice';
import logisticsReducer from '../store/slices/logisticsSlice';
import authReducer from '../store/slices/authSlice';
import zapierSyncReducer from '../store/slices/zapierSyncSlice';
import IngestionView from '../views/IngestionView';

const createTestStore = (preloadedState?: any) => {
  return configureStore({
    reducer: {
      core: coreReducer,
      ingestion: ingestionReducer,
      inventory: inventoryReducer,
      workflow: workflowReducer,
      logistics: logisticsReducer,
      auth: authReducer,
      zapierSync: zapierSyncReducer,
    },
    preloadedState,
  });
};

describe('IngestionView Sub-Routing and Connector Deep Linking Seam', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    // Reset URL
    window.history.replaceState({}, '', '/?tab=ingestion');
  });

  afterEach(() => {
    window.history.replaceState({}, '', '/?tab=ingestion');
  });

  it('renders dedicated full-page connector shell when connector query param is present on mount', () => {
    window.history.replaceState({}, '', '/?tab=ingestion&connector=google-sheets');
    const store = createTestStore();

    render(
      <Provider store={store}>
        <IngestionView />
      </Provider>
    );

    // Should render connector shell header & back button
    expect(screen.getByRole('button', { name: /Back to Ingestion Pipeline/i })).toBeDefined();
    expect(screen.getByRole('heading', { level: 1, name: /Integration Management Suite/i })).toBeDefined();

    // Active tab is Google Sheets
    const sheetsTab = screen.getByRole('tab', { name: /Google Sheets Sync/i });
    expect(sheetsTab.getAttribute('aria-selected')).toBe('true');

    // Default pipeline workbenches should NOT be visible in full-page connector mode
    expect(screen.queryByText('Surplus Ingestion Pipeline')).toBeNull();
  });

  it('navigates from IngestionHubConnectors directly to full-page connector mode and updates URL', () => {
    window.history.replaceState({}, '', '/?tab=ingestion');
    const store = createTestStore();

    render(
      <Provider store={store}>
        <IngestionView />
      </Provider>
    );

    // Initial state: standard pipeline view
    expect(screen.getByText('Surplus Ingestion Pipeline')).toBeDefined();
    expect(screen.getByText('Ingestion Hub & Connectors')).toBeDefined();

    // Click "Connect Zapier"
    const zapierBtn = screen.getByRole('button', { name: /Connect Zapier/i });
    fireEvent.click(zapierBtn);

    // Should update URL query param to connector=zapier
    expect(window.location.search).toContain('connector=zapier');

    // Should now display connector shell with Zapier selected
    expect(screen.getByRole('button', { name: /Back to Ingestion Pipeline/i })).toBeDefined();
    const zapierTab = screen.getByRole('tab', { name: /Zapier Webhooks/i });
    expect(zapierTab.getAttribute('aria-selected')).toBe('true');
  });

  it('switches between connectors via switcher bar and updates URL preserving history', () => {
    window.history.replaceState({}, '', '/?tab=ingestion&connector=google-sheets');
    const store = createTestStore();

    render(
      <Provider store={store}>
        <IngestionView />
      </Provider>
    );

    // Switch to doc-scanner
    const scannerTab = screen.getByRole('tab', { name: /Image & Doc Scanner/i });
    fireEvent.click(scannerTab);

    expect(window.location.search).toContain('connector=doc-scanner');
    expect(scannerTab.getAttribute('aria-selected')).toBe('true');

    // Switch to zapier
    const zapierTab = screen.getByRole('tab', { name: /Zapier Webhooks/i });
    fireEvent.click(zapierTab);

    expect(window.location.search).toContain('connector=zapier');
    expect(zapierTab.getAttribute('aria-selected')).toBe('true');
  });

  it('returns to Ingestion Pipeline when Back button is clicked and clears connector query param', () => {
    window.history.replaceState({}, '', '/?tab=ingestion&connector=google-sheets');
    const store = createTestStore();

    render(
      <Provider store={store}>
        <IngestionView />
      </Provider>
    );

    const backBtn = screen.getByRole('button', { name: /Back to Ingestion Pipeline/i });
    fireEvent.click(backBtn);

    // URL should no longer contain connector
    expect(window.location.search).not.toContain('connector=');

    // Parent pipeline elements should be restored
    expect(screen.getByText('Surplus Ingestion Pipeline')).toBeDefined();
    expect(screen.getByText('Ingestion Hub & Connectors')).toBeDefined();
  });

  it('handles browser popstate events to navigate between connector and pipeline views', () => {
    window.history.replaceState({}, '', '/?tab=ingestion');
    const store = createTestStore();

    render(
      <Provider store={store}>
        <IngestionView />
      </Provider>
    );

    expect(screen.getByText('Surplus Ingestion Pipeline')).toBeDefined();

    // Simulate browser forward to ?tab=ingestion&connector=zapier
    act(() => {
      window.history.pushState({}, '', '/?tab=ingestion&connector=zapier');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    expect(screen.getByRole('button', { name: /Back to Ingestion Pipeline/i })).toBeDefined();
    expect(screen.getByRole('tab', { name: /Zapier Webhooks/i }).getAttribute('aria-selected')).toBe('true');

    // Simulate browser back to ?tab=ingestion
    act(() => {
      window.history.pushState({}, '', '/?tab=ingestion');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    expect(screen.getByText('Surplus Ingestion Pipeline')).toBeDefined();
    expect(screen.queryByRole('button', { name: /Back to Ingestion Pipeline/i })).toBeNull();
  });

  it('renders GoogleSheetsIntegrationView with Quadrants 1, 2, and 3 when active connector is google-sheets', () => {
    window.history.replaceState({}, '', '/?tab=ingestion&connector=google-sheets');
    const store = createTestStore({
      core: {
        suppliers: [{ _id: 'sup-123', name: 'Valley Fresh Farm' }],
      },
      ingestion: {
        selectedSupplier: 'sup-123',
        googleSheetsConfig: {
          ingressKey: 'key-test-456',
        },
      },
    });

    render(
      <Provider store={store}>
        <IngestionView />
      </Provider>
    );

    expect(screen.getByTestId('gsheet-quadrant-1-telemetry')).toBeInTheDocument();
    expect(screen.getByTestId('gsheet-quadrant-2-credentials')).toBeInTheDocument();
    expect(screen.getByTestId('gsheet-quadrant-3-roster')).toBeInTheDocument();
  });

  it('renders ZapierIntegrationView with Quadrants 1, 2, and 3 when active connector is zapier', () => {
    window.history.replaceState({}, '', '/?tab=ingestion&connector=zapier');
    const store = createTestStore({
      core: {
        suppliers: [{ _id: 'sup-123', name: 'Valley Fresh Farm' }],
      },
      ingestion: {
        selectedSupplier: 'sup-123',
      },
      zapierSync: {
        supplierId: 'sup-123',
        ingressKey: 'zap_sec_live_key_999',
        connectedZaps: [],
        deliveryLogs: [],
        totalZaps: 0,
        pingStatus: 'idle',
        pingLatencyMs: null,
      },
    });

    render(
      <Provider store={store}>
        <IngestionView />
      </Provider>
    );

    expect(screen.getByTestId('zapier-quadrant-1-telemetry')).toBeInTheDocument();
    expect(screen.getByTestId('zapier-quadrant-2-credentials')).toBeInTheDocument();
    expect(screen.getByTestId('zapier-quadrant-3-roster')).toBeInTheDocument();
  });

  it('renders DocScannerIntegrationView with Quadrants 1, 2, 3, and 4 when active connector is doc-scanner', () => {
    window.history.replaceState({}, '', '/?tab=ingestion&connector=doc-scanner');
    const store = createTestStore({
      core: {
        suppliers: [{ _id: 'sup-123', name: 'Valley Fresh Farm' }],
      },
      ingestion: {
        selectedSupplier: 'sup-123',
      },
    });

    render(
      <Provider store={store}>
        <IngestionView />
      </Provider>
    );

    expect(screen.getByTestId('doc-scanner-quadrant-1-telemetry')).toBeInTheDocument();
    expect(screen.getByTestId('doc-scanner-quadrant-2-dropzone')).toBeInTheDocument();
    expect(screen.getByTestId('doc-scanner-quadrant-3-roster')).toBeInTheDocument();
    expect(screen.getByTestId('doc-scanner-quadrant-4-mapper')).toBeInTheDocument();
  });

  it('renders CsvExcelIntegrationView foundational container when deep linked via connector=csv-upload', () => {
    window.history.replaceState({}, '', '/?tab=ingestion&connector=csv-upload');
    const store = createTestStore({
      core: {
        suppliers: [{ _id: 'sup-123', name: 'Valley Fresh Farm' }],
      },
      ingestion: {
        selectedSupplier: 'sup-123',
      },
    });

    render(
      <Provider store={store}>
        <IngestionView />
      </Provider>
    );

    // Shell header and back button
    expect(screen.getByRole('button', { name: /Back to Ingestion Pipeline/i })).toBeDefined();
    expect(screen.getByRole('heading', { level: 1, name: /Integration Management Suite/i })).toBeDefined();

    // Active tab is CSV / Excel Upload
    const csvTab = screen.getByRole('tab', { name: /CSV \/ Excel Upload/i });
    expect(csvTab.getAttribute('aria-selected')).toBe('true');

    // Foundational container is mounted
    expect(screen.getByTestId('connector-csv-upload-workspace')).toBeInTheDocument();
    expect(screen.getByTestId('csv-excel-integration-view')).toBeInTheDocument();
  });

  it('transitions from IngestionHubConnectors CSV / Excel Upload card to connector=csv-upload mode', () => {
    window.history.replaceState({}, '', '/?tab=ingestion');
    const store = createTestStore();

    render(
      <Provider store={store}>
        <IngestionView />
      </Provider>
    );

    // Click "Upload File" in CSV / Excel card
    const uploadBtn = screen.getByRole('button', { name: /Upload File/i });
    fireEvent.click(uploadBtn);

    // URL is updated
    expect(window.location.search).toContain('connector=csv-upload');

    // Shell is mounted with CSV tab active
    const csvTab = screen.getByRole('tab', { name: /CSV \/ Excel Upload/i });
    expect(csvTab.getAttribute('aria-selected')).toBe('true');
    expect(screen.getByTestId('connector-csv-upload-workspace')).toBeInTheDocument();
  });

  it('switches to csv-upload via switcher tab and returns cleanly to pipeline', () => {
    window.history.replaceState({}, '', '/?tab=ingestion&connector=google-sheets');
    const store = createTestStore();

    render(
      <Provider store={store}>
        <IngestionView />
      </Provider>
    );

    // Initial connector is google-sheets
    expect(screen.getByRole('tab', { name: /Google Sheets Sync/i }).getAttribute('aria-selected')).toBe('true');

    // Click CSV / Excel Upload tab
    const csvTab = screen.getByRole('tab', { name: /CSV \/ Excel Upload/i });
    fireEvent.click(csvTab);

    expect(window.location.search).toContain('connector=csv-upload');
    expect(csvTab.getAttribute('aria-selected')).toBe('true');
    expect(screen.getByTestId('connector-csv-upload-workspace')).toBeInTheDocument();

    // Click "← Back to Ingestion Pipeline"
    const backBtn = screen.getByRole('button', { name: /Back to Ingestion Pipeline/i });
    fireEvent.click(backBtn);

    expect(window.location.search).not.toContain('connector=');
    expect(screen.queryByTestId('connector-csv-upload-workspace')).toBeNull();
    expect(screen.getByText('Surplus Ingestion Pipeline')).toBeDefined();
  });

  it('handles browser popstate navigation for csv-upload', () => {
    window.history.replaceState({}, '', '/?tab=ingestion');
    const store = createTestStore();

    render(
      <Provider store={store}>
        <IngestionView />
      </Provider>
    );

    expect(screen.getByText('Surplus Ingestion Pipeline')).toBeDefined();

    // Simulate browser navigating forward to ?tab=ingestion&connector=csv-upload
    act(() => {
      window.history.pushState({}, '', '/?tab=ingestion&connector=csv-upload');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    expect(screen.getByRole('button', { name: /Back to Ingestion Pipeline/i })).toBeDefined();
    expect(screen.getByRole('tab', { name: /CSV \/ Excel Upload/i }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByTestId('connector-csv-upload-workspace')).toBeInTheDocument();

    // Simulate browser back to ?tab=ingestion
    act(() => {
      window.history.pushState({}, '', '/?tab=ingestion');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    expect(screen.getByText('Surplus Ingestion Pipeline')).toBeDefined();
    expect(screen.queryByTestId('connector-csv-upload-workspace')).toBeNull();
  });
});



