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

describe('IngestionHubConnectors Direct Transition Seam', () => {
  it('triggers onSelectConnector when Zapier, Scanner, or Sheets buttons are clicked', () => {
    const store = createTestStore();
    const handleSelectConnector = vi.fn();
    const handleOpenUploadModal = vi.fn();

    render(
      <Provider store={store}>
        <IngestionHubConnectors
          onSelectConnector={handleSelectConnector}
          onOpenUploadModal={handleOpenUploadModal}
        />
      </Provider>
    );

    // 1. Zapier
    const zapierBtn = screen.getByRole('button', { name: /Connect Zapier/i });
    fireEvent.click(zapierBtn);
    expect(handleSelectConnector).toHaveBeenCalledWith('zapier');

    // 2. Google Sheets (disconnected state)
    const sheetsBtn = screen.getByRole('button', { name: /Connect Sheets/i });
    fireEvent.click(sheetsBtn);
    expect(handleSelectConnector).toHaveBeenCalledWith('google-sheets');

    // 3. Image & Doc Scanner
    const scannerBtn = screen.getByRole('button', { name: /Scan \/ Upload Doc/i });
    fireEvent.click(scannerBtn);
    expect(handleSelectConnector).toHaveBeenCalledWith('doc-scanner');

    // 4. Batch CSV/Excel Upload triggers onSelectConnector('csv-upload')
    const uploadBtn = screen.getByRole('button', { name: /Upload File/i });
    fireEvent.click(uploadBtn);
    expect(handleSelectConnector).toHaveBeenCalledWith('csv-upload');
  });

  it('falls back to onOpenUploadModal when onSelectConnector is not provided for CSV / Excel upload', () => {
    const store = createTestStore();
    const handleOpenUploadModal = vi.fn();

    render(
      <Provider store={store}>
        <IngestionHubConnectors
          onOpenUploadModal={handleOpenUploadModal}
        />
      </Provider>
    );

    const uploadBtn = screen.getByRole('button', { name: /Upload File/i });
    fireEvent.click(uploadBtn);
    expect(handleOpenUploadModal).toHaveBeenCalledTimes(1);
  });

  it('triggers onSelectConnector("google-sheets") when Settings button is clicked in connected Sheets state', () => {
    const connectedStore = createTestStore({
      ingestion: {
        googleSheetsSync: {
          connectionStatus: 'connected',
          isSyncing: false,
          syncedLotCount: 15,
          lastSyncedAt: new Date().toISOString(),
        },
      },
    });

    const handleSelectConnector = vi.fn();

    render(
      <Provider store={connectedStore}>
        <IngestionHubConnectors
          onSelectConnector={handleSelectConnector}
          onOpenUploadModal={vi.fn()}
        />
      </Provider>
    );

    const settingsBtn = screen.getByRole('button', { name: /Google Sheets Settings/i });
    fireEvent.click(settingsBtn);
    expect(handleSelectConnector).toHaveBeenCalledWith('google-sheets');
  });

  it('reflects operational health for Zapier when connected zaps exist', () => {
    const zapierStore = createTestStore({
      zapierSync: {
        totalZaps: 3,
        connectedZaps: [
          {
            zapId: 'zap-001',
            zapName: 'ERP Inbound Receiver',
            status: 'active',
            deliveryCount: 42,
            lastDeliveredAt: new Date().toISOString(),
          },
        ],
      },
    });

    render(
      <Provider store={zapierStore}>
        <IngestionHubConnectors />
      </Provider>
    );

    expect(screen.getByText(/3 Connected Zaps/i)).toBeInTheDocument();
  });

  it('reflects operational health for Image & Doc Scanner with active AI OCR engine', () => {
    const store = createTestStore();

    render(
      <Provider store={store}>
        <IngestionHubConnectors />
      </Provider>
    );

    expect(screen.getByText(/AI Engine Ready/i)).toBeInTheDocument();
  });
});
