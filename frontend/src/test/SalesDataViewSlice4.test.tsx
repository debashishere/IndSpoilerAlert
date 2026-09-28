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
        salesAnalytics: salesAnalyticsData,
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

describe('Seam 5: Slice 4 - RSL Decay Scatter Matrix & Price Realization Trendline', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockCloseouts = [
    {
      id: 'tx-001',
      sku: 'SKU-BEV-99',
      product: 'Artisan Cold Brew Tea 12pk',
      rslDays: 70,
      price: 32.5,
      recoveryPct: 88,
      buyer: 'Premier Off-Price Partners',
      saleDate: '2026-09-20T10:00:00Z',
    },
    {
      id: 'tx-002',
      sku: 'SKU-SNK-44',
      product: 'Organic Sea Salt Chips',
      rslDays: 20,
      price: 15.0,
      recoveryPct: 55,
      buyer: 'Discount Grocery Network',
      saleDate: '2026-09-22T14:30:00Z',
    },
  ];

  it('renders dynamic scatter nodes from recentCloseouts and replaces hardcoded scatter points', () => {
    const store = createMockStore({
      totalRevenue: 50000,
      revenueGrowthPct: 12,
      totalVolume: 2000,
      avgPrice: 25,
      reconciledCount: 30,
      totalCount: 35,
      categories: ['Beverages', 'Snacks'],
      warehouses: ['Dallas DC'],
      trajectory: [],
      categoryRecovery: [],
      channelDistribution: [],
      recentCloseouts: mockCloseouts,
    });

    render(
      <Provider store={store}>
        <SalesDataView />
      </Provider>
    );

    // Old hardcoded points should NOT exist
    expect(screen.queryByText('Organic Almond Milk 12pk')).not.toBeInTheDocument();
    expect(screen.queryByText('Greek Yogurt Vanilla 32oz')).not.toBeInTheDocument();
    expect(screen.queryByText('DRY-1092')).not.toBeInTheDocument();

    // Scatter nodes for dynamic closeout transactions should be rendered
    const node1 = screen.getByTestId('scatter-node-tx-001');
    const node2 = screen.getByTestId('scatter-node-tx-002');
    expect(node1).toBeInTheDocument();
    expect(node2).toBeInTheDocument();

    // Unit prices should be visible on scatter plot
    expect(screen.getByText('$32.5')).toBeInTheDocument();
    expect(screen.getByText('$15.0')).toBeInTheDocument();
  });

  it('computes dynamic least-squares regression trendline path across points', () => {
    const store = createMockStore({
      totalRevenue: 50000,
      revenueGrowthPct: 12,
      totalVolume: 2000,
      avgPrice: 25,
      reconciledCount: 30,
      totalCount: 35,
      categories: ['Beverages', 'Snacks'],
      warehouses: ['Dallas DC'],
      trajectory: [],
      categoryRecovery: [],
      channelDistribution: [],
      recentCloseouts: mockCloseouts,
    });

    render(
      <Provider store={store}>
        <SalesDataView />
      </Provider>
    );

    const trendline = screen.getByTestId('rsl-regression-trendline');
    expect(trendline).toBeInTheDocument();
    const dAttr = trendline.getAttribute('d');
    // Ensure it is NOT the static hardcoded path "M 50,130 C 150,110 300,50 450,20"
    expect(dAttr).not.toBe('M 50,130 C 150,110 300,50 450,20');
    expect(dAttr).toMatch(/^M \d+(\.\d+)?,/);
  });

  it('clicking a scatter node displays the transaction inspection banner with details', () => {
    const store = createMockStore({
      totalRevenue: 50000,
      revenueGrowthPct: 12,
      totalVolume: 2000,
      avgPrice: 25,
      reconciledCount: 30,
      totalCount: 35,
      categories: ['Beverages', 'Snacks'],
      warehouses: ['Dallas DC'],
      trajectory: [],
      categoryRecovery: [],
      channelDistribution: [],
      recentCloseouts: mockCloseouts,
    });

    render(
      <Provider store={store}>
        <SalesDataView />
      </Provider>
    );

    // Initial instruction prompt is visible
    expect(screen.getByText(/Click any point on the scatter matrix to inspect transaction details/i)).toBeInTheDocument();

    // Click node 1
    const node1 = screen.getByTestId('scatter-node-tx-001');
    fireEvent.click(node1);

    // Inspector card details should be rendered
    expect(screen.getByText('Artisan Cold Brew Tea 12pk')).toBeInTheDocument();
    expect(screen.getByText('(SKU-BEV-99)')).toBeInTheDocument();
    expect(screen.getByText('70 Days RSL')).toBeInTheDocument();
    expect(screen.getByText('$32.50/cs (88% COGS)')).toBeInTheDocument();
    expect(screen.getByText(/Premier Off-Price Partners/i)).toBeInTheDocument();
  });

  it('renders clean empty coordinate grid when 0 closeout transactions exist', () => {
    const store = createMockStore({
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
    });

    render(
      <Provider store={store}>
        <SalesDataView />
      </Provider>
    );

    expect(screen.getByText('No closeout transaction points recorded.')).toBeInTheDocument();
    expect(screen.queryByTestId('rsl-regression-trendline')).not.toBeInTheDocument();
  });
});
