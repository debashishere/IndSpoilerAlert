import { describe, it, expect, vi, beforeEach } from 'vitest';
import { store } from '../store';
import {
  fetchSalesAnalyticsThunk,
  selectSalesAnalytics,
  selectSalesAnalyticsLoading,
} from '../store/slices/coreSlice';
import coreService from '../services/coreService';

describe('Seam 2: Redux Store Seam (coreSlice Sales Analytics)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes coreSlice with default salesAnalytics null and salesAnalyticsLoading false', () => {
    const state = store.getState();
    expect(selectSalesAnalytics(state)).toBeNull();
    expect(selectSalesAnalyticsLoading(state)).toBe(false);
  });

  it('updates state cleanly when fetchSalesAnalyticsThunk succeeds', async () => {
    const mockPayload = {
      totalRevenue: 24500.5,
      revenueGrowthPct: 14.2,
      totalVolume: 1200,
      avgPrice: 20.42,
      reconciledCount: 42,
      totalCount: 50,
      categories: ['Beverages', 'Dry Goods'],
      warehouses: ['Chicago DC', 'Dallas DC'],
      trajectory: [
        { period: 'Week 1', revenue: 5000, volume: 200 },
        { period: 'Week 2', revenue: 6000, volume: 250 },
        { period: 'Week 3', revenue: 4000, volume: 180 },
        { period: 'Week 4', revenue: 5500, volume: 300 },
        { period: 'Week 5', revenue: 4000.5, volume: 270 },
      ],
      recentCloseouts: [
        {
          id: 'closeout-1',
          sku: 'SKU-001',
          product: 'Organic Milk',
          rslDays: 45,
          price: 18.5,
          recoveryPct: 85,
          buyer: 'Bargain Hunt',
          saleDate: new Date().toISOString(),
        },
      ],
    };

    vi.spyOn(coreService, 'fetchSalesAnalytics').mockResolvedValueOnce(mockPayload);

    const dispatchPromise = store.dispatch(
      fetchSalesAnalyticsThunk({
        timeframe: '30d',
        category: 'Beverages',
        warehouse: 'Chicago DC',
        supplierId: 'test-sup-id',
      })
    );

    // Should indicate loading
    expect(selectSalesAnalyticsLoading(store.getState())).toBe(true);

    await dispatchPromise;

    const finalState = store.getState();
    expect(selectSalesAnalyticsLoading(finalState)).toBe(false);
    expect(selectSalesAnalytics(finalState)).toEqual(mockPayload);
    expect(selectSalesAnalytics(finalState)?.trajectory).toHaveLength(5);
    expect(selectSalesAnalytics(finalState)?.trajectory[0].period).toBe('Week 1');
    expect(selectSalesAnalytics(finalState)?.recentCloseouts).toHaveLength(1);
    expect(selectSalesAnalytics(finalState)?.recentCloseouts?.[0].sku).toBe('SKU-001');
  });

  it('handles errors when fetchSalesAnalyticsThunk fails', async () => {
    vi.spyOn(coreService, 'fetchSalesAnalytics').mockRejectedValueOnce(
      new Error('Network error')
    );

    await store.dispatch(
      fetchSalesAnalyticsThunk({ timeframe: '7d' })
    );

    const finalState = store.getState();
    expect(selectSalesAnalyticsLoading(finalState)).toBe(false);
    expect(finalState.core.error).toBe('Network error');
  });
});
