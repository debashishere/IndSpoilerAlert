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
  const [rawSearchQuery, setRawSearchQuery] = useState('');
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

  const statusColorMap: Record<string, string> = {
    awarded: 'hsl(var(--success))',
    fallback_executed: 'hsl(var(--warning))',
    failed: 'hsl(var(--error))',
    evaluating: 'hsl(var(--primary))',
    dispatched: 'hsl(var(--primary))'
  };
  const statusColor = statusColorMap[run.status] || 'hsl(var(--text-muted))';

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

  // Copy raw JSON
  const handleCopyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(run, null, 2));
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2000);
  };

  return (
    <div
      data-testid="workflow-run-audit-modal"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        backgroundColor: 'rgba(0, 0, 0, 0.82)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* ══ STICKY EXECUTIVE AUDIT HEADER ════════════════════════════════════ */}
      <header style={{
        backgroundColor: 'hsl(var(--bg-card))',
        borderBottom: '1px solid hsl(var(--border-color))',
        padding: '16px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            backgroundColor: `${statusColor}18`,
            border: `1px solid ${statusColor}40`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: statusColor
          }}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'hsl(var(--text-primary))' }}>
                {linkedAuto?.name || run.campaignSnapshot?.name || 'Workflow Run Audit'}
              </h2>
              <span style={{
                fontSize: '0.72rem',
                fontFamily: 'monospace',
                padding: '2px 8px',
                borderRadius: '6px',
                backgroundColor: 'hsl(var(--bg-card-hover))',
                color: 'hsl(var(--text-muted))',
                border: '1px solid hsl(var(--border-color))'
              }}>
                ID: #{String(run._id).slice(-8).toUpperCase()}
              </span>
              <span style={{
                fontSize: '0.72rem',
                padding: '3px 10px',
                borderRadius: '12px',
                backgroundColor: `${statusColor}18`,
                color: statusColor,
                fontWeight: 800,
                textTransform: 'uppercase',
                border: `1px solid ${statusColor}40`
              }}>
                {run.status?.replace(/_/g, ' ')}
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', marginTop: '4px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <span>Dispatched: <strong style={{ color: 'hsl(var(--text-primary))' }}>{new Date(run.dispatchedAt || run.createdAt).toLocaleString()}</strong></span>
              <span>•</span>
              <span>Execution Mode: <strong style={{ textTransform: 'capitalize', color: 'hsl(var(--text-primary))' }}>{run.runType || 'Scheduled'}</strong></span>
              {totalDollarValue > 0 && (
                <>
                  <span>•</span>
                  <span style={{ color: 'hsl(var(--success))', fontWeight: 700 }}>
                    ${totalDollarValue.toLocaleString(undefined, { minimumFractionDigits: 2 })} Total Recovered
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Header Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {run.status === 'evaluating' && onForceExpire && (
            <button
              type="button"
              className="btn btn-warning"
              onClick={() => onForceExpire(run._id)}
              style={{ fontSize: '0.8rem', padding: '7px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Zap size={14} /> Force Expire / Resolve Now
            </button>
          )}

          {onReTrigger && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => onReTrigger(run)}
              style={{ fontSize: '0.8rem', padding: '7px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw size={14} /> Re-Trigger Workflow
            </button>
          )}

          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleExportJSON}
            style={{ fontSize: '0.8rem', padding: '7px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Download size={14} /> Export Audit Report (JSON)
          </button>

          <button
            type="button"
            aria-label="Close Audit Inspector"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'hsl(var(--text-muted))',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X size={24} />
          </button>
        </div>
      </header>

      {/* ══ AUDIT TAB NAVIGATION BAR ═══════════════════════════════════════ */}
      <nav style={{
        backgroundColor: 'hsl(var(--bg-card))',
        borderBottom: '1px solid hsl(var(--border-color))',
        padding: '0 28px',
        display: 'flex',
        gap: '8px',
        overflowX: 'auto'
      }}>
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
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '14px 18px',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: isActive ? 'hsl(var(--primary))' : 'hsl(var(--text-muted))',
                borderBottom: isActive ? '3px solid hsl(var(--primary))' : '3px solid transparent',
                background: 'none',
                borderTop: 'none',
                borderLeft: 'none',
                borderRight: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap'
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* ══ AUDIT TAB BODY CONTENT ═════════════════════════════════════════ */}
      <main style={{
        flex: 1,
        overflowY: 'auto',
        padding: '28px',
        backgroundColor: 'hsl(var(--bg-app))',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        {/* TAB 1: SUMMARY & TIMELINE */}
        {activeTab === 'summary' && (() => {
          const isEvaluating = run.status === 'evaluating' || run.status === 'dispatched';
          const activeStage = (run.campaignSnapshot?.stages || linkedAuto?.stages || [])[0] || { name: 'Stage 1: Primary Clearance', waitHours: 24 };
          const stageWindowFormatted = formatExecutionWindow(activeStage.waitHours, activeStage.waitUnit);
          const dispatchTimeMs = new Date(run.dispatchedAt || run.createdAt || Date.now()).getTime();
          const endsAtMs = run.evaluationEndsAt ? new Date(run.evaluationEndsAt).getTime() : (dispatchTimeMs + (activeStage.waitHours || 24) * 3600000);
          const remainingMs = endsAtMs - nowTime;
          const isWindowExpired = remainingMs <= 0;
          const totalDurationMs = Math.max(1, endsAtMs - dispatchTimeMs);
          const elapsedMs = Math.max(0, nowTime - dispatchTimeMs);
          const progressPct = Math.min(100, Math.max(0, Math.round((elapsedMs / totalDurationMs) * 100)));

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Active Stage Live Window & Countdown Hero Card */}
              {isEvaluating && (
                <div
                  data-testid="active-stage-countdown-card"
                  className="card"
                  style={{
                    border: '1px solid hsl(var(--warning) / 50%)',
                    backgroundColor: 'hsl(var(--warning) / 8%)',
                    padding: '20px 24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    boxShadow: '0 0 20px hsl(var(--warning) / 10%)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        backgroundColor: 'hsl(var(--warning) / 20%)',
                        color: 'hsl(var(--warning))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Timer size={22} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'hsl(var(--text-primary))' }}>
                            Current Active Stage: {activeStage.name || 'Stage 1'}
                          </h4>
                          <span style={{
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '10px',
                            backgroundColor: 'hsl(var(--warning) / 25%)',
                            color: 'hsl(var(--warning))',
                            textTransform: 'uppercase'
                          }}>
                            Live Evaluation
                          </span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', marginTop: '2px' }}>
                          Dispatched: {new Date(dispatchTimeMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} • Configured Window: <strong style={{ color: 'hsl(var(--text-primary))' }}>{stageWindowFormatted}</strong>
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.72rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', fontWeight: 700 }}>
                        Window Time Remaining
                      </div>
                      <div style={{ fontSize: '1.35rem', fontWeight: 800, fontFamily: 'monospace', color: isWindowExpired ? 'hsl(var(--warning))' : 'hsl(var(--primary))' }}>
                        {isWindowExpired ? '00h 00m 00s (Expired)' : formatTimeRemaining(remainingMs)}
                      </div>
                    </div>
                  </div>

                  {/* Window Progress Bar */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'hsl(var(--text-muted))' }}>
                      <span>Stage Window Elapsed: <strong>{progressPct}%</strong></span>
                      <span>Total Window Duration: <strong>{stageWindowFormatted}</strong></span>
                    </div>
                    <div style={{ width: '100%', height: '8px', borderRadius: '4px', backgroundColor: 'hsl(var(--bg-card))', overflow: 'hidden', border: '1px solid hsl(var(--border-color))' }}>
                      <div style={{
                        width: `${progressPct}%`,
                        height: '100%',
                        backgroundColor: isWindowExpired ? 'hsl(var(--error))' : 'hsl(var(--warning))',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>
                </div>
              )}

              {/* Top 4-card metric overview */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div className="card" style={{ padding: '18px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'hsl(var(--text-primary))' }}>
                    {matchedLots.length} Lots
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', marginTop: '4px' }}>
                    {totalCasesCount.toLocaleString()} Total Cases Evaluated
                  </div>
                </div>

                <div className="card" style={{ padding: '18px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'hsl(var(--primary))' }}>
                    {runBids.length}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', marginTop: '4px' }}>
                    Buyer Responses Received
                  </div>
                </div>

                <div className="card" style={{ padding: '18px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: winningBidPrice ? 'hsl(var(--success))' : 'hsl(var(--text-muted))' }}>
                    {winningBidPrice ? `$${winningBidPrice.toFixed(2)}/case` : '--'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', marginTop: '4px' }}>
                    Winning Bid Price
                  </div>
                </div>

                <div className="card" style={{ padding: '18px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: totalDollarValue ? 'hsl(var(--success))' : 'hsl(var(--text-primary))' }}>
                    {totalDollarValue ? `$${totalDollarValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '$0.00'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', marginTop: '4px' }}>
                    Total Dollar Recovery
                  </div>
                </div>
              </div>

              {/* Strategy Configuration Active at Dispatch */}
              <div className="card" style={{ padding: '24px' }}>
                <h4 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 800, color: 'hsl(var(--text-primary))' }}>
                  Strategy Configuration Active at Dispatch
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', fontSize: '0.84rem' }}>
                  <div>
                    <div style={{ color: 'hsl(var(--text-muted))', fontSize: '0.75rem' }}>Strategy Template Name</div>
                    <div style={{ fontWeight: 700, marginTop: '2px' }}>{linkedAuto?.name || 'Automated Clearance Flow'}</div>
                  </div>
                  <div>
                    <div style={{ color: 'hsl(var(--text-muted))', fontSize: '0.75rem' }}>Category Target</div>
                    <div style={{ fontWeight: 700, marginTop: '2px' }}>{linkedAuto?.categoryFilter || 'All Categories'}</div>
                  </div>
                  <div>
                    <div style={{ color: 'hsl(var(--text-muted))', fontSize: '0.75rem' }}>Max RSL % Threshold</div>
                    <div style={{ fontWeight: 700, marginTop: '2px' }}>{linkedAuto?.maxRslFilter || linkedAuto?.maxRsl || 30}% Remaining Shelf Life</div>
                  </div>
                  <div>
                    <div style={{ color: 'hsl(var(--text-muted))', fontSize: '0.75rem' }}>Minimum Case Count</div>
                    <div style={{ fontWeight: 700, marginTop: '2px' }}>{linkedAuto?.minCasesFilter || linkedAuto?.minCases || 50} Cases</div>
                  </div>
                </div>
              </div>

              {/* Stage Execution Stepper */}
              <div className="card" style={{ padding: '24px' }}>
                <WorkflowRunTimelineStepper
                  run={run}
                  stages={run.campaignSnapshot?.stages}
                  allBuyers={allBuyers}
                  allBids={allBids}
                  inventoryList={inventoryList}
                  buyerLists={effectiveBuyerLists}
                />
              </div>

              {/* Resolution Audit Breakdown */}
              {run.resolution && (
                <div className="card" style={{ padding: '20px', border: '1px solid hsl(var(--primary) / 30%)' }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', fontWeight: 800, color: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={18} /> Resolution Audit Details & Outcome
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', fontSize: '0.82rem' }}>
                    <div>
                      <span style={{ color: 'hsl(var(--text-muted))' }}>Executed Action:</span>
                      <div style={{ fontWeight: 700, textTransform: 'capitalize', color: 'hsl(var(--text-primary))', marginTop: '2px' }}>
                        {run.resolution.action?.replace(/_/g, ' ') || run.status}
                      </div>
                    </div>
                    {run.resolution.targetBuyerId && (
                      <div>
                        <span style={{ color: 'hsl(var(--text-muted))' }}>Awarded Partner / Buyer:</span>
                        <div style={{ fontWeight: 700, color: 'hsl(var(--text-primary))', marginTop: '2px' }}>
                          {typeof run.resolution.targetBuyerId === 'object'
                            ? (run.resolution.targetBuyerId.companyName || run.resolution.targetBuyerId.name || 'Target Buyer')
                            : run.resolution.targetBuyerId}
                        </div>
                      </div>
                    )}
                    <div>
                      <span style={{ color: 'hsl(var(--text-muted))' }}>Resolution Timestamp:</span>
                      <div style={{ fontWeight: 600, color: 'hsl(var(--text-primary))', marginTop: '2px' }}>
                        {run.resolution.resolvedAt ? new Date(run.resolution.resolvedAt).toLocaleString() : new Date(run.evaluationEndsAt || run.updatedAt).toLocaleString()}
                      </div>
                    </div>
                    {run.fallbackJobId && (
                      <div>
                        <span style={{ color: 'hsl(var(--text-muted))' }}>Fallback Execution Job:</span>
                        <div style={{ fontFamily: 'monospace', fontWeight: 600, color: 'hsl(var(--text-primary))', marginTop: '2px' }}>
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
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>
                Evaluated Inventory Lots ({matchedLots.length})
              </h4>
              <span style={{ fontSize: '0.78rem', color: 'hsl(var(--text-muted))' }}>
                <strong style={{ color: 'hsl(var(--text-primary))' }}>{totalCasesCount.toLocaleString()} Total Cases Evaluated</strong>
              </span>
            </div>

            {matchedLots.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'hsl(var(--text-muted))' }}>
                No specific inventory lots attached to this execution snapshot.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid hsl(var(--border-color))', textAlign: 'left', color: 'hsl(var(--text-muted))' }}>
                      <th style={{ padding: '10px' }}>Lot Identifier</th>
                      <th style={{ padding: '10px' }}>SKU</th>
                      <th style={{ padding: '10px' }}>Description</th>
                      <th style={{ padding: '10px' }}>Quantity Cases</th>
                      <th style={{ padding: '10px' }}>Remaining Shelf Life</th>
                      <th style={{ padding: '10px' }}>Valuation</th>
                      <th style={{ padding: '10px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matchedLots.map((lot: any, idx: number) => {
                      const lotId = lot._id || lot.id || `LOT-${idx}`;
                      const lotNum = lot.lotNumber || `LOT-${String(lotId).slice(-4)}`;
                      const cases = lot.availableQty || lot.quantityCases || 0;
                      const lotPrice = lot.pricePerCase ?? lot.costPerCase ?? lot.unitPrice ?? 0;
                      const lotValuation = lot.valuation ?? (lotPrice > 0 ? lotPrice * cases : (lot.estimatedValue || 0));

                      return (
                        <tr key={lotId || idx} style={{ borderBottom: '1px solid hsl(var(--border-color) / 30%)' }}>
                          <td style={{ padding: '10px', fontWeight: 700, fontFamily: 'monospace', color: 'hsl(var(--primary))' }}>
                            {lotNum}
                          </td>
                          <td style={{ padding: '10px', fontWeight: 600 }}>{lot.sku || 'SKU-SNAPSHOT'}</td>
                          <td style={{ padding: '10px', color: 'hsl(var(--text-muted))' }}>{lot.description || lot.productName || 'Inventory Item'}</td>
                          <td style={{ padding: '10px', fontWeight: 700 }}>{cases.toLocaleString()} cases</td>
                          <td style={{ padding: '10px' }}>
                            <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '0.72rem', backgroundColor: 'hsl(var(--warning) / 15%)', color: 'hsl(var(--warning))', fontWeight: 700 }}>
                              {lot.rsl != null ? `${lot.rsl}% RSL` : 'Expiring Soon'}
                            </span>
                          </td>
                          <td style={{ padding: '10px', fontWeight: 700, color: lotValuation > 0 ? 'hsl(var(--text-primary))' : 'hsl(var(--text-muted))' }}>
                            {lotValuation > 0 ? `$${lotValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '--'}
                          </td>
                          <td style={{ padding: '10px' }}>
                            {onSelectLot && (
                              <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => {
                                  onClose();
                                  onSelectLot(lot);
                                }}
                                style={{ fontSize: '0.72rem', padding: '3px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                              >
                                View in Lot Hub <ExternalLink size={12} />
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

        {/* TAB 4: COMMUNICATIONS LOG */}
        {activeTab === 'comms' && (
          <div className="card" style={{ padding: '24px' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 800 }}>
              Partner Dispatch & Communications Log
            </h4>
            {(!run.buyerEmails || run.buyerEmails.length === 0) && (!run.evaluatedBuyerIds || run.evaluatedBuyerIds.length === 0) ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'hsl(var(--text-muted))' }}>
                No direct outreach emails were dispatched during this run execution.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
                    <div key={idx} style={{ padding: '14px 18px', backgroundColor: 'hsl(var(--bg-card-hover) / 25%)', borderRadius: '8px', border: '1px solid hsl(var(--border-color))', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          backgroundColor: 'hsl(var(--primary) / 10%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'hsl(var(--primary))'
                        }}>
                          <Send size={16} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <strong style={{ fontSize: '0.86rem', color: 'hsl(var(--text-primary))' }}>{emailStr}</strong>
                            {companyName && (
                              <span style={{ fontSize: '0.74rem', padding: '1px 6px', borderRadius: '4px', backgroundColor: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border-color))', color: 'hsl(var(--text-muted))' }}>
                                {companyName}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: 'hsl(var(--text-muted))', marginTop: '3px' }}>
                            Dispatch Channel: <strong>OAuth Gmail Direct</strong> • Sent: {new Date(run.dispatchedAt || run.createdAt || Date.now()).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                      <span style={{ fontSize: '0.72rem', padding: '3px 10px', borderRadius: '10px', backgroundColor: 'hsl(var(--success) / 15%)', color: 'hsl(var(--success))', fontWeight: 700 }}>
                        Delivered
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: BIDS & OFFERS LEDGER */}
        {activeTab === 'bids' && (
          <div className="card" style={{ padding: '24px' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 800 }}>
              Buyer Bids & Evaluation Ledger ({runBids.length})
            </h4>
            {runBids.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'hsl(var(--text-muted))' }}>
                No buyer bids were received within the execution evaluation window.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid hsl(var(--border-color))', textAlign: 'left', color: 'hsl(var(--text-muted))' }}>
                      <th style={{ padding: '10px' }}>Buyer Company</th>
                      <th style={{ padding: '10px' }}>SKU</th>
                      <th style={{ padding: '10px' }}>Bid / Case</th>
                      <th style={{ padding: '10px' }}>Quantity</th>
                      <th style={{ padding: '10px' }}>Total Offer</th>
                      <th style={{ padding: '10px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
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
                          style={{
                            borderBottom: '1px solid hsl(var(--border-color) / 30%)',
                            backgroundColor: isWinning ? 'hsl(var(--success) / 8%)' : undefined,
                            borderLeft: isWinning ? '3px solid hsl(var(--success))' : '3px solid transparent'
                          }}
                        >
                          <td style={{ padding: '10px', fontWeight: 700 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {isWinning && <span style={{ color: 'hsl(var(--success))', fontSize: '0.85rem' }}>★</span>}
                              <span>{buyerName}</span>
                            </div>
                          </td>
                          <td style={{ padding: '10px', color: 'hsl(var(--primary))', fontWeight: 600 }}>{bid.sku || 'Target Lot SKU'}</td>
                          <td style={{ padding: '10px', fontWeight: 700, color: 'hsl(var(--success))' }}>${price.toFixed(2)}</td>
                          <td style={{ padding: '10px' }}>{cases.toLocaleString()} cases</td>
                          <td style={{ padding: '10px', fontWeight: 700 }}>${totalOffer.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td style={{ padding: '10px' }}>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '10px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              backgroundColor: isWinning ? 'hsl(var(--success) / 15%)' : 'hsl(var(--warning) / 15%)',
                              color: isWinning ? 'hsl(var(--success))' : 'hsl(var(--warning))'
                            }}>
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

    </div>
  );
};
