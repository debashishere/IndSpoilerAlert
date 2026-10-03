import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import coreReducer from '../store/slices/coreSlice';
import ingestionReducer from '../store/slices/ingestionSlice';
import inventoryReducer from '../store/slices/inventorySlice';
import workflowReducer from '../store/slices/workflowSlice';
import logisticsReducer from '../store/slices/logisticsSlice';
import authReducer from '../store/slices/authSlice';
import IngestionView from '../views/IngestionView';
import { IngestionHubConnectors } from '../components/domain/ingestion/subcomponents/IngestionHubConnectors';
import { PipelineSwitcherBar } from '../components/domain/ingestion/subcomponents/PipelineSwitcherBar';

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
    preloadedState,
  });
};

describe('Issue #0119: Slice 1 - Ingestion Shell, Telemetry Bar, Connectors Workbench & Master Tab Bar', () => {
  let testStore: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    testStore = createTestStore();
  });

  describe('IngestionHubConnectors', () => {
    it('renders the Data Sources Dock with section header, auto-sync badge, and Add Data Source button', () => {
      render(
        <Provider store={testStore}>
          <IngestionHubConnectors onOpenUploadModal={vi.fn()} />
        </Provider>
      );

      expect(screen.getByText('Data Sources')).toBeDefined();
      expect(screen.getByText(/Auto-sync Active/i)).toBeDefined();
      expect(screen.getByTestId('data-sources-add-button')).toBeDefined();
      expect(screen.getByText('Add Data Source')).toBeDefined();

      // Legacy chips are removed
      expect(screen.queryByTestId('data-source-chip-google-sheets')).toBeNull();
      expect(screen.queryByTestId('data-source-chip-csv-upload')).toBeNull();
      expect(screen.queryByTestId('data-source-chip-zapier')).toBeNull();
      expect(screen.queryByTestId('data-source-chip-doc-scanner')).toBeNull();
    });

    it('dispatches onSelectConnector with google-sheets when Add Data Source button is clicked', () => {
      const onSelectConnector = vi.fn();
      render(
        <Provider store={testStore}>
          <IngestionHubConnectors onSelectConnector={onSelectConnector} />
        </Provider>
      );

      const addBtn = screen.getByTestId('data-sources-add-button');
      fireEvent.click(addBtn);
      expect(onSelectConnector).toHaveBeenCalledWith('google-sheets');
    });
  });

  describe('PipelineSwitcherBar', () => {
    it('displays active tab state and accurate live dataset counts', () => {
      const storeWithData = createTestStore({
        inventory: {
          inventoryList: [
            { _id: 'lot-1', lotNumber: 'LOT-001' },
            { _id: 'lot-2', lotNumber: 'LOT-002' },
          ],
        },
        ingestion: {
          pipelineTab: 'inventory',
          salesRecords: [{ id: 's1' }, { id: 's2' }, { id: 's3' }],
        },
        core: {
          buyers: [{ _id: 'b1' }],
        },
      });

      render(
        <Provider store={storeWithData}>
          <PipelineSwitcherBar
            activeTab="inventory"
            onTabChange={vi.fn()}
            onOpenBuyerLists={vi.fn()}
            onAddBuyer={vi.fn()}
            onToggleAll={vi.fn()}
          />
        </Provider>
      );

      // Verify tabs
      expect(screen.getByText('Inventory')).toBeDefined();
      expect(screen.getByText('Sales')).toBeDefined();
      expect(screen.getByText('Buyers')).toBeDefined();

      // Counts
      expect(screen.getByText('2')).toBeDefined(); // Inventory count
      expect(screen.getByText('3')).toBeDefined(); // Sales count
      expect(screen.getByText('1')).toBeDefined(); // Buyer count

      // Action Utilities on inventory tab (Create Inventory and Toggle All present)
      expect(screen.getByRole('button', { name: /Create Inventory/i })).toBeDefined();
      expect(screen.queryByRole('button', { name: /Create Sales/i })).toBeNull();
      expect(screen.queryByRole('button', { name: /Buyer Lists/i })).toBeNull();
      expect(screen.queryByRole('button', { name: /Create Buyer/i })).toBeNull();
      expect(screen.getByRole('button', { name: /Toggle All/i })).toBeDefined();
    });

    it('preserves screen-reader and legacy test compatibility tokens for all dataset tabs', () => {
      render(
        <Provider store={testStore}>
          <PipelineSwitcherBar
            activeTab="inventory"
            onTabChange={vi.fn()}
          />
        </Provider>
      );

      // Inventory tab compatibility
      expect(screen.getByText('📦 Inventory Pipeline')).toBeDefined();
      expect(screen.getByRole('tab', { name: /Inventory Pipeline/i })).toBeDefined();

      // Sales tab compatibility
      expect(screen.getByText('💰 Sales Pipeline')).toBeDefined();
      expect(screen.getByRole('tab', { name: /Sales Pipeline/i })).toBeDefined();

      // Buyer tab compatibility (supports legacy assertions for Buyer List or Buyer Pipeline)
      expect(screen.getByText(/Buyer List/i)).toBeDefined();
      expect(screen.getByRole('tab', { name: /Buyer Pipeline/i })).toBeDefined();
      expect(screen.getByRole('tab', { name: /Buyer List/i })).toBeDefined();
    });

    it('renders contextual action buttons for each activeTab', () => {
      const { rerender } = render(
        <Provider store={testStore}>
          <PipelineSwitcherBar
            activeTab="inventory"
            onTabChange={vi.fn()}
            onOpenBuyerLists={vi.fn()}
            onAddBuyer={vi.fn()}
            onCreateBuyer={vi.fn()}
            onCreateInventory={vi.fn()}
            onCreateSales={vi.fn()}
            onToggleAll={vi.fn()}
          />
        </Provider>
      );

      // Inventory tab: Create Inventory visible, others hidden
      expect(screen.getByRole('button', { name: /Create Inventory/i })).toBeDefined();
      expect(screen.queryByRole('button', { name: /Create Sales/i })).toBeNull();
      expect(screen.queryByRole('button', { name: /Buyer Lists/i })).toBeNull();
      expect(screen.queryByRole('button', { name: /Create Buyer/i })).toBeNull();
      expect(screen.getByRole('button', { name: /Toggle All/i })).toBeDefined();

      // Switch to sales tab: Create Sales visible, others hidden
      rerender(
        <Provider store={testStore}>
          <PipelineSwitcherBar
            activeTab="sales"
            onTabChange={vi.fn()}
            onOpenBuyerLists={vi.fn()}
            onAddBuyer={vi.fn()}
            onCreateBuyer={vi.fn()}
            onCreateInventory={vi.fn()}
            onCreateSales={vi.fn()}
            onToggleAll={vi.fn()}
          />
        </Provider>
      );
      expect(screen.queryByRole('button', { name: /Create Inventory/i })).toBeNull();
      expect(screen.getByRole('button', { name: /Create Sales/i })).toBeDefined();
      expect(screen.queryByRole('button', { name: /Buyer Lists/i })).toBeNull();
      expect(screen.queryByRole('button', { name: /Create Buyer/i })).toBeNull();
      expect(screen.getByRole('button', { name: /Toggle All/i })).toBeDefined();

      // Switch to buyers tab: Buyer Lists and Create Buyer visible, others hidden
      rerender(
        <Provider store={testStore}>
          <PipelineSwitcherBar
            activeTab="buyers"
            onTabChange={vi.fn()}
            onOpenBuyerLists={vi.fn()}
            onAddBuyer={vi.fn()}
            onCreateBuyer={vi.fn()}
            onCreateInventory={vi.fn()}
            onCreateSales={vi.fn()}
            onToggleAll={vi.fn()}
          />
        </Provider>
      );
      expect(screen.queryByRole('button', { name: /Create Inventory/i })).toBeNull();
      expect(screen.queryByRole('button', { name: /Create Sales/i })).toBeNull();
      expect(screen.getByRole('button', { name: /Buyer Lists/i })).toBeDefined();
      expect(screen.getByRole('button', { name: /Create Buyer/i })).toBeDefined();
      expect(screen.getByRole('button', { name: /Toggle All/i })).toBeDefined();
    });

    it('invokes callbacks when clicking tabs and action buttons', () => {
      const onTabChange = vi.fn();
      const onOpenBuyerLists = vi.fn();
      const onAddBuyer = vi.fn();
      const onToggleAll = vi.fn();

      const { rerender } = render(
        <Provider store={testStore}>
          <PipelineSwitcherBar
            activeTab="inventory"
            onTabChange={onTabChange}
            onOpenBuyerLists={onOpenBuyerLists}
            onAddBuyer={onAddBuyer}
            onToggleAll={onToggleAll}
          />
        </Provider>
      );

      // Switch to sales
      fireEvent.click(screen.getByText('Sales'));
      expect(onTabChange).toHaveBeenCalledWith('sales');

      // Switch to buyer
      fireEvent.click(screen.getByText('Buyers'));
      expect(onTabChange).toHaveBeenCalledWith('buyers');

      // Toggle all works on inventory tab
      fireEvent.click(screen.getByRole('button', { name: /Toggle All/i }));
      expect(onToggleAll).toHaveBeenCalledTimes(1);

      // Rerender with activeTab="buyers" to click contextual buyer buttons
      rerender(
        <Provider store={testStore}>
          <PipelineSwitcherBar
            activeTab="buyers"
            onTabChange={onTabChange}
            onOpenBuyerLists={onOpenBuyerLists}
            onAddBuyer={onAddBuyer}
            onToggleAll={onToggleAll}
          />
        </Provider>
      );

      // Click contextual utility buttons
      fireEvent.click(screen.getByRole('button', { name: /Buyer Lists/i }));
      expect(onOpenBuyerLists).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByRole('button', { name: /Create Buyer/i }));
      expect(onAddBuyer).toHaveBeenCalledTimes(1);
    });

    it('triggers onCreateBuyer callback when "Create Buyer" is clicked', () => {
      const onCreateBuyer = vi.fn();
      render(
        <Provider store={testStore}>
          <PipelineSwitcherBar
            activeTab="buyers"
            onTabChange={vi.fn()}
            onCreateBuyer={onCreateBuyer}
          />
        </Provider>
      );

      fireEvent.click(screen.getByRole('button', { name: /Create Buyer/i }));
      expect(onCreateBuyer).toHaveBeenCalledTimes(1);
    });
  });

  describe('IngestionView Master Shell Integration', () => {
    it('renders the header title and subtitle matching the design', () => {
      render(
        <Provider store={testStore}>
          <IngestionView />
        </Provider>
      );

      expect(screen.getByText('Surplus Ingestion Pipeline')).toBeDefined();
      expect(
        screen.getByText('Progressive disclosure telemetry, automated shelf-life validation, and inventory liquidation allocations.')
      ).toBeDefined();
    });

    it('integrates TelemetryBar, IngestionHubConnectors, and PipelineSwitcherBar', () => {
      render(
        <Provider store={testStore}>
          <IngestionView />
        </Provider>
      );

      expect(screen.getByText('Data Sources')).toBeDefined();
      expect(screen.getByText('Inventory')).toBeDefined();
    });

    it('switches tabs cleanly and preserves Redux state without resetting', () => {
      render(
        <Provider store={testStore}>
          <IngestionView />
        </Provider>
      );

      // Initial tab is inventory
      expect(testStore.getState().ingestion.pipelineTab).toBe('inventory');

      // Switch to sales
      fireEvent.click(screen.getByText('Sales'));
      expect(testStore.getState().ingestion.pipelineTab).toBe('sales');

      // Switch to buyers
      fireEvent.click(screen.getByText('Buyers'));
      expect(testStore.getState().ingestion.pipelineTab).toBe('buyers');
    });
  });
});
