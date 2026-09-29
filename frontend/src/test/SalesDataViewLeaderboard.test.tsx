import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
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
          topBuyers: [
            {
              buyerId: 'buyer-1',
              buyerName: 'Costco Wholesale',
              totalPurchases: 25000,
              orderCount: 5,
              avgDiscount: 15,
              transactions: [],
            },
          ],
          topWarehouses: [
            {
              warehouse: 'Dallas DC',
              totalRevenue: 30000,
              orderCount: 8,
              volume: 1200,
              transactions: [],
            },
          ],
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

describe('Seam: Leaderboard Unified Header & Secondary Tab Shell', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders unified header with title, description, and secondary pill-toggle bar defaulting to Lead Buyers', () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <SalesDataView />
      </Provider>
    );

    // Navigate to Leaderboard
    const leaderboardPrimaryTab = screen.getByRole('tab', { name: /leaderboard/i });
    fireEvent.click(leaderboardPrimaryTab);

    // Verify unified header card contents
    expect(screen.getByText('Sales Channel & Fulfillment Leaderboard')).toBeInTheDocument();
    expect(
      screen.getByText('Top closeout buying partners and top performing distribution fulfillment nodes.')
    ).toBeInTheDocument();

    // Verify secondary tablist inside the leaderboard header
    const secondaryTablist = screen.getByRole('tablist', { name: /leaderboard sub-navigation/i });
    expect(secondaryTablist).toBeInTheDocument();

    // Verify the two secondary tabs
    const secondaryTabs = screen.getAllByRole('tab').filter(
      (tab) => tab.getAttribute('aria-controls')?.startsWith('leaderboard-subpanel-')
    );
    expect(secondaryTabs).toHaveLength(2);

    const [buyersTab, warehousesTab] = secondaryTabs;
    expect(buyersTab).toHaveTextContent(/lead buyers/i);
    expect(buyersTab).toHaveAttribute('aria-selected', 'true');

    expect(warehousesTab).toHaveTextContent(/lead warehouses/i);
    expect(warehousesTab).toHaveAttribute('aria-selected', 'false');
  });

  it('switches secondary sub-tabs upon click interaction', () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <SalesDataView />
      </Provider>
    );

    // Navigate to Leaderboard
    fireEvent.click(screen.getByRole('tab', { name: /leaderboard/i }));

    const secondaryTabs = screen.getAllByRole('tab').filter(
      (tab) => tab.getAttribute('aria-controls')?.startsWith('leaderboard-subpanel-')
    );
    const [buyersTab, warehousesTab] = secondaryTabs;

    expect(buyersTab).toHaveAttribute('aria-selected', 'true');
    expect(warehousesTab).toHaveAttribute('aria-selected', 'false');

    // Click Lead Warehouses
    fireEvent.click(warehousesTab);
    expect(buyersTab).toHaveAttribute('aria-selected', 'false');
    expect(warehousesTab).toHaveAttribute('aria-selected', 'true');

    // Click Lead Buyers back
    fireEvent.click(buyersTab);
    expect(buyersTab).toHaveAttribute('aria-selected', 'true');
    expect(warehousesTab).toHaveAttribute('aria-selected', 'false');
  });

  it('supports full keyboard navigation (ArrowRight, ArrowLeft, Home, End) across secondary sub-tabs', () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <SalesDataView />
      </Provider>
    );

    // Navigate to Leaderboard
    fireEvent.click(screen.getByRole('tab', { name: /leaderboard/i }));

    const secondaryTabs = screen.getAllByRole('tab').filter(
      (tab) => tab.getAttribute('aria-controls')?.startsWith('leaderboard-subpanel-')
    );
    const [buyersTab, warehousesTab] = secondaryTabs;

    buyersTab.focus();
    expect(document.activeElement).toBe(buyersTab);

    // ArrowRight moves to Lead Warehouses
    fireEvent.keyDown(buyersTab, { key: 'ArrowRight' });
    expect(warehousesTab).toHaveAttribute('aria-selected', 'true');
    expect(document.activeElement).toBe(warehousesTab);

    // ArrowRight wraps back to Lead Buyers
    fireEvent.keyDown(warehousesTab, { key: 'ArrowRight' });
    expect(buyersTab).toHaveAttribute('aria-selected', 'true');
    expect(document.activeElement).toBe(buyersTab);

    // ArrowLeft wraps backwards to Lead Warehouses
    fireEvent.keyDown(buyersTab, { key: 'ArrowLeft' });
    expect(warehousesTab).toHaveAttribute('aria-selected', 'true');
    expect(document.activeElement).toBe(warehousesTab);

    // ArrowLeft moves back to Lead Buyers
    fireEvent.keyDown(warehousesTab, { key: 'ArrowLeft' });
    expect(buyersTab).toHaveAttribute('aria-selected', 'true');
    expect(document.activeElement).toBe(buyersTab);

    // End jumps to last tab (Lead Warehouses)
    fireEvent.keyDown(buyersTab, { key: 'End' });
    expect(warehousesTab).toHaveAttribute('aria-selected', 'true');
    expect(document.activeElement).toBe(warehousesTab);

    // Home jumps to first tab (Lead Buyers)
    fireEvent.keyDown(warehousesTab, { key: 'Home' });
    expect(buyersTab).toHaveAttribute('aria-selected', 'true');
    expect(document.activeElement).toBe(buyersTab);
  });

  it('isolates TopBuyersDrilldown under Lead Buyers and TopWarehousesDrilldown under Lead Warehouses', () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <SalesDataView />
      </Provider>
    );

    // Navigate to Leaderboard
    fireEvent.click(screen.getByRole('tab', { name: /leaderboard/i }));

    const secondaryTabs = screen.getAllByRole('tab').filter(
      (tab) => tab.getAttribute('aria-controls')?.startsWith('leaderboard-subpanel-')
    );
    const [buyersTab, warehousesTab] = secondaryTabs;
    const leaderboardPanel = screen.getByTestId('sales-subview-leaderboard');

    // Default: Lead Buyers is active
    expect(screen.getByTestId('sales-subview-buyers')).toBeInTheDocument();
    expect(screen.queryByTestId('sales-subview-warehouses')).not.toBeInTheDocument();
    expect(within(leaderboardPanel).getByText('Costco Wholesale')).toBeInTheDocument();
    expect(within(leaderboardPanel).queryByText('Dallas DC')).not.toBeInTheDocument();

    // Switch to Lead Warehouses
    fireEvent.click(warehousesTab);
    expect(screen.queryByTestId('sales-subview-buyers')).not.toBeInTheDocument();
    expect(screen.getByTestId('sales-subview-warehouses')).toBeInTheDocument();
    expect(within(leaderboardPanel).getByText('Dallas DC')).toBeInTheDocument();
    expect(within(leaderboardPanel).queryByText('Costco Wholesale')).not.toBeInTheDocument();

    // Switch back to Lead Buyers
    fireEvent.click(buyersTab);
    expect(screen.getByTestId('sales-subview-buyers')).toBeInTheDocument();
    expect(screen.queryByTestId('sales-subview-warehouses')).not.toBeInTheDocument();
    expect(within(leaderboardPanel).getByText('Costco Wholesale')).toBeInTheDocument();
    expect(within(leaderboardPanel).queryByText('Dallas DC')).not.toBeInTheDocument();
  });

  it('forwards onOpenLotHub callback to the drilldowns when lots are inspected', () => {
    const mockOnOpenLotHub = vi.fn();
    const store = createMockStore({
      totalRevenue: 50000,
      revenueGrowthPct: 5,
      totalVolume: 2000,
      avgPrice: 25,
      reconciledCount: 10,
      totalCount: 10,
      categories: ['Beverages'],
      warehouses: ['Dallas DC'],
      trajectory: [],
      topBuyers: [
        {
          buyerId: 'buyer-1',
          buyerName: 'Costco Wholesale',
          totalPurchases: 25000,
          orderCount: 1,
          avgDiscount: 15,
          transactions: [
            {
              id: 'tx-1',
              lotNumber: 'LOT-9988',
              sku: 'SKU-001',
              product: 'Organic Milk',
              quantityCases: 100,
              price: 20,
              date: '2026-03-01',
              warehouse: 'Dallas DC',
              recoveryPct: 80,
            },
          ],
        },
      ],
      topWarehouses: [],
    });

    render(
      <Provider store={store}>
        <SalesDataView onOpenLotHub={mockOnOpenLotHub} />
      </Provider>
    );

    // Go to Leaderboard -> Lead Buyers
    fireEvent.click(screen.getByRole('tab', { name: /leaderboard/i }));

    // Expand buyer card
    const buyerCard = screen.getByTestId('buyer-card-buyer-1');
    fireEvent.click(buyerCard.firstElementChild!);

    // Click lot link
    const lotButton = screen.getByRole('button', { name: /lot-9988/i });
    fireEvent.click(lotButton);

    expect(mockOnOpenLotHub).toHaveBeenCalledWith(
      expect.objectContaining({
        lotNumber: 'LOT-9988',
      })
    );
  });
});

