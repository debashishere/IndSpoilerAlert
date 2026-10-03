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

describe('Google Sheets Source Chip (Dual-State & Ingress Dispatch)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders State 1 (Unconnected) with "Connect Sheets" action by default', () => {
    const onSelectConnector = vi.fn();
    renderWithStore(undefined, { onSelectConnector });

    expect(screen.getByText('Google Sheets')).toBeInTheDocument();
    const connectBtn = screen.getByTestId('data-source-chip-google-sheets');
    expect(connectBtn).toBeInTheDocument();

    fireEvent.click(connectBtn);
    expect(onSelectConnector).toHaveBeenCalledWith('google-sheets');
  });

  it('renders State 2 (Connected) with emerald badge, active status, and synced time', () => {
    const onSelectConnector = vi.fn();
    const preloadedState = {
      ingestion: {
        googleSheetsSync: {
          connectionStatus: 'connected' as const,
          lastSyncedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 mins ago
          syncedLotCount: 142,
          isSyncing: false,
          error: null,
        },
        googleSheetsConfig: {
          spreadsheetId: 'sheet-xyz-123',
          sheetName: 'Live Inventory',
          connectedEmail: 'supplier@example.com',
          oauthConnected: true,
          ingressKey: 'ingress-key-123',
        },
      },
    };

    renderWithStore(preloadedState, { onSelectConnector });

    // Emerald pulsating badge
    const chip = screen.getByTestId('data-source-chip-google-sheets');
    expect(chip).toHaveTextContent(/Active • 5m ago/i);
    expect(chip.querySelector('.animate-pulse')).toBeInTheDocument();

    // Clicking connected chip also navigates to google-sheets
    fireEvent.click(chip);
    expect(onSelectConnector).toHaveBeenCalledWith('google-sheets');
  });

  it('provides dark-mode surface tokens on dock container and Google Sheets chip', () => {
    renderWithStore();

    const dock = screen.getByTestId('data-sources-dock');
    expect(dock.className).toContain('dark:bg-slate-900');
    expect(dock.className).toContain('dark:border-slate-800');

    const chip = screen.getByTestId('data-source-chip-google-sheets');
    expect(chip.className).toContain('dark:bg-slate-800/80');
    expect(chip.className).toContain('dark:border-slate-700');
  });
});
