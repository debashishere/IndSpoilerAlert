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
    expect(screen.getByText(/Auto-sync Active • 4 sources configured/i)).toBeInTheDocument();
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

  describe('Streamlined Dock Layout (No Preview Chips)', () => {
    it('does not render any connector preview chips or tabs', () => {
      const store = createTestStore();
      render(
        <Provider store={store}>
          <IngestionHubConnectors />
        </Provider>
      );

      expect(screen.queryByTestId('data-source-chip-google-sheets')).not.toBeInTheDocument();
      expect(screen.queryByTestId('data-source-chip-csv-upload')).not.toBeInTheDocument();
      expect(screen.queryByTestId('data-source-chip-zapier')).not.toBeInTheDocument();
      expect(screen.queryByTestId('data-source-chip-doc-scanner')).not.toBeInTheDocument();
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
  });
});

