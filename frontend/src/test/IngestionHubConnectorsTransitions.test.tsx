import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

describe('IngestionHubConnectors Unified Ingress Seam', () => {
  it('triggers onSelectConnector("google-sheets") when "+ Add Data Source" button is clicked', () => {
    const store = createTestStore();
    const handleSelectConnector = vi.fn();

    render(
      <Provider store={store}>
        <IngestionHubConnectors
          onSelectConnector={handleSelectConnector}
        />
      </Provider>
    );

    const addBtn = screen.getByTestId('data-sources-add-button');
    expect(addBtn).toBeInTheDocument();
    expect(addBtn).toHaveTextContent(/Add Data Source/i);

    fireEvent.click(addBtn);
    expect(handleSelectConnector).toHaveBeenCalledTimes(1);
    expect(handleSelectConnector).toHaveBeenCalledWith('google-sheets');
  });

  it('displays fallback notification when onSelectConnector is not provided and "+ Add Data Source" is clicked', () => {
    const store = createTestStore();

    render(
      <Provider store={store}>
        <IngestionHubConnectors />
      </Provider>
    );

    const addBtn = screen.getByTestId('data-sources-add-button');
    fireEvent.click(addBtn);

    expect(screen.getByText(/Navigating to Integration Management Suite\.\.\./i)).toBeInTheDocument();
  });

  it('renders operational auto-sync telemetry badge and container attributes', () => {
    const store = createTestStore();

    render(
      <Provider store={store}>
        <IngestionHubConnectors />
      </Provider>
    );

    expect(screen.getByRole('heading', { level: 2, name: /Data Sources/i })).toBeInTheDocument();
    expect(screen.getByText(/Auto-sync Active • 4 sources configured/i)).toBeInTheDocument();
  });

  it('does not render individual connector dock chips or preview tabs', () => {
    const store = createTestStore();

    render(
      <Provider store={store}>
        <IngestionHubConnectors />
      </Provider>
    );

    expect(screen.queryByTestId('data-source-chip-google-sheets')).toBeNull();
    expect(screen.queryByTestId('data-source-chip-csv-upload')).toBeNull();
    expect(screen.queryByTestId('data-source-chip-zapier')).toBeNull();
    expect(screen.queryByTestId('data-source-chip-doc-scanner')).toBeNull();
  });
});

