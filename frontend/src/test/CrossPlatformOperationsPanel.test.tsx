import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import coreReducer from '../store/slices/coreSlice';
import inventoryReducer from '../store/slices/inventorySlice';
import ingestionReducer from '../store/slices/ingestionSlice';
import workflowReducer from '../store/slices/workflowSlice';
import { InventoryListView } from '../views/InventoryListView';
import { CrossPlatformOperationsPanel } from '../components/domain/insights/CrossPlatformOperationsPanel';

function createTestStore() {
  return configureStore({
    reducer: {
      core: coreReducer,
      ingestion: ingestionReducer,
      inventory: inventoryReducer,
      workflow: workflowReducer,
    },
  });
}

describe('Cross-Platform Operations Panel', () => {
  beforeEach(() => {
    vi.spyOn(global, 'fetch').mockImplementation(async () =>
      ({ ok: true, status: 200, json: async () => ({}) }) as Response
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders a Cross-Platform Operations tab pill in the switcher bar', () => {
    const store = createTestStore();

    render(
      <Provider store={store}>
        <InventoryListView />
      </Provider>
    );

    const operationsTab = screen.getByRole('tab', { name: /cross-platform operations/i });
    expect(operationsTab).toBeInTheDocument();
  });

  it('shows 4 telemetry card titles when the Operations tab is selected', () => {
    const store = createTestStore();

    render(
      <Provider store={store}>
        <InventoryListView />
      </Provider>
    );

    fireEvent.click(screen.getByRole('tab', { name: /cross-platform operations/i }));

    expect(screen.getByText('Ingestion Pipeline Velocity')).toBeInTheDocument();
    expect(screen.getByText('Buyer Comms Engagement')).toBeInTheDocument();
    expect(screen.getByText('Workflow Campaign Yield')).toBeInTheDocument();
    expect(screen.getByText('Cold Chain & Compliance')).toBeInTheDocument();
  });

  it('does not render Coming Soon badge and navigates to logistics on Cold Chain card click', () => {
    const store = createTestStore();

    render(
      <Provider store={store}>
        <InventoryListView />
      </Provider>
    );

    fireEvent.click(screen.getByRole('tab', { name: /cross-platform operations/i }));

    expect(screen.queryByText('Coming Soon')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Cold Chain & Compliance'));
    expect(store.getState().core.activeTab).toBe('logistics');
  });

  it('dispatches active tab change to ingestion when clicking Ingestion Pipeline Velocity card', () => {
    const store = createTestStore();

    render(
      <Provider store={store}>
        <InventoryListView />
      </Provider>
    );

    fireEvent.click(screen.getByRole('tab', { name: /cross-platform operations/i }));
    fireEvent.click(screen.getByText('Ingestion Pipeline Velocity'));

    expect(store.getState().core.activeTab).toBe('ingestion');
  });

  it('dispatches active tab change to inbox when clicking Buyer Comms Engagement card', () => {
    const store = createTestStore();

    render(
      <Provider store={store}>
        <InventoryListView />
      </Provider>
    );

    fireEvent.click(screen.getByRole('tab', { name: /cross-platform operations/i }));
    fireEvent.click(screen.getByText('Buyer Comms Engagement'));

    expect(store.getState().core.activeTab).toBe('inbox');
  });

  it('dispatches active tab change to workflows when clicking Workflow Campaign Yield card', () => {
    const store = createTestStore();

    render(
      <Provider store={store}>
        <InventoryListView />
      </Provider>
    );

    fireEvent.click(screen.getByRole('tab', { name: /cross-platform operations/i }));
    fireEvent.click(screen.getByText('Workflow Campaign Yield'));

    expect(store.getState().core.activeTab).toBe('workflows');
  });

  it('renders institutional multi-timeframe selector with 7D, 30D (default), 90D, YTD', () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <CrossPlatformOperationsPanel />
      </Provider>
    );

    expect(screen.getByRole('button', { name: '7D' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '30D' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '90D' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'YTD' })).toBeInTheDocument();
  });

  it('switches timeframe and triggers data fetching when clicking a different timeframe pill', async () => {
    const store = createTestStore();
    const fetchSpy = vi.spyOn(global, 'fetch');

    render(
      <Provider store={store}>
        <CrossPlatformOperationsPanel />
      </Provider>
    );

    fireEvent.click(screen.getByRole('button', { name: '7D' }));
    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining('timeframe=7d'), expect.anything());
    });
  });

  it('renders clean mathematical zero-state baselines without mock fallbacks', () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <CrossPlatformOperationsPanel />
      </Provider>
    );

    // No mock numbers like || 18, 94.2%, < 2.4 Hours, || 12, 98.5%
    expect(screen.queryByText('18 Outbound')).not.toBeInTheDocument();
    expect(screen.queryByText('94.2%')).not.toBeInTheDocument();
    expect(screen.queryByText('< 2.4 Hours')).not.toBeInTheDocument();
    expect(screen.queryByText('12 Runs')).not.toBeInTheDocument();
    expect(screen.queryByText('98.5%')).not.toBeInTheDocument();

    // Clean mathematical zero states
    expect(screen.getByText('0 Outbound')).toBeInTheDocument();
    expect(screen.getByText('0.0 Hours')).toBeInTheDocument();
    expect(screen.getByText('0 Runs')).toBeInTheDocument();
  });

  it('binds all 4 KPI cards to live operations analytics data from store', () => {
    const store = createTestStore();
    // Dispatch fulfilled action to populate state
    store.dispatch({
      type: 'core/fetchOperationsAnalytics/fulfilled',
      payload: {
        timeframe: '30d',
        ingestion: {
          portfolioValue: '$42,500',
          portfolioValueRaw: 42500,
          criticalRsl: '3 Lots',
          criticalRslCount: 3,
          liquidationVelocity: '62.5%',
          liquidationVelocityRaw: 62.5,
          matchedBuyers: '8 Verified',
          matchedBuyersCount: 8,
        },
        buyerComms: {
          activeBuyers: 5,
          dispatchVolume: 27,
          engagementRate: 85.2,
          responseVelocityHours: 1.8,
        },
        workflowCampaigns: {
          activeCampaigns: 4,
          inactiveCampaigns: 2,
          casesInScope: 1200,
          automationRuns: 9,
          executionYield: 88.9,
        },
        coldChain: {
          tempComplianceSla: '99.5%',
          fsma204Status: 'FSMA 204 Audited',
          dockSla: '< 30 Min',
          logisticsLinkStatus: 'Active Fleet',
        },
      },
    });

    render(
      <Provider store={store}>
        <CrossPlatformOperationsPanel />
      </Provider>
    );

    // Pillar 1: Ingestion
    expect(screen.getByText('$42,500')).toBeInTheDocument();
    expect(screen.getByText('3 Lots')).toBeInTheDocument();
    expect(screen.getByText('62.5%')).toBeInTheDocument();
    expect(screen.getByText('8 Verified')).toBeInTheDocument();

    // Pillar 2: Buyer Comms
    expect(screen.getByText('5 Accounts')).toBeInTheDocument();
    expect(screen.getByText('27 Outbound')).toBeInTheDocument();
    expect(screen.getByText('85.2%')).toBeInTheDocument();
    expect(screen.getByText('< 1.8 Hours')).toBeInTheDocument();

    // Pillar 3: Workflow Campaigns
    expect(screen.getByText('4 Active')).toBeInTheDocument();
    expect(screen.getByText('2 Draft / Stopped')).toBeInTheDocument();
    expect(screen.getByText('1,200')).toBeInTheDocument();
    expect(screen.getByText('9 Runs')).toBeInTheDocument();
    expect(screen.getByText('88.9%')).toBeInTheDocument();

    // Pillar 4: Cold Chain
    expect(screen.getByText('99.5%')).toBeInTheDocument();
    expect(screen.getByText('FSMA 204 Audited')).toBeInTheDocument();
    expect(screen.getByText('< 30 Min')).toBeInTheDocument();
    expect(screen.getByText('Active Fleet')).toBeInTheDocument();
  });

  it('renders CrossServicePipelineVelocityChart with 3 SVG curves beneath KPI cards', () => {
    const store = createTestStore();
    store.dispatch({
      type: 'core/fetchOperationsAnalytics/fulfilled',
      payload: {
        timeframe: '7d',
        ingestion: { portfolioValue: '$0', criticalRsl: '0 Lots', liquidationVelocity: '0%', matchedBuyers: '0 Verified' },
        buyerComms: { activeBuyers: 0, dispatchVolume: 0, engagementRate: 0, responseVelocityHours: 0 },
        workflowCampaigns: { activeCampaigns: 0, inactiveCampaigns: 0, casesInScope: 0, automationRuns: 0, executionYield: 0 },
        coldChain: { tempComplianceSla: '0%', fsma204Status: 'Unverified', dockSla: '0.0 hrs', logisticsLinkStatus: 'Disconnected' },
        velocityTrendline: [
          { date: '2026-09-22', label: 'Sep 22', lots: 1, runs: 0, dispatches: 0 },
          { date: '2026-09-23', label: 'Sep 23', lots: 2, runs: 1, dispatches: 3 },
          { date: '2026-09-24', label: 'Sep 24', lots: 0, runs: 4, dispatches: 2 },
          { date: '2026-09-25', label: 'Sep 25', lots: 5, runs: 2, dispatches: 1 },
          { date: '2026-09-26', label: 'Sep 26', lots: 3, runs: 0, dispatches: 4 },
          { date: '2026-09-27', label: 'Sep 27', lots: 2, runs: 3, dispatches: 2 },
          { date: '2026-09-28', label: 'Sep 28', lots: 4, runs: 5, dispatches: 6 },
        ],
      },
    });

    render(
      <Provider store={store}>
        <CrossPlatformOperationsPanel />
      </Provider>
    );

    // Chart title and container
    expect(screen.getByText(/Cross-Service Pipeline Velocity & Throughput/i)).toBeInTheDocument();
    expect(screen.getByTestId('cross-service-velocity-svg')).toBeInTheDocument();

    // 3 Series curves rendered in SVG
    expect(screen.getByTestId('series-ingestion-lots')).toBeInTheDocument();
    expect(screen.getByTestId('series-workflow-runs')).toBeInTheDocument();
    expect(screen.getByTestId('series-buyer-dispatches')).toBeInTheDocument();
  });

  it('provides interactive legend controls to toggle channel visibility', () => {
    const store = createTestStore();
    store.dispatch({
      type: 'core/fetchOperationsAnalytics/fulfilled',
      payload: {
        timeframe: '7d',
        ingestion: { portfolioValue: '$0', criticalRsl: '0 Lots', liquidationVelocity: '0%', matchedBuyers: '0 Verified' },
        buyerComms: { activeBuyers: 0, dispatchVolume: 0, engagementRate: 0, responseVelocityHours: 0 },
        workflowCampaigns: { activeCampaigns: 0, inactiveCampaigns: 0, casesInScope: 0, automationRuns: 0, executionYield: 0 },
        coldChain: { tempComplianceSla: '0%', fsma204Status: 'Unverified', dockSla: '0.0 hrs', logisticsLinkStatus: 'Disconnected' },
        velocityTrendline: [
          { date: '2026-09-27', label: 'Sep 27', lots: 2, runs: 3, dispatches: 2 },
          { date: '2026-09-28', label: 'Sep 28', lots: 4, runs: 5, dispatches: 6 },
        ],
      },
    });

    render(
      <Provider store={store}>
        <CrossPlatformOperationsPanel />
      </Provider>
    );

    // Legend toggles exist
    const ingestionToggle = screen.getByRole('button', { name: /Ingested Lots/i });
    const runsToggle = screen.getByRole('button', { name: /Workflow Runs/i });
    const dispatchesToggle = screen.getByRole('button', { name: /Buyer Dispatches/i });

    expect(ingestionToggle).toBeInTheDocument();
    expect(runsToggle).toBeInTheDocument();
    expect(dispatchesToggle).toBeInTheDocument();

    // Toggle Ingested Lots off
    fireEvent.click(ingestionToggle);
    expect(screen.queryByTestId('series-ingestion-lots')).not.toBeInTheDocument();

    // Toggle back on
    fireEvent.click(ingestionToggle);
    expect(screen.getByTestId('series-ingestion-lots')).toBeInTheDocument();
  });

  it('renders hover tooltips displaying exact counts when inspecting coordinate points', () => {
    const store = createTestStore();
    store.dispatch({
      type: 'core/fetchOperationsAnalytics/fulfilled',
      payload: {
        timeframe: '7d',
        ingestion: { portfolioValue: '$0', criticalRsl: '0 Lots', liquidationVelocity: '0%', matchedBuyers: '0 Verified' },
        buyerComms: { activeBuyers: 0, dispatchVolume: 0, engagementRate: 0, responseVelocityHours: 0 },
        workflowCampaigns: { activeCampaigns: 0, inactiveCampaigns: 0, casesInScope: 0, automationRuns: 0, executionYield: 0 },
        coldChain: { tempComplianceSla: '0%', fsma204Status: 'Unverified', dockSla: '0.0 hrs', logisticsLinkStatus: 'Disconnected' },
        velocityTrendline: [
          { date: '2026-09-28', label: 'Sep 28', lots: 14, runs: 8, dispatches: 22 },
        ],
      },
    });

    render(
      <Provider store={store}>
        <CrossPlatformOperationsPanel />
      </Provider>
    );

    const pointTarget = screen.getByTestId('velocity-point-2026-09-28');
    fireEvent.mouseEnter(pointTarget);

    // Tooltip should reveal exact metrics
    expect(screen.getByTestId('velocity-chart-tooltip')).toBeInTheDocument();
    expect(screen.getByText('14 Ingested')).toBeInTheDocument();
    expect(screen.getByText('8 Runs')).toBeInTheDocument();
    expect(screen.getByText('22 Dispatches')).toBeInTheDocument();
  });

  it('renders authentic flat-zero baseline axes and guidance when no events exist in active timeframe', () => {
    const store = createTestStore();
    store.dispatch({
      type: 'core/fetchOperationsAnalytics/fulfilled',
      payload: {
        timeframe: '7d',
        ingestion: { portfolioValue: '$0', criticalRsl: '0 Lots', liquidationVelocity: '0%', matchedBuyers: '0 Verified' },
        buyerComms: { activeBuyers: 0, dispatchVolume: 0, engagementRate: 0, responseVelocityHours: 0 },
        workflowCampaigns: { activeCampaigns: 0, inactiveCampaigns: 0, casesInScope: 0, automationRuns: 0, executionYield: 0 },
        coldChain: { tempComplianceSla: '0%', fsma204Status: 'Unverified', dockSla: '0.0 hrs', logisticsLinkStatus: 'Disconnected' },
        velocityTrendline: [
          { date: '2026-09-27', label: 'Sep 27', lots: 0, runs: 0, dispatches: 0 },
          { date: '2026-09-28', label: 'Sep 28', lots: 0, runs: 0, dispatches: 0 },
        ],
      },
    });

    render(
      <Provider store={store}>
        <CrossPlatformOperationsPanel />
      </Provider>
    );

    expect(screen.getByTestId('cross-service-velocity-svg')).toBeInTheDocument();
    expect(screen.getByText(/No cross-service operational throughput recorded/i)).toBeInTheDocument();
    // Zero baseline ticks
    expect(screen.getByTestId('baseline-zero-axis')).toBeInTheDocument();
  });

  it('renders PlatformSlaYieldDistributionChart with circular gauges and turnaround distribution bars', () => {
    const store = createTestStore();
    store.dispatch({
      type: 'core/fetchOperationsAnalytics/fulfilled',
      payload: {
        timeframe: '30d',
        ingestion: { portfolioValue: '$0', criticalRsl: '0 Lots', liquidationVelocity: '0%', matchedBuyers: '0 Verified' },
        buyerComms: { activeBuyers: 0, dispatchVolume: 0, engagementRate: 0, responseVelocityHours: 0 },
        workflowCampaigns: { activeCampaigns: 0, inactiveCampaigns: 0, casesInScope: 0, automationRuns: 0, executionYield: 0 },
        coldChain: { tempComplianceSla: '0%', fsma204Status: 'Unverified', dockSla: '0.0 hrs', logisticsLinkStatus: 'Disconnected' },
        distribution: {
          workflowYield: {
            yieldPct: 88.9,
            successfulRuns: 8,
            totalRuns: 9,
          },
          turnaroundDistribution: {
            under2h: { count: 12, pct: 40 },
            twoToSixH: { count: 9, pct: 30 },
            sixToTwentyFourH: { count: 6, pct: 20 },
            over24h: { count: 3, pct: 10 },
            totalEvaluated: 30,
          },
          coldChainCompliance: {
            dockCompliancePct: 96.5,
            tempCompliancePct: 99.2,
            totalShipments: 15,
            totalColdLogs: 45,
          },
        },
      },
    });

    render(
      <Provider store={store}>
        <CrossPlatformOperationsPanel />
      </Provider>
    );

    // Distribution Card Container & Heading
    expect(screen.getByTestId('platform-sla-yield-distribution-container')).toBeInTheDocument();
    expect(screen.getByText(/Platform SLA & Operational Yield Distribution/i)).toBeInTheDocument();

    // Gauges
    expect(screen.getByTestId('workflow-yield-gauge')).toBeInTheDocument();
    expect(screen.getByText('88.9%')).toBeInTheDocument();
    expect(screen.getByText('8 / 9 Runs Resolved')).toBeInTheDocument();

    expect(screen.getByTestId('dock-compliance-gauge')).toBeInTheDocument();
    expect(screen.getByText('96.5%')).toBeInTheDocument();
    expect(screen.getByText('Dock SLA Target')).toBeInTheDocument();

    // Turnaround Buckets
    expect(screen.getByTestId('turnaround-bucket-under2h')).toBeInTheDocument();
    expect(screen.getByText('< 2h')).toBeInTheDocument();
    expect(screen.getByText('12 (40%)')).toBeInTheDocument();

    expect(screen.getByTestId('turnaround-bucket-twoToSixH')).toBeInTheDocument();
    expect(screen.getByText('2–6h')).toBeInTheDocument();
    expect(screen.getByText('9 (30%)')).toBeInTheDocument();

    expect(screen.getByTestId('turnaround-bucket-sixToTwentyFourH')).toBeInTheDocument();
    expect(screen.getByText('6–24h')).toBeInTheDocument();
    expect(screen.getByText('6 (20%)')).toBeInTheDocument();

    expect(screen.getByTestId('turnaround-bucket-over24h')).toBeInTheDocument();
    expect(screen.getByText('> 24h')).toBeInTheDocument();
    expect(screen.getByText('3 (10%)')).toBeInTheDocument();
  });

  it('renders authentic mathematical zero-state baselines and guidance for SLA and yield distribution when empty', () => {
    const store = createTestStore();
    store.dispatch({
      type: 'core/fetchOperationsAnalytics/fulfilled',
      payload: {
        timeframe: '30d',
        ingestion: { portfolioValue: '$0', criticalRsl: '0 Lots', liquidationVelocity: '0%', matchedBuyers: '0 Verified' },
        buyerComms: { activeBuyers: 0, dispatchVolume: 0, engagementRate: 0, responseVelocityHours: 0 },
        workflowCampaigns: { activeCampaigns: 0, inactiveCampaigns: 0, casesInScope: 0, automationRuns: 0, executionYield: 0 },
        coldChain: { tempComplianceSla: '0%', fsma204Status: 'Unverified', dockSla: '0.0 hrs', logisticsLinkStatus: 'Disconnected' },
        distribution: {
          workflowYield: {
            yieldPct: 0,
            successfulRuns: 0,
            totalRuns: 0,
          },
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
        <CrossPlatformOperationsPanel />
      </Provider>
    );

    expect(screen.getByTestId('platform-sla-yield-distribution-container')).toBeInTheDocument();
    expect(screen.getByTestId('sla-empty-guidance')).toBeInTheDocument();
    expect(screen.getByText(/No operational SLA or yield telemetry recorded/i)).toBeInTheDocument();

    // Check zero baseline indicators
    expect(screen.getByTestId('workflow-yield-gauge')).toBeInTheDocument();
    expect(screen.getByTestId('dock-compliance-gauge')).toBeInTheDocument();
    expect(screen.getByText('0 / 0 Runs Resolved')).toBeInTheDocument();
  });

  it('renders multi-series SVG area fill paths beneath velocity trendline curves', () => {
    const store = createTestStore();
    store.dispatch({
      type: 'core/fetchOperationsAnalytics/fulfilled',
      payload: {
        timeframe: '7d',
        ingestion: { portfolioValue: '$0', criticalRsl: '0 Lots', liquidationVelocity: '0%', matchedBuyers: '0 Verified' },
        buyerComms: { activeBuyers: 0, dispatchVolume: 0, engagementRate: 0, responseVelocityHours: 0 },
        workflowCampaigns: { activeCampaigns: 0, inactiveCampaigns: 0, casesInScope: 0, automationRuns: 0, executionYield: 0 },
        coldChain: { tempComplianceSla: '0%', fsma204Status: 'Unverified', dockSla: '0.0 hrs', logisticsLinkStatus: 'Disconnected' },
        velocityTrendline: [
          { date: '2026-09-27', label: 'Sep 27', lots: 2, runs: 3, dispatches: 2 },
          { date: '2026-09-28', label: 'Sep 28', lots: 4, runs: 5, dispatches: 6 },
        ],
      },
    });

    render(
      <Provider store={store}>
        <CrossPlatformOperationsPanel />
      </Provider>
    );

    // Area fill paths must be rendered beneath each active curve
    expect(screen.getByTestId('series-area-ingestion-lots')).toBeInTheDocument();
    expect(screen.getByTestId('series-area-workflow-runs')).toBeInTheDocument();
    expect(screen.getByTestId('series-area-buyer-dispatches')).toBeInTheDocument();
  });
});


