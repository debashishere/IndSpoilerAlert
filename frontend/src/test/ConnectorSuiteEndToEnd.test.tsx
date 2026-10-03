import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
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

const createFullTestStore = (preloadedState?: any) => {
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
    preloadedState: {
      core: {
        suppliers: [
          { _id: 'sup-alpha', name: 'Apex Foods International', companyCode: 'AFI' },
        ],
      },
      ingestion: {
        selectedSupplier: 'sup-alpha',
        pipelineTab: 'inventory',
        inventoryList: [],
        googleSheetsConfig: {
          ingressKey: 'sec_test_gsheet_key_111',
        },
        connectedSheets: [],
      },
      zapierSync: {
        supplierId: 'sup-alpha',
        ingressKey: 'sec_test_zapier_key_222',
        connectedZaps: [],
        deliveryLogs: [],
        totalZaps: 0,
        pingStatus: 'idle',
        pingLatencyMs: null,
      },
      ...preloadedState,
    },
  });
};

describe('Full-Page Ingestion Connector Suite End-to-End Regression Seam', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/?tab=ingestion');
  });

  afterEach(() => {
    window.history.replaceState({}, '', '/?tab=ingestion');
  });

  it('executes complete journey: Card navigation -> Cross-connector switching -> Back to pipeline', async () => {
    const store = createFullTestStore();

    render(
      <Provider store={store}>
        <IngestionView />
      </Provider>
    );

    // 1. Initial State: Main Ingestion View
    expect(screen.getByText('Surplus Ingestion Pipeline')).toBeInTheDocument();
    expect(screen.getByText('Data Sources')).toBeInTheDocument();

    // 2. Click Zapier Card -> Navigates to Zapier suite
    const zapierCardBtn = screen.getByRole('button', { name: /Connect Zapier/i });
    fireEvent.click(zapierCardBtn);

    expect(window.location.search).toContain('connector=zapier');
    expect(screen.getByTestId('zapier-quadrant-1-telemetry')).toBeInTheDocument();
    expect(screen.getByTestId('zapier-quadrant-2-credentials')).toBeInTheDocument();
    expect(screen.getByTestId('zapier-quadrant-3-roster')).toBeInTheDocument();
    expect(screen.getByTestId('zapier-quadrant-4-mapper')).toBeInTheDocument();

    // 3. Switch to Image & Doc Scanner via switcher tab bar
    const docScannerTab = screen.getByRole('tab', { name: /Image & Doc Scanner/i });
    fireEvent.click(docScannerTab);

    expect(window.location.search).toContain('connector=doc-scanner');
    expect(docScannerTab.getAttribute('aria-selected')).toBe('true');
    expect(screen.getByTestId('doc-scanner-quadrant-1-telemetry')).toBeInTheDocument();
    expect(screen.getByTestId('doc-scanner-quadrant-2-dropzone')).toBeInTheDocument();
    expect(screen.getByTestId('doc-scanner-quadrant-3-roster')).toBeInTheDocument();
    expect(screen.getByTestId('doc-scanner-quadrant-4-mapper')).toBeInTheDocument();

    // 4. Switch to Google Sheets Sync via switcher tab bar
    const gsheetsTab = screen.getByRole('tab', { name: /Google Sheets Sync/i });
    fireEvent.click(gsheetsTab);

    expect(window.location.search).toContain('connector=google-sheets');
    expect(gsheetsTab.getAttribute('aria-selected')).toBe('true');
    expect(screen.getByTestId('gsheet-quadrant-1-telemetry')).toBeInTheDocument();
    expect(screen.getByTestId('gsheet-quadrant-2-credentials')).toBeInTheDocument();
    expect(screen.getByTestId('gsheet-quadrant-3-roster')).toBeInTheDocument();

    // 5. Click "← Back to Ingestion Pipeline" to return to parent pipeline
    const backBtn = screen.getByRole('button', { name: /Back to Ingestion Pipeline/i });
    fireEvent.click(backBtn);

    expect(window.location.search).not.toContain('connector=');
    expect(screen.getByText('Surplus Ingestion Pipeline')).toBeInTheDocument();
    expect(screen.getByText('Data Sources')).toBeInTheDocument();
  });

  it('navigates directly to Image & Doc Scanner via deep-link URL on initial mount', () => {
    window.history.replaceState({}, '', '/?tab=ingestion&connector=doc-scanner');
    const store = createFullTestStore();

    render(
      <Provider store={store}>
        <IngestionView />
      </Provider>
    );

    // Deep-linked URL immediately renders full-page Doc Scanner
    expect(screen.getByRole('heading', { level: 1, name: /Integration Management Suite/i })).toBeInTheDocument();
    expect(screen.getByTestId('doc-scanner-quadrant-1-telemetry')).toBeInTheDocument();
    expect(screen.getByTestId('doc-scanner-quadrant-2-dropzone')).toBeInTheDocument();
    expect(screen.getByTestId('doc-scanner-quadrant-3-roster')).toBeInTheDocument();
    expect(screen.getByTestId('doc-scanner-quadrant-4-mapper')).toBeInTheDocument();

    // Main pipeline is not visible
    expect(screen.queryByText('Surplus Ingestion Pipeline')).toBeNull();
  });

  it('handles browser back/forward history navigation across connectors and pipeline root', () => {
    window.history.replaceState({}, '', '/?tab=ingestion');
    const store = createFullTestStore();

    render(
      <Provider store={store}>
        <IngestionView />
      </Provider>
    );

    expect(screen.getByText('Surplus Ingestion Pipeline')).toBeInTheDocument();

    // Simulate forward to connector=doc-scanner
    act(() => {
      window.history.pushState({}, '', '/?tab=ingestion&connector=doc-scanner');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    expect(screen.getByTestId('doc-scanner-quadrant-1-telemetry')).toBeInTheDocument();

    // Simulate forward to connector=google-sheets
    act(() => {
      window.history.pushState({}, '', '/?tab=ingestion&connector=google-sheets');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    expect(screen.getByTestId('gsheet-quadrant-1-telemetry')).toBeInTheDocument();

    // Simulate back to connector=doc-scanner
    act(() => {
      window.history.pushState({}, '', '/?tab=ingestion&connector=doc-scanner');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    expect(screen.getByTestId('doc-scanner-quadrant-1-telemetry')).toBeInTheDocument();

    // Simulate back to pipeline root
    act(() => {
      window.history.pushState({}, '', '/?tab=ingestion');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    expect(screen.getByText('Surplus Ingestion Pipeline')).toBeInTheDocument();
  });

  it('navigates to full-page CSV Integration Suite from Hub Card and returns cleanly to pipeline', async () => {
    window.history.replaceState({}, '', '/?tab=ingestion');
    const store = createFullTestStore();

    render(
      <Provider store={store}>
        <IngestionView />
      </Provider>
    );

    // Click "Upload File" on the CSV/Excel card
    const uploadBtn = screen.getByRole('button', { name: /Upload File/i });
    fireEvent.click(uploadBtn);

    // Navigates to full-page CSV integration suite
    await waitFor(() => {
      expect(screen.getByTestId('connector-csv-upload-workspace')).toBeInTheDocument();
    });
    expect(window.location.search).toContain('connector=csv-upload');

    // Click "← Back to Ingestion Pipeline" to return to parent pipeline
    const backBtn = screen.getByRole('button', { name: /Back to Ingestion Pipeline/i });
    fireEvent.click(backBtn);

    await waitFor(() => {
      expect(screen.queryByTestId('connector-csv-upload-workspace')).toBeNull();
    });

    // Pipeline view remains healthy
    expect(screen.getByText('Surplus Ingestion Pipeline')).toBeInTheDocument();
  });
});
