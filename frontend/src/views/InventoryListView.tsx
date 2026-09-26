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

  const calculateDaysRemaining = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const criticalExpirations = inventoryList.filter((lot: any) => {
    if (lot.status === 'sold' || lot.status === 'donated' || lot.status === 'recycled') return false;
    const days = calculateDaysRemaining(lot.expirationDate);
    return days < 10;
  }).length;

  const totalInventoryValue =
    analyticsData?.summary?.totalCOGS ||
    inventoryList.reduce((sum: number, lot: any) => sum + lot.quantityCases * (lot.costPerCase ?? 0), 0);

  const revenueSecured = analyticsData?.summary?.totalRecoveredValue || 0;

  const landfillDiversionRate =
    analyticsData?.summary?.caseStats?.total > 0
      ? Math.round(
          (((analyticsData?.summary?.caseStats?.sold || 0) +
            (analyticsData?.summary?.caseStats?.donated || 0) +
            (analyticsData?.summary?.caseStats?.recycled || 0)) /
            analyticsData.summary.caseStats.total) *
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

      {/* 2. Operational Telemetry Bar (5 KPI Cards matching Ingestion standard) */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5 mb-6" id="insight-telemetry-bar">
        {/* Card 1: Active Portfolio Value */}
        <InsightCard
          title="Active Portfolio Value"
          value={metrics.portfolioValue}
          subtext={metrics.portfolioSubtext}
          icon={
            <>
              <span className="material-symbols-outlined text-[20px] flex items-center justify-center">account_balance_wallet</span>
              <Wallet className="w-5 h-5 hidden" aria-hidden="true" />
            </>
          }
          iconBgClass="bg-blue-50 dark:bg-blue-900/30"
          iconTextClass="text-blue-600 dark:text-blue-400"
          subtextClass="text-blue-600 dark:text-blue-400"
          tooltipText="The total potential sales value of the inventory currently available to sell. Calculated by multiplying availableQty by standardSellPrice."
        />

        {/* Card 2: Total Inventory Value */}
        <InsightCard
          title="Total Inventory Value"
          value={`$${totalInventoryValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          subtext="Distressed COGS ingested"
          icon={
            <>
              <span className="material-symbols-outlined text-[20px] flex items-center justify-center">account_balance_wallet</span>
              <DollarSign className="w-5 h-5 hidden" aria-hidden="true" />
            </>
          }
          iconBgClass="bg-blue-50 dark:bg-blue-900/30"
          iconTextClass="text-blue-600 dark:text-blue-400"
          subtextClass="text-blue-600 dark:text-blue-400"
          tooltipText="The total original cost of goods sold (COGS) for all items in the inventory."
        />

        {/* Card 3: Revenue Secured */}
        <InsightCard
          title="Revenue Secured"
          value={`$${revenueSecured.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          subtext="From closed closeout sales"
          valueClass="text-emerald-600 dark:text-emerald-400"
          icon={
            <>
              <span className="material-symbols-outlined text-[20px] flex items-center justify-center">military_tech</span>
              <Award className="w-5 h-5 hidden" aria-hidden="true" />
            </>
          }
          iconBgClass="bg-emerald-50 dark:bg-emerald-900/30"
          iconTextClass="text-emerald-600 dark:text-emerald-400"
          subtextClass="text-emerald-600 dark:text-emerald-400"
          tooltipText="Total revenue secured from closed closeout sales and successful bids."
        />

        {/* Card 4: Landfill Diversion Rate */}
        <InsightCard
          title="Landfill Diversion Rate"
          value={`${landfillDiversionRate}%`}
          subtext="Sold, Donated, or Recycled"
          icon={
            <>
              <span className="material-symbols-outlined text-[20px] flex items-center justify-center">eco</span>
              <Leaf className="w-5 h-5 hidden" aria-hidden="true" />
            </>
          }
          iconBgClass="bg-teal-50 dark:bg-teal-900/30"
          iconTextClass="text-teal-600 dark:text-teal-400"
          tooltipText="Percentage of inventory successfully diverted from landfills via sales, donations, or recycling."
        />

        {/* Card 5: Critical Expirations */}
        <InsightCard
          title="Critical Expirations"
          value={criticalExpirations}
          subtext="Lots expiring in < 10 days"
          valueClass={criticalExpirations > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-slate-100'}
          subtextClass={criticalExpirations > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'}
          icon={
            <>
              <span className="material-symbols-outlined text-[20px] flex items-center justify-center">warning</span>
              <ShieldAlert className="w-5 h-5 hidden" aria-hidden="true" />
            </>
          }
          iconBgClass={criticalExpirations > 0 ? 'bg-rose-50 dark:bg-rose-900/30' : 'bg-slate-100 dark:bg-slate-800'}
          iconTextClass={criticalExpirations > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'}
          tooltipText="Number of inventory lots that are within 10 days of expiration or have critically low remaining shelf life (RSL)."
        />
      </div>

      {/* 3. Master Subtab Switcher Bar (Matching Ingestion PipelineSwitcherBar) */}
      <div
        className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-2 mb-6 border border-slate-200 dark:border-slate-800"
        id="insight-switcher-bar"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-lg border border-slate-200/60 dark:border-slate-700/60 overflow-x-auto">
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
            <SalesDataView />
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
