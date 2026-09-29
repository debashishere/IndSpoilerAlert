import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { DollarSign, Award, Leaf, ShieldAlert, Tag, TrendingUp, Recycle, Activity } from 'lucide-react';
import type { RootState } from '../store';
import { fetchAnalyticsSummaryThunk, selectAnalyticsSummary, selectAnalyticsLoading } from '../store/slices/coreSlice';
import { RiskAssessmentModal } from '../components/domain/inventory/RiskAssessmentModal';
import { ComplianceModal } from '../components/domain/inventory/ComplianceModal';
import { SalesDataView } from '../components/domain/inventory/SalesDataView';
import { BiddingDataView } from '../components/domain/inventory/BiddingDataView';
import SummaryMetrics from '../components/analytics/SummaryMetrics';
import COGSRecoveryDashboard from '../components/analytics/COGSRecoveryDashboard';
import RSLDistributionChart from '../components/analytics/RSLDistributionChart';
import { InsightCard } from '../components/InsightCard';
import { useIngestionTelemetry } from '../components/domain/ingestion/hooks/useIngestionTelemetry';
import { Wallet } from 'lucide-react';
import { CrossPlatformOperationsPanel } from '../components/domain/insights/CrossPlatformOperationsPanel';

export const InventoryListView: React.FC<{ onOpenLotHub?: (lot: any) => void }> = ({ onOpenLotHub }) => {
  const dispatch = useDispatch();
  const { inventoryList, analyticsData, allBids } = useSelector((state: RootState) => state.inventory);
  const salesRecords = useSelector((state: RootState) => state.ingestion?.salesRecords || []);
  const analyticsSummary = useSelector(selectAnalyticsSummary);
  const analyticsLoading = useSelector(selectAnalyticsLoading);
  const { metrics } = useIngestionTelemetry();
  const [inventorySubTab, setInventorySubTab] = useState<'recovery' | 'bidding' | 'sales' | 'operations'>('recovery');

  useEffect(() => {
    if (!analyticsSummary && !analyticsLoading) {
      dispatch(fetchAnalyticsSummaryThunk() as any);
    }
  }, [dispatch, analyticsSummary, analyticsLoading]);

  const [activeInfoCardId, setActiveInfoCardId] = useState<string | null>(null);

  const handleToggleCard = (cardId: string) => {
    setActiveInfoCardId((prev) => (prev === cardId ? null : cardId));
  };

  const summary = analyticsSummary?.summary || analyticsSummary || analyticsData?.summary || analyticsData;

  const totalInventoryValue =
    summary?.totalCOGS ||
    inventoryList.reduce((sum: number, lot: any) => sum + lot.quantityCases * (lot.costPerCase ?? 0), 0);

  const revenueSecured = summary?.totalRecoveredValue || 0;

  const landfillDiversionRate =
    summary?.caseStats?.total > 0
      ? Math.round(
          (((summary?.caseStats?.sold || 0) +
            (summary?.caseStats?.donated || 0) +
            (summary?.caseStats?.recycled || 0)) /
            summary.caseStats.total) *
            100
        )
      : 0;

  const bidsCount = (allBids || []).length;
  const salesCount = (salesRecords || []).length || 48;

  return (
    <div
      className="w-full px-4 sm:px-6 py-4 bg-slate-50 dark:bg-slate-950 min-h-screen font-sans text-slate-900 dark:text-slate-100"
      id="insight-view"
    >
      {/* 1. Master Header */}
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
          Surplus Inventory &amp; Closeout Insight Hub
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Review real-time buyer bidding data, distressed surplus metrics, COGS expiration risk trajectories, and sales performance charts. Raw data lists are centralized under Ingestion Pipeline.
        </p>
      </header>

      {/* 2. Operational Telemetry Grid (Two-Tier Layout: 4 Valuation Cards + 3 Operational Flow Cards) */}
      <div className="space-y-3.5 mb-6" id="insight-telemetry-grid">
        {/* Row 1: Valuation & Financial Performance (4 Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5" data-testid="telemetry-tier-1">
          <InsightCard
            title="Active Portfolio Value"
            value={metrics.portfolioValue}
            subtext={metrics.portfolioSubtext}
            subtextClass="text-blue-600 dark:text-blue-400"
            tooltipText="The total potential sales value of the inventory currently available to sell. Calculated by multiplying availableQty by standardSellPrice."
            isExpanded={activeInfoCardId === 'portfolioValue'}
            onToggle={() => handleToggleCard('portfolioValue')}
          />

          <InsightCard
            title="Total Inventory Value"
            value={`$${totalInventoryValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            subtext="Distressed COGS ingested"
            subtextClass="text-blue-600 dark:text-blue-400"
            tooltipText="The total original cost of goods sold (COGS) for all items in the inventory."
            isExpanded={activeInfoCardId === 'inventoryValue'}
            onToggle={() => handleToggleCard('inventoryValue')}
          />

          <InsightCard
            title="Revenue Secured"
            value={`$${revenueSecured.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            subtext="From closed closeout sales"
            valueClass="text-emerald-600 dark:text-emerald-400"
            subtextClass="text-emerald-600 dark:text-emerald-400"
            tooltipText="Total revenue secured from closed closeout sales and successful bids."
            isExpanded={activeInfoCardId === 'revenueSecured'}
            onToggle={() => handleToggleCard('revenueSecured')}
          />

          <InsightCard
            title="Landfill Diversion Rate"
            value={`${landfillDiversionRate}%`}
            subtext="Sold, Donated, or Recycled"
            tooltipText="Percentage of inventory successfully diverted from landfills via sales, donations, or recycling."
            isExpanded={activeInfoCardId === 'diversionRate'}
            onToggle={() => handleToggleCard('diversionRate')}
          />
        </div>

        {/* Row 2: Operational Flow & Buyer Liquidity (3 Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5" data-testid="telemetry-tier-2">
          <InsightCard
            title="Critical RSL (<14 Days)"
            value={metrics.criticalRsl}
            subtext={metrics.criticalRslSubtext}
            valueClass="text-rose-600 dark:text-rose-400"
            subtextClass="text-rose-600 dark:text-rose-400"
            tooltipText="Number of inventory lots with less than 14 days of remaining shelf life requiring immediate action."
            isExpanded={activeInfoCardId === 'criticalRsl'}
            onToggle={() => handleToggleCard('criticalRsl')}
          />

          <InsightCard
            title="Liquidation Velocity"
            value={metrics.liquidationVelocity}
            subtext={metrics.liquidationVelocitySubtext}
            subtextClass="text-sky-600 dark:text-sky-400"
            tooltipText="The rate at which inventory is being liquidated, calculated as sold units divided by total units."
            isExpanded={activeInfoCardId === 'liquidationVelocity'}
            onToggle={() => handleToggleCard('liquidationVelocity')}
          />

          <InsightCard
            title="Matched Buyer Network"
            value={metrics.matchedBuyers}
            subtext={metrics.matchedBuyersSubtext}
            tooltipText="Number of verified buyers currently active in the network matching your inventory profile."
            isExpanded={activeInfoCardId === 'matchedBuyers'}
            onToggle={() => handleToggleCard('matchedBuyers')}
          />
        </div>
      </div>

      {/* 3. Master Subtab Switcher Bar (Matching Ingestion PipelineSwitcherBar) */}
      <div
        className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-2 mb-6 border border-slate-200 dark:border-slate-800"
        id="insight-switcher-bar"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div
            className="flex items-center gap-1.5 bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-lg border border-slate-200/60 dark:border-slate-700/60 overflow-x-auto"
            role="tablist"
            aria-label="Insight Hub Subtabs"
          >
            {/* 1. Recovery & Sustainability */}
            <button
              type="button"
              id="tab-insight-recovery"
              onClick={() => setInventorySubTab('recovery')}
              className={`px-3.5 py-1.5 rounded-md text-[12px] flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                inventorySubTab === 'recovery'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/60 dark:hover:bg-slate-700/60 font-medium'
              }`}
              aria-selected={inventorySubTab === 'recovery'}
              role="tab"
            >
              <span className="material-symbols-outlined text-[18px]">eco</span>
              <Recycle className="w-4 h-4 hidden" aria-hidden="true" />
              <span>Recovery &amp; Sustainability</span>
            </button>

            {/* 2. Current Bidding Data */}
            <button
              type="button"
              id="tab-insight-bidding"
              onClick={() => setInventorySubTab('bidding')}
              className={`px-3.5 py-1.5 rounded-md text-[12px] flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                inventorySubTab === 'bidding'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/60 dark:hover:bg-slate-700/60 font-medium'
              }`}
              aria-selected={inventorySubTab === 'bidding'}
              role="tab"
            >
              <span className="material-symbols-outlined text-[18px]">sell</span>
              <Tag className="w-4 h-4 hidden" aria-hidden="true" />
              <span>Current Bidding Data</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold transition-colors ${
                  inventorySubTab === 'bidding'
                    ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                    : 'bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {bidsCount}
              </span>
            </button>

            {/* 3. Sales & Clearing */}
            <button
              type="button"
              id="tab-insight-sales"
              onClick={() => setInventorySubTab('sales')}
              className={`px-3.5 py-1.5 rounded-md text-[12px] flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                inventorySubTab === 'sales'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/60 dark:hover:bg-slate-700/60 font-medium'
              }`}
              aria-selected={inventorySubTab === 'sales'}
              role="tab"
            >
              <span className="material-symbols-outlined text-[18px]">query_stats</span>
              <TrendingUp className="w-4 h-4 hidden" aria-hidden="true" />
              <span>Sales &amp; Clearing</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold transition-colors ${
                  inventorySubTab === 'sales'
                    ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                    : 'bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {salesCount}
              </span>
            </button>

            {/* 4. Cross-Platform Operations */}
            <button
              type="button"
              id="tab-insight-operations"
              onClick={() => setInventorySubTab('operations')}
              className={`px-3.5 py-1.5 rounded-md text-[12px] flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                inventorySubTab === 'operations'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/60 dark:hover:bg-slate-700/60 font-medium'
              }`}
              aria-selected={inventorySubTab === 'operations'}
              role="tab"
            >
              <span className="material-symbols-outlined text-[18px]">hub</span>
              <Activity className="w-4 h-4 hidden" aria-hidden="true" />
              <span>Cross-Platform Operations</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Active Workbench Views */}
      <div className="w-full transition-opacity duration-150">
        {inventorySubTab === 'recovery' && (
          <div id="panel-insight-recovery">
            <div className="flex flex-col gap-6">
              {/* Recovery & Sustainability Metric Cards */}
              <SummaryMetrics />

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-5 items-stretch">
                <COGSRecoveryDashboard />
                <RSLDistributionChart />
              </div>
            </div>
          </div>
        )}

        {inventorySubTab === 'bidding' && (
          <div id="panel-insight-bidding">
            <BiddingDataView onOpenLotHub={onOpenLotHub} />
          </div>
        )}

        {inventorySubTab === 'sales' && (
          <div id="panel-insight-sales">
            <SalesDataView onOpenLotHub={onOpenLotHub} />
          </div>
        )}

        {inventorySubTab === 'operations' && (
          <CrossPlatformOperationsPanel />
        )}
      </div>

      {/* Domain Modals */}
      <RiskAssessmentModal />
      <ComplianceModal />
    </div>
  );
};

export default InventoryListView;
