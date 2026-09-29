import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React, { act } from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import coreReducer, {
  coreSlice,
  type SalesAnalyticsResponse,
  type SalesBuyerSummary,
  type SalesWarehouseSummary,
} from '../store/slices/coreSlice';
import ingestionReducer from '../store/slices/ingestionSlice';
import inventoryReducer from '../store/slices/inventorySlice';
import workflowReducer from '../store/slices/workflowSlice';
import logisticsReducer from '../store/slices/logisticsSlice';
import { SalesDataView } from '../components/domain/inventory/SalesDataView';

const mockAnalyticsInitial: SalesAnalyticsResponse = {
  totalRevenue: 125000,
  revenueGrowthPct: 12.4,
  totalVolume: 5000,
  avgPrice: 25.0,
  reconciledCount: 45,
  totalCount: 50,
  categories: ['Beverages', 'Dairy', 'Snacks'],
  warehouses: ['Midwest DC (Chicago, IL)', 'Southwest DC (Dallas, TX)'],
  trajectory: [
    { period: 'Week 1', revenue: 25000, volume: 1000 },
    { period: 'Week 2', revenue: 30000, volume: 1200 },
    { period: 'Week 3', revenue: 35000, volume: 1400 },
    { period: 'Week 4', revenue: 35000, volume: 1400 },
  ],
  topBuyers: [
    {
      rank: 1,
      buyerId: 'buyer-1',
      buyerName: 'Bargain Hunt Liquidation',
      segment: 'Regional Off-Price Retailer',
      totalSpent: 75000,
      totalVolume: 3000,
      revenueSharePct: 60.0,
      transactionCount: 2,
      transactions: [
        {
          id: 'tx-1',
          saleDate: '2026-09-20T10:00:00Z',
          lotId: 'lot-101',
          lotNumber: 'LOT-2026-09-101',
          invoiceNumber: 'INV-1001',
          sku: 'SKU-BEV-01',
          product: 'Organic Lemonade 12pk',
          brand: 'Valley Fresh',
          buyer: 'Bargain Hunt Liquidation',
          warehouse: 'Midwest DC (Chicago, IL)',
          quantityCases: 1000,
          pricePerCase: 25.0,
          revenue: 25000,
          recoveryPct: 80.0,
          status: 'delivered',
        },
      ],
    },
  ],
  topWarehouses: [
    {
      rank: 1,
      warehouse: 'Midwest DC (Chicago, IL)',
      clearedRevenue: 75000,
      casesCleared: 3000,
      recoveryPct: 78.5,
      transactionCount: 2,
      transactions: [
        {
          id: 'tx-1',
          saleDate: '2026-09-20T10:00:00Z',
          lotId: 'lot-101',
          lotNumber: 'LOT-2026-09-101',
          invoiceNumber: 'INV-1001',
          sku: 'SKU-BEV-01',
          product: 'Organic Lemonade 12pk',
          brand: 'Valley Fresh',
          buyer: 'Bargain Hunt Liquidation',
          warehouse: 'Midwest DC (Chicago, IL)',
          quantityCases: 1000,
          pricePerCase: 25.0,
          revenue: 25000,
          recoveryPct: 80.0,
          status: 'delivered',
        },
      ],
    },
  ],
};

function createTestStore(preloadedAnalytics: SalesAnalyticsResponse | null = mockAnalyticsInitial) {
  return configureStore({
    reducer: {
      core: coreReducer,
      ingestion: ingestionReducer,
      inventory: inventoryReducer,
      workflow: workflowReducer,
      logistics: logisticsReducer,
    },
    preloadedState: {
      core: {
        activeTab: 'inventory' as any,
        returnTab: null,
        sidebarExpanded: false,
        backendHealthy: true,
        sidecarHealthy: true,
        suppliers: [],
        buyers: [],
        buyerLists: [],
        loading: false,
        error: null,
        analyticsSummary: null,
        analyticsLoading: false,
        salesAnalytics: preloadedAnalytics,
        salesAnalyticsLoading: false,
      },
      ingestion: {
        inventoryList: [],
        salesRecords: [],
        buyers: [],
        selectedSupplier: 'supp-456',
        selectedBuyer: '',
        supplierStats: null,
        buyerStats: null,
        channelDistribution: null,
        cogsSummary: null,
        recentActivity: [],
        loading: false,
        error: null,
      },
    },
  });
}

