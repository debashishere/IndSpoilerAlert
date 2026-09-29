import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { coreSlice } from '../store/slices/coreSlice';
import { ingestionSlice } from '../store/slices/ingestionSlice';
import { SalesDataView } from '../components/domain/inventory/SalesDataView';

function createMockStore(salesAnalyticsData: any = null) {
  return configureStore({
    reducer: {
      core: coreSlice.reducer,
      ingestion: ingestionSlice.reducer,
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
        salesAnalytics: salesAnalyticsData ?? {
          totalRevenue: 50000,
          revenueGrowthPct: 5,
          totalVolume: 2000,
          avgPrice: 25,
          reconciledCount: 10,
          totalCount: 10,
          categories: ['Beverages'],
          warehouses: ['Dallas DC'],
          trajectory: [],
          topBuyers: [],
          topWarehouses: [],
        },
        salesAnalyticsLoading: false,
      },
      ingestion: {
        inventoryList: [],
        salesRecords: [],
        buyers: [],
        selectedSupplier: 'supp-123',
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

describe('Seam: Sales & Clearing Sub-Navigation Shell & Accessibility', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders a 3-pill sub-navigation strip with ARIA tab roles beneath the filter bar', () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <SalesDataView />
      </Provider>
    );

    const tabList = screen.getByRole('tablist', { name: /sales & clearing/i });
    expect(tabList).toBeInTheDocument();

    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(3);

    expect(tabs[0]).toHaveTextContent(/overview & analytics/i);
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    expect(tabList).toHaveClass('rounded-full');
    expect(tabs[0]).toHaveClass('bg-[#0f4cc9]', 'text-white', 'rounded-full');

    expect(tabs[1]).toHaveTextContent(/top buyers/i);
    expect(tabs[1]).toHaveAttribute('aria-selected', 'false');

    expect(tabs[2]).toHaveTextContent(/top warehouses \/ dcs/i);
    expect(tabs[2]).toHaveAttribute('aria-selected', 'false');
  });

  it('switches active tab when a sub-tab is clicked', () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <SalesDataView />
      </Provider>
    );

    const overviewTab = screen.getByRole('tab', { name: /overview & analytics/i });
    const buyersTab = screen.getByRole('tab', { name: /top buyers/i });
    const warehousesTab = screen.getByRole('tab', { name: /top warehouses/i });

    expect(overviewTab).toHaveAttribute('aria-selected', 'true');
    expect(buyersTab).toHaveAttribute('aria-selected', 'false');

    fireEvent.click(buyersTab);
    expect(overviewTab).toHaveAttribute('aria-selected', 'false');
    expect(buyersTab).toHaveAttribute('aria-selected', 'true');
    expect(warehousesTab).toHaveAttribute('aria-selected', 'false');

    fireEvent.click(warehousesTab);
    expect(overviewTab).toHaveAttribute('aria-selected', 'false');
    expect(buyersTab).toHaveAttribute('aria-selected', 'false');
    expect(warehousesTab).toHaveAttribute('aria-selected', 'true');
  });

  it('supports keyboard navigation across sub-tabs with ArrowRight, ArrowLeft, Home, and End', () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <SalesDataView />
      </Provider>
    );

    const overviewTab = screen.getByRole('tab', { name: /overview & analytics/i });
    const buyersTab = screen.getByRole('tab', { name: /top buyers/i });
    const warehousesTab = screen.getByRole('tab', { name: /top warehouses/i });

    overviewTab.focus();
    expect(document.activeElement).toBe(overviewTab);

    // ArrowRight moves to next tab
    fireEvent.keyDown(overviewTab, { key: 'ArrowRight' });
    expect(buyersTab).toHaveAttribute('aria-selected', 'true');
    expect(document.activeElement).toBe(buyersTab);

    // ArrowRight moves to third tab
    fireEvent.keyDown(buyersTab, { key: 'ArrowRight' });
    expect(warehousesTab).toHaveAttribute('aria-selected', 'true');
    expect(document.activeElement).toBe(warehousesTab);

    // ArrowRight wraps around to first tab
    fireEvent.keyDown(warehousesTab, { key: 'ArrowRight' });
    expect(overviewTab).toHaveAttribute('aria-selected', 'true');
    expect(document.activeElement).toBe(overviewTab);

    // ArrowLeft wraps backwards to last tab
    fireEvent.keyDown(overviewTab, { key: 'ArrowLeft' });
    expect(warehousesTab).toHaveAttribute('aria-selected', 'true');
    expect(document.activeElement).toBe(warehousesTab);

    // Home goes to first tab
    fireEvent.keyDown(warehousesTab, { key: 'Home' });
    expect(overviewTab).toHaveAttribute('aria-selected', 'true');
    expect(document.activeElement).toBe(overviewTab);

    // End goes to last tab
    fireEvent.keyDown(overviewTab, { key: 'End' });
    expect(warehousesTab).toHaveAttribute('aria-selected', 'true');
    expect(document.activeElement).toBe(warehousesTab);
  });

  it('isolates the 4 visual charts inside Overview & Analytics, hiding them in Top Buyers and Top Warehouses sub-tabs', () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <SalesDataView />
      </Provider>
    );

    const overviewTab = screen.getByRole('tab', { name: /overview & analytics/i });
    const buyersTab = screen.getByRole('tab', { name: /top buyers/i });
    const warehousesTab = screen.getByRole('tab', { name: /top warehouses/i });

    // In Overview & Analytics (default), the 4 charts are rendered
    expect(screen.getByText(/Realized Closeout Revenue & Volume Trajectory/i)).toBeInTheDocument();
    expect(screen.getByText(/COGS Recovery % by Product Category/i)).toBeInTheDocument();
    expect(screen.getByText(/Sales Channel Revenue Share/i)).toBeInTheDocument();
    expect(screen.getByText(/Price Realization vs\. Days to Expiry/i)).toBeInTheDocument();

    // Telemetry bar and filter bar are visible
    expect(document.getElementById('sales-telemetry-bar')).toBeInTheDocument();
    expect(document.getElementById('sales-filter-bar')).toBeInTheDocument();

    // Switch to Top Buyers
    fireEvent.click(buyersTab);

    // The 4 charts should NOT be rendered
    expect(screen.queryByText(/Realized Closeout Revenue & Volume Trajectory/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/COGS Recovery % by Product Category/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Sales Channel Revenue Share/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Price Realization vs\. Days to Expiry/i)).not.toBeInTheDocument();

    // The Top Buyers panel container is rendered
    expect(screen.getByTestId('sales-subview-buyers')).toBeInTheDocument();

    // Telemetry bar and filter bar remain visible
    expect(document.getElementById('sales-telemetry-bar')).toBeInTheDocument();
    expect(document.getElementById('sales-filter-bar')).toBeInTheDocument();

    // Switch to Top Warehouses / DCs
    fireEvent.click(warehousesTab);

    // The 4 charts should NOT be rendered
    expect(screen.queryByText(/Realized Closeout Revenue & Volume Trajectory/i)).not.toBeInTheDocument();
    expect(screen.getByTestId('sales-subview-warehouses')).toBeInTheDocument();

    // Telemetry and filter bars remain visible
    expect(document.getElementById('sales-telemetry-bar')).toBeInTheDocument();
    expect(document.getElementById('sales-filter-bar')).toBeInTheDocument();

    // Switch back to Overview & Analytics
    fireEvent.click(overviewTab);
    expect(screen.getByText(/Realized Closeout Revenue & Volume Trajectory/i)).toBeInTheDocument();
  });

  it('preserves active filter selections (timeframe, category, warehouse) seamlessly across sub-tab switches', () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <SalesDataView />
      </Provider>
    );

    // Select timeframe '90d'
    const btn90d = screen.getByRole('button', { name: '90d' });
    fireEvent.click(btn90d);
    expect(btn90d).toHaveClass('bg-emerald-600');

    // Switch to Top Buyers
    const buyersTab = screen.getByRole('tab', { name: /top buyers/i });
    fireEvent.click(buyersTab);

    // Filter should still be '90d'
    const btn90dInBuyers = screen.getByRole('button', { name: '90d' });
    expect(btn90dInBuyers).toHaveClass('bg-emerald-600');

    // Switch to Top Warehouses
    const warehousesTab = screen.getByRole('tab', { name: /top warehouses/i });
    fireEvent.click(warehousesTab);

    // Filter should still be '90d'
    const btn90dInWh = screen.getByRole('button', { name: '90d' });
    expect(btn90dInWh).toHaveClass('bg-emerald-600');
  });
});

