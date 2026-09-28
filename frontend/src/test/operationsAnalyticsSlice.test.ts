import { describe, it, expect, vi, beforeEach } from 'vitest';
import { store } from '../store';
import {
  fetchOperationsAnalyticsThunk,
  selectOperationsAnalytics,
  selectOperationsAnalyticsLoading,
  type OperationsAnalyticsData,
} from '../store/slices/coreSlice';
import coreService from '../services/coreService';

describe('Seam 2: Redux Store Seam (coreSlice Operations Analytics)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes coreSlice with default operationsAnalytics null and operationsAnalyticsLoading false', () => {
    const state = store.getState();
    expect(selectOperationsAnalytics(state)).toBeNull();
    expect(selectOperationsAnalyticsLoading(state)).toBe(false);
  });

  it('updates state cleanly when fetchOperationsAnalyticsThunk succeeds', async () => {
    const mockPayload: OperationsAnalyticsData = {
      timeframe: '30d',
      ingestion: {
        portfolioValue: '$9,500',
        portfolioValueRaw: 9500,
        criticalRsl: '1 Lot',
        criticalRslCount: 1,
        liquidationVelocity: '50.0%',
        liquidationVelocityRaw: 50.0,
        matchedBuyers: '1 Verified',
        matchedBuyersCount: 1,
      },
      buyerComms: {
        activeBuyers: 1,
        dispatchVolume: 2,
        engagementRate: 50,
        responseVelocityHours: 2.0,
      },
      workflowCampaigns: {
        activeCampaigns: 1,
        inactiveCampaigns: 1,
        casesInScope: 500,
        automationRuns: 2,
        executionYield: 50,
      },
      coldChain: {
        tempComplianceSla: '100.0%',
        fsma204Status: 'Verified',
        dockSla: '< 45 Min',
        logisticsLinkStatus: 'Active',
      },
      velocityTrendline: [
        { date: '2026-09-28', label: 'Sep 28', lots: 3, runs: 2, dispatches: 2 },
      ],
      distribution: {
        workflowYield: {
          yieldPct: 50,
          successfulRuns: 1,
          totalRuns: 2,
        },
        turnaroundDistribution: {
          under2h: { count: 0, pct: 0 },
          twoToSixH: { count: 1, pct: 100 },
          sixToTwentyFourH: { count: 0, pct: 0 },
          over24h: { count: 0, pct: 0 },
          totalEvaluated: 1,
        },
        coldChainCompliance: {
          dockCompliancePct: 100,
          tempCompliancePct: 100,
          totalShipments: 1,
          totalColdLogs: 2,
        },
      },
    };

    vi.spyOn(coreService, 'fetchOperationsAnalytics').mockResolvedValueOnce(mockPayload);

    const dispatchPromise = store.dispatch(
      fetchOperationsAnalyticsThunk({
        timeframe: '30d',
        supplierId: 'test-sup-id',
      })
    );

    // Should indicate loading
    expect(selectOperationsAnalyticsLoading(store.getState())).toBe(true);

    await dispatchPromise;

    const finalState = store.getState();
    expect(selectOperationsAnalyticsLoading(finalState)).toBe(false);
    expect(selectOperationsAnalytics(finalState)).toEqual(mockPayload);
    expect(selectOperationsAnalytics(finalState)?.ingestion.portfolioValue).toBe('$9,500');
    expect(selectOperationsAnalytics(finalState)?.buyerComms.dispatchVolume).toBe(2);
    expect(selectOperationsAnalytics(finalState)?.workflowCampaigns.executionYield).toBe(50);
    expect(selectOperationsAnalytics(finalState)?.coldChain.fsma204Status).toBe('Verified');
    expect(selectOperationsAnalytics(finalState)?.velocityTrendline).toHaveLength(1);
    expect(selectOperationsAnalytics(finalState)?.velocityTrendline?.[0].lots).toBe(3);
    expect(selectOperationsAnalytics(finalState)?.distribution?.workflowYield.yieldPct).toBe(50);
    expect(selectOperationsAnalytics(finalState)?.distribution?.turnaroundDistribution.twoToSixH.count).toBe(1);
    expect(selectOperationsAnalytics(finalState)?.distribution?.coldChainCompliance.dockCompliancePct).toBe(100);
  });

  it('handles errors when fetchOperationsAnalyticsThunk fails', async () => {
    vi.spyOn(coreService, 'fetchOperationsAnalytics').mockRejectedValueOnce(
      new Error('Operations fetch error')
    );

    await store.dispatch(
      fetchOperationsAnalyticsThunk({ timeframe: '7d' })
    );

    const finalState = store.getState();
    expect(selectOperationsAnalyticsLoading(finalState)).toBe(false);
    expect(finalState.core.error).toBe('Operations fetch error');
  });
});
