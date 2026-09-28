import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import coreReducer from '../store/slices/coreSlice';
import inventoryReducer from '../store/slices/inventorySlice';
import ingestionReducer from '../store/slices/ingestionSlice';
import workflowReducer from '../store/slices/workflowSlice';
import logisticsReducer from '../store/slices/logisticsSlice';
import { InventoryListView } from '../views/InventoryListView';

function createTestStore() {
  return configureStore({
    reducer: {
      core: coreReducer,
      ingestion: ingestionReducer,
      inventory: inventoryReducer,
      workflow: workflowReducer,
      logistics: logisticsReducer,
    },
  });
}

describe('Issue 04: Cross-Platform Operations Regression Suite', () => {
  beforeEach(() => {
    vi.spyOn(global, 'fetch').mockImplementation(async () =>
      ({ ok: true, status: 200, json: async () => ({}) }) as Response
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Seam 1: Insight Hub Sub-Tab Navigation', () => {
    it('seamlessly transitions to Cross-Platform Operations and back to other sub-tabs', () => {
      const store = createTestStore();
      render(
        <Provider store={store}>
          <InventoryListView />
        </Provider>
      );

      // Default sub-tab is recovery
      expect(document.getElementById('panel-insight-recovery')).toBeInTheDocument();
      expect(document.getElementById('panel-insight-operations')).not.toBeInTheDocument();

      // Navigate to Cross-Platform Operations
      const opsTab = screen.getByRole('tab', { name: /cross-platform operations/i });
      fireEvent.click(opsTab);

      // Operational telemetry panel mounted, recovery unmounted
      expect(document.getElementById('panel-insight-operations')).toBeInTheDocument();
      expect(document.getElementById('panel-insight-recovery')).not.toBeInTheDocument();
      expect(screen.getByText('Cross-Platform Operational Telemetry')).toBeInTheDocument();

      // Navigate to Sales & Clearing
      const salesTab = screen.getByRole('tab', { name: /sales & clearing/i });
      fireEvent.click(salesTab);

      expect(document.getElementById('panel-insight-operations')).not.toBeInTheDocument();
      expect(document.getElementById('panel-insight-sales')).toBeInTheDocument();

      // Navigate back to Cross-Platform Operations
      fireEvent.click(opsTab);
      expect(document.getElementById('panel-insight-operations')).toBeInTheDocument();
      expect(document.getElementById('panel-insight-sales')).not.toBeInTheDocument();

      // Navigate to Current Bidding Data
      const biddingTab = screen.getByRole('tab', { name: /current bidding data/i });
      fireEvent.click(biddingTab);
      expect(document.getElementById('panel-insight-operations')).not.toBeInTheDocument();
      expect(document.getElementById('panel-insight-bidding')).toBeInTheDocument();
    });
  });

  describe('Seam 2: Card Click-Through Navigation to Operational Pillars', () => {
    it('dispatches activeTab navigation for all 4 telemetry pillar cards', () => {
      const store = createTestStore();
      render(
        <Provider store={store}>
          <InventoryListView />
        </Provider>
      );

      // Open Cross-Platform Operations
      fireEvent.click(screen.getByRole('tab', { name: /cross-platform operations/i }));

      // 1. Ingestion Pipeline Velocity -> Ingestion
      fireEvent.click(screen.getByText('Ingestion Pipeline Velocity'));
      expect(store.getState().core.activeTab).toBe('ingestion');

      // Reset to insights
      store.dispatch({ type: 'core/setActiveTab', payload: 'insights' });

      // 2. Buyer Comms Engagement -> Inbox
      fireEvent.click(screen.getByText('Buyer Comms Engagement'));
      expect(store.getState().core.activeTab).toBe('inbox');

      // Reset
      store.dispatch({ type: 'core/setActiveTab', payload: 'insights' });

      // 3. Workflow Campaign Yield -> Workflows
      fireEvent.click(screen.getByText('Workflow Campaign Yield'));
      expect(store.getState().core.activeTab).toBe('workflows');

      // Reset
      store.dispatch({ type: 'core/setActiveTab', payload: 'insights' });

      // 4. Cold Chain & Compliance -> Logistics
      fireEvent.click(screen.getByText('Cold Chain & Compliance'));
      expect(store.getState().core.activeTab).toBe('logistics');
    });
  });

  describe('Seam 3: Multi-Timeframe Reactive Re-hydration', () => {
    it('switches across 7D, 30D, 90D, YTD and re-hydrates KPI cards and visual charts', async () => {
      const store = createTestStore();
      const fetchSpy = vi.spyOn(global, 'fetch');

      render(
        <Provider store={store}>
          <InventoryListView />
        </Provider>
      );

      // Open Cross-Platform Operations
      fireEvent.click(screen.getByRole('tab', { name: /cross-platform operations/i }));

      // Default timeframe is 30D
      const btn30d = screen.getByRole('button', { name: '30D' });
      const btn7d = screen.getByRole('button', { name: '7D' });
      const btn90d = screen.getByRole('button', { name: '90D' });
      const btnYtd = screen.getByRole('button', { name: 'YTD' });

      expect(btn30d).toHaveClass('text-blue-600');

      const payload7d = {
        timeframe: '7d',
        ingestion: {
          portfolioValue: '$18,400',
          portfolioValueRaw: 18400,
          criticalRsl: '2 Lots',
          criticalRslCount: 2,
          liquidationVelocity: '45.0%',
          liquidationVelocityRaw: 45,
          matchedBuyers: '5 Verified',
          matchedBuyersCount: 5,
        },
        buyerComms: {
          activeBuyers: 3,
          dispatchVolume: 14,
          engagementRate: 78.5,
          responseVelocityHours: 1.5,
        },
        workflowCampaigns: {
          activeCampaigns: 2,
          inactiveCampaigns: 1,
          casesInScope: 450,
          automationRuns: 6,
          executionYield: 100,
        },
        coldChain: {
          tempComplianceSla: '99.8%',
          fsma204Status: 'FSMA 204 Audited',
          dockSla: '< 15 Min',
          logisticsLinkStatus: 'Active Fleet',
        },
        velocityTrendline: [
          { date: '2026-09-28', label: 'Sep 28', lots: 7, runs: 4, dispatches: 9 },
        ],
        distribution: {
          workflowYield: { yieldPct: 100, successfulRuns: 6, totalRuns: 6 },
          turnaroundDistribution: {
            under2h: { count: 8, pct: 57.1 },
            twoToSixH: { count: 4, pct: 28.6 },
            sixToTwentyFourH: { count: 2, pct: 14.3 },
            over24h: { count: 0, pct: 0 },
            totalEvaluated: 14,
          },
          coldChainCompliance: {
            dockCompliancePct: 98.2,
            tempCompliancePct: 99.8,
            totalShipments: 10,
            totalColdLogs: 30,
          },
        },
      };

      fetchSpy.mockImplementation(async (url: any) => {
        if (typeof url === 'string' && url.includes('timeframe=7d')) {
          return {
            ok: true,
            status: 200,
            json: async () => payload7d,
          } as Response;
        }
        return { ok: true, status: 200, json: async () => ({}) } as Response;
      });

      // Click 7D
      fireEvent.click(btn7d);

      // Verify KPI re-hydration
      await waitFor(() => {
        expect(screen.getByText('$18,400')).toBeInTheDocument();
      });
      expect(screen.getByText('2 Lots')).toBeInTheDocument();
      expect(screen.getByText('14 Outbound')).toBeInTheDocument();
      expect(screen.getByText(/7d window/i)).toBeInTheDocument();
      expect(screen.getByText('< 1.5 Hours')).toBeInTheDocument();
      expect(screen.getByText('450')).toBeInTheDocument();
      expect(screen.getByText('6 Runs')).toBeInTheDocument();

      // Verify Chart 1: Cross-Service Velocity Chart re-hydration
      expect(screen.getByTestId('velocity-point-2026-09-28')).toBeInTheDocument();
      expect(screen.getByTestId('series-ingestion-lots')).toBeInTheDocument();

      // Verify Chart 2: Platform SLA & Yield Distribution re-hydration
      expect(screen.getByTestId('workflow-yield-gauge')).toBeInTheDocument();
      expect(screen.getByText('6 / 6 Runs Resolved')).toBeInTheDocument();
      expect(screen.getByText('98.2%')).toBeInTheDocument();
      expect(screen.getByText('8 (57.1%)')).toBeInTheDocument();

      // Click 90D
      fireEvent.click(btn90d);
      expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining('timeframe=90d'), expect.anything());

      // Click YTD
      fireEvent.click(btnYtd);
      expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining('timeframe=ytd'), expect.anything());
    });
  });

  describe('Seam 4: Authentic Zero-State & Theme Rendering', () => {
    it('renders authentic mathematical zero-state baselines, empty-state guides, and dark/light mode classes', () => {
      const store = createTestStore();
      // Ensure empty zero-state store data
      store.dispatch({
        type: 'core/fetchOperationsAnalytics/fulfilled',
        payload: {
          timeframe: '30d',
          ingestion: {
            portfolioValue: '$0',
            portfolioValueRaw: 0,
            criticalRsl: '0 Lots',
            criticalRslCount: 0,
            liquidationVelocity: '0%',
            liquidationVelocityRaw: 0,
            matchedBuyers: '0 Verified',
            matchedBuyersCount: 0,
          },
          buyerComms: {
            activeBuyers: 0,
            dispatchVolume: 0,
            engagementRate: 0,
            responseVelocityHours: 0,
          },
          workflowCampaigns: {
            activeCampaigns: 0,
            inactiveCampaigns: 0,
            casesInScope: 0,
            automationRuns: 0,
            executionYield: 0,
          },
          coldChain: {
            tempComplianceSla: '0%',
            fsma204Status: 'Unverified',
            dockSla: '0.0 hrs',
            logisticsLinkStatus: 'Disconnected',
          },
          velocityTrendline: [
            { date: '2026-09-27', label: 'Sep 27', lots: 0, runs: 0, dispatches: 0 },
            { date: '2026-09-28', label: 'Sep 28', lots: 0, runs: 0, dispatches: 0 },
          ],
          distribution: {
            workflowYield: { yieldPct: 0, successfulRuns: 0, totalRuns: 0 },
            turnaroundDistribution: {
              under2h: { count: 0, pct: 0 },
              twoToSixH: { count: 0, pct: 0 },
              sixToTwentyFourH: { count: 0, pct: 0 },
              over24h: { count: 0, pct: 0 },
              totalEvaluated: 0,
            },
            coldChainCompliance: {
              dockCompliancePct: 0,
              tempCompliancePct: 0,
              totalShipments: 0,
              totalColdLogs: 0,
            },
          },
        },
      });

      render(
        <Provider store={store}>
          <InventoryListView />
        </Provider>
      );

      // Open Cross-Platform Operations
      fireEvent.click(screen.getByRole('tab', { name: /cross-platform operations/i }));

      // 1. Verify strict absence of all legacy mock literals
      expect(screen.queryByText('18 Outbound')).not.toBeInTheDocument();
      expect(screen.queryByText('94.2%')).not.toBeInTheDocument();
      expect(screen.queryByText('< 2.4 Hours')).not.toBeInTheDocument();
      expect(screen.queryByText('12 Runs')).not.toBeInTheDocument();
      expect(screen.queryByText('98.5%')).not.toBeInTheDocument();

      const panel = document.getElementById('panel-insight-operations');
      expect(panel).toBeInTheDocument();
      const withinOps = within(panel!);

      // 2. Verify authentic mathematical zero-state values across all 4 KPI cards
      expect(withinOps.getByText('$0')).toBeInTheDocument();
      expect(withinOps.getByText('0 Lots')).toBeInTheDocument();
      expect(withinOps.getByText('0 Verified')).toBeInTheDocument();
      expect(withinOps.getByText('0 Accounts')).toBeInTheDocument();
      expect(withinOps.getByText('0 Outbound')).toBeInTheDocument();
      expect(withinOps.getByText('0.0 Hours')).toBeInTheDocument();
      expect(withinOps.getByText('0 Active')).toBeInTheDocument();
      expect(withinOps.getByText('0 Draft / Stopped')).toBeInTheDocument();
      expect(withinOps.getByText('0 Runs')).toBeInTheDocument();
      expect(withinOps.getByText('Unverified')).toBeInTheDocument();
      expect(withinOps.getByText('0.0 hrs')).toBeInTheDocument();
      expect(withinOps.getByText('Disconnected')).toBeInTheDocument();

      // 3. Verify zero-state guidance and baseline axes in visual charts
      expect(withinOps.getByText(/No cross-service operational throughput recorded/i)).toBeInTheDocument();
      expect(withinOps.getByTestId('baseline-zero-axis')).toBeInTheDocument();
      expect(withinOps.getByText(/No operational SLA or yield telemetry recorded/i)).toBeInTheDocument();
      expect(withinOps.getByText('0 / 0 Runs Resolved')).toBeInTheDocument();
      expect(withinOps.getByTestId('sla-empty-guidance')).toBeInTheDocument();

      // 4. Verify Theme styling classes support both light and dark modes
      const themeContainers = panel?.querySelectorAll('.dark\\:bg-slate-900, .bg-white');
      expect(themeContainers && themeContainers.length > 0).toBe(true);
    });
  });

  describe('Seam 5: Static AST & Zero-Mock Integrity Verification', () => {
    it('guarantees zero instances of legacy mock fallbacks in CrossPlatformOperationsPanel.tsx and child charts', async () => {
      const fs = await import('fs');
      const path = await import('path');

      const panelFilePath = path.resolve(__dirname, '../components/domain/insights/CrossPlatformOperationsPanel.tsx');
      const panelContent = fs.readFileSync(panelFilePath, 'utf-8');

      // Prohibited legacy mock fallbacks specified in Issue 04
      const legacyMockPatterns = [
        /\|\|\s*18\b/,
        /94\.2/,
        /<\s*2\.4\s*Hours/i,
        /\|\|\s*12\b/,
        /98\.5%?/,
      ];

      for (const pattern of legacyMockPatterns) {
        expect(panelContent).not.toMatch(pattern);
      }

      // Also verify child chart components do not contain arbitrary mock fixtures
      const velocityChartPath = path.resolve(__dirname, '../components/domain/insights/CrossServicePipelineVelocityChart.tsx');
      const velocityContent = fs.readFileSync(velocityChartPath, 'utf-8');
      expect(velocityContent).not.toMatch(/mock|fixture/i);

      const slaChartPath = path.resolve(__dirname, '../components/domain/insights/PlatformSlaYieldDistributionChart.tsx');
      const slaContent = fs.readFileSync(slaChartPath, 'utf-8');
      expect(slaContent).not.toMatch(/mock|fixture/i);
    });
  });
});
