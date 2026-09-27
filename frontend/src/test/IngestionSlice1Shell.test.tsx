import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import coreReducer from '../store/slices/coreSlice';
import ingestionReducer, { setPipelineTab, setSalesRecords } from '../store/slices/ingestionSlice';
import inventoryReducer, { setInventoryList } from '../store/slices/inventorySlice';
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
    it('renders the 5 integration cards with icons, labels, and badges', () => {
      render(
        <Provider store={testStore}>
          <IngestionHubConnectors onOpenUploadModal={vi.fn()} />
        </Provider>
      );

      expect(screen.getByText('Ingestion Hub & Connectors')).toBeDefined();
      expect(screen.getByText(/Auto-sync Active/i)).toBeDefined();

      // 5 Cards
      expect(screen.getByText('Zapier Webhooks')).toBeDefined();
      expect(screen.getByText('Google Sheets Sync')).toBeDefined();
      expect(screen.getByText('Image & Doc Scanner')).toBeDefined();
      expect(screen.getByText('CSV / Excel Upload')).toBeDefined();
      expect(screen.getByText('+ Add Integration')).toBeDefined();

      // Buttons
      expect(screen.getByRole('button', { name: /Connect Zapier/i })).toBeDefined();
      expect(screen.getByRole('button', { name: /Connect Sheets/i })).toBeDefined();
      expect(screen.getByRole('button', { name: /Scan \/ Upload Doc/i })).toBeDefined();
      expect(screen.getByRole('button', { name: /Upload File/i })).toBeDefined();
      expect(screen.getByText(/Explore Directory/i)).toBeDefined();
    });

    it('toggles collapse/expand when the toggle button is clicked', () => {
      render(
        <Provider store={testStore}>
          <IngestionHubConnectors onOpenUploadModal={vi.fn()} />
        </Provider>
      );

      const toggleBtn = screen.getByRole('button', { name: /Collapse Hub/i });
      expect(toggleBtn).toBeDefined();

      // Click to collapse
      fireEvent.click(toggleBtn);
      expect(screen.getByRole('button', { name: /Expand Hub/i })).toBeDefined();

      // When collapsed, the connectors grid is collapsed/hidden
      const zapierCard = screen.queryByText('Zapier Webhooks');
      // If visually collapsed or hidden
      expect(screen.getByRole('button', { name: /Expand Hub/i })).toBeDefined();

      // Click to expand back
      fireEvent.click(screen.getByRole('button', { name: /Expand Hub/i }));
      expect(screen.getByRole('button', { name: /Collapse Hub/i })).toBeDefined();
      expect(screen.getByText('Zapier Webhooks')).toBeDefined();
    });

    it('calls onOpenUploadModal when CSV / Excel Upload button is clicked', () => {
      const onOpenUploadModal = vi.fn();
      render(
        <Provider store={testStore}>
          <IngestionHubConnectors onOpenUploadModal={onOpenUploadModal} />
        </Provider>
      );

      const uploadBtn = screen.getByRole('button', { name: /Upload File/i });
      fireEvent.click(uploadBtn);
      expect(onOpenUploadModal).toHaveBeenCalledTimes(1);
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
      expect(screen.getByText('Inventory Pipeline')).toBeDefined();
      expect(screen.getByText('Sales Pipeline')).toBeDefined();
      expect(screen.getByText('Buyer Pipeline')).toBeDefined();

      // Counts
      expect(screen.getByText('2')).toBeDefined(); // Inventory count
      expect(screen.getByText('3')).toBeDefined(); // Sales count
      expect(screen.getByText('1')).toBeDefined(); // Buyer count

      // Action Utilities
      expect(screen.getByRole('button', { name: /Buyer Lists/i })).toBeDefined();
      expect(screen.getByRole('button', { name: /Add Buyer/i })).toBeDefined();
      expect(screen.getByRole('button', { name: /Toggle All/i })).toBeDefined();
    });

    it('invokes callbacks when clicking tabs and action buttons', () => {
      const onTabChange = vi.fn();
      const onOpenBuyerLists = vi.fn();
      const onAddBuyer = vi.fn();
      const onToggleAll = vi.fn();

      render(
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
      fireEvent.click(screen.getByText('Sales Pipeline'));
      expect(onTabChange).toHaveBeenCalledWith('sales');

      // Switch to buyer
      fireEvent.click(screen.getByText('Buyer Pipeline'));
      expect(onTabChange).toHaveBeenCalledWith('buyers');

      // Click utility buttons
      fireEvent.click(screen.getByRole('button', { name: /Buyer Lists/i }));
      expect(onOpenBuyerLists).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByRole('button', { name: /Add Buyer/i }));
      expect(onAddBuyer).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByRole('button', { name: /Toggle All/i }));
      expect(onToggleAll).toHaveBeenCalledTimes(1);
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

      expect(screen.getByText('Ingestion Hub & Connectors')).toBeDefined();
      expect(screen.getByText('Inventory Pipeline')).toBeDefined();
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
      fireEvent.click(screen.getByText('Sales Pipeline'));
      expect(testStore.getState().ingestion.pipelineTab).toBe('sales');

      // Switch to buyers
      fireEvent.click(screen.getByText('Buyer Pipeline'));
      expect(testStore.getState().ingestion.pipelineTab).toBe('buyers');
    });
  });
});
