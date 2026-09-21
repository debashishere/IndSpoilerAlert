import React, { useState, useMemo } from 'react';
import {
  History,
  Search,
  ChevronDown,
  ChevronRight,
  Zap,
  Clock,
  Package,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Timer,
  Play,
  RotateCcw,
  Sparkles,
  RefreshCw,
  XCircle,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { WorkflowRunAuditModal } from './WorkflowRunAuditModal';
import { useAppSelector } from '../store/hooks';
import { selectBuyerLists } from '../store/slices/coreSlice';

interface WorkflowRunHistoryViewProps {
  supplierId: string;
  liquidationAutomations: any[];
  automationRuns: any[];
  inventoryList?: any[];
  allBids?: any[];
  allBuyers?: any[];
  buyerLists?: any[];
  loading?: boolean;
  onForceExpireRun?: (runId: string) => void;
  onEditCampaign?: (campaignId: string) => void;
  onSelectLot?: (lot: any) => void;
  onReTriggerRun?: (run: any) => void;
}

export const WorkflowRunHistoryView: React.FC<WorkflowRunHistoryViewProps> = ({
  supplierId,
  liquidationAutomations = [],
  automationRuns = [],
  inventoryList = [],
  allBids = [],
  allBuyers = [],
  buyerLists = [],
  loading = false,
  onForceExpireRun,
  onEditCampaign,
  onSelectLot,
  onReTriggerRun
}) => {
  let reduxBuyerLists: any[] = [];
  try {
    reduxBuyerLists = useAppSelector(selectBuyerLists) || [];
  } catch (e) {
    reduxBuyerLists = [];
  }
  const effectiveBuyerLists = (buyerLists && buyerLists.length > 0) ? buyerLists : reduxBuyerLists;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'evaluating' | 'awarded' | 'fallback_executed' | 'failed'>('all');
  const [collapsedWorkflows, setCollapsedWorkflows] = useState<Record<string, boolean>>({});
  const [selectedRunForAudit, setSelectedRunForAudit] = useState<any | null>(null);

  // Active in-flight evaluations
  const activeRuns = useMemo(() => {
    return automationRuns.filter(r => r.status === 'evaluating' || r.status === 'dispatched');
  }, [automationRuns]);

  // Group runs by Workflow Strategy for history section (excluding active evaluations)
  const groupedWorkflows = useMemo(() => {
    const activeWorkflowIds = new Set<string>();
    activeRuns.forEach(run => {
      const autoId = String(run.automationId?._id || run.automationId || '');
      if (autoId) {
        activeWorkflowIds.add(autoId);
      } else {
        const fallbackKey = `unlinked-${run.campaignSnapshot?.name || 'Standalone'}`;
        activeWorkflowIds.add(fallbackKey);
      }
    });

    const filteredRuns = automationRuns.filter(run => {
      if (run.status === 'evaluating' || run.status === 'dispatched') return false;

      const autoId = String(run.automationId?._id || run.automationId || '');
      const fallbackKey = autoId || `unlinked-${run.campaignSnapshot?.name || 'Standalone'}`;
      if (activeWorkflowIds.has(autoId) || activeWorkflowIds.has(fallbackKey)) return false;

      if (selectedStatusFilter !== 'all') {
        if (selectedStatusFilter === 'evaluating') return false;
        if (selectedStatusFilter === 'awarded' && run.status !== 'awarded') return false;
        if (selectedStatusFilter === 'fallback_executed' && run.status !== 'fallback_executed') return false;
        if (selectedStatusFilter === 'failed' && run.status !== 'failed' && run.status !== 'error') return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const linkedWorkflow = liquidationAutomations.find(a => String(a._id) === autoId);
        const autoName = linkedWorkflow?.name || linkedWorkflow?.templateName || run.campaignSnapshot?.name || '';
        const runId = String(run._id || '').toLowerCase();
        const status = String(run.status || '').toLowerCase();
        const matchesQuery = autoName.toLowerCase().includes(query) || runId.includes(query) || status.includes(query);
        if (!matchesQuery) return false;
      }

      return true;
    });

    const map = new Map<string, { workflow: any; runs: any[] }>();

    // First populate from existing saved workflows (excluding active workflows)
    liquidationAutomations.forEach(auto => {
      const autoId = String(auto._id);
      if (!activeWorkflowIds.has(autoId)) {
        map.set(autoId, { workflow: auto, runs: [] });
      }
    });

    // Bucket runs into groups
    filteredRuns.forEach(run => {
      const autoId = String(run.automationId?._id || run.automationId || '');
      if (activeWorkflowIds.has(autoId)) return;

      if (map.has(autoId)) {
        map.get(autoId)!.runs.push(run);
      } else {
        const fallbackKey = autoId || `unlinked-${run.campaignSnapshot?.name || 'Standalone'}`;
        if (activeWorkflowIds.has(fallbackKey)) return;

        if (!map.has(fallbackKey)) {
          map.set(fallbackKey, {
            workflow: run.campaignSnapshot || { _id: fallbackKey, name: run.campaignSnapshot?.name || 'Ad-Hoc Workflow' },
            runs: []
          });
        }
        map.get(fallbackKey)!.runs.push(run);
      }
    });

    // Sort runs chronologically within each group (newest first)
    map.forEach(group => {
      group.runs.sort((a, b) => new Date(b.dispatchedAt || b.createdAt).getTime() - new Date(a.dispatchedAt || a.createdAt).getTime());
    });

    return Array.from(map.entries()).filter(([_, group]) => {
      if (selectedStatusFilter === 'all' && !searchQuery.trim()) return true;
      return group.runs.length > 0;
    });
  }, [liquidationAutomations, automationRuns, selectedStatusFilter, searchQuery, activeRuns]);

  const toggleWorkflowCollapse = (wfId: string) => {
    setCollapsedWorkflows(prev => ({
      ...prev,
      [wfId]: !prev[wfId]
    }));
  };


  const handleCollapseAll = () => {
    const newMap: Record<string, boolean> = {};
    groupedWorkflows.forEach(([key]) => {
      newMap[key] = true;
    });
    setCollapsedWorkflows(newMap);
  };

  // Helper to render uniform execution run rows across active banner and history groups
  const renderExecutionRunRow = (run: any, isInsideActiveBanner: boolean = false) => {
    const isActive = run.status === 'evaluating' || run.status === 'dispatched';

    // Calculate run specific recovery
    let runDollarValue = run.resolution?.totalValue || 0;
    if (!runDollarValue && run.resolution?.winningPrice && run.resolution?.totalCases) {
      runDollarValue = run.resolution.winningPrice * run.resolution.totalCases;
    }

    const runBids = allBids.filter((b: any) =>
      run.snapshotInventoryIds?.some((lotId: string) => {
        const bidLotId = b.inventoryLotId?._id || b.inventoryLotId;
        return bidLotId === lotId;
      })
    );

    const linkedAuto = liquidationAutomations.find(a => String(a._id) === String(run.automationId?._id || run.automationId));
    const autoName = linkedAuto?.name || run.campaignSnapshot?.name || 'Automated Strategy Run';

    // Status Badge Configuration with elevated contrast
    const statusStyles: Record<string, { bg: string; text: string; border: string; dot: string }> = {
      awarded: {
        bg: 'bg-emerald-100 dark:bg-emerald-950/60',
        text: 'text-emerald-900 dark:text-emerald-200',
        border: 'border-emerald-300 dark:border-emerald-700',
        dot: 'bg-emerald-600 dark:bg-emerald-400'
      },
      fallback_executed: {
        bg: 'bg-amber-100 dark:bg-amber-950/60',
        text: 'text-amber-900 dark:text-amber-200',
        border: 'border-amber-300 dark:border-amber-700',
        dot: 'bg-amber-600 dark:bg-amber-400'
      },
      failed: {
        bg: 'bg-rose-100 dark:bg-rose-950/60',
        text: 'text-rose-900 dark:text-rose-200',
        border: 'border-rose-300 dark:border-rose-700',
        dot: 'bg-rose-600 dark:bg-rose-400'
      },
      evaluating: {
        bg: 'bg-amber-100 dark:bg-amber-950/60',
        text: 'text-amber-900 dark:text-amber-200',
        border: 'border-amber-300 dark:border-amber-700',
        dot: 'bg-amber-600 dark:bg-amber-400'
      },
      dispatched: {
        bg: 'bg-amber-100 dark:bg-amber-950/60',
        text: 'text-amber-900 dark:text-amber-200',
        border: 'border-amber-300 dark:border-amber-700',
        dot: 'bg-amber-600 dark:bg-amber-400'
      }
    };

    const currentStatusStyle = statusStyles[run.status] || {
      bg: 'bg-slate-100 dark:bg-slate-800',
      text: 'text-slate-800 dark:text-slate-200',
      border: 'border-slate-300 dark:border-slate-700',
      dot: 'bg-slate-500'
    };

    return (
      <div
        key={run._id}
        data-testid="execution-run-row"
        onClick={() => setSelectedRunForAudit(run)}
        className={`group p-4 rounded-xl border-2 transition-all duration-150 cursor-pointer flex items-center justify-between flex-wrap gap-4 ${
          isActive
            ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-400 dark:border-amber-700 hover:border-amber-500 hover:bg-amber-100/50 shadow-md hover:shadow-lg'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-primary dark:hover:border-primary hover:bg-slate-50 dark:hover:bg-slate-800/80 shadow-sm hover:shadow-md'
        }`}
      >
        {/* Left Section: Status Icon, Run ID, Status Badge, Mode */}
        <div className="flex items-center gap-3 sm:gap-3.5">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold transition-transform duration-150 group-hover:scale-105 ${
              isActive
                ? 'bg-amber-100/70 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                : run.status === 'awarded'
                ? 'bg-emerald-100/70 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
          >
            {isActive ? (
              <Timer className="w-4 h-4 text-amber-600 animate-spin-slow" />
            ) : run.status === 'awarded' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <FileText className="w-4 h-4 text-slate-500" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono font-bold text-sm text-primary tracking-tight">
                #{String(run._id).slice(-8).toUpperCase()}
              </span>

              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide border ${currentStatusStyle.bg} ${currentStatusStyle.text} ${currentStatusStyle.border}`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${currentStatusStyle.dot} ${
                    isActive ? 'animate-ping' : ''
                  }`}
                />
                {run.status?.replace(/_/g, ' ')}
              </span>

              {isInsideActiveBanner && (
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {autoName}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>Dispatched: {new Date(run.dispatchedAt || run.createdAt).toLocaleString()}</span>
              <span>•</span>
              <span>
                Mode: <strong className="capitalize font-semibold text-slate-700 dark:text-slate-300">{run.runType || 'scheduled'}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Right Section: Lots Count, Bids Count, Recovery $, Actions */}
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap ml-auto">
          <div className="text-right text-xs">
            <span className="text-slate-500 dark:text-slate-400">Target Lots: </span>
            <strong className="font-mono font-semibold text-slate-900 dark:text-slate-100">
              {run.snapshotInventoryIds?.length || 0} Lots
            </strong>
          </div>

          <div className="text-right text-xs">
            <span className="text-slate-500 dark:text-slate-400">Bids: </span>
            <strong className="font-mono font-semibold text-slate-900 dark:text-slate-100">
              {runBids.length}
            </strong>
          </div>

          {runDollarValue > 0 && (
            <div className="text-right font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
              ${runDollarValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          )}

          {isActive && onForceExpireRun && (
            <button
              type="button"
              className="h-8 px-3 rounded-lg text-xs font-semibold bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 transition-all active:scale-[0.98] shadow-2xs"
              onClick={(e) => {
                e.stopPropagation();
                onForceExpireRun(run._id);
              }}
            >
              Force Expire
            </button>
          )}

          <button
            type="button"
            className="h-8 px-3 rounded-lg text-xs font-semibold bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 flex items-center gap-1.5 transition-all active:scale-[0.98] shadow-2xs"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedRunForAudit(run);
            }}
          >
            <span>Full-Screen Audit Log</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-primary transition-colors" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div data-testid="workflow-run-history-view" className="flex flex-col gap-6">
      {/* ══ TOP COMMAND BAR: SEARCH, STATS & FILTER CONTROLS ════════════════ */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-xs flex items-center justify-between flex-wrap gap-4">
        {/* Left Cluster: Master Title, Total Executions Pill, and Search Box */}
        <div className="flex items-center gap-3.5 flex-wrap flex-1 min-w-[280px]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight m-0">
                  Run History & Audit Log
                </h3>
                <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {automationRuns.length} Total Executions
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 m-0 mt-0.5">
                Complete chronological execution ledger with strategy snapshots & bidding telemetry.
              </p>
            </div>
          </div>

          {/* Institutional Search Bar: h-10, soft hairline border, diffuse halo */}
          <div className="relative min-w-[240px] flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search workflows, run IDs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-9 rounded-lg bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                aria-label="Clear search"
              >
                <XCircle className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Right Cluster: Segmented Status Filter Pills & Top-Right Collapse All Button */}
        <div className="flex items-center gap-3 flex-wrap ml-auto">
          {/* Segmented Status Filter Pills */}
          <div className="inline-flex rounded-lg border border-slate-300 dark:border-slate-700 p-0.5 bg-slate-100 dark:bg-slate-800/80 shadow-xs">
            {(['all', 'evaluating', 'awarded', 'fallback_executed', 'failed'] as const).map(filterKey => {
              const filterLabels: Record<string, string> = {
                all: 'All',
                evaluating: 'Evaluating',
                awarded: 'Awarded',
                fallback_executed: 'Fallback',
                failed: 'Failed'
              };
              const isSelected = selectedStatusFilter === filterKey;
              return (
                <button
                  key={filterKey}
                  type="button"
                  data-testid={`filter-${filterKey}`}
                  className={`h-7 px-3 rounded-md text-xs font-semibold transition-all active:scale-[0.98] ${
                    isSelected
                      ? 'bg-white dark:bg-slate-700 text-primary dark:text-primary-glow font-bold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/50'
                  }`}
                  onClick={() => setSelectedStatusFilter(filterKey)}
                >
                  {filterLabels[filterKey]}
                </button>
              );
            })}
          </div>

          {/* Dedicated Collapse All button placed to top right after the "Failed" sort filter */}
          <button
            type="button"
            className="h-8 px-3 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 transition-all active:scale-[0.98] shadow-xs hover:shadow-sm"
            onClick={handleCollapseAll}
          >
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Collapse All</span>
          </button>
        </div>
      </div>

      {/* ══ LOADING SKELETON STATE (WHEN NO RUNS CACHED YET) ═══════════════ */}
      {loading && automationRuns.length === 0 && (
        <div className="flex flex-col gap-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="h-5 w-48 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="h-4 w-16 bg-slate-100 dark:bg-slate-800 rounded-full" />
                </div>
                <div className="flex gap-4">
                  <div className="h-8 w-24 bg-slate-100 dark:bg-slate-800 rounded" />
                  <div className="h-8 w-20 bg-slate-100 dark:bg-slate-800 rounded" />
                </div>
              </div>
              <div className="space-y-2.5 pt-2">
                <div className="h-14 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-100 dark:border-slate-800" />
                <div className="h-14 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-100 dark:border-slate-800" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ══ ACTIVE EVALUATIONS HIGHLIGHT BANNER (LIVE TELEMETRY) ════════════ */}
      {(!loading || automationRuns.length > 0) && activeRuns.length > 0 && selectedStatusFilter !== 'awarded' && selectedStatusFilter !== 'fallback_executed' && selectedStatusFilter !== 'failed' && (
        <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-300/80 dark:border-amber-800/80 rounded-xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3.5 flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-600" />
                <h4 className="m-0 text-sm font-bold text-slate-900 dark:text-slate-100">
                  Active Workflow Evaluations In-Progress ({activeRuns.length})
                </h4>
              </div>
            </div>
            <span className="text-xs font-medium text-amber-700/80 dark:text-amber-400 bg-amber-100/60 dark:bg-amber-900/40 px-2.5 py-0.5 rounded-full border border-amber-200/60 dark:border-amber-800">
              Live Bidding & Stage Escalations
            </span>
          </div>

          <div className="flex flex-col gap-2.5">
            {activeRuns.map(run => renderExecutionRunRow(run, true))}
          </div>
        </div>
      )}

      {/* ══ WORKFLOW-GROUPED STRATEGY CARDS OR EMPTY STATE ═════════════════ */}
      {(!loading || automationRuns.length > 0) && groupedWorkflows.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-10 sm:p-12 text-center shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-4 border border-slate-200 dark:border-slate-700">
            <History className="w-7 h-7" />
          </div>
          <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 m-0">
            No workflow execution logs found
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-2 leading-relaxed">
            {searchQuery || selectedStatusFilter !== 'all'
              ? 'Try resetting your filter or search terms.'
              : 'Trigger a workflow run from the Campaign Builder or wait for scheduled dispatch.'}
          </p>
          {(searchQuery || selectedStatusFilter !== 'all') && (
            <div className="mt-4">
              <button
                type="button"
                className="h-8 px-3 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-primary/90 transition-all active:scale-[0.98] shadow-2xs inline-flex items-center gap-1.5"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedStatusFilter('all');
                }}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            </div>
          )}
        </div>
      ) : (!loading || automationRuns.length > 0) && (
        <div className="flex flex-col gap-4">
          {groupedWorkflows.map(([groupKey, { workflow, runs }]) => {
            const isCollapsed = collapsedWorkflows[groupKey] || false;
            const completedRuns = runs.filter(r => r.status !== 'evaluating' && r.status !== 'dispatched');
            const awardedRuns = runs.filter(r => r.status === 'awarded');
            const awardRate = completedRuns.length > 0 ? Math.round((awardedRuns.length / completedRuns.length) * 100) : 0;

            const cumulativeRecovery = runs.reduce((acc, r) => {
              if (r.resolution?.totalValue) return acc + r.resolution.totalValue;
              if (r.resolution?.winningPrice && r.resolution?.totalCases) {
                return acc + (r.resolution.winningPrice * r.resolution.totalCases);
              }
              return acc;
            }, 0);

            const lastRun = runs[0];

            return (
              <div
                key={groupKey}
                data-testid="workflow-strategy-card"
                className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-md hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-700 transition-all"
              >
                {/* Workflow Strategy Group Header Accordion */}
                <div
                  onClick={() => toggleWorkflowCollapse(groupKey)}
                  className={`px-5 py-4 bg-slate-100/90 dark:bg-slate-800/80 flex items-center justify-between cursor-pointer select-none hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors ${
                    isCollapsed ? '' : 'border-b-2 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 p-1 flex items-center justify-center transition-transform duration-200"
                      aria-label={isCollapsed ? 'Expand workflow' : 'Collapse workflow'}
                    >
                      {isCollapsed ? (
                        <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                      )}
                    </button>

                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 tracking-tight">
                          {workflow.name || workflow.templateName || 'Saved Workflow Strategy'}
                        </span>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25">
                          {runs.length} {runs.length === 1 ? 'Run' : 'Runs'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
                        {lastRun
                          ? `Latest Run: ${new Date(lastRun.dispatchedAt || lastRun.createdAt).toLocaleString()} • ${lastRun.status?.replace(/_/g, ' ')}`
                          : 'No execution records yet'}
                      </div>
                    </div>
                  </div>

                  {/* Right Header Section: Health KPIs and View/Hide affordance */}
                  <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
                    {cumulativeRecovery > 0 && (
                      <div data-testid="strategy-cumulative-recovery" className="text-right">
                        <div className="text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-400">
                          Cumulative Recovery
                        </div>
                        <div className="font-mono font-bold text-sm sm:text-base text-emerald-600 dark:text-emerald-400 leading-none mt-1">
                          ${cumulativeRecovery.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    )}

                    {completedRuns.length > 0 && (
                      <div data-testid="strategy-clearance-rate" className="text-right">
                        <div className="text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-400">
                          Clearance Rate
                        </div>
                        <div
                          className={`font-mono font-bold text-sm sm:text-base leading-none mt-1 ${
                            awardRate >= 50
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {awardRate}%
                        </div>
                      </div>
                    )}

                    <span className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                      {isCollapsed ? 'View Runs' : 'Hide Runs'}
                    </span>
                  </div>
                </div>

                {/* Expanded Run Rows List */}
                {!isCollapsed && (
                  <div className="p-4 sm:p-5 flex flex-col gap-3 bg-slate-100/40 dark:bg-slate-950/60">
                    {runs.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400 font-medium">
                        No runs recorded for this workflow strategy.
                      </div>
                    ) : (
                      runs.map((run: any) => renderExecutionRunRow(run, false))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ══ FULL-SCREEN AUDIT INSPECTOR MODAL ════════════════════════════════ */}
      {selectedRunForAudit && (
        <WorkflowRunAuditModal
          run={selectedRunForAudit}
          workflow={groupedWorkflows.find(([_, g]) => g.runs.some(r => r._id === selectedRunForAudit._id))?.[1]?.workflow}
          inventoryList={inventoryList}
          allBids={allBids}
          allBuyers={allBuyers}
          buyerLists={effectiveBuyerLists}
          onClose={() => setSelectedRunForAudit(null)}
          onForceExpire={onForceExpireRun}
          onReTrigger={onReTriggerRun}
          onSelectLot={onSelectLot}
        />
      )}
    </div>
  );
};
