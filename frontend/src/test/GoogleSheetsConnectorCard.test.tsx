import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { IngestionHubConnectors } from '../components/domain/ingestion/subcomponents/IngestionHubConnectors';
import ingestionReducer, {
  setGoogleSheetsSyncState,
} from '../store/slices/ingestionSlice';
import coreReducer from '../store/slices/coreSlice';
import inventoryReducer from '../store/slices/inventorySlice';
import { googleSheetsSyncService } from '../services/googleSheetsSyncService';

function renderWithStore(
  preloadedState?: any,
  props?: {
    onOpenUploadModal?: () => void;
    onOpenGoogleSheetsDrawer?: () => void;
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
          onOpenGoogleSheetsDrawer={props?.onOpenGoogleSheetsDrawer}
          onOpenUploadModal={props?.onOpenUploadModal}
        />
      </Provider>
    ),
  };
}

describe('Vertical Slice 3: Google Sheets Connector Card (Dual-State & Sync Dispatch)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders State 1 (Unconnected) with "Connect Sheets" button by default', () => {
    const onOpenGoogleSheetsDrawer = vi.fn();
    renderWithStore(undefined, { onOpenGoogleSheetsDrawer });

    expect(screen.getByText('Google Sheets Sync')).toBeInTheDocument();
    const connectBtn = screen.getByRole('button', { name: /connect sheets/i });
    expect(connectBtn).toBeInTheDocument();

    fireEvent.click(connectBtn);
    expect(onOpenGoogleSheetsDrawer).toHaveBeenCalledTimes(1);
  });

  it('renders State 2 (Connected) with emerald badge, synced lots, and "Sync Now" button', () => {
    const onOpenGoogleSheetsDrawer = vi.fn();
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

    renderWithStore(preloadedState, { onOpenGoogleSheetsDrawer });

    // Emerald pulsating badge
    expect(screen.getByText(/active trigger • auto-sync/i)).toBeInTheDocument();

    // Synced lots count and relative time
    expect(screen.getByText(/142/)).toBeInTheDocument();
    expect(screen.getByText(/last synced:/i)).toBeInTheDocument();

    // "Sync Now" button
    const syncNowBtn = screen.getByRole('button', { name: /sync now/i });
    expect(syncNowBtn).toBeInTheDocument();

    // Secondary settings gear button
    const settingsBtn = screen.getByRole('button', { name: /configure sheets|google sheets settings/i });
    expect(settingsBtn).toBeInTheDocument();
    fireEvent.click(settingsBtn);
    expect(onOpenGoogleSheetsDrawer).toHaveBeenCalledTimes(1);
  });

  it('triggers on-demand sync dispatch with toast feedback and spinner animation when clicking "Sync Now"', async () => {
    const mockSyncNow = vi.spyOn(googleSheetsSyncService, 'syncNow').mockResolvedValue({
      success: true,
      syncStatus: 'success',
      lastSyncedAt: new Date().toISOString(),
      syncedLotCount: 150,
      metrics: { totalRows: 150, inserted: 150, updated: 0, depleted: 0, errors: [] },
    });

    const preloadedState = {
      ingestion: {
        selectedSupplier: 'sup-test-1',
        googleSheetsSync: {
          connectionStatus: 'connected' as const,
          lastSyncedAt: new Date().toISOString(),
          syncedLotCount: 120,
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

    renderWithStore(preloadedState);

    const syncNowBtn = screen.getByRole('button', { name: /sync now/i });
    fireEvent.click(syncNowBtn);

    await waitFor(() => {
      expect(mockSyncNow).toHaveBeenCalledWith(
        expect.objectContaining({
          supplierId: 'sup-test-1',
        })
      );
    });

    // Toast feedback appears
    await waitFor(() => {
      expect(screen.getByText(/sync completed|synchronization pass/i)).toBeInTheDocument();
    });
  });

  it('renders spinner and disabled state while isSyncing is true', () => {
    const preloadedState = {
      ingestion: {
        googleSheetsSync: {
          connectionStatus: 'connected' as const,
          lastSyncedAt: new Date().toISOString(),
          syncedLotCount: 120,
          isSyncing: true,
          error: null,
        },
      },
    };

    renderWithStore(preloadedState);

    const syncBtn = screen.getByRole('button', { name: /syncing|sync now/i });
    expect(syncBtn).toBeDisabled();
  });

  it('provides dark-mode surface tokens on card container and Connect Sheets button', () => {
    renderWithStore();

    const cardTitle = screen.getByText('Google Sheets Sync');
    const cardContainer = cardTitle.closest('.rounded-xl');
    expect(cardContainer?.className).toContain('dark:bg-slate-800');
    expect(cardContainer?.className).toContain('dark:border-slate-700');

    const connectBtn = screen.getByRole('button', { name: /connect sheets/i });
    expect(connectBtn.className).toContain('dark:bg-slate-800');
    expect(connectBtn.className).toContain('dark:text-slate-200');
  });
});
