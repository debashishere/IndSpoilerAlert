import React, { useState, useMemo } from 'react';
import {
  History,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Zap,
  Clock,
  DollarSign,
  Package,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Timer,
  Play,
  RotateCcw
} from 'lucide-react';
import { WorkflowRunAuditModal } from './WorkflowRunAuditModal';

interface WorkflowRunHistoryViewProps {
  supplierId: string;
  liquidationAutomations: any[];
  automationRuns: any[];
  inventoryList?: any[];
  allBids?: any[];
  allBuyers?: any[];
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
  loading = false,
  onForceExpireRun,
  onEditCampaign,
  onSelectLot,
  onReTriggerRun
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'evaluating' | 'awarded' | 'fallback_executed' | 'failed'>('all');
  const [collapsedWorkflows, setCollapsedWorkflows] = useState<Record<string, boolean>>({});
  const [selectedRunForAudit, setSelectedRunForAudit] = useState<any | null>(null);

  // Group runs by Workflow Strategy
  const groupedWorkflows = useMemo(() => {
    // Filter runs by status and search
    const filteredRuns = automationRuns.filter(run => {
      if (selectedStatusFilter !== 'all') {
        if (selectedStatusFilter === 'evaluating' && run.status !== 'evaluating' && run.status !== 'dispatched') return false;
        if (selectedStatusFilter === 'awarded' && run.status !== 'awarded') return false;
        if (selectedStatusFilter === 'fallback_executed' && run.status !== 'fallback_executed') return false;
        if (selectedStatusFilter === 'failed' && run.status !== 'failed' && run.status !== 'error') return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const autoId = String(run.automationId?._id || run.automationId || '');
        const linkedWorkflow = liquidationAutomations.find(a => String(a._id) === autoId);
        const autoName = linkedWorkflow?.name || linkedWorkflow?.templateName || run.campaignSnapshot?.name || '';
        const runId = String(run._id || '').toLowerCase();
        const status = String(run.status || '').toLowerCase();
        const matchesQuery = autoName.toLowerCase().includes(query) || runId.includes(query) || status.includes(query);
        if (!matchesQuery) return false;
      }

      return true;
    });

    // Grouping map
    const map = new Map<string, { workflow: any; runs: any[] }>();

    // First populate from existing saved workflows
    liquidationAutomations.forEach(auto => {
      map.set(String(auto._id), { workflow: auto, runs: [] });
    });

    // Bucket runs into groups
    filteredRuns.forEach(run => {
      const autoId = String(run.automationId?._id || run.automationId || '');
      if (map.has(autoId)) {
        map.get(autoId)!.runs.push(run);
      } else {
        // Unlinked or standalone workflow run
        const fallbackKey = autoId || `unlinked-${run.campaignSnapshot?.name || 'Standalone'}`;
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

    // Return groups that either have runs or match filter
    return Array.from(map.entries()).filter(([_, group]) => {
      if (selectedStatusFilter === 'all' && !searchQuery.trim()) return true;
      return group.runs.length > 0;
    });
  }, [liquidationAutomations, automationRuns, selectedStatusFilter, searchQuery]);

  // Active in-flight evaluations
  const activeRuns = useMemo(() => {
    return automationRuns.filter(r => r.status === 'evaluating' || r.status === 'dispatched');
  }, [automationRuns]);

  const toggleWorkflowCollapse = (wfId: string) => {
    setCollapsedWorkflows(prev => ({
      ...prev,
      [wfId]: !prev[wfId]
    }));
  };

  const handleExpandAll = () => {
    const newMap: Record<string, boolean> = {};
    groupedWorkflows.forEach(([key]) => {
      newMap[key] = false;
    });
    setCollapsedWorkflows(newMap);
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
    const statusColorMap: Record<string, string> = {
      awarded: 'hsl(var(--success))',
      fallback_executed: 'hsl(var(--warning))',
      failed: 'hsl(var(--error))',
      evaluating: 'hsl(var(--warning))',
      dispatched: 'hsl(var(--warning))'
    };
    const statusColor = statusColorMap[run.status] || 'hsl(var(--text-muted))';

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

    return (
      <div
        key={run._id}
        data-testid="execution-run-row"
        onClick={() => setSelectedRunForAudit(run)}
        style={{
          padding: '12px 16px',
          backgroundColor: isActive ? 'hsl(var(--warning) / 8%)' : 'hsl(var(--bg-card))',
          borderRadius: '8px',
          border: isActive ? '1px solid hsl(var(--warning) / 45%)' : '1px solid hsl(var(--border-color))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          boxShadow: isActive ? '0 0 12px hsl(var(--warning) / 10%)' : undefined
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = isActive ? 'hsl(var(--warning))' : 'hsl(var(--primary))';
          e.currentTarget.style.backgroundColor = isActive ? 'hsl(var(--warning) / 14%)' : 'hsl(var(--bg-card-hover) / 40%)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = isActive ? 'hsl(var(--warning) / 45%)' : 'hsl(var(--border-color))';
          e.currentTarget.style.backgroundColor = isActive ? 'hsl(var(--warning) / 8%)' : 'hsl(var(--bg-card))';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '8px',
            backgroundColor: `${statusColor}18`,
            color: statusColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '0.75rem',
            border: `1px solid ${statusColor}35`
          }}>
            {isActive ? <Timer size={18} style={{ color: 'hsl(var(--warning))' }} /> : <FileText size={16} />}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, fontSize: '0.86rem', fontFamily: 'monospace', color: isActive ? 'hsl(var(--warning))' : 'hsl(var(--primary))' }}>
                #{String(run._id).slice(-8).toUpperCase()}
              </span>
              <span style={{
                fontSize: '0.68rem',
                padding: '2px 8px',
                borderRadius: '10px',
                backgroundColor: `${statusColor}18`,
                color: statusColor,
                fontWeight: 800,
                textTransform: 'uppercase',
                border: `1px solid ${statusColor}35`,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                {isActive && <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'hsl(var(--warning))', animation: 'pulse 1.5s infinite' }} />}
                {run.status?.replace(/_/g, ' ')}
              </span>
              {isInsideActiveBanner && (
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'hsl(var(--text-primary))' }}>
                  {autoName}
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'hsl(var(--text-muted))', marginTop: '2px' }}>
              Dispatched: {new Date(run.dispatchedAt || run.createdAt).toLocaleString()} • Mode: <span style={{ textTransform: 'capitalize' }}>{run.runType || 'scheduled'}</span>
            </div>
          </div>
        </div>

        {/* Run summary metrics and launch button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'right', fontSize: '0.78rem' }}>
            <span style={{ color: 'hsl(var(--text-muted))' }}>Target Lots:</span> <strong>{run.snapshotInventoryIds?.length || 0} Lots</strong>
          </div>

          <div style={{ textAlign: 'right', fontSize: '0.78rem' }}>
            <span style={{ color: 'hsl(var(--text-muted))' }}>Bids:</span> <strong>{runBids.length}</strong>
          </div>

          {runDollarValue > 0 && (
            <div style={{ textAlign: 'right', fontSize: '0.82rem', fontWeight: 800, color: 'hsl(var(--success))' }}>
              ${runDollarValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          )}

          {isActive && onForceExpireRun && (
            <button
              type="button"
              className="btn btn-warning"
              onClick={(e) => {
                e.stopPropagation();
                onForceExpireRun(run._id);
              }}
              style={{ fontSize: '0.72rem', padding: '4px 10px' }}
            >
              Force Expire
            </button>
          )}

          <button
            type="button"
            className="btn btn-secondary"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedRunForAudit(run);
            }}
            style={{ fontSize: '0.75rem', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            Full-Screen Audit Log <ArrowUpRight size={14} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div data-testid="workflow-run-history-view" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* ══ TOP CONTROLS & SEARCH BAR ════════════════════════════════════════ */}
      <div className="card" style={{ padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={22} style={{ color: 'hsl(var(--primary))' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>
              Run History & Audit Log
            </h3>
            <span style={{
              fontSize: '0.75rem',
              padding: '3px 10px',
              borderRadius: '12px',
              backgroundColor: 'hsl(var(--primary) / 12%)',
              color: 'hsl(var(--primary))',
              fontWeight: 800
            }}>
              {automationRuns.length} Total Executions
            </span>
          </div>

          <div style={{ position: 'relative', minWidth: '240px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--text-muted))' }} />
            <input
              type="text"
              placeholder="Search workflows, run IDs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 12px 6px 30px',
                borderRadius: '6px',
                backgroundColor: 'hsl(var(--bg-card))',
                border: '1px solid hsl(var(--border-color))',
                fontSize: '0.82rem',
                color: 'hsl(var(--text-primary))'
              }}
            />
          </div>
        </div>

        {/* Status Filters and Expand/Collapse Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleExpandAll}
              style={{ fontSize: '0.72rem', padding: '4px 8px' }}
            >
              Expand All
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleCollapseAll}
              style={{ fontSize: '0.72rem', padding: '4px 8px' }}
            >
              Collapse All
            </button>
          </div>

          <div style={{ display: 'flex', gap: '4px' }}>
            {(['all', 'evaluating', 'awarded', 'fallback_executed', 'failed'] as const).map(filterKey => {
              const filterLabels: Record<string, string> = {
                all: 'All',
                evaluating: 'Evaluating',
                awarded: 'Awarded',
                fallback_executed: 'Fallback',
                failed: 'Failed'
              };
              return (
                <button
                  key={filterKey}
                  type="button"
                  data-testid={`filter-${filterKey}`}
                  className={`btn ${selectedStatusFilter === filterKey ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setSelectedStatusFilter(filterKey)}
                  style={{ fontSize: '0.72rem', padding: '4px 10px' }}
                >
                  {filterLabels[filterKey]}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ══ ACTIVE EVALUATIONS HIGHLIGHT BANNER ══════════════════════════════ */}
      {activeRuns.length > 0 && selectedStatusFilter !== 'awarded' && selectedStatusFilter !== 'fallback_executed' && selectedStatusFilter !== 'failed' && (
        <div className="card" style={{ border: '1px solid hsl(var(--warning) / 50%)', backgroundColor: 'hsl(var(--warning) / 6%)', padding: '18px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={18} style={{ color: 'hsl(var(--warning))' }} />
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'hsl(var(--text-primary))' }}>
                Active Workflow Evaluations In-Progress ({activeRuns.length})
              </h4>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'hsl(var(--text-muted))' }}>
              Live Bidding & Stage Escalations
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {activeRuns.map(run => renderExecutionRunRow(run, true))}
          </div>
        </div>
      )}

      {/* ══ WORKFLOW-GROUPED STRATEGY CARDS ═════════════════════════════════ */}
      {groupedWorkflows.length === 0 ? (
        <div className="card" style={{ padding: '48px', textAlign: 'center', color: 'hsl(var(--text-muted))' }}>
          <History size={36} style={{ opacity: 0.3, marginBottom: '12px' }} />
          <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>No workflow execution logs found</div>
          <div style={{ fontSize: '0.78rem', marginTop: '4px' }}>
            {searchQuery || selectedStatusFilter !== 'all'
              ? 'Try resetting your filter or search terms.'
              : 'Trigger a workflow run from the Campaign Builder or wait for scheduled dispatch.'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {groupedWorkflows.map(([groupKey, { workflow, runs }]) => {
            const isCollapsed = collapsedWorkflows[groupKey] || false;
            const completedRuns = runs.filter(r => r.status !== 'evaluating' && r.status !== 'dispatched');
            const awardedRuns = runs.filter(r => r.status === 'awarded');
            const awardRate = completedRuns.length > 0 ? Math.round((awardedRuns.length / completedRuns.length) * 100) : 0;

            // Calculate cumulative dollar recovery across all runs of this workflow
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
                className="card"
                style={{
                  padding: 0,
                  overflow: 'hidden',
                  border: '1px solid hsl(var(--border-color))',
                  transition: 'border-color 0.15s ease'
                }}
              >
                {/* Workflow Strategy Group Header */}
                <div
                  onClick={() => toggleWorkflowCollapse(groupKey)}
                  style={{
                    padding: '16px 20px',
                    backgroundColor: 'hsl(var(--bg-card-hover) / 25%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    userSelect: 'none',
                    borderBottom: isCollapsed ? 'none' : '1px solid hsl(var(--border-color))'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                      type="button"
                      style={{ background: 'none', border: 'none', color: 'hsl(var(--text-muted))', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      aria-label={isCollapsed ? 'Expand workflow' : 'Collapse workflow'}
                    >
                      {isCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                    </button>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.96rem', color: 'hsl(var(--text-primary))' }}>
                          {workflow.name || workflow.templateName || 'Saved Workflow Strategy'}
                        </span>
                        <span style={{
                          fontSize: '0.68rem',
                          padding: '2px 8px',
                          borderRadius: '10px',
                          backgroundColor: 'hsl(var(--primary) / 15%)',
                          color: 'hsl(var(--primary))',
                          fontWeight: 700
                        }}>
                          {runs.length} {runs.length === 1 ? 'Run' : 'Runs'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'hsl(var(--text-muted))', marginTop: '2px' }}>
                        {lastRun
                          ? `Latest Run: ${new Date(lastRun.dispatchedAt || lastRun.createdAt).toLocaleString()} • ${lastRun.status?.replace(/_/g, ' ')}`
                          : 'No execution records yet'}
                      </div>
                    </div>
                  </div>

                  {/* Summary Metrics on Card Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                    {cumulativeRecovery > 0 && (
                      <div data-testid="strategy-cumulative-recovery" style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.68rem', color: 'hsl(var(--text-muted))' }}>Cumulative Recovery</div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'hsl(var(--success))' }}>
                          ${cumulativeRecovery.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    )}

                    {completedRuns.length > 0 && (
                      <div data-testid="strategy-clearance-rate" style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.68rem', color: 'hsl(var(--text-muted))' }}>Clearance Rate</div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 800, color: awardRate >= 50 ? 'hsl(var(--success))' : 'hsl(var(--warning))' }}>
                          {awardRate}%
                        </div>
                      </div>
                    )}

                    <span style={{
                      fontSize: '0.72rem',
                      color: 'hsl(var(--primary))',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      {isCollapsed ? 'View Runs' : 'Hide Runs'}
                    </span>
                  </div>
                </div>

                {/* Expanded Run Rows List */}
                {!isCollapsed && (
                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {runs.length === 0 ? (
                      <div style={{ padding: '24px', textAlign: 'center', color: 'hsl(var(--text-muted))', fontSize: '0.82rem' }}>
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
          onClose={() => setSelectedRunForAudit(null)}
          onForceExpire={onForceExpireRun}
          onReTrigger={onReTriggerRun}
          onSelectLot={onSelectLot}
        />
      )}
    </div>
  );
};
