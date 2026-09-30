import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import coreReducer from '../store/slices/coreSlice';
import ingestionReducer, {
  setGoogleSheetsSyncState,
} from '../store/slices/ingestionSlice';
import inventoryReducer, {
  setInventoryList,
} from '../store/slices/inventorySlice';
import workflowReducer from '../store/slices/workflowSlice';
import logisticsReducer from '../store/slices/logisticsSlice';
import authReducer from '../store/slices/authSlice';
import { IngestionView } from '../views/IngestionView';
import { MobileNavDrawer } from '../components/navigation/MobileNavDrawer';
import { useIngestionTelemetry } from '../components/domain/ingestion/hooks/useIngestionTelemetry';

// Mock AuthContext
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { email: 'ops@spoileralert.corp' },
    token: 'test-token',
  }),
}));

vi.mock('../services/coreService', () => ({
  coreService: {
    getSuppliers: vi.fn().mockResolvedValue([{ _id: 'sup-hydrated-1', name: 'Hydrated Ingress Supplier' }]),
    getDistributionCenters: vi.fn().mockResolvedValue([]),
    getBuyers: vi.fn().mockResolvedValue([]),
  },
  default: {
    getSuppliers: vi.fn().mockResolvedValue([{ _id: 'sup-hydrated-1', name: 'Hydrated Ingress Supplier' }]),
    getDistributionCenters: vi.fn().mockResolvedValue([]),
    getBuyers: vi.fn().mockResolvedValue([]),
  },
}));

const initialInventoryState = inventoryReducer(undefined, { type: '@@INIT' });

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
    preloadedState: {
      ...preloadedState,
      inventory: {
        ...initialInventoryState,
        ...preloadedState?.inventory,
      },
    },
  });
};

describe('Issue 05 Slice 2: Ingress UI, Sync Badge, & Operational Metrics Hydration', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    vi.clearAllMocks();
    store = createTestStore({
      core: {
        suppliers: [{ _id: 'sup-hydrated-1', name: 'Hydrated Ingress Supplier' }],
        activeTab: 'ingestion',
      },
      ingestion: {
        pipelineTab: 'inventory',
        selectedSupplier: 'sup-hydrated-1',
        googleSheetsConfig: {
          spreadsheetId: 'sheet-hydrated-123',
          sheetName: 'Live Inventory',
          connectedEmail: 'ops@spoileralert.corp',
          oauthConnected: true,
          ingressKey: 'ingress-key-hydrated-123',
        },
        googleSheetsSync: {
          connectionStatus: 'connected',
          lastSyncedAt: new Date().toISOString(),
          syncedLotCount: 24,
          isSyncing: false,
          error: null,
        },
      },
      inventory: {
        inventoryList: [
          {
            _id: 'lot-1',
            sku: 'SKU-001',
            quantityCases: 100,
            availableQty: 100,
            costPerCase: 10,
            standardSellPrice: 10,
            expirationDate: '2027-05-01',
          },
          {
            _id: 'lot-2',
            sku: 'SKU-002',
            quantityCases: 200,
            availableQty: 200,
            costPerCase: 15,
            standardSellPrice: 15,
            expirationDate: '2027-06-01',
          },
        ],
      },
    });
  });

  it('renders IngestionView with connected Google Sheets badge, last synced time, and synced lot count', () => {
    render(
      <Provider store={store}>
        <IngestionView />
      </Provider>
    );

    // Verify Google Sheets Connector Card reflects connected sync state
    expect(screen.getByText('Google Sheets Sync')).toBeInTheDocument();
    expect(screen.getByText(/Active Trigger • Auto-Sync/i)).toBeInTheDocument();
    expect(screen.getByText(/24 lots synced/i)).toBeInTheDocument();
    expect(screen.getByText(/Last synced: just now/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sync Now/i })).toBeInTheDocument();
  });

  it('hydrates operational Portfolio Value telemetry metric accurately from Redux inventory state', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );

    const { result } = renderHook(() => useIngestionTelemetry(), { wrapper });

    // lot-1: 100 * $10 = $1,000; lot-2: 200 * $15 = $3,000; Total = $4,000
    expect(result.current.metrics.portfolioValue).toBe('$4,000');
    expect(result.current.counts.inventory).toBe(2);
  });

  it('dynamically rehydrates MobileNavDrawer Active Lots metric when inventory updates after sync', () => {
    const { rerender } = render(
      <Provider store={store}>
        <MobileNavDrawer isOpen={true} onClose={vi.fn()} />
      </Provider>
    );

    // Initial state has 2 lots in store
    expect(screen.getByText('Active Lots')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();

    // Dispatch updated inventory batch (e.g. 5 lots synced)
    const updatedLots = Array.from({ length: 5 }, (_, i) => ({
      _id: `lot-updated-${i}`,
      sku: `SKU-${i}`,
      quantityCases: 50,
      costPerCase: 20,
    }));
    act(() => {
      store.dispatch(setInventoryList(updatedLots));
    });

    rerender(
      <Provider store={store}>
        <MobileNavDrawer isOpen={true} onClose={vi.fn()} />
      </Provider>
    );

    expect(screen.getByText('5')).toBeInTheDocument();
  });
});
