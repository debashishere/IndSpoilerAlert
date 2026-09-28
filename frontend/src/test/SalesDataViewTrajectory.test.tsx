import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { coreSlice } from '../store/slices/coreSlice';
import { ingestionSlice } from '../store/slices/ingestionSlice';
import { SalesDataView } from '../components/domain/inventory/SalesDataView';
import coreService from '../services/coreService';

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

describe('Seam 3: Chart 1 Trajectory & Multi-Timeframe Filtering', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('dynamically populates Category and Warehouse dropdowns from backend data', () => {
    const store = createMockStore({
      totalRevenue: 5000,
      revenueGrowthPct: 0,
      totalVolume: 200,
      avgPrice: 25,
      reconciledCount: 5,
      totalCount: 5,
      categories: ['Artisan Bakery', 'Specialty Dairy'],
      warehouses: ['Phoenix DC', 'Seattle DC'],
      trajectory: [
        { period: 'Day 1', revenue: 2000, volume: 80 },
        { period: 'Day 2', revenue: 3000, volume: 120 },
      ],
    });

    render(
      <Provider store={store}>
        <SalesDataView />
      </Provider>
    );

    // Categories dropdown
    expect(screen.getByRole('option', { name: 'All Categories' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Artisan Bakery' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Specialty Dairy' })).toBeInTheDocument();
    // Static hardcoded options should not exist
    expect(screen.queryByRole('option', { name: 'Frozen Food' })).not.toBeInTheDocument();

    // Warehouses dropdown
    expect(screen.getByRole('option', { name: 'All Warehouses' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Phoenix DC' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Seattle DC' })).toBeInTheDocument();
  });

  it('dispatches fetchSalesAnalyticsThunk with active parameters when toggling filters', async () => {
    const fetchSpy = vi.spyOn(coreService, 'fetchSalesAnalytics').mockResolvedValue({
      totalRevenue: 5000,
      revenueGrowthPct: 0,
      totalVolume: 200,
      avgPrice: 25,
      reconciledCount: 5,
      totalCount: 5,
      categories: ['Dairy'],
      warehouses: ['Dallas DC'],
      trajectory: [],
    });

    const store = createMockStore({
      totalRevenue: 5000,
      revenueGrowthPct: 0,
      totalVolume: 200,
      avgPrice: 25,
      reconciledCount: 5,
      totalCount: 5,
      categories: ['Dairy'],
      warehouses: ['Dallas DC'],
      trajectory: [],
    });

    await render(
      <Provider store={store}>
        <SalesDataView />
      </Provider>
    );

    // Click 7d button
    const btn7d = screen.getByRole('button', { name: /7d/i });
    fireEvent.click(btn7d);

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        timeframe: '7d',
        supplierId: 'supp-123',
      })
    );
  });

  it('renders dynamic SVG path coordinates for revenue and volume, replacing static curve', () => {
    const trajectoryData = [
      { period: 'Day 1', revenue: 1000, volume: 50 },
      { period: 'Day 2', revenue: 2000, volume: 100 },
      { period: 'Day 3', revenue: 1500, volume: 75 },
    ];

    const store = createMockStore({
      totalRevenue: 4500,
      revenueGrowthPct: 10,
      totalVolume: 225,
      avgPrice: 20,
      reconciledCount: 3,
      totalCount: 3,
      categories: ['Dairy'],
      warehouses: ['Dallas DC'],
      trajectory: trajectoryData,
    });

    render(
      <Provider store={store}>
        <SalesDataView />
      </Provider>
    );

    // Static bezier curve should NOT be present in DOM
    const staticPath = document.querySelector('path[d*="M 0,110 Q 100,50 200,75 T 400,30"]');
    expect(staticPath).toBeNull();

    // Dynamic paths should be present
    const revArea = document.querySelector('[data-testid="trajectory-revenue-area"]');
    const revLine = document.querySelector('[data-testid="trajectory-revenue-line"]');
    const volLine = document.querySelector('[data-testid="trajectory-volume-line"]');
    expect(revArea).toBeInTheDocument();
    expect(revLine).toBeInTheDocument();
    expect(volLine).toBeInTheDocument();

    // Period labels
    expect(screen.getByText('Day 1')).toBeInTheDocument();
    expect(screen.getByText('Day 2')).toBeInTheDocument();
    expect(screen.getByText('Day 3')).toBeInTheDocument();
  });

  it('renders flat baseline axis and in-situ message when 0 transactions exist for timeframe/filter', () => {
    const store = createMockStore({
      totalRevenue: 0,
      revenueGrowthPct: 0,
      totalVolume: 0,
      avgPrice: 0,
      reconciledCount: 0,
      totalCount: 0,
      categories: [],
      warehouses: [],
      trajectory: [
        { period: 'Day 1', revenue: 0, volume: 0 },
        { period: 'Day 2', revenue: 0, volume: 0 },
        { period: 'Day 3', revenue: 0, volume: 0 },
      ],
    });

    render(
      <Provider store={store}>
        <SalesDataView />
      </Provider>
    );

    // In-situ informative notice
    expect(
      screen.getByText('No closeout sales recorded for this timeframe/warehouse.')
    ).toBeInTheDocument();

    // Baseline flat path rendered
    const baseline = document.querySelector('[data-testid="trajectory-baseline-axis"]');
    expect(baseline).toBeInTheDocument();
  });
});
