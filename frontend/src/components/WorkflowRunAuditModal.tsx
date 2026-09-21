import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  DollarSign,
  Package,
  Users,
  Send,
  Download,
  Copy,
  Layers,
  Activity,
  ChevronRight,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Search,
  Zap,
  Timer
} from 'lucide-react';
import { WorkflowRunTimelineStepper, formatExecutionWindow, formatTimeRemaining } from './WorkflowRunTimelineStepper';
import { useAppSelector } from '../store/hooks';
import { selectBuyerLists } from '../store/slices/coreSlice';

interface WorkflowRunAuditModalProps {
  run: any;
  workflow?: any;
  inventoryList?: any[];
  allBids?: any[];
  allBuyers?: any[];
  buyerLists?: any[];
  onClose: () => void;
  onReTrigger?: (run: any) => void;
  onForceExpire?: (runId: string) => void;
  onSelectLot?: (lot: any) => void;
}

export const WorkflowRunAuditModal: React.FC<WorkflowRunAuditModalProps> = ({
  run,
  workflow,
  inventoryList = [],
  allBids = [],
  allBuyers = [],
  buyerLists = [],
  onClose,
  onReTrigger,
  onForceExpire,
  onSelectLot
}) => {
  let reduxBuyerLists: any[] = [];
  try {
    reduxBuyerLists = useAppSelector(selectBuyerLists) || [];
  } catch (e) {
    reduxBuyerLists = [];
  }
  const effectiveBuyerLists = (buyerLists && buyerLists.length > 0) ? buyerLists : reduxBuyerLists;
  const [activeTab, setActiveTab] = useState<'summary' | 'inventory' | 'comms' | 'bids'>('summary');
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [nowTime, setNowTime] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNowTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!run) return null;

  const linkedAuto = workflow || run.campaignSnapshot || {};
  const runBids = allBids.filter((b: any) =>
    run.snapshotInventoryIds?.some((lotId: string) => {
      const bidLotId = b.inventoryLotId?._id || b.inventoryLotId;
      return bidLotId === lotId;
    })
  );

  let winningBidPrice: number | null = null;
  let totalCasesCount = run.resolution?.totalCases || 0;
  let totalDollarValue = run.resolution?.totalValue || 0;

  if (run.resolution) {
    if (run.resolution.winningPrice) winningBidPrice = run.resolution.winningPrice;
    if (run.resolution.action === 'auto_award' && !winningBidPrice && runBids.length > 0) {
      winningBidPrice = Math.max(...runBids.map((b: any) => b.price || 0));
    }
  }

  // Matched lots
  const matchedLots = (run.snapshotInventoryIds || []).map((id: string) => {
    const found = inventoryList.find((l: any) => (l._id || l.id) === id);
    return found || { _id: id, lotNumber: `LOT-${String(id).slice(-4)}`, sku: 'SKU-SNAPSHOT', quantityCases: 100, description: 'Inventory Item' };
  });

  if (!totalCasesCount && matchedLots.length > 0) {
    totalCasesCount = matchedLots.reduce((sum: number, l: any) => sum + (l.availableQty || l.quantityCases || 0), 0);
  }

  if (!totalDollarValue && winningBidPrice && totalCasesCount) {
    totalDollarValue = winningBidPrice * totalCasesCount;
  }

  // Export JSON Report
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({
      auditHeader: {
        runId: run._id,
        workflowName: linkedAuto?.name || 'Workflow Strategy',
        dispatchedAt: run.dispatchedAt,
        status: run.status,
        recoveryValue: totalDollarValue,
        totalCases: totalCasesCount
      },
      campaignSnapshot: run.campaignSnapshot || linkedAuto,
      inventorySnapshot: matchedLots,
      bidsReceived: runBids,
      resolution: run.resolution,
      rawTelemetry: run
    }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `workflow-run-audit-${run._id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const isLotAwarded = (lot: any): boolean => {
    const lotId = lot._id || lot.id;
    if (run.status === 'awarded') return true;
    if (Array.isArray(run.stageExecutions)) {
      for (const exec of run.stageExecutions) {
        if (Array.isArray(exec.lotsOffered)) {
          const found = exec.lotsOffered.find((lo: any) => {
            const lId = typeof lo.lotId === 'object' ? (lo.lotId?._id || lo.lotId?.id) : lo.lotId;
            return lId === lotId || String(lId) === String(lotId);
          });
          if (found && ((found.awardedQty && found.awardedQty > 0) || found.remainingQty === 0 || exec.status === 'awarded')) {
            return true;
          }
        }
      }
    }
    return false;
  };

  // Status Badge Configuration
  const statusStyles: Record<string, { bg: string; text: string; border: string }> = {
    awarded: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      text: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-200/80 dark:border-emerald-800/80'
    },
    fallback_executed: {
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      text: 'text-amber-700 dark:text-amber-300',
      border: 'border-amber-200/80 dark:border-amber-800/80'
    },
    failed: {
      bg: 'bg-rose-50 dark:bg-rose-950/40',
      text: 'text-rose-700 dark:text-rose-300',
      border: 'border-rose-200/80 dark:border-rose-800/80'
    },
    evaluating: {
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      text: 'text-amber-700 dark:text-amber-300',
      border: 'border-amber-200/80 dark:border-amber-800/80'
    },
    dispatched: {
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      text: 'text-amber-700 dark:text-amber-300',
      border: 'border-amber-200/80 dark:border-amber-800/80'
    }
  };

  const currentStatusStyle = statusStyles[run.status] || {
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-600 dark:text-slate-400',
    border: 'border-slate-200 dark:border-slate-700'
  };

  return (
    <div
      data-testid="workflow-run-audit-modal"
      className="fixed inset-0 z-[10000] w-full h-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col overflow-hidden animate-in fade-in duration-150"
    >
      {/* ══ FULL SCREEN AUDIT INSPECTOR VIEWPORT ═════════════════════════════ */}
      <div className="w-full h-full flex flex-col overflow-hidden bg-white dark:bg-slate-900">
        
        {/* ══ STICKY EXECUTIVE AUDIT HEADER ════════════════════════════════════ */}
        <header className="px-6 py-4 sm:py-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start justify-between flex-wrap gap-4 select-none shrink-0 shadow-xs">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold mt-0.5 shadow-2xs">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <div>
              {/* Top Eyebrow Metadata Tranche */}
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Execution Audit Inspector
                </span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  ID: #{String(run._id).slice(-8).toUpperCase()}
                </span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide border ${currentStatusStyle.bg} ${currentStatusStyle.text} ${currentStatusStyle.border}`}
                >
                  {run.status?.replace(/_/g, ' ')}
                </span>
              </div>

              {/* Master Title */}
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 m-0 leading-snug">
                {linkedAuto?.name || run.campaignSnapshot?.name || 'Workflow Run Audit'}
              </h2>

              {/* Sub-Metadata Tranche */}
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                <span>
                  Dispatched: <strong className="text-slate-800 dark:text-slate-200">{new Date(run.dispatchedAt || run.createdAt).toLocaleString()}</strong>
                </span>
                <span>•</span>
                <span>
                  Execution Mode: <strong className="capitalize text-slate-800 dark:text-slate-200">{run.runType || 'Scheduled'}</strong>
                </span>
                {totalDollarValue > 0 && (
                  <>
                    <span>•</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      ${totalDollarValue.toLocaleString(undefined, { minimumFractionDigits: 2 })} Total Recovered
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Header Action Controls & Close Button */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {run.status === 'evaluating' && onForceExpire && (
              <button
                type="button"
                className="h-9 px-3 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-1.5 transition-all active:scale-[0.98] shadow-2xs"
                onClick={() => onForceExpire(run._id)}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Force Expire / Resolve Now</span>
              </button>
            )}

            {onReTrigger && (
              <button
                type="button"
                className="h-9 px-3 rounded-lg text-xs font-semibold bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-all active:scale-[0.98] shadow-2xs"
                onClick={() => onReTrigger(run)}
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                <span>Re-Trigger Workflow</span>
              </button>
            )}

            <button
              type="button"
              className="h-9 px-3 rounded-lg text-xs font-semibold bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-all active:scale-[0.98] shadow-2xs"
              onClick={handleExportJSON}
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export Audit Report (JSON)</span>
            </button>

            <button
              type="button"
              aria-label="Close Audit Inspector"
              title="Close Audit Inspector (X)"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-slate-300 dark:border-slate-700 shadow-2xs hover:shadow-xs"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* ══ AUDIT TAB NAVIGATION BAR (-mb-[1px] SEAM) ══════════════════════ */}
        <nav className="px-6 border-b border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2 select-none overflow-x-auto">
          {[
            { id: 'summary', label: 'Summary & Timeline', icon: Activity },
            { id: 'inventory', label: `Inventory Scope (${matchedLots.length})`, icon: Package },
            { id: 'comms', label: `Communications Log (${run.buyerEmails?.length || run.evaluatedBuyerIds?.length || 0})`, icon: Send },
            { id: 'bids', label: `Bids & Offers Ledger (${runBids.length})`, icon: DollarSign },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold transition-all -mb-[1px] border-b-[3px] ${
                  isActive
                    ? 'border-primary text-primary font-bold bg-primary/5 dark:bg-primary/10'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:border-slate-300'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* ══ AUDIT TAB BODY CONTENT (GENEROUS BREATHING SURFACE) ═════════════ */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-950/40 space-y-6">
          
          {/* TAB 1: SUMMARY & TIMELINE */}
          {activeTab === 'summary' && (() => {
            const isEvaluating = run.status === 'evaluating' || run.status === 'dispatched';
            const effectiveStages = (Array.isArray(run.campaignSnapshot?.stages) && run.campaignSnapshot.stages.length > 0)
              ? run.campaignSnapshot.stages
              : (Array.isArray(linkedAuto?.stages) && linkedAuto.stages.length > 0 ? linkedAuto.stages : []);
            const currStageIdx = run.currentStageIndex ?? 0;
            const activeStage = effectiveStages[currStageIdx] || effectiveStages[0] || { name: `Stage ${currStageIdx + 1}`, waitHours: 24 };
            const stageWindowFormatted = formatExecutionWindow(activeStage.waitHours, activeStage.waitUnit);
            const dispatchTimeMs = new Date(run.dispatchedAt || run.createdAt || Date.now()).getTime();
            const endsAtMs = run.evaluationEndsAt ? new Date(run.evaluationEndsAt).getTime() : (dispatchTimeMs + (activeStage.waitHours || 24) * 3600000);
            const remainingMs = endsAtMs - nowTime;
            const isWindowExpired = remainingMs <= 0;
            const totalDurationMs = Math.max(1, endsAtMs - dispatchTimeMs);
            const elapsedMs = Math.max(0, nowTime - dispatchTimeMs);
            const progressPct = Math.min(100, Math.max(0, Math.round((elapsedMs / totalDurationMs) * 100)));

            return (
              <div className="space-y-6">
                {/* Active Stage Live Window & Countdown Hero Card */}
                {isEvaluating && (
                  <div
                    data-testid="active-stage-countdown-card"
                    className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-300/80 dark:border-amber-800/80 rounded-xl p-5 shadow-xs flex flex-col gap-4"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 flex items-center justify-center font-bold">
                          <Timer className="w-5 h-5 animate-spin-slow" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="m-0 text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                              Current Active Stage: {activeStage.name || 'Stage 1'}
                            </h4>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200/60 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 uppercase tracking-wider">
                              Live Evaluation
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Dispatched: {new Date(dispatchTimeMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} • Configured Window: <strong className="text-slate-800 dark:text-slate-200">{stageWindowFormatted}</strong>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Window Time Remaining
                        </div>
                        <div className={`text-xl sm:text-2xl font-bold font-mono ${isWindowExpired ? 'text-amber-600' : 'text-primary'}`}>
                          {isWindowExpired ? '00h 00m 00s (Expired)' : formatTimeRemaining(remainingMs)}
                        </div>
                      </div>
                    </div>

                    {/* Window Progress Bar */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span>Stage Window Elapsed: <strong>{progressPct}%</strong></span>
                        <span>Total Window Duration: <strong>{stageWindowFormatted}</strong></span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-200/80 dark:bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            isWindowExpired ? 'bg-rose-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* ══ 4-COLUMN COMMERCIAL KPI GRID (ENTERPRISE GUTTERS) ═══════ */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 shadow-2xs flex flex-col justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Evaluated Lots
                    </span>
                    <div className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100 leading-none my-2">
                      {matchedLots.length} Lots
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {totalCasesCount.toLocaleString()} Total Cases Evaluated
                    </span>
                  </div>

                  <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 shadow-2xs flex flex-col justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Partner Responses
                    </span>
                    <div className="text-2xl font-bold font-mono text-primary leading-none my-2">
                      {runBids.length}
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Buyer Responses Received
                    </span>
                  </div>

                  <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 shadow-2xs flex flex-col justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Winning Bid Price
                    </span>
                    <div className={`text-2xl font-bold font-mono leading-none my-2 ${winningBidPrice ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                      {winningBidPrice ? `$${winningBidPrice.toFixed(2)}/case` : '--'}
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Highest Qualified Bid
                    </span>
                  </div>

                  <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 shadow-2xs flex flex-col justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Total Dollar Recovery
                    </span>
                    <div className={`text-2xl font-bold font-mono leading-none my-2 ${totalDollarValue ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100'}`}>
                      {totalDollarValue ? `$${totalDollarValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '$0.00'}
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Calculated Clearance Yield
                    </span>
                  </div>
                </div>

                {/* Strategy Configuration Active at Dispatch */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-2xs">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 m-0 mb-3.5 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    <span>Strategy Configuration Active at Dispatch</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                    <div className="p-3 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                      <div className="text-slate-500 dark:text-slate-400 text-[11px] font-medium">Strategy Template Name</div>
                      <div className="font-bold text-slate-900 dark:text-slate-100 text-sm mt-1">{linkedAuto?.name || 'Automated Clearance Flow'}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                      <div className="text-slate-500 dark:text-slate-400 text-[11px] font-medium">Category Target</div>
                      <div className="font-bold text-slate-900 dark:text-slate-100 text-sm mt-1">{linkedAuto?.categoryFilter || 'All Categories'}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                      <div className="text-slate-500 dark:text-slate-400 text-[11px] font-medium">Max RSL % Threshold</div>
                      <div className="font-bold text-slate-900 dark:text-slate-100 text-sm mt-1">{linkedAuto?.maxRslFilter || linkedAuto?.maxRsl || 30}% Remaining Shelf Life</div>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                      <div className="text-slate-500 dark:text-slate-400 text-[11px] font-medium">Minimum Case Count</div>
                      <div className="font-bold text-slate-900 dark:text-slate-100 text-sm mt-1">{linkedAuto?.minCasesFilter || linkedAuto?.minCases || 50} Cases</div>
                    </div>
                  </div>
                </div>

                {/* Stage Execution Stepper */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-2xs">
                  <WorkflowRunTimelineStepper
                    run={run}
                    stages={run.campaignSnapshot?.stages || workflow?.stages || linkedAuto?.stages || run.stages}
                    allBuyers={allBuyers}
                    allBids={allBids}
                    inventoryList={inventoryList}
                    buyerLists={effectiveBuyerLists}
                  />
                </div>

                {/* Resolution Audit Breakdown */}
                {run.resolution && (
                  <div className="bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/80 rounded-xl p-5 shadow-2xs">
                    <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-300 m-0 mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Resolution Audit Details & Outcome</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Executed Action:</span>
                        <div className="font-bold capitalize text-slate-900 dark:text-slate-100 mt-0.5">
                          {run.resolution.action?.replace(/_/g, ' ') || run.status}
                        </div>
                      </div>
                      {run.resolution.targetBuyerId && (
                        <div>
                          <span className="text-slate-500 dark:text-slate-400">Awarded Partner / Buyer:</span>
                          <div className="font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                            {typeof run.resolution.targetBuyerId === 'object'
                              ? (run.resolution.targetBuyerId.companyName || run.resolution.targetBuyerId.name || 'Target Buyer')
                              : run.resolution.targetBuyerId}
                          </div>
                        </div>
                      )}
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Resolution Timestamp:</span>
                        <div className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                          {run.resolution.resolvedAt ? new Date(run.resolution.resolvedAt).toLocaleString() : new Date(run.evaluationEndsAt || run.updatedAt).toLocaleString()}
                        </div>
                      </div>
                      {run.fallbackJobId && (
                        <div>
                          <span className="text-slate-500 dark:text-slate-400">Fallback Execution Job:</span>
                          <div className="font-mono font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                            {run.fallbackJobId}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* TAB 2: INVENTORY LOT SCOPE */}
          {activeTab === 'inventory' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-2xs">
              <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                <h4 className="m-0 text-base font-bold text-slate-900 dark:text-slate-100">
                  Evaluated Inventory Lots ({matchedLots.length})
                </h4>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  <strong className="text-slate-900 dark:text-slate-100">{totalCasesCount.toLocaleString()} Total Cases Evaluated</strong>
                </span>
              </div>

              {matchedLots.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
                  No specific inventory lots attached to this execution snapshot.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                        <th className="py-2.5 px-3">Lot Identifier</th>
                        <th className="py-2.5 px-3">SKU</th>
                        <th className="py-2.5 px-3">Description</th>
                        <th className="py-2.5 px-3">Quantity Cases</th>
                        <th className="py-2.5 px-3">Remaining Shelf Life</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Valuation</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {matchedLots.map((lot: any, idx: number) => {
                        const lotId = lot._id || lot.id || `LOT-${idx}`;
                        const lotNum = lot.lotNumber || `LOT-${String(lotId).slice(-4)}`;
                        const cases = lot.availableQty || lot.quantityCases || 0;
                        const lotPrice = lot.pricePerCase ?? lot.costPerCase ?? lot.unitPrice ?? 0;
                        const lotValuation = lot.valuation ?? (lotPrice > 0 ? lotPrice * cases : (lot.estimatedValue || 0));
                        const isAwarded = isLotAwarded(lot);

                        return (
                          <tr
                            key={lotId || idx}
                            data-testid={isAwarded ? 'lot-row-awarded' : 'lot-row-remaining'}
                            className={`transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40 ${
                              isAwarded ? 'opacity-70 bg-slate-50/40 dark:bg-slate-800/20' : ''
                            }`}
                          >
                            <td className={`py-3 px-3 font-mono font-bold ${isAwarded ? 'line-through text-slate-500' : 'text-primary'}`}>
                              {lotNum}
                            </td>
                            <td className={`py-3 px-3 font-mono font-semibold ${isAwarded ? 'line-through' : ''}`}>{lot.sku || 'SKU-SNAPSHOT'}</td>
                            <td className={`py-3 px-3 text-slate-600 dark:text-slate-400 ${isAwarded ? 'line-through' : ''}`}>{lot.description || lot.productName || 'Inventory Item'}</td>
                            <td className="py-3 px-3 font-semibold">{cases.toLocaleString()} cases</td>
                            <td className="py-3 px-3">
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/80">
                                {lot.rsl != null ? `${lot.rsl}% RSL` : 'Expiring Soon'}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <span
                                data-testid="lot-status-badge"
                                className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide border ${
                                  isAwarded
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300'
                                    : 'bg-primary/10 text-primary border-primary/20'
                                }`}
                              >
                                {isAwarded ? 'Awarded' : 'Remaining'}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                              {lotValuation > 0 ? `$${lotValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '--'}
                            </td>
                            <td className="py-3 px-3 text-right">
                              {onSelectLot && (
                                <button
                                  type="button"
                                  className="h-7 px-2.5 text-xs font-semibold rounded-md border border-slate-200 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5 transition-all active:scale-[0.98] shadow-2xs"
                                  onClick={() => {
                                    onClose();
                                    onSelectLot(lot);
                                  }}
                                >
                                  <span>View in Lot Hub</span>
                                  <ExternalLink className="w-3 h-3 text-slate-400" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: COMMUNICATIONS LOG */}
          {activeTab === 'comms' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-2xs">
              <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 m-0 mb-4">
                Partner Dispatch & Communications Log
              </h4>
              {(!run.buyerEmails || run.buyerEmails.length === 0) && (!run.evaluatedBuyerIds || run.evaluatedBuyerIds.length === 0) ? (
                <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
                  No direct outreach emails were dispatched during this run execution.
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {(run.buyerEmails || run.evaluatedBuyerIds || []).map((bTarget: any, idx: number) => {
                    let emailStr = typeof bTarget === 'string' ? bTarget : (bTarget?.email || bTarget?.companyName || `buyer-${idx + 1}@domain.com`);
                    let companyName = typeof bTarget === 'object' ? (bTarget.companyName || bTarget.name) : undefined;

                    if (!companyName) {
                      const matchedBuyer = allBuyers.find((b: any) =>
                        (b.email && typeof bTarget === 'string' && b.email.toLowerCase() === bTarget.toLowerCase()) ||
                        b._id === bTarget ||
                        b.id === bTarget
                      );
                      if (matchedBuyer) {
                        companyName = matchedBuyer.companyName || matchedBuyer.name;
                        if (matchedBuyer.email) emailStr = matchedBuyer.email;
                      }
                    }

                    return (
                      <div
                        key={idx}
                        className="p-3.5 sm:p-4 bg-slate-50/60 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                            <Send className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <strong className="text-xs sm:text-sm text-slate-900 dark:text-slate-100">{emailStr}</strong>
                              {companyName && (
                                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300">
                                  {companyName}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              Dispatch Channel: <strong className="text-slate-700 dark:text-slate-300">OAuth Gmail Direct</strong> • Sent: {new Date(run.dispatchedAt || run.createdAt || Date.now()).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>

                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/80">
                          Delivered
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: BIDS & OFFERS LEDGER */}
          {activeTab === 'bids' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-2xs">
              <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 m-0 mb-4">
                Buyer Bids & Evaluation Ledger ({runBids.length})
              </h4>
              {runBids.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
                  No buyer bids were received within the execution evaluation window.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                        <th className="py-2.5 px-3">Buyer Company</th>
                        <th className="py-2.5 px-3">SKU</th>
                        <th className="py-2.5 px-3">Bid / Case</th>
                        <th className="py-2.5 px-3">Quantity</th>
                        <th className="py-2.5 px-3">Total Offer</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {runBids.map((bid: any, idx: number) => {
                        let buyerName = bid.buyerName || bid.companyName || (typeof bid.buyerId === 'object' ? (bid.buyerId?.companyName || bid.buyerId?.name) : undefined);
                        if (!buyerName && typeof bid.buyerId === 'string') {
                          const foundBuyer = allBuyers.find((b: any) => (b._id || b.id) === bid.buyerId);
                          if (foundBuyer) buyerName = foundBuyer.companyName || foundBuyer.name;
                        }
                        if (!buyerName) buyerName = 'Verified Buyer';

                        const isWinning = bid.status === 'accepted' || (winningBidPrice != null && (bid.price === winningBidPrice || bid.bidPrice === winningBidPrice));
                        const price = bid.price ?? bid.bidPrice ?? 0;
                        const cases = bid.quantityCases ?? bid.quantity ?? 0;
                        const totalOffer = price * cases;

                        return (
                          <tr
                            key={bid._id || idx}
                            className={`transition-colors ${
                              isWinning
                                ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-l-4 border-l-emerald-500'
                                : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40'
                            }`}
                          >
                            <td className="py-3 px-3 font-semibold text-slate-900 dark:text-slate-100">
                              <div className="flex items-center gap-1.5">
                                {isWinning && <span className="text-emerald-600 font-bold text-sm">★</span>}
                                <span>{buyerName}</span>
                              </div>
                            </td>
                            <td className="py-3 px-3 font-mono font-semibold text-primary">{bid.sku || 'Target Lot SKU'}</td>
                            <td className="py-3 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">${price.toFixed(2)}</td>
                            <td className="py-3 px-3 font-semibold">{cases.toLocaleString()} cases</td>
                            <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                              ${totalOffer.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide border ${
                                  isWinning
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300'
                                    : 'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300'
                                }`}
                              >
                                {isWinning ? 'Awarded / Winning' : 'Outbid'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </main>

        {/* ══ DEDICATED UNIFIED MODAL FOOTER (<= 52px HEIGHT) ════════════════ */}
        <footer className="h-13 sm:h-14 px-6 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3 select-none">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>Audit Session: <strong className="font-mono text-slate-700 dark:text-slate-300">#{String(run._id).slice(-8).toUpperCase()}</strong></span>
            <span>•</span>
            <span>Lots Scoped: <strong className="text-slate-700 dark:text-slate-300">{matchedLots.length}</strong></span>
            {totalDollarValue > 0 && (
              <>
                <span>•</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                  ${totalDollarValue.toLocaleString(undefined, { minimumFractionDigits: 2 })} Recovered
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="h-8 px-3 rounded-lg text-xs font-semibold bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-all active:scale-[0.98]"
              onClick={handleExportJSON}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>

            <button
              type="button"
              className="h-8 px-4 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-primary/90 transition-all active:scale-[0.98] shadow-2xs"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </footer>

      </div>
    </div>
  );
};
