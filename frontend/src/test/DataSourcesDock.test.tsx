import React from 'react';
import { describe, it, expect, vi } from 'vitest';
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
import { IngestionHubConnectors } from '../components/domain/ingestion/subcomponents/IngestionHubConnectors';

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

describe('DataSourcesDock Seam', () => {
  it('renders section title "Data Sources", supporting subtitle, and container attributes', () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <IngestionHubConnectors />
      </Provider>
    );

    const container = screen.getByTestId('data-sources-dock');
    expect(container).toBeInTheDocument();
    expect(container).toHaveAttribute('id', 'ingestion-hub-section');

    expect(screen.getByRole('heading', { level: 2, name: /Data Sources/i })).toBeInTheDocument();
    expect(
      screen.getByText(/Automate surplus inventory, sales reports, and buyer intake via live integrations/i)
    ).toBeInTheDocument();
  });

  it('renders visual "+ Add Data Source" primary button with testid and dispatches navigation to google-sheets', () => {
    const store = createTestStore();
    const handleSelectConnector = vi.fn();

    render(
      <Provider store={store}>
        <IngestionHubConnectors onSelectConnector={handleSelectConnector} />
      </Provider>
    );

    const addButton = screen.getByTestId('data-sources-add-button');
    expect(addButton).toBeInTheDocument();
    expect(addButton).toHaveTextContent(/Add Data Source/i);

    fireEvent.click(addButton);
    expect(handleSelectConnector).toHaveBeenCalledTimes(1);
    expect(handleSelectConnector).toHaveBeenCalledWith('google-sheets');
  });

  describe('Semi-Visible Source Preview Chips & Deep Linking', () => {
    it('renders all four semi-visible preview chips with icons and badges', () => {
      const store = createTestStore();
      render(
        <Provider store={store}>
          <IngestionHubConnectors />
        </Provider>
      );

      const sheetsChip = screen.getByTestId('data-source-chip-google-sheets');
      const csvChip = screen.getByTestId('data-source-chip-csv-upload');
      const zapierChip = screen.getByTestId('data-source-chip-zapier');
      const scannerChip = screen.getByTestId('data-source-chip-doc-scanner');

      expect(sheetsChip).toBeInTheDocument();
      expect(csvChip).toBeInTheDocument();
      expect(zapierChip).toBeInTheDocument();
      expect(scannerChip).toBeInTheDocument();

      expect(csvChip).toHaveTextContent(/Batch Ingress/i);
      expect(scannerChip).toHaveTextContent(/AI OCR/i);
    });

    it('navigates directly to connector when each preview chip is clicked', () => {
      const store = createTestStore();
      const handleSelectConnector = vi.fn();

      render(
        <Provider store={store}>
          <IngestionHubConnectors onSelectConnector={handleSelectConnector} />
        </Provider>
      );

      fireEvent.click(screen.getByTestId('data-source-chip-google-sheets'));
      expect(handleSelectConnector).toHaveBeenCalledWith('google-sheets');

      fireEvent.click(screen.getByTestId('data-source-chip-csv-upload'));
      expect(handleSelectConnector).toHaveBeenCalledWith('csv-upload');

      fireEvent.click(screen.getByTestId('data-source-chip-zapier'));
      expect(handleSelectConnector).toHaveBeenCalledWith('zapier');

      fireEvent.click(screen.getByTestId('data-source-chip-doc-scanner'));
      expect(handleSelectConnector).toHaveBeenCalledWith('doc-scanner');
    });

    it('reflects live connected state and last synced status on Google Sheets chip', () => {
      const store = createTestStore({
        ingestion: {
          googleSheetsSync: {
            connectionStatus: 'connected',
            isSyncing: false,
            syncedLotCount: 24,
            lastSyncedAt: new Date(Date.now() - 5 * 60000).toISOString(),
          },
        },
      });

      render(
        <Provider store={store}>
          <IngestionHubConnectors />
        </Provider>
      );

      const sheetsChip = screen.getByTestId('data-source-chip-google-sheets');
      expect(sheetsChip).toHaveTextContent(/Active/i);
      expect(sheetsChip).toHaveTextContent(/5m ago/i);
      expect(sheetsChip.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('reflects active feeds on Zapier chip when zaps exist', () => {
      const store = createTestStore({
        zapierSync: {
          totalZaps: 2,
          connectedZaps: [{ zapId: 'z1', status: 'active' }],
        },
      });

      render(
        <Provider store={store}>
          <IngestionHubConnectors />
        </Provider>
      );

      const zapierChip = screen.getByTestId('data-source-chip-zapier');
      expect(zapierChip).toHaveTextContent(/2 Feeds/i);
      expect(zapierChip.querySelector('.animate-pulse')).toBeInTheDocument();
    });
  });

  describe('End-to-End Pipeline Navigation & History Synchronization', () => {
    beforeEach(() => {
      window.history.replaceState({}, '', '/?tab=ingestion');
    });

    afterEach(() => {
      window.history.replaceState({}, '', '/?tab=ingestion');
    });

    it('transitions from + Add Data Source into IngestionConnectorShell and returns via Back button', async () => {
      const IngestionView = (await import('../views/IngestionView')).default;
      const store = createTestStore();

      render(
        <Provider store={store}>
          <IngestionView />
        </Provider>
      );

      // Verify on main Ingestion pipeline view
      expect(screen.getByTestId('data-sources-dock')).toBeInTheDocument();
      const addBtn = screen.getByTestId('data-sources-add-button');

      // Click + Add Data Source
      fireEvent.click(addBtn);

      // URL updated to google-sheets connector
      expect(window.location.search).toContain('connector=google-sheets');
      expect(screen.getByRole('button', { name: /Back to Ingestion Pipeline/i })).toBeInTheDocument();

      // Click Back to Ingestion Pipeline
      const backBtn = screen.getByRole('button', { name: /Back to Ingestion Pipeline/i });
      fireEvent.click(backBtn);

      // Back on pipeline view
      expect(window.location.search).not.toContain('connector=');
      expect(screen.getByTestId('data-sources-dock')).toBeInTheDocument();
    });

    it('navigates to specific connector from preview chips and preserves browser popstate', async () => {
      const IngestionView = (await import('../views/IngestionView')).default;
      const store = createTestStore();

      render(
        <Provider store={store}>
          <IngestionView />
        </Provider>
      );

      // Click Zapier preview chip
      const zapierChip = screen.getByTestId('data-source-chip-zapier');
      fireEvent.click(zapierChip);

      expect(window.location.search).toContain('connector=zapier');
      expect(screen.getByRole('tab', { name: /Zapier Webhooks/i })).toHaveAttribute('aria-selected', 'true');

      // Simulate popstate back to pipeline
      act(() => {
        window.history.pushState({}, '', '/?tab=ingestion');
        window.dispatchEvent(new PopStateEvent('popstate'));
      });

      expect(screen.getByTestId('data-sources-dock')).toBeInTheDocument();
    });
  });
});

