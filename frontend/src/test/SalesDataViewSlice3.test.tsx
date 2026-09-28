import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
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

describe('Seam 4: Slice 3 - COGS Recovery Yield & Sales Channel Revenue Share Charts', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('Chart 2: renders dynamic category recovery bars from backend and removes hardcoded categories', () => {
    const store = createMockStore({
      totalRevenue: 75000,
      revenueGrowthPct: 15,
      totalVolume: 3000,
      avgPrice: 25,
      reconciledCount: 10,
      totalCount: 10,
      categories: ['Artisan Bakery', 'Specialty Dairy'],
      warehouses: ['Chicago DC'],
      trajectory: [],
      categoryRecovery: [
        { category: 'Artisan Bakery', cogs: 50000, revenue: 45000, recoveryPct: 90.0 },
        { category: 'Specialty Dairy', cogs: 40000, revenue: 30000, recoveryPct: 75.0 },
      ],
      channelDistribution: [],
    });

    render(
      <Provider store={store}>
        <SalesDataView />
      </Provider>
    );

    // Dynamic backend categories should be rendered
    expect(screen.getByTestId('category-name-Artisan Bakery')).toHaveTextContent('Artisan Bakery');
    expect(screen.getByText('$45,000 / $50,000 COGS')).toBeInTheDocument();
    expect(screen.getByText(/90% Recovery/i)).toBeInTheDocument();

    expect(screen.getByTestId('category-name-Specialty Dairy')).toHaveTextContent('Specialty Dairy');
    expect(screen.getByText('$30,000 / $40,000 COGS')).toBeInTheDocument();
    expect(screen.getByText(/75% Recovery/i)).toBeInTheDocument();

    // Progress bar styles
    const progressBarBakery = screen.getByTestId('category-progress-Artisan Bakery');
    expect(progressBarBakery).toHaveStyle({ width: '90%' });

    const progressBarDairy = screen.getByTestId('category-progress-Specialty Dairy');
    expect(progressBarDairy).toHaveStyle({ width: '75%' });

    // Hardcoded categories must NOT be present
    expect(screen.queryByText('Dry Goods')).not.toBeInTheDocument();
    expect(screen.queryByText('Frozen Food')).not.toBeInTheDocument();
  });

  it('Chart 3: renders dynamic SVG Donut chart with calculated strokeDasharray and strokeDashoffset', () => {
    const store = createMockStore({
      totalRevenue: 100000,
      revenueGrowthPct: 0,
      totalVolume: 4000,
      avgPrice: 25,
      reconciledCount: 8,
      totalCount: 8,
      categories: ['Beverages'],
      warehouses: ['Chicago DC'],
      trajectory: [],
      categoryRecovery: [],
      channelDistribution: [
        { channel: 'National Wholesale', revenue: 60000, pct: 60 },
        { channel: 'Regional Liquidators', revenue: 30000, pct: 30 },
        { channel: 'Food Rescue Partner', revenue: 10000, pct: 10 },
      ],
    });

    render(
      <Provider store={store}>
        <SalesDataView />
      </Provider>
    );

    // Dynamic legend items
    expect(screen.getByText('National Wholesale')).toBeInTheDocument();
    expect(screen.getByText('60% ($60,000)')).toBeInTheDocument();

    expect(screen.getByText('Regional Liquidators')).toBeInTheDocument();
    expect(screen.getByText('30% ($30,000)')).toBeInTheDocument();

    expect(screen.getByText('Food Rescue Partner')).toBeInTheDocument();
    expect(screen.getByText('10% ($10,000)')).toBeInTheDocument();

    // Center text
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('Revenue Share')).toBeInTheDocument();

    // SVG Circles for segments
    const circles = screen.getAllByTestId('donut-segment');
    expect(circles).toHaveLength(3);

    // Segment 1 (60%): strokeDasharray="60 40", strokeDashoffset="0"
    expect(circles[0]).toHaveAttribute('stroke-dasharray', '60 40');
    expect(circles[0]).toHaveAttribute('stroke-dashoffset', '0');

    // Segment 2 (30%): strokeDasharray="30 70", strokeDashoffset="-60"
    expect(circles[1]).toHaveAttribute('stroke-dasharray', '30 70');
    expect(circles[1]).toHaveAttribute('stroke-dashoffset', '-60');

    // Segment 3 (10%): strokeDasharray="10 90", strokeDashoffset="-90"
    expect(circles[2]).toHaveAttribute('stroke-dasharray', '10 90');
    expect(circles[2]).toHaveAttribute('stroke-dashoffset', '-90');

    // Hardcoded segments must NOT be present
    expect(screen.queryByText('Off-Price Wholesalers')).not.toBeInTheDocument();
    expect(screen.queryByText('Secondary Direct Export')).not.toBeInTheDocument();
  });

  it('Chart 2 & Chart 3: Zero-state handling displays neutral indicators and clean zeroed tracks', () => {
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
    });

    render(
      <Provider store={store}>
        <SalesDataView />
      </Provider>
    );

    // Chart 2 zero-state notice
    expect(screen.getByText(/No category recovery data recorded for this timeframe/i)).toBeInTheDocument();

    // Chart 3 zero-state ring and notice
    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.getByText('Revenue Share')).toBeInTheDocument();
    expect(screen.getByTestId('donut-zero-ring')).toBeInTheDocument();
    expect(screen.getByText(/No channel distribution recorded for this timeframe/i)).toBeInTheDocument();
  });
});
