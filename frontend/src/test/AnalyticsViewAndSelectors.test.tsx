import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import coreReducer, {
  fetchAnalyticsSummaryThunk,
  selectCOGSRecoveryMetrics,
  selectRSLDistribution,
  selectLandfillDiversionStats,
} from '../store/slices/coreSlice';
import inventoryReducer from '../store/slices/inventorySlice';
import AnalyticsView from '../views/AnalyticsView';

describe('AnalyticsView & Memoized Selectors Integration', () => {
  let store: ReturnType<typeof configureStore<{ core: ReturnType<typeof coreReducer>; inventory: ReturnType<typeof inventoryReducer> }>>;

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
        leftoverRate: 5
      }
    },
    trends: [
      { month: 'May', recoveryRate: 65, divertedTons: 15 },
      { month: 'Jun', recoveryRate: 68, divertedTons: 18 },
      { month: 'Jul', recoveryRate: 72, divertedTons: 22.4 }
    ],
    categoryBreakdown: [
      { category: 'Dairy & Eggs', volumeCases: 1500, recoveryRate: 75 },
      { category: 'Produce', volumeCases: 1200, recoveryRate: 68 }
    ]
  };

  beforeEach(() => {
    store = configureStore({
      reducer: {
        core: coreReducer,
        inventory: inventoryReducer,
      },
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch analytics summary, compute memoized selectors without unnecessary re-renders, and render AnalyticsView', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(async (url: any, init?: any) => {
      if (url.toString().endsWith('/analytics/summary')) {
        expect(init?.headers).toEqual(
          expect.objectContaining({
            'Cache-Control': 'no-cache, no-store',
            'Pragma': 'no-cache'
          })
        );
        return {
          ok: true,
          status: 200,
          json: async () => mockAnalyticsPayload
        } as Response;
      }
      return { ok: true, status: 200, json: async () => ({}) } as Response;
    });

    // 1. Dispatch thunk
    await store.dispatch(fetchAnalyticsSummaryThunk() as any);
    const state = store.getState();
    expect(state.core.analyticsSummary).toEqual(mockAnalyticsPayload);
    expect(fetchSpy).toHaveBeenCalled();

    // 2. Test memoized selectors
    const recoveryMetrics1 = selectCOGSRecoveryMetrics(state);
    expect(recoveryMetrics1.cogsRecoveryRate).toBe(72);
    expect(recoveryMetrics1.totalRecoveredValue).toBe(45000);

    const rslDist1 = selectRSLDistribution(state);
    expect(rslDist1.caseStats.total).toBe(4000);
    expect(rslDist1.caseStats.leftoverRate).toBe(5);
    expect(rslDist1.categoryBreakdown).toHaveLength(2);

    const diversionStats1 = selectLandfillDiversionStats(state);
    expect(diversionStats1.trends).toHaveLength(3);
    expect(diversionStats1.maxTons).toBe(30); // max of 22.4 and 30 is 30

    // Check memoization identity when state identity is unchanged
    const recoveryMetrics2 = selectCOGSRecoveryMetrics(store.getState());
    expect(recoveryMetrics1).toBe(recoveryMetrics2);

    // 3. Render AnalyticsView using preloaded store
    render(
      <Provider store={store}>
        <AnalyticsView />
      </Provider>
    );

    expect(screen.getByText('Distressed Inventory Analytics')).toBeInTheDocument();
    expect(screen.getByText('COGS Recovery Rate')).toBeInTheDocument();
    expect(screen.getAllByText('72%')[0]).toBeInTheDocument();
    expect(screen.getByText('22.4 Tons')).toBeInTheDocument();
    expect(screen.getByText('Product Stock Disposition')).toBeInTheDocument();
    expect(screen.getByText('Volume Distribution by CPG Category')).toBeInTheDocument();
    expect(screen.getByText('Dairy & Eggs')).toBeInTheDocument();
  });
});
