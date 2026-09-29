import { describe, it, expect, vi, beforeEach } from 'vitest';
import { store } from '../store';
import {
  fetchSalesAnalyticsThunk,
  selectSalesAnalytics,
  selectSalesAnalyticsLoading,
  type SalesTransactionPoint,
  type SalesBuyerSummary,
  type SalesWarehouseSummary,
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

  it('updates state cleanly when fetchSalesAnalyticsThunk returns topBuyers and topWarehouses with transactions', async () => {
    const mockTransaction: SalesTransactionPoint = {
      id: 'tx-101',
      saleDate: '2026-09-20T10:00:00Z',
      lotId: 'lot-123',
      lotNumber: 'LOT-2026-09-123',
      invoiceNumber: 'INV-9001',
      sku: 'SKU-DAIRY-01',
      product: 'Organic Whole Milk 1gal',
      brand: 'Organic Valley',
      buyer: 'Bargain Hunt Liquidation',
      buyerSegment: 'Regional Off-Price Retailer',
      warehouse: 'Unilever Midwest DC (Chicago, IL)',
      quantityCases: 150,
      pricePerCase: 14.5,
      totalValue: 2175,
      revenue: 2175,
      cogs: 1800,
      recoveryPct: 82.5,
      status: 'delivered',
    };

    const mockBuyer: SalesBuyerSummary = {
      rank: 1,
      buyerId: 'buyer-01',
      buyerName: 'Bargain Hunt Liquidation',
      segment: 'Regional Off-Price Retailer',
      totalSpent: 45000,
      totalVolume: 3200,
      revenueSharePct: 24.5,
      transactionCount: 1,
      transactions: [mockTransaction],
    };

    const mockWarehouse: SalesWarehouseSummary = {
      rank: 1,
      warehouse: 'Unilever Midwest DC (Chicago, IL)',
      clearedRevenue: 65000,
      casesCleared: 4500,
      recoveryPct: 78.4,
      transactionCount: 1,
      transactions: [mockTransaction],
    };

    const mockPayload = {
      totalRevenue: 100000,
      revenueGrowthPct: 10.0,
      totalVolume: 5000,
      avgPrice: 20.0,
      reconciledCount: 50,
      totalCount: 50,
      categories: ['Dairy'],
      warehouses: ['Unilever Midwest DC (Chicago, IL)'],
      trajectory: [],
      topBuyers: [mockBuyer],
      topWarehouses: [mockWarehouse],
    };

    vi.spyOn(coreService, 'fetchSalesAnalytics').mockResolvedValueOnce(mockPayload);

    await store.dispatch(
      fetchSalesAnalyticsThunk({
        timeframe: '30d',
      })
    );

    const state = store.getState();
    const analytics = selectSalesAnalytics(state);
    expect(analytics?.topBuyers).toHaveLength(1);
    expect(analytics?.topBuyers?.[0].buyerName).toBe('Bargain Hunt Liquidation');
    expect(analytics?.topBuyers?.[0].transactions).toHaveLength(1);
    expect(analytics?.topBuyers?.[0].transactions[0].lotNumber).toBe('LOT-2026-09-123');

    expect(analytics?.topWarehouses).toHaveLength(1);
    expect(analytics?.topWarehouses?.[0].warehouse).toBe('Unilever Midwest DC (Chicago, IL)');
    expect(analytics?.topWarehouses?.[0].transactions).toHaveLength(1);
    expect(analytics?.topWarehouses?.[0].transactions[0].recoveryPct).toBe(82.5);
  });
});

