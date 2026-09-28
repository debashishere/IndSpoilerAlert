import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Radio, MessageSquare, Workflow, Thermometer, ArrowUpRight } from 'lucide-react';
import type { RootState } from '../../../store';
import {
  setActiveTab,
  fetchOperationsAnalyticsThunk,
  selectOperationsAnalytics,
  selectOperationsAnalyticsLoading,
  type OperationsAnalyticsData,
} from '../../../store/slices/coreSlice';
import { CrossServicePipelineVelocityChart } from './CrossServicePipelineVelocityChart';
import { PlatformSlaYieldDistributionChart } from './PlatformSlaYieldDistributionChart';

const defaultOperationsAnalytics: OperationsAnalyticsData = {
  timeframe: '30d',
  velocityTrendline: [],
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
};

export const CrossPlatformOperationsPanel: React.FC = () => {
  const dispatch = useDispatch();
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d' | 'ytd'>('30d');

  const opsAnalytics = useSelector(selectOperationsAnalytics);
  const loading = useSelector(selectOperationsAnalyticsLoading);
  const selectedSupplier = useSelector((state: RootState) => state.ingestion?.selectedSupplier);

  useEffect(() => {
    dispatch(fetchOperationsAnalyticsThunk({ timeframe, supplierId: selectedSupplier }) as any);
  }, [dispatch, timeframe, selectedSupplier]);

  const data: OperationsAnalyticsData = {
    timeframe: opsAnalytics?.timeframe || defaultOperationsAnalytics.timeframe,
    ingestion: {
      ...defaultOperationsAnalytics.ingestion,
      ...(opsAnalytics?.ingestion || {}),
    },
    buyerComms: {
      ...defaultOperationsAnalytics.buyerComms,
      ...(opsAnalytics?.buyerComms || {}),
    },
    workflowCampaigns: {
      ...defaultOperationsAnalytics.workflowCampaigns,
      ...(opsAnalytics?.workflowCampaigns || {}),
    },
    coldChain: {
      tempComplianceSla: opsAnalytics?.coldChain?.tempComplianceSla ?? defaultOperationsAnalytics.coldChain.tempComplianceSla,
      fsma204Status: opsAnalytics?.coldChain?.fsma204Status ?? defaultOperationsAnalytics.coldChain.fsma204Status,
      dockSla: opsAnalytics?.coldChain?.dockSla ?? defaultOperationsAnalytics.coldChain.dockSla,
      logisticsLinkStatus: opsAnalytics?.coldChain?.logisticsLinkStatus ?? defaultOperationsAnalytics.coldChain.logisticsLinkStatus,
    },
    velocityTrendline: opsAnalytics?.velocityTrendline || defaultOperationsAnalytics.velocityTrendline || [],
    distribution: opsAnalytics?.distribution || defaultOperationsAnalytics.distribution,
  };

  const handleNavigate = (tab: 'ingestion' | 'inbox' | 'workflows' | 'logistics') => {
    dispatch(setActiveTab(tab as any));
  };

  return (
    <div id="panel-insight-operations" className="flex flex-col gap-6">
      {/* Telemetry Header & Multi-Timeframe Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Cross-Platform Operational Telemetry
              {loading && <span className="inline-block w-2 h-2 rounded-full bg-blue-500 animate-ping" />}
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Synchronized operational pulse across Ingestion, Communications, Automations, and Cold-Chain
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Timeframe:
          </span>
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-lg border border-slate-200 dark:border-slate-700/60">
            {(['7d', '30d', '90d', 'ytd'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTimeframe(t)}
                className={`px-3 py-1 text-xs font-semibold rounded-md uppercase transition-all cursor-pointer ${
                  timeframe === t
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/80 dark:border-slate-700 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: Ingestion Pipeline Velocity */}
        <div
          onClick={() => handleNavigate('ingestion')}
          className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 hover:border-blue-500/50 dark:hover:border-blue-500/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                <span className="material-symbols-outlined text-[18px]">speed</span>
                <Radio className="w-4 h-4 hidden" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Ingestion Pipeline Velocity
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Aggregate portfolio ingestion & liquidation metrics
                </p>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/60">
            <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg">
              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Portfolio</p>
              <p className="text-base font-bold font-mono text-slate-900 dark:text-slate-100 mt-0.5">{data.ingestion.portfolioValue}</p>
              <p className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">FEFO Managed</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg">
              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Critical RSL Lots</p>
              <p className="text-base font-bold font-mono text-rose-600 dark:text-rose-400 mt-0.5">{data.ingestion.criticalRsl}</p>
              <p className="text-[10px] text-rose-500 font-medium">Immediate Auction</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg">
              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Liquidation Velocity</p>
              <p className="text-base font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-0.5">{data.ingestion.liquidationVelocity}</p>
              <p className="text-[10px] text-indigo-500 font-medium">Realized Clearance</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg">
              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Verified Buyers</p>
              <p className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">{data.ingestion.matchedBuyers}</p>
              <p className="text-[10px] text-emerald-500 font-medium">Institutional Network</p>
            </div>
          </div>
        </div>

        {/* Card 2: Buyer Comms Engagement */}
        <div
          onClick={() => handleNavigate('inbox')}
          className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                <span className="material-symbols-outlined text-[18px]">forum</span>
                <MessageSquare className="w-4 h-4 hidden" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Buyer Comms Engagement
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Outbound dispatch volume & buyer responsiveness
                </p>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 transition-colors" />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/60">
            <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg">
              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Buyers</p>
              <p className="text-base font-bold font-mono text-slate-900 dark:text-slate-100 mt-0.5">{data.buyerComms.activeBuyers} Accounts</p>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Verified Network</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg">
              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Dispatch Volume</p>
              <p className="text-base font-bold font-mono text-slate-900 dark:text-slate-100 mt-0.5">{data.buyerComms.dispatchVolume} Outbound</p>
              <p className="text-[10px] text-slate-500 font-medium">{timeframe.toUpperCase()} Window</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg">
              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Engagement Rate</p>
              <p className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">{data.buyerComms.engagementRate}%</p>
              <p className="text-[10px] text-emerald-500 font-medium">Response Ratio</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg">
              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Response Velocity</p>
              <p className="text-base font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-0.5">
                {data.buyerComms.responseVelocityHours > 0 ? `< ${data.buyerComms.responseVelocityHours} Hours` : '0.0 Hours'}
              </p>
              <p className="text-[10px] text-indigo-500 font-medium">Avg Turnaround</p>
            </div>
          </div>
        </div>

        {/* Card 3: Workflow Campaign Yield */}
        <div
          onClick={() => handleNavigate('workflows')}
          className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 hover:border-violet-500/50 dark:hover:border-violet-500/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400 shrink-0">
                <span className="material-symbols-outlined text-[18px]">account_tree</span>
                <Workflow className="w-4 h-4 hidden" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                  Workflow Campaign Yield
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Automated liquidation campaign performance
                </p>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-violet-500 transition-colors" />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/60">
            <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg">
              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Campaign Status</p>
              <p className="text-base font-bold font-mono text-slate-900 dark:text-slate-100 mt-0.5">{data.workflowCampaigns.activeCampaigns} Active</p>
              <p className="text-[10px] text-slate-500 font-medium">{data.workflowCampaigns.inactiveCampaigns} Draft / Stopped</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg">
              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cases In Scope</p>
              <p className="text-base font-bold font-mono text-slate-900 dark:text-slate-100 mt-0.5">{data.workflowCampaigns.casesInScope.toLocaleString()}</p>
              <p className="text-[10px] text-violet-600 dark:text-violet-400 font-medium">Under Automation</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg">
              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Automation Runs</p>
              <p className="text-base font-bold font-mono text-violet-600 dark:text-violet-400 mt-0.5">{data.workflowCampaigns.automationRuns} Runs</p>
              <p className="text-[10px] text-violet-500 font-medium">Executed</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg">
              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Execution Yield</p>
              <p className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">{data.workflowCampaigns.executionYield}%</p>
              <p className="text-[10px] text-emerald-500 font-medium">Success Rate</p>
            </div>
          </div>
        </div>

        {/* Card 4: Cold Chain & Compliance */}
        <div
          onClick={() => handleNavigate('logistics')}
          className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 hover:border-cyan-500/50 dark:hover:border-cyan-500/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-cyan-50 dark:bg-cyan-900/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shrink-0">
                <span className="material-symbols-outlined text-[18px]">thermostat</span>
                <Thermometer className="w-4 h-4 hidden" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                  Cold Chain & Compliance
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Temperature compliance & FSMA 204 audit tracking
                </p>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-500 transition-colors" />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/60">
            <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg">
              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Temp Compliance</p>
              <p className="text-base font-bold font-mono text-cyan-600 dark:text-cyan-400 mt-0.5">{data.coldChain.tempComplianceSla}</p>
              <p className="text-[10px] text-cyan-500 font-medium">HACCP Target</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg">
              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">FSMA 204 Audit</p>
              <p className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">{data.coldChain.fsma204Status}</p>
              <p className="text-[10px] text-emerald-500 font-medium">Traceability</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg">
              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Dock SLA</p>
              <p className="text-base font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-0.5">{data.coldChain.dockSla}</p>
              <p className="text-[10px] text-indigo-500 font-medium">Turnaround</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg">
              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Logistics Link</p>
              <p className="text-base font-bold font-mono text-slate-900 dark:text-slate-100 mt-0.5">{data.coldChain.logisticsLinkStatus}</p>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Freight Dispatch</p>
            </div>
          </div>
        </div>
      </div>

      {/* Cross-Service Pipeline Velocity & Throughput Trendline Chart */}
      <CrossServicePipelineVelocityChart
        data={data.velocityTrendline}
        loading={loading}
        timeframe={timeframe}
      />

      {/* Platform SLA & Operational Yield Distribution Chart */}
      <PlatformSlaYieldDistributionChart
        distribution={data.distribution}
        loading={loading}
        timeframe={timeframe}
      />
    </div>
  );
};
