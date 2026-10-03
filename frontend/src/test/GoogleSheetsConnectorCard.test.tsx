import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { IngestionHubConnectors } from '../components/domain/ingestion/subcomponents/IngestionHubConnectors';
import ingestionReducer from '../store/slices/ingestionSlice';
import coreReducer from '../store/slices/coreSlice';
import inventoryReducer from '../store/slices/inventorySlice';

function renderWithStore(
  preloadedState?: any,
  props?: {
    onOpenUploadModal?: () => void;
    onSelectConnector?: (connector: any) => void;
  }
) {
  const store = configureStore({
    reducer: {
      ingestion: ingestionReducer,
      core: coreReducer,
      inventory: inventoryReducer,
    },
    preloadedState,
  });

  return {
    store,
    ...render(
      <Provider store={store}>
        <IngestionHubConnectors
          onSelectConnector={props?.onSelectConnector}
          onOpenUploadModal={props?.onOpenUploadModal}
        />
      </Provider>
    ),
  };
}

describe('Google Sheets Ingress Dispatch & Dock Surface Seam', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders "+ Add Data Source" primary button and dispatches ingress to "google-sheets"', () => {
    const onSelectConnector = vi.fn();
    renderWithStore(undefined, { onSelectConnector });

    const addBtn = screen.getByTestId('data-sources-add-button');
    expect(addBtn).toBeInTheDocument();
    expect(addBtn).toHaveTextContent(/Add Data Source/i);

    fireEvent.click(addBtn);
    expect(onSelectConnector).toHaveBeenCalledTimes(1);
    expect(onSelectConnector).toHaveBeenCalledWith('google-sheets');
  });

  it('renders auto-sync telemetry badge reflecting configured sources', () => {
    renderWithStore();

    expect(screen.getByText(/Auto-sync Active • 4 sources configured/i)).toBeInTheDocument();
  });

  it('provides dark-mode surface tokens on dock container', () => {
    renderWithStore();

    const dock = screen.getByTestId('data-sources-dock');
    expect(dock.className).toContain('dark:bg-slate-900');
    expect(dock.className).toContain('dark:border-slate-800');
  });

  it('ensures individual preview chips are not rendered in the dock', () => {
    renderWithStore();

    expect(screen.queryByTestId('data-source-chip-google-sheets')).not.toBeInTheDocument();
  });
});

