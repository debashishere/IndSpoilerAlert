import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import coreReducer, { fetchAnalyticsSummaryThunk } from '../store/slices/coreSlice';
import inventoryReducer from '../store/slices/inventorySlice';
import ingestionReducer from '../store/slices/ingestionSlice';
import { InventoryListView } from '../views/InventoryListView';

describe('Centralized Insight Hub — Recovery & Sustainability End-to-End Telemetry Integration (Ticket 04)', () => {
  const mockAnalyticsPayload = {
    summary: {
      cogsRecoveryRate: 74.5,
      totalCOGS: 95000,
      totalRecoveredValue: 52000,
      totalSoldCOGS: 69800,
      wasteDivertedTons: 31.8,
      landfillFeesSaved: 6360,
      co2SavedTons: 57.2,
      caseStats: {
        total: 5000,
        sold: 3500,
        donated: 900,
        recycled: 400,
        expired: 200,
        leftoverRate: 4,
      },
    },
    trends: [
      { month: 'Jan', recoveryRate: 58, divertedTons: 12.4 },
      { month: 'Feb', recoveryRate: 62, divertedTons: 16.5 },
      { month: 'Mar', recoveryRate: 68, divertedTons: 22.0 },
      { month: 'Apr', recoveryRate: 71, divertedTons: 25.4 },
      { month: 'May', recoveryRate: 73, divertedTons: 28.6 },
      { month: 'Jun', recoveryRate: 75, divertedTons: 31.8 },
    ],
    categoryBreakdown: [
      { category: 'Dairy & Refrigerated', volume: 2200 },
      { category: 'Fresh Produce', volume: 1600 },
      { category: 'Dry Grocery', volume: 1200 },
    ],
  };

  let store: ReturnType<typeof createTestStore>;

  function createTestStore(initialAnalytics?: any) {
    const s = configureStore({
      reducer: {
        core: coreReducer,
        ingestion: ingestionReducer,
        inventory: inventoryReducer,
      },
    });
    if (initialAnalytics) {
      s.dispatch({ type: 'core/fetchAnalyticsSummary/fulfilled', payload: initialAnalytics });
    }
    return s;
  }

  beforeEach(() => {
    vi.spyOn(global, 'fetch').mockImplementation(async (url: any) => {
      const urlStr = url?.toString() || '';
      if (urlStr.includes('/analytics/summary')) {
        return {
          ok: true,
          status: 200,
          json: async () => mockAnalyticsPayload,
        } as Response;
      }
      return { ok: true, status: 200, json: async () => ({}) } as Response;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('hydrates Redux store from /analytics/summary and displays all 4 recovery metric cards', async () => {
    store = createTestStore();

    render(
      <Provider store={store}>
        <InventoryListView />
      </Provider>
    );

    // Wait for the thunk to resolve and populate the store
    await waitFor(() => {
      expect(screen.getByText('74.5%')).toBeInTheDocument();
    });

    expect(screen.getByText('31.8 Tons')).toBeInTheDocument();
    expect(screen.getByText('$6,360')).toBeInTheDocument();
    expect(screen.getByText('57.2 Tons')).toBeInTheDocument();
  });

  it('renders exact formula disclosures on metric card info button clicks with exclusive dismissal', () => {
    store = createTestStore(mockAnalyticsPayload);

    render(
      <Provider store={store}>
        <InventoryListView />
      </Provider>
    );

    // Click COGS Recovery info button
    const cogsInfo = screen.getByRole('button', { name: /more information about cogs recovery rate/i });
    fireEvent.click(cogsInfo);

    expect(screen.getByTestId('info-overlay')).toBeInTheDocument();
    expect(screen.getByText(/Formula: \(Total Recovered Value ÷ Total Sold COGS\) × 100/i)).toBeInTheDocument();

    // Click Landfill Waste Diverted info button -> Card 1 closes, Card 2 opens
    const wasteInfo = screen.getByRole('button', { name: /more information about landfill waste diverted/i });
    fireEvent.click(wasteInfo);

    expect(screen.getByText(/Landfill Waste Diverted Info/i)).toBeInTheDocument();
    expect(screen.queryByText(/COGS Recovery Rate Info/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Computed from verified food donation transfers/i)).toBeInTheDocument();
  });

  it('renders COGSRecoveryDashboard with 6-month SVG trendlines and data series', () => {
    store = createTestStore(mockAnalyticsPayload);

    render(
      <Provider store={store}>
        <InventoryListView />
      </Provider>
    );

    expect(screen.getByText(/COGS Recovery Rate & Waste Diverted Trends/i)).toBeInTheDocument();
    expect(screen.getByTestId('cogs-recovery-svg')).toBeInTheDocument();
    expect(screen.getByTestId('recovery-rate-series')).toBeInTheDocument();
    expect(screen.getByTestId('waste-diverted-series')).toBeInTheDocument();

    // Verify all 6 months are rendered
    expect(screen.getByText('Jan')).toBeInTheDocument();
    expect(screen.getByText('Jun')).toBeInTheDocument();
  });

  it('renders RSLDistributionChart in a cohesive right rail with stacked disposition and CPG categories', () => {
    store = createTestStore(mockAnalyticsPayload);

    render(
      <Provider store={store}>
        <InventoryListView />
      </Provider>
    );

    const rail = screen.getByTestId('rsl-distribution-rail');
    expect(rail).toBeInTheDocument();

    // Verify Product Stock Disposition
    expect(screen.getByText('Product Stock Disposition')).toBeInTheDocument();
    expect(screen.getByText('Leftovers Rate: 4%')).toBeInTheDocument();
    expect(screen.getByTestId('disposition-stacked-bar')).toBeInTheDocument();
    expect(screen.getByText('3,500 Cases')).toBeInTheDocument(); // Sold
    expect(screen.getByText('900 Cases')).toBeInTheDocument(); // Donated

    // Verify Volume Distribution by CPG Category
    expect(screen.getByText('Volume Distribution by CPG Category')).toBeInTheDocument();
    expect(screen.getByText('3 Categories')).toBeInTheDocument();
    expect(screen.getByText('Dairy & Refrigerated')).toBeInTheDocument();
    expect(screen.getByText('2,200 Cases')).toBeInTheDocument();
    expect(screen.getByText('Fresh Produce')).toBeInTheDocument();
    expect(screen.getByText('1,600 Cases')).toBeInTheDocument();
  });

  it('handles empty trends gracefully with zero-state empty placeholder', () => {
    const emptyPayload = {
      summary: {
        cogsRecoveryRate: 0,
        totalCOGS: 0,
        totalRecoveredValue: 0,
        totalSoldCOGS: 0,
        wasteDivertedTons: 0,
        landfillFeesSaved: 0,
        co2SavedTons: 0,
        caseStats: { total: 0, sold: 0, donated: 0, recycled: 0, expired: 0, leftoverRate: 0 },
      },
      trends: [],
      categoryBreakdown: [],
    };

    store = createTestStore(emptyPayload);

    render(
      <Provider store={store}>
        <InventoryListView />
      </Provider>
    );

    expect(screen.getByText(/no historical recovery trend data available yet/i)).toBeInTheDocument();
    expect(screen.getByText(/no category volume distribution recorded yet/i)).toBeInTheDocument();
  });

  it('allows seamless subtab navigation across all 4 workbench views', () => {
    store = createTestStore(mockAnalyticsPayload);

    render(
      <Provider store={store}>
        <InventoryListView />
      </Provider>
    );

    // Tablist accessibility
    const tablist = screen.getByRole('tablist', { name: /insight hub subtabs/i });
    expect(tablist).toBeInTheDocument();

    // Default: Recovery
    expect(screen.getByRole('tab', { name: /recovery/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('COGS Recovery Rate')).toBeInTheDocument();

    // Switch to Bidding
    fireEvent.click(screen.getByRole('tab', { name: /current bidding data/i }));
    expect(screen.getByRole('tab', { name: /current bidding data/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.queryByText('COGS Recovery Rate')).not.toBeInTheDocument();

    // Switch to Sales
    fireEvent.click(screen.getByRole('tab', { name: /sales & clearing/i }));
    expect(screen.getByRole('tab', { name: /sales & clearing/i })).toHaveAttribute('aria-selected', 'true');

    // Switch to Operations
    fireEvent.click(screen.getByRole('tab', { name: /cross-platform operations/i }));
    expect(screen.getByRole('tab', { name: /cross-platform operations/i })).toHaveAttribute('aria-selected', 'true');

    // Switch back to Recovery
    fireEvent.click(screen.getByRole('tab', { name: /recovery/i }));
    expect(screen.getByRole('tab', { name: /recovery/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('COGS Recovery Rate')).toBeInTheDocument();
  });
});
