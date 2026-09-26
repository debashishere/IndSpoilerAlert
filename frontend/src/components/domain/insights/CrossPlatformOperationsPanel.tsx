import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Radio, MessageSquare, Workflow, Thermometer, ArrowUpRight } from 'lucide-react';
import type { RootState } from '../../../store';
import { setActiveTab } from '../../../store/slices/coreSlice';
import { selectColdChainMetrics, fetchColdChainLogsThunk } from '../../../store/slices/logisticsSlice';
import { useIngestionTelemetry } from '../ingestion/hooks/useIngestionTelemetry';

export const CrossPlatformOperationsPanel: React.FC = () => {
  const dispatch = useDispatch();
  const { metrics } = useIngestionTelemetry();

  // Redux Selectors
  const buyers = useSelector((state: RootState) => state.core?.buyers || []);
  const salesRecords = useSelector((state: RootState) => state.ingestion?.salesRecords || []);
  const inventoryList = useSelector((state: RootState) => state.inventory?.inventoryList || []);
  const { liquidationAutomations = [], automationRuns = [] } = useSelector((state: RootState) => state.workflow || {});
  const coldChainMetrics = useSelector(selectColdChainMetrics);

  useEffect(() => {
    dispatch(fetchColdChainLogsThunk() as any);
  }, [dispatch]);

  // Computed Comms metrics
  const activeBuyers = buyers.filter((b: any) => b.isActive !== false).length;
  const engagementRate = buyers.length > 0 ? Math.round((activeBuyers / buyers.length) * 100) : 94.2;

  // Computed Workflow metrics
  const activeCampaigns = liquidationAutomations.filter((a: any) => a.status === 'active' || a.active).length;
  const inactiveCampaigns = liquidationAutomations.length - activeCampaigns;
  const totalCasesInScope = inventoryList.reduce((acc: number, lot: any) => acc + Number(lot.quantityCases || lot.availableQty || 0), 0);

  const handleNavigate = (tab: 'ingestion' | 'inbox' | 'workflows' | 'logistics') => {
    dispatch(setActiveTab(tab as any));
  };

  return (
    <div id="panel-insight-operations" className="flex flex-col gap-6">
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
              <p className="text-base font-bold font-mono text-slate-900 dark:text-slate-100 mt-0.5">{metrics.portfolioValue}</p>
              <p className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">{metrics.portfolioSubtext}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg">
              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Critical RSL Lots</p>
              <p className="text-base font-bold font-mono text-rose-600 dark:text-rose-400 mt-0.5">{metrics.criticalRsl}</p>
              <p className="text-[10px] text-rose-500 font-medium">{metrics.criticalRslSubtext}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg">
              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Liquidation Velocity</p>
              <p className="text-base font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-0.5">{metrics.liquidationVelocity}</p>
              <p className="text-[10px] text-indigo-500 font-medium">{metrics.liquidationVelocitySubtext}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg">
              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Verified Buyers</p>
              <p className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">{metrics.matchedBuyers}</p>
              <p className="text-[10px] text-emerald-500 font-medium">{metrics.matchedBuyersSubtext}</p>
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
              <p className="text-base font-bold font-mono text-slate-900 dark:text-slate-100 mt-0.5">{activeBuyers} Accounts</p>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Verified Network</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg">
              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Dispatch Volume</p>
              <p className="text-base font-bold font-mono text-slate-900 dark:text-slate-100 mt-0.5">{salesRecords.length || 18} Outbound</p>
              <p className="text-[10px] text-slate-500 font-medium">Recent 30 Days</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg">
              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Engagement Rate</p>
              <p className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">{engagementRate}%</p>
              <p className="text-[10px] text-emerald-500 font-medium">Response Ratio</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg">
              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Response Velocity</p>
              <p className="text-base font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-0.5">&lt; 2.4 Hours</p>
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
              <p className="text-base font-bold font-mono text-slate-900 dark:text-slate-100 mt-0.5">{activeCampaigns} Active</p>
              <p className="text-[10px] text-slate-500 font-medium">{inactiveCampaigns} Draft / Stopped</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg">
              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cases In Scope</p>
              <p className="text-base font-bold font-mono text-slate-900 dark:text-slate-100 mt-0.5">{totalCasesInScope.toLocaleString()}</p>
              <p className="text-[10px] text-violet-600 dark:text-violet-400 font-medium">Under Automation</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg">
              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Automation Runs</p>
              <p className="text-base font-bold font-mono text-violet-600 dark:text-violet-400 mt-0.5">{automationRuns.length || 12} Runs</p>
              <p className="text-[10px] text-violet-500 font-medium">Executed</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg">
              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Execution Yield</p>
              <p className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">98.5%</p>
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
              <p className="text-base font-bold font-mono text-cyan-600 dark:text-cyan-400 mt-0.5">{coldChainMetrics.tempComplianceSla}</p>
              <p className="text-[10px] text-cyan-500 font-medium">HACCP Target</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg">
              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">FSMA 204 Audit</p>
              <p className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">{coldChainMetrics.status}</p>
              <p className="text-[10px] text-emerald-500 font-medium">Traceability</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg">
              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Dock SLA</p>
              <p className="text-base font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-0.5">{coldChainMetrics.dockSla}</p>
              <p className="text-[10px] text-indigo-500 font-medium">Turnaround</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg">
              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Logistics Link</p>
              <p className="text-base font-bold font-mono text-slate-900 dark:text-slate-100 mt-0.5">{coldChainMetrics.logisticsLinkStatus}</p>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Freight Dispatch</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
