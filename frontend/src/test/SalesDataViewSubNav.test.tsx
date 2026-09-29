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

  it('renders a 2-pill sub-navigation strip with ARIA tab roles beneath the filter bar', () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <SalesDataView />
      </Provider>
    );

    const tabList = screen.getByRole('tablist', { name: /sales & clearing/i });
    expect(tabList).toBeInTheDocument();

    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(2);

    expect(tabs[0]).toHaveTextContent(/overview & analytics/i);
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    expect(tabList).toHaveClass('rounded-full');
    expect(tabs[0]).toHaveClass('bg-[#0f4cc9]', 'text-white', 'rounded-full');

    expect(tabs[1]).toHaveTextContent(/leaderboard/i);
    expect(tabs[1]).toHaveAttribute('aria-selected', 'false');
  });

  it('switches active tab when a sub-tab is clicked', () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <SalesDataView />
      </Provider>
    );

    const overviewTab = screen.getByRole('tab', { name: /overview & analytics/i });
    const leaderboardTab = screen.getByRole('tab', { name: /leaderboard/i });

    expect(overviewTab).toHaveAttribute('aria-selected', 'true');
    expect(leaderboardTab).toHaveAttribute('aria-selected', 'false');

    fireEvent.click(leaderboardTab);
    expect(overviewTab).toHaveAttribute('aria-selected', 'false');
    expect(leaderboardTab).toHaveAttribute('aria-selected', 'true');

    fireEvent.click(overviewTab);
    expect(overviewTab).toHaveAttribute('aria-selected', 'true');
    expect(leaderboardTab).toHaveAttribute('aria-selected', 'false');
  });

  it('supports keyboard navigation across sub-tabs with ArrowRight, ArrowLeft, Home, and End', () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <SalesDataView />
      </Provider>
    );

    const overviewTab = screen.getByRole('tab', { name: /overview & analytics/i });
    const leaderboardTab = screen.getByRole('tab', { name: /leaderboard/i });

    overviewTab.focus();
    expect(document.activeElement).toBe(overviewTab);

    // ArrowRight moves to next tab (leaderboard)
    fireEvent.keyDown(overviewTab, { key: 'ArrowRight' });
    expect(leaderboardTab).toHaveAttribute('aria-selected', 'true');
    expect(document.activeElement).toBe(leaderboardTab);

    // ArrowRight wraps around to first tab (overview)
    fireEvent.keyDown(leaderboardTab, { key: 'ArrowRight' });
    expect(overviewTab).toHaveAttribute('aria-selected', 'true');
    expect(document.activeElement).toBe(overviewTab);

    // ArrowLeft wraps backwards to last tab (leaderboard)
    fireEvent.keyDown(overviewTab, { key: 'ArrowLeft' });
    expect(leaderboardTab).toHaveAttribute('aria-selected', 'true');
    expect(document.activeElement).toBe(leaderboardTab);

    // ArrowLeft moves back to first tab
    fireEvent.keyDown(leaderboardTab, { key: 'ArrowLeft' });
    expect(overviewTab).toHaveAttribute('aria-selected', 'true');
    expect(document.activeElement).toBe(overviewTab);

    // End goes to last tab
    fireEvent.keyDown(overviewTab, { key: 'End' });
    expect(leaderboardTab).toHaveAttribute('aria-selected', 'true');
    expect(document.activeElement).toBe(leaderboardTab);

    // Home goes to first tab
    fireEvent.keyDown(leaderboardTab, { key: 'Home' });
    expect(overviewTab).toHaveAttribute('aria-selected', 'true');
    expect(document.activeElement).toBe(overviewTab);
  });

  it('isolates the 4 visual charts in Overview & Analytics and eliminates duplicate static leaderboard card and dummy data', () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <SalesDataView />
      </Provider>
    );

    const overviewTab = screen.getByRole('tab', { name: /overview & analytics/i });
    const leaderboardTab = screen.getByRole('tab', { name: /leaderboard/i });

    // In Overview & Analytics (default), the 4 charts are rendered
    expect(screen.getByText(/Realized Closeout Revenue & Volume Trajectory/i)).toBeInTheDocument();
    expect(screen.getByText(/COGS Recovery % by Product Category/i)).toBeInTheDocument();
    expect(screen.getByText(/Sales Channel Revenue Share/i)).toBeInTheDocument();
    expect(screen.getByText(/Price Realization vs\. Days to Expiry/i)).toBeInTheDocument();

    // Section 5 static duplicate leaderboard and dummy data MUST NOT be in Overview
    expect(screen.queryByText(/Sales Channel & Fulfillment Leaderboard/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Bargain Hunt Liquidation/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Unilever Midwest DC \(Chicago, IL\)/i)).not.toBeInTheDocument();

    // Telemetry bar and filter bar are visible
    expect(document.getElementById('sales-telemetry-bar')).toBeInTheDocument();
    expect(document.getElementById('sales-filter-bar')).toBeInTheDocument();

    // Switch to Leaderboard
    fireEvent.click(leaderboardTab);

    // The 4 charts should NOT be rendered
    expect(screen.queryByText(/Realized Closeout Revenue & Volume Trajectory/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/COGS Recovery % by Product Category/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Sales Channel Revenue Share/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Price Realization vs\. Days to Expiry/i)).not.toBeInTheDocument();

    // The Leaderboard panel container is rendered
    expect(screen.getByTestId('sales-subview-leaderboard')).toBeInTheDocument();

    // Telemetry bar and filter bar remain visible
    expect(document.getElementById('sales-telemetry-bar')).toBeInTheDocument();
    expect(document.getElementById('sales-filter-bar')).toBeInTheDocument();

    // Switch back to Overview & Analytics
    fireEvent.click(overviewTab);
    expect(screen.getByText(/Realized Closeout Revenue & Volume Trajectory/i)).toBeInTheDocument();
    expect(screen.queryByText(/Sales Channel & Fulfillment Leaderboard/i)).not.toBeInTheDocument();
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

    // Switch to Leaderboard
    const leaderboardTab = screen.getByRole('tab', { name: /leaderboard/i });
    fireEvent.click(leaderboardTab);

    // Filter should still be '90d'
    const btn90dInLeaderboard = screen.getByRole('button', { name: '90d' });
    expect(btn90dInLeaderboard).toHaveClass('bg-emerald-600');

    // Switch back to Overview
    const overviewTab = screen.getByRole('tab', { name: /overview & analytics/i });
    fireEvent.click(overviewTab);

    // Filter should still be '90d'
    const btn90dInOverview = screen.getByRole('button', { name: '90d' });
    expect(btn90dInOverview).toHaveClass('bg-emerald-600');
  });
});

