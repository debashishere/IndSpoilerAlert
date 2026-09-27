import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import coreReducer from '../store/slices/coreSlice';
import inventoryReducer from '../store/slices/inventorySlice';
import ingestionReducer from '../store/slices/ingestionSlice';
import { InventoryListView } from '../views/InventoryListView';

describe('Centralized Insight Hub — Recovery & Sustainability Panel', () => {
  const mockAnalyticsPayload = {
    summary: {
      cogsRecoveryRate: 72,
      totalRecoveredValue: 45000,
      totalSoldCOGS: 62500,
      totalCOGS: 80000,
      wasteDivertedTons: 22.4,
      landfillFeesSaved: 4480,
      co2SavedTons: 51.2,
      caseStats: {
        total: 4000,
        sold: 2800,
        donated: 700,
        recycled: 300,
        expired: 200,
        leftoverRate: 5,
      },
    },
    trends: [
      { month: 'May', recoveryRate: 65, divertedTons: 15 },
      { month: 'Jun', recoveryRate: 68, divertedTons: 18 },
      { month: 'Jul', recoveryRate: 72, divertedTons: 22.4 },
    ],
    categoryBreakdown: [
      { category: 'Dairy & Eggs', volumeCases: 1500, recoveryRate: 75 },
      { category: 'Produce', volumeCases: 1200, recoveryRate: 68 },
    ],
  };

  let store: ReturnType<typeof createTestStore>;

  function createTestStore(analyticsData?: any) {
    const s = configureStore({
      reducer: {
        core: coreReducer,
        ingestion: ingestionReducer,
        inventory: inventoryReducer,
      },
    });
    // Pre-populate analytics data into the core slice if provided
    if (analyticsData) {
      s.dispatch({ type: 'core/fetchAnalyticsSummary/fulfilled', payload: analyticsData });
    }
    return s;
  }

  beforeEach(() => {
    vi.spyOn(global, 'fetch').mockImplementation(async () =>
      ({ ok: true, status: 200, json: async () => ({}) }) as Response
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should default to the Recovery & Sustainability subtab and show recovery panel content', () => {
    store = createTestStore(mockAnalyticsPayload);

    render(
      <Provider store={store}>
        <InventoryListView />
      </Provider>
    );

    // The "Recovery & Sustainability" pill should be the active/selected tab
    const recoveryTab = screen.getByRole('tab', { name: /recovery/i });
    expect(recoveryTab).toHaveAttribute('aria-selected', 'true');

    // The recovery panel should render analytics content
    expect(screen.getByText('COGS Recovery Rate')).toBeInTheDocument();
  });

  it('should render live analytics metric values from the store in the recovery panel', () => {
    store = createTestStore(mockAnalyticsPayload);

    render(
      <Provider store={store}>
        <InventoryListView />
      </Provider>
    );

    // Known-good values from mockAnalyticsPayload — independent literals, not recomputed
    expect(screen.getAllByText('72%').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('22.4 Tons')).toBeInTheDocument();
    expect(screen.getByText('Product Stock Disposition')).toBeInTheDocument();
    expect(screen.getByText('Dairy & Eggs')).toBeInTheDocument();
  });

  it('should switch from recovery to bidding subtab when clicked', () => {
    store = createTestStore(mockAnalyticsPayload);

    render(
      <Provider store={store}>
        <InventoryListView />
      </Provider>
    );

    // Recovery is default — verify it's active
    expect(screen.getByRole('tab', { name: /recovery/i })).toHaveAttribute('aria-selected', 'true');

    // Click the bidding tab
    fireEvent.click(screen.getByRole('tab', { name: /bidding/i }));

    // Bidding tab should now be selected
    expect(screen.getByRole('tab', { name: /bidding/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /recovery/i })).toHaveAttribute('aria-selected', 'false');

    // Recovery panel content should no longer be visible
    expect(screen.queryByText('COGS Recovery Rate')).not.toBeInTheDocument();
  });

  it('should dispatch fetchAnalyticsSummaryThunk on mount when no analytics data exists', () => {
    // Create store WITHOUT analytics data — thunk should fire
    store = createTestStore();

    render(
      <Provider store={store}>
        <InventoryListView />
      </Provider>
    );

    // fetch should have been called with the analytics/summary endpoint
    const fetchCalls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
    const analyticsFetch = fetchCalls.find(
      (call: any[]) => call[0]?.toString().includes('/analytics/summary')
    );
    expect(analyticsFetch).toBeDefined();
  });
});
