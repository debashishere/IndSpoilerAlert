import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
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
    },
  });
}

describe('Seam 3: UI Component Seam (SalesDataView Telemetry Bar)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(coreService, 'fetchSalesAnalytics').mockResolvedValue({
      totalRevenue: 0,
      revenueGrowthPct: 0,
      totalVolume: 0,
      avgPrice: 0,
      reconciledCount: 0,
      totalCount: 0,
      categories: [],
      warehouses: [],
    });
  });

  it('renders live telemetry metrics and positive directional indicator (+X.X%)', () => {
    const store = createMockStore({
      totalRevenue: 48500.5,
      revenueGrowthPct: 18.4,
      totalVolume: 2450,
      avgPrice: 19.8,
      reconciledCount: 38,
      totalCount: 45,
      categories: ['Beverages'],
      warehouses: ['Chicago DC'],
    });

    render(
      <Provider store={store}>
        <SalesDataView />
      </Provider>
    );

    // Should display live values instead of hardcoded 14.2%
    expect(screen.getByText('$48,500.50')).toBeInTheDocument();
    expect(screen.getByText('+18.4%')).toBeInTheDocument();
    expect(screen.queryByText('+14.2%')).not.toBeInTheDocument();

    // Volume
    expect(screen.getByText('2,450')).toBeInTheDocument();

    // Avg Price
    expect(screen.getByText('$19.80')).toBeInTheDocument();

    // Reconciled
    expect(screen.getByText('38')).toBeInTheDocument();
    expect(screen.getByText(/\/ 45/)).toBeInTheDocument();
  });

  it('renders negative velocity badge (-X.X%) with ArrowDownRight when growth is negative', () => {
    const store = createMockStore({
      totalRevenue: 12000,
      revenueGrowthPct: -8.5,
      totalVolume: 600,
      avgPrice: 20.0,
      reconciledCount: 10,
      totalCount: 15,
      categories: [],
      warehouses: [],
    });

    render(
      <Provider store={store}>
        <SalesDataView />
      </Provider>
    );

    expect(screen.getByText('-8.5%')).toBeInTheDocument();
  });

  it('renders clean mathematical zero-state baselines ($0.00, 0 cases, $0.00 / cs, 0 / 0) without NaN or hardcoded badges', () => {
    const store = createMockStore({
      totalRevenue: 0,
      revenueGrowthPct: 0,
      totalVolume: 0,
      avgPrice: 0,
      reconciledCount: 0,
      totalCount: 0,
      categories: [],
      warehouses: [],
    });

    render(
      <Provider store={store}>
        <SalesDataView />
      </Provider>
    );

    // Revenue zero baseline & Avg Price zero baseline
    expect(screen.getAllByText('$0.00').length).toBeGreaterThanOrEqual(2);
    // Neutral velocity badge
    expect(screen.getByText('0.0%')).toBeInTheDocument();
    expect(screen.queryByText('+14.2%')).not.toBeInTheDocument();

    // Zero volume and zero reconciled count
    expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('cases')).toBeInTheDocument();
    expect(screen.getByText(/\/ 0/)).toBeInTheDocument();

    // Verify no NaN strings anywhere
    expect(document.body.textContent).not.toContain('NaN');
  });
});
