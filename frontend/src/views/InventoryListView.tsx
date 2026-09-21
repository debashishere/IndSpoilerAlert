import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { DollarSign, Award, Leaf, ShieldAlert, Tag, BarChart3, TrendingUp } from 'lucide-react';
import type { RootState } from '../store';
import { RiskAssessmentModal } from '../components/domain/inventory/RiskAssessmentModal';
import { ComplianceModal } from '../components/domain/inventory/ComplianceModal';
import { SalesDataView } from '../components/domain/inventory/SalesDataView';
import { BiddingDataView } from '../components/domain/inventory/BiddingDataView';
import { InventoryChartsDashboard } from '../components/domain/inventory/InventoryChartsDashboard';

export const InventoryListView: React.FC<{ onOpenLotHub?: (lot: any) => void }> = ({ onOpenLotHub }) => {
  const { inventoryList, analyticsData, allBids } = useSelector((state: RootState) => state.inventory);
  const salesRecords = useSelector((state: RootState) => state.ingestion?.salesRecords || []);
  const [inventorySubTab, setInventorySubTab] = useState<'bidding' | 'charts' | 'sales'>('bidding');

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
  const chartsCount = inventoryList.length;
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

      {/* 2. Operational Telemetry Bar (4 KPI Cards matching Ingestion standard) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5 mb-6" id="insight-telemetry-bar">
        {/* Card 1: Total Inventory Value */}
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Inventory Value
            </p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-[20px] font-bold font-mono text-slate-900 dark:text-slate-100 leading-none">
                ${totalInventoryValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
              <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                Distressed COGS ingested
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <span className="material-symbols-outlined text-[20px] flex items-center justify-center">
              account_balance_wallet
            </span>
            <DollarSign className="w-5 h-5 hidden" aria-hidden="true" />
          </div>
        </div>

        {/* Card 2: Revenue Secured */}
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Revenue Secured
            </p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-[20px] font-bold font-mono text-emerald-600 dark:text-emerald-400 leading-none">
                ${revenueSecured.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                From closed closeout sales
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <span className="material-symbols-outlined text-[20px] flex items-center justify-center">
              military_tech
            </span>
            <Award className="w-5 h-5 hidden" aria-hidden="true" />
          </div>
        </div>

        {/* Card 3: Landfill Diversion Rate */}
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Landfill Diversion Rate
            </p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-[20px] font-bold font-mono text-slate-900 dark:text-slate-100 leading-none">
                {landfillDiversionRate}%
              </span>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Sold, Donated, or Recycled
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0">
            <span className="material-symbols-outlined text-[20px] flex items-center justify-center">
              eco
            </span>
            <Leaf className="w-5 h-5 hidden" aria-hidden="true" />
          </div>
        </div>

        {/* Card 4: Critical Expirations */}
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Critical Expirations
            </p>
            <div className="flex items-baseline gap-1 mt-1">
              <span
                className={`text-[20px] font-bold font-mono leading-none ${
                  criticalExpirations > 0
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-slate-900 dark:text-slate-100'
                }`}
              >
                {criticalExpirations}
              </span>
              <span
                className={`text-[11px] font-semibold ${
                  criticalExpirations > 0
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                Lots expiring in &lt; 10 days
              </span>
            </div>
          </div>
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
              criticalExpirations > 0
                ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
            }`}
          >
            <span className="material-symbols-outlined text-[20px] flex items-center justify-center">
              warning
            </span>
            <ShieldAlert className="w-5 h-5 hidden" aria-hidden="true" />
          </div>
        </div>
      </div>

      {/* 3. Master Subtab Switcher Bar (Matching Ingestion PipelineSwitcherBar) */}
      <div
        className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-2 mb-6 border border-slate-200 dark:border-slate-800"
        id="insight-switcher-bar"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-lg border border-slate-200/60 dark:border-slate-700/60 overflow-x-auto">
            {/* 1. Bidding Data */}
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

            {/* 2. Inventory Insights & Analytics */}
            <button
              type="button"
              id="tab-insight-charts"
              onClick={() => setInventorySubTab('charts')}
              className={`px-3.5 py-1.5 rounded-md text-[12px] flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                inventorySubTab === 'charts'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/60 dark:hover:bg-slate-700/60 font-medium'
              }`}
              aria-selected={inventorySubTab === 'charts'}
              role="tab"
            >
              <span className="material-symbols-outlined text-[18px]">bar_chart</span>
              <BarChart3 className="w-4 h-4 hidden" aria-hidden="true" />
              <span>Inventory Insights &amp; Analytics</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold transition-colors ${
                  inventorySubTab === 'charts'
                    ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                    : 'bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {chartsCount}
              </span>
            </button>

            {/* 3. Sales Insights & Revenue Charts */}
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
              <span>Sales Insights &amp; Revenue Charts</span>
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
          </div>
        </div>
      </div>

      {/* 4. Active Workbench Views */}
      <div className="w-full transition-opacity duration-150">
        {inventorySubTab === 'bidding' && (
          <div id="panel-insight-bidding">
            <BiddingDataView onOpenLotHub={onOpenLotHub} />
          </div>
        )}

        {inventorySubTab === 'charts' && (
          <div id="panel-insight-charts">
            <InventoryChartsDashboard />
          </div>
        )}

        {inventorySubTab === 'sales' && (
          <div id="panel-insight-sales">
            <SalesDataView />
          </div>
        )}
      </div>

      {/* Domain Modals */}
      <RiskAssessmentModal />
      <ComplianceModal />
    </div>
  );
};

export default InventoryListView;