describe('Issue 05: Sales & Clearing End-to-End Filter Synchronization, Zero-State & Regression', () => {
  let fetchSpy: any;

  beforeEach(() => {
    fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(async (url: any) => {
      const urlStr = String(url);
      if (urlStr.includes('/api/analytics/sales')) {
        return {
          ok: true,
          status: 200,
          json: async () => mockAnalyticsInitial,
        } as Response;
      }
      return {
        ok: true,
        status: 200,
        json: async () => ([]),
      } as Response;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Seam 1: Dynamic Filter Synchronization & Query Dispatching', () => {
    it('dynamically re-queries the backend and preserves selections across sub-tabs when timeframe, category, and DC change', async () => {
      const store = createTestStore();

      await act(async () => {
        render(
          <Provider store={store}>
            <SalesDataView />
          </Provider>
        );
      });

      // Initial query dispatched with default 30d, all categories (omitted when 'all'), all warehouses (omitted when 'all'), supp-456
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/analytics/sales?timeframe=30d&supplierId=supp-456'),
        expect.any(Object)
      );

      fetchSpy.mockClear();

      // 1. Change timeframe to 90d
      const btn90d = screen.getByRole('button', { name: '90d' });
      await act(async () => {
        fireEvent.click(btn90d);
      });

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/analytics/sales?timeframe=90d&supplierId=supp-456'),
        expect.any(Object)
      );

      fetchSpy.mockClear();

      // 2. Change Category filter to 'Beverages'
      const categorySelect = screen.getByDisplayValue('All Categories');
      await act(async () => {
        fireEvent.change(categorySelect, { target: { value: 'Beverages' } });
      });

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/analytics/sales?timeframe=90d&category=Beverages&supplierId=supp-456'),
        expect.any(Object)
      );

      fetchSpy.mockClear();

      // 3. Change DC filter to 'Midwest DC (Chicago, IL)'
      const dcSelect = screen.getByDisplayValue('All Warehouses');
      await act(async () => {
        fireEvent.change(dcSelect, { target: { value: 'Midwest DC (Chicago, IL)' } });
      });

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          '/api/analytics/sales?timeframe=90d&category=Beverages&warehouse=Midwest+DC+%28Chicago%2C+IL%29&supplierId=supp-456'
        ),
        expect.any(Object)
      );

      // 4. Switch to Top Buyers subtab and confirm filter selections are preserved
      const buyersTab = screen.getByRole('tab', { name: /top buyers/i });
      await act(async () => {
        fireEvent.click(buyersTab);
      });

      expect(btn90d).toHaveClass('bg-emerald-600');
      expect(screen.getByDisplayValue('Beverages')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Midwest DC (Chicago, IL)')).toBeInTheDocument();
      expect(screen.getByTestId('sales-subview-buyers')).not.toHaveClass('hidden');

      // 5. Switch to Top Warehouses subtab and confirm filter selections are preserved
      const warehousesTab = screen.getByRole('tab', { name: /top warehouses/i });
      await act(async () => {
        fireEvent.click(warehousesTab);
      });

      expect(btn90d).toHaveClass('bg-emerald-600');
      expect(screen.getByDisplayValue('Beverages')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Midwest DC (Chicago, IL)')).toBeInTheDocument();
      expect(screen.getByTestId('sales-subview-warehouses')).not.toHaveClass('hidden');
    });
  });

  describe('Seam 2: Authentic Mathematical Zero-State & Ingestion Guidance', () => {
    it('renders authentic mathematical zero baselines and actionable prompts to ingest sales data in zero state', async () => {
      const zeroAnalytics: SalesAnalyticsResponse = {
        totalRevenue: 0,
        revenueGrowthPct: 0,
        totalVolume: 0,
        avgPrice: 0,
        reconciledCount: 0,
        totalCount: 0,
        categories: [],
        warehouses: [],
        trajectory: [],
        categoryRecovery: [],
        channelDistribution: [],
        recentCloseouts: [],
        topBuyers: [],
        topWarehouses: [],
      };

      const store = createTestStore(zeroAnalytics);

      fetchSpy.mockImplementation(async () => ({
        ok: true,
        status: 200,
        json: async () => zeroAnalytics,
      } as Response));

      await act(async () => {
        render(
          <Provider store={store}>
            <SalesDataView />
          </Provider>
        );
      });

      // 1. Telemetry Bar renders exact mathematical zero baselines
      const telemetryBar = document.getElementById('sales-telemetry-bar')!;
      expect(telemetryBar).toBeInTheDocument();
      // Revenue is $0.00 and Avg Price is $0.00
      expect(within(telemetryBar).getAllByText('$0.00')).toHaveLength(2);
      expect(within(telemetryBar).getAllByText('0')).toHaveLength(2);
      expect(within(telemetryBar).getByText('/ cs')).toBeInTheDocument();
      expect(within(telemetryBar).getByText(/\/ 0/)).toBeInTheDocument();

      // 2. Trajectory chart renders baseline axis and zero guidance message
      expect(screen.getByTestId('trajectory-baseline-axis')).toBeInTheDocument();
      expect(screen.getByText(/No closeout sales recorded for this timeframe\/warehouse/i)).toBeInTheDocument();

      // 3. Navigate to Top Buyers subtab
      const buyersTab = screen.getByRole('tab', { name: /top buyers/i });
      await act(async () => {
        fireEvent.click(buyersTab);
      });

      const buyersEmptyState = screen.getByTestId('top-buyers-empty-state');
      expect(buyersEmptyState).toBeInTheDocument();
      expect(within(buyersEmptyState).getByText(/No Buyer Closeout Sales Recorded/i)).toBeInTheDocument();

      // Prompt to ingest sales data must be present
      const buyerIngestPrompt = within(buyersEmptyState).getByRole('button', { name: /ingest sales data/i });
      expect(buyerIngestPrompt).toBeInTheDocument();

      // Clicking prompt dispatches navigation to the Ingestion pipeline tab
      await act(async () => {
        fireEvent.click(buyerIngestPrompt);
      });
      expect(store.getState().core.activeTab).toBe('ingestion');

      // Reset activeTab back to inventory for warehouse test
      store.dispatch({ type: 'core/setActiveTab', payload: 'inventory' });

      // 4. Navigate to Top Warehouses / DCs subtab
      const warehousesTab = screen.getByRole('tab', { name: /top warehouses/i });
      await act(async () => {
        fireEvent.click(warehousesTab);
      });

      const whEmptyState = screen.getByTestId('top-warehouses-empty-state');
      expect(whEmptyState).toBeInTheDocument();
      expect(within(whEmptyState).getByText(/No Warehouse Clearing Activity Recorded/i)).toBeInTheDocument();

      // Prompt to ingest sales data must be present in warehouse zero state
      const whIngestPrompt = within(whEmptyState).getByRole('button', { name: /ingest sales data/i });
      expect(whIngestPrompt).toBeInTheDocument();

      // Clicking prompt dispatches navigation to the Ingestion pipeline tab
      await act(async () => {
        fireEvent.click(whIngestPrompt);
      });
      expect(store.getState().core.activeTab).toBe('ingestion');
    });
  });

  describe('Seam 3: End-to-End User Interaction Integrity (Accordions, Search & Lot Hub Linking)', () => {
    it('handles accordion toggling, in-table searching, and Lot Hub navigation seamlessly without regressions', async () => {
      const store = createTestStore(mockAnalyticsInitial);
      const onOpenLotHubSpy = vi.fn();

      await act(async () => {
        render(
          <Provider store={store}>
            <SalesDataView onOpenLotHub={onOpenLotHubSpy} />
          </Provider>
        );
      });

      // 1. Switch to Top Buyers subtab
      const buyersTab = screen.getByRole('tab', { name: /top buyers/i });
      await act(async () => {
        fireEvent.click(buyersTab);
      });

      // Buyer card exists
      const buyerCard = screen.getByTestId('buyer-card-buyer-1');
      expect(buyerCard).toBeInTheDocument();

      // Accordion trigger is collapsed initially
      const buyerTrigger = within(buyerCard).getByRole('button', { name: /bargain hunt liquidation/i });
      expect(buyerTrigger).toHaveAttribute('aria-expanded', 'false');
      expect(screen.queryByTestId('buyer-transactions-panel-buyer-1')).not.toBeInTheDocument();

      // Expand buyer accordion
      await act(async () => {
        fireEvent.click(buyerTrigger);
      });

      expect(buyerTrigger).toHaveAttribute('aria-expanded', 'true');
      const buyerPanel = screen.getByTestId('buyer-transactions-panel-buyer-1');
      expect(buyerPanel).toBeInTheDocument();
      expect(within(buyerPanel).getByText('Organic Lemonade 12pk')).toBeInTheDocument();

      // In-table search by SKU/product
      const searchInput = within(buyerPanel).getByPlaceholderText(/filter transactions by sku/i);
      await act(async () => {
        fireEvent.change(searchInput, { target: { value: 'Lemonade' } });
      });

      // Search matches, transaction remains visible and accordion remains expanded
      expect(within(buyerPanel).getByText('Organic Lemonade 12pk')).toBeInTheDocument();
      expect(buyerTrigger).toHaveAttribute('aria-expanded', 'true');

      // Search with non-matching query
      await act(async () => {
        fireEvent.change(searchInput, { target: { value: 'NonExistentProduct' } });
      });
      expect(within(buyerPanel).getByText(/No transactions matched the search query/i)).toBeInTheDocument();

      // Clear search
      await act(async () => {
        fireEvent.change(searchInput, { target: { value: '' } });
      });

      // Click Lot Hub link on lot number
      const lotHubLink = within(buyerPanel).getByRole('button', { name: /LOT-2026-09-101/i });
      await act(async () => {
        fireEvent.click(lotHubLink);
      });

      expect(onOpenLotHubSpy).toHaveBeenCalledTimes(1);
      expect(onOpenLotHubSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          lotNumber: 'LOT-2026-09-101',
          productName: 'Organic Lemonade 12pk',
          sku: 'SKU-BEV-01',
          facility: 'Midwest DC (Chicago, IL)',
          quantityCases: 1000,
        })
      );

      // 2. Switch to Top Warehouses / DCs subtab
      const warehousesTab = screen.getByRole('tab', { name: /top warehouses/i });
      await act(async () => {
        fireEvent.click(warehousesTab);
      });

      const whCard = screen.getByTestId('warehouse-card-warehouse-1');
      expect(whCard).toBeInTheDocument();

      const whTrigger = within(whCard).getByRole('button', { name: /Midwest DC \(Chicago, IL\)/i });
      expect(whTrigger).toHaveAttribute('aria-expanded', 'false');

      // Expand warehouse accordion
      await act(async () => {
        fireEvent.click(whTrigger);
      });

      expect(whTrigger).toHaveAttribute('aria-expanded', 'true');
      const whPanel = screen.getByTestId('warehouse-transactions-panel-warehouse-1');
      expect(whPanel).toBeInTheDocument();
      expect(within(whPanel).getByText('Organic Lemonade 12pk')).toBeInTheDocument();

      // Click Lot Hub link in warehouse panel
      const whLotLink = within(whPanel).getByRole('button', { name: /LOT-2026-09-101/i });
      await act(async () => {
        fireEvent.click(whLotLink);
      });

      expect(onOpenLotHubSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('Seam 4: Cross-Platform Regression & Theme Integration Suite', () => {
    it('integrates seamlessly within InventoryListView and renders institutional dark/light theme tokens without regressions', async () => {
      const { InventoryListView } = await import('../views/InventoryListView');
      const store = createTestStore(mockAnalyticsInitial);

      await act(async () => {
        render(
          <Provider store={store}>
            <div className="dark">
              <InventoryListView />
            </div>
          </Provider>
        );
      });

      // Default sub-tab is recovery
      expect(document.getElementById('panel-insight-recovery')).toBeInTheDocument();

      // Navigate to Sales & Clearing tab in InventoryListView
      const salesTab = screen.getByRole('tab', { name: /sales & clearing/i });
      await act(async () => {
        fireEvent.click(salesTab);
      });

      // Sales panel is mounted
      expect(document.getElementById('insight-sales-panel')).toBeInTheDocument();
      expect(document.getElementById('sales-telemetry-bar')).toBeInTheDocument();
      expect(document.getElementById('sales-filter-bar')).toBeInTheDocument();
      expect(document.getElementById('sales-sub-nav-strip')).toBeInTheDocument();

      // Navigate to Top Buyers subtab inside InventoryListView
      const buyersTab = screen.getByRole('tab', { name: /top buyers/i });
      await act(async () => {
        fireEvent.click(buyersTab);
      });

      const buyersSubView = screen.getByTestId('sales-subview-buyers');
      expect(buyersSubView).not.toHaveClass('hidden');

      // Expand buyer accordion inside full view
      const buyerTrigger = within(buyersSubView).getByRole('button', { name: /bargain hunt liquidation/i });
      await act(async () => {
        fireEvent.click(buyerTrigger);
      });

      expect(within(buyersSubView).getByTestId('buyer-transactions-panel-buyer-1')).toBeInTheDocument();

      // Navigate to Top Warehouses / DCs subtab inside InventoryListView
      const warehousesTab = screen.getByRole('tab', { name: /top warehouses/i });
      await act(async () => {
        fireEvent.click(warehousesTab);
      });

      const warehousesSubView = screen.getByTestId('sales-subview-warehouses');
      expect(warehousesSubView).not.toHaveClass('hidden');

      // Expand warehouse accordion inside full view
      const whTrigger = within(warehousesSubView).getByRole('button', { name: /Midwest DC \(Chicago, IL\)/i });
      await act(async () => {
        fireEvent.click(whTrigger);
      });

      expect(within(warehousesSubView).getByTestId('warehouse-transactions-panel-warehouse-1')).toBeInTheDocument();

      // Return to Overview & Analytics subtab
      const overviewTab = screen.getByRole('tab', { name: /overview & analytics/i });
      await act(async () => {
        fireEvent.click(overviewTab);
      });

      expect(screen.getByRole('tabpanel', { name: /overview & analytics/i })).toBeInTheDocument();
    });
  });
});
