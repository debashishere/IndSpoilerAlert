import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { WorkflowRunHistoryView } from '../components/WorkflowRunHistoryView';

describe('Slice 1: WorkflowRunHistoryView - Grouping, Health Metrics & Accordions', () => {
  const mockAutomations = [
    {
      _id: 'auto-1',
      name: 'Dairy Quick Clearance',
      templateName: 'short_dated_clearance',
      status: 'active'
    },
    {
      _id: 'auto-2',
      name: 'Bakery Batch Liquidation',
      templateName: 'category_liquidation',
      status: 'active'
    }
  ];

  const mockRuns = [
    {
      _id: 'run-001',
      automationId: 'auto-1',
      status: 'awarded',
      runType: 'scheduled',
      dispatchedAt: '2026-08-15T14:30:00.000Z',
      snapshotInventoryIds: ['lot-1', 'lot-2'],
      resolution: {
        totalValue: 3500.00,
        winningBuyer: 'Buyer Alpha'
      }
    },
    {
      _id: 'run-002',
      automationId: 'auto-1',
      status: 'fallback_executed',
      runType: 'manual',
      dispatchedAt: '2026-08-14T10:00:00.000Z',
      snapshotInventoryIds: ['lot-3'],
      resolution: {
        fallbackDecision: 'donate'
      }
    },
    {
      _id: 'run-003',
      automationId: 'auto-2',
      status: 'evaluating',
      runType: 'scheduled',
      dispatchedAt: '2026-08-16T08:00:00.000Z',
      snapshotInventoryIds: ['lot-4']
    },
    {
      _id: 'run-004',
      automationId: null,
      campaignSnapshot: { name: 'Ad-Hoc Holiday Blast' },
      status: 'awarded',
      runType: 'manual',
      dispatchedAt: '2026-08-13T12:00:00.000Z',
      snapshotInventoryIds: ['lot-5'],
      resolution: {
        winningPrice: 20,
        totalCases: 50
      }
    }
  ];

  const mockBids = [
    { _id: 'bid-1', inventoryLotId: 'lot-1', amount: 1800 },
    { _id: 'bid-2', inventoryLotId: 'lot-2', amount: 1700 }
  ];

  it('should group runs by parent workflow strategy and calculate aggregate health metrics', () => {
    render(
      <WorkflowRunHistoryView
        supplierId="sup-101"
        liquidationAutomations={mockAutomations}
        automationRuns={mockRuns}
        allBids={mockBids}
      />
    );

    // Verify Strategy Cards rendered for historical non-active workflows
    const strategyCards = screen.getAllByTestId('workflow-strategy-card');
    expect(strategyCards).toHaveLength(2); // auto-1 and ad-hoc (auto-2 is active so only in Active Evaluations)

    expect(screen.getByText('Dairy Quick Clearance')).toBeInTheDocument();
    expect(screen.getAllByText('Bakery Batch Liquidation')).toHaveLength(1); // Only in Active Evaluations Banner
    expect(screen.getByText('Ad-Hoc Holiday Blast')).toBeInTheDocument();

    // Verify run counts
    expect(screen.getByText('2 Runs')).toBeInTheDocument();
    expect(screen.getByText('1 Run')).toBeInTheDocument();

    // Verify Cumulative Recovery metric ($3,500.00 for auto-1, $1,000.00 for ad-hoc)
    const cumulativeRecoveryElements = screen.getAllByTestId('strategy-cumulative-recovery');
    expect(cumulativeRecoveryElements[0]).toHaveTextContent('$3,500.00');
    expect(cumulativeRecoveryElements[1]).toHaveTextContent('$1,000.00');

    // Verify Clearance Rate (auto-1 has 2 completed runs, 1 awarded = 50%)
    const clearanceRateElements = screen.getAllByTestId('strategy-clearance-rate');
    expect(clearanceRateElements[0]).toHaveTextContent('50%');

    // Verify Total Executions badge in main top header
    expect(screen.getByText('4 Total Executions')).toBeInTheDocument();
  });

  it('should support individual accordion toggling and global Expand All / Collapse All controls', () => {
    render(
      <WorkflowRunHistoryView
        supplierId="sup-101"
        liquidationAutomations={mockAutomations}
        automationRuns={mockRuns}
        allBids={mockBids}
      />
    );

    // By default, cards are expanded and execution run rows are visible
    expect(screen.getByText('#RUN-001')).toBeInTheDocument();
    expect(screen.getByText('#RUN-002')).toBeInTheDocument();

    // Click Collapse All
    const collapseAllBtn = screen.getByRole('button', { name: /collapse all/i });
    fireEvent.click(collapseAllBtn);

    // Run rows should not be in the document
    expect(screen.queryByText('#RUN-001')).not.toBeInTheDocument();
    expect(screen.queryByText('#RUN-002')).not.toBeInTheDocument();

    // Click individual card header to expand Dairy Quick Clearance
    fireEvent.click(screen.getByText('Dairy Quick Clearance'));
    expect(screen.getByText('#RUN-001')).toBeInTheDocument();
    expect(screen.getByText('#RUN-002')).toBeInTheDocument();

    // Click Expand All
    const expandAllBtn = screen.getByRole('button', { name: /expand all/i });
    fireEvent.click(expandAllBtn);
    expect(screen.getByText('#RUN-001')).toBeInTheDocument();
    expect(screen.getAllByText('#RUN-003').length).toBeGreaterThan(0);
    expect(screen.getByText('#RUN-004')).toBeInTheDocument();
  });

  it('should filter workflows and runs by search query', () => {
    render(
      <WorkflowRunHistoryView
        supplierId="sup-101"
        liquidationAutomations={mockAutomations}
        automationRuns={mockRuns}
        allBids={mockBids}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search workflows, run IDs...');

    // Search for "RUN-004"
    fireEvent.change(searchInput, { target: { value: 'RUN-004' } });

    expect(screen.getByText('Ad-Hoc Holiday Blast')).toBeInTheDocument();
    expect(screen.getByText('#RUN-004')).toBeInTheDocument();
    expect(screen.queryByText('Dairy Quick Clearance')).not.toBeInTheDocument();
    expect(screen.queryByText('#RUN-001')).not.toBeInTheDocument();

    // Clear search and search for "Dairy"
    fireEvent.change(searchInput, { target: { value: 'Dairy' } });
    expect(screen.getByText('Dairy Quick Clearance')).toBeInTheDocument();
    expect(screen.getByText('#RUN-001')).toBeInTheDocument();
    expect(screen.queryByText('Ad-Hoc Holiday Blast')).not.toBeInTheDocument();
  });

  it('should filter runs by status pills and display empty state when no runs match', () => {
    render(
      <WorkflowRunHistoryView
        supplierId="sup-101"
        liquidationAutomations={mockAutomations}
        automationRuns={mockRuns}
        allBids={mockBids}
      />
    );

    // Click "Awarded" filter pill
    const awardedFilterBtn = screen.getByTestId('filter-awarded');
    fireEvent.click(awardedFilterBtn);

    expect(screen.getByText('#RUN-001')).toBeInTheDocument();
    expect(screen.getByText('#RUN-004')).toBeInTheDocument();
    expect(screen.queryByText('#RUN-002')).not.toBeInTheDocument(); // fallback
    expect(screen.queryByText('#RUN-003')).not.toBeInTheDocument(); // evaluating

    // Click "Fallback" filter pill
    const fallbackFilterBtn = screen.getByTestId('filter-fallback_executed');
    fireEvent.click(fallbackFilterBtn);

    expect(screen.getByText('#RUN-002')).toBeInTheDocument();
    expect(screen.queryByText('#RUN-001')).not.toBeInTheDocument();

    // Click "Failed" filter pill (should show 0 matching runs)
    const failedFilterBtn = screen.getByTestId('filter-failed');
    fireEvent.click(failedFilterBtn);

    expect(screen.getByText('No workflow execution logs found')).toBeInTheDocument();
    expect(screen.getByText('Try resetting your filter or search terms.')).toBeInTheDocument();
  });

  it('should render active in-flight evaluations banner and trigger onForceExpireRun callback', () => {
    const handleForceExpire = vi.fn();

    render(
      <WorkflowRunHistoryView
        supplierId="sup-101"
        liquidationAutomations={mockAutomations}
        automationRuns={mockRuns}
        allBids={mockBids}
        onForceExpireRun={handleForceExpire}
      />
    );

    // Active evaluations banner should be visible with 1 active run (#RUN-003)
    expect(screen.getByText(/Active Workflow Evaluations In-Progress \(1\)/i)).toBeInTheDocument();

    const forceExpireBtns = screen.getAllByRole('button', { name: /force expire/i });
    expect(forceExpireBtns.length).toBeGreaterThan(0);

    fireEvent.click(forceExpireBtns[0]);
    expect(handleForceExpire).toHaveBeenCalledTimes(1);
    expect(handleForceExpire).toHaveBeenCalledWith('run-003');
  });

  it('should render itemized execution run rows and open the Audit modal on click', () => {
    render(
      <WorkflowRunHistoryView
        supplierId="sup-101"
        liquidationAutomations={mockAutomations}
        automationRuns={mockRuns}
        allBids={mockBids}
      />
    );

    // Verify run rows rendered
    const runRows = screen.getAllByTestId('execution-run-row');
    expect(runRows.length).toBeGreaterThanOrEqual(4);

    // Click on RUN-001 row to open audit modal
    fireEvent.click(runRows[0]);

    // Audit modal should be displayed
    expect(screen.getByTestId('workflow-run-audit-modal')).toBeInTheDocument();
    expect(screen.getByLabelText('Close Audit Inspector')).toBeInTheDocument();
  });

  it('should forward onReTriggerRun and onForceExpireRun to WorkflowRunAuditModal', () => {
    const handleReTrigger = vi.fn();
    const handleForceExpire = vi.fn();

    render(
      <WorkflowRunHistoryView
        supplierId="sup-101"
        liquidationAutomations={mockAutomations}
        automationRuns={mockRuns}
        allBids={mockBids}
        onReTriggerRun={handleReTrigger}
        onForceExpireRun={handleForceExpire}
      />
    );

    // Open evaluating run (RUN-003)
    const runRows = screen.getAllByTestId('execution-run-row');
    const evaluatingRow = runRows.find(r => r.textContent?.includes('RUN-003'));
    expect(evaluatingRow).toBeDefined();
    fireEvent.click(evaluatingRow!);

    expect(screen.getByTestId('workflow-run-audit-modal')).toBeInTheDocument();

    // Click Force Expire from inside modal
    const modalForceExpireBtn = screen.getByRole('button', { name: /force expire \/ resolve now/i });
    fireEvent.click(modalForceExpireBtn);
    expect(handleForceExpire).toHaveBeenCalledWith('run-003');

    // Click Re-Trigger Workflow from inside modal
    const reTriggerBtn = screen.getByRole('button', { name: /re-trigger workflow/i });
    fireEvent.click(reTriggerBtn);
    expect(handleReTrigger).toHaveBeenCalledWith(mockRuns[2]);
  });

  it('should render active workflows with highlighted warning color and unified list element details without duplicating in history list', () => {
    render(
      <WorkflowRunHistoryView
        supplierId="sup-101"
        liquidationAutomations={mockAutomations}
        automationRuns={mockRuns}
        allBids={mockBids}
      />
    );

    const runRows = screen.getAllByTestId('execution-run-row');
    // Active run rows (RUN-003) should only be present in top active evaluations banner and NOT duplicated in history cards
    const evaluatingRows = runRows.filter(r => r.textContent?.includes('RUN-003'));
    expect(evaluatingRows.length).toBe(1);

    // Check that the active row renders target lots, bids count, and audit button
    evaluatingRows.forEach(row => {
      expect(row).toHaveTextContent('1 Lots');
      expect(row).toHaveTextContent('Full-Screen Audit Log');
      expect(row).toHaveTextContent('evaluating');
    });
  });

  it('should render flow-8 only in Active Workflow Evaluations when active, without duplicate rendering in History list', () => {
    const automations = [
      { _id: 'flow-8', name: 'Workflow flow-8', status: 'active' },
      { _id: 'flow-9', name: 'Workflow flow-9', status: 'active' }
    ];
    const runs = [
      {
        _id: 'run-flow-8',
        automationId: 'flow-8',
        status: 'evaluating',
        runType: 'scheduled',
        dispatchedAt: '2026-08-17T12:00:00.000Z',
        snapshotInventoryIds: ['lot-8']
      },
      {
        _id: 'run-flow-9',
        automationId: 'flow-9',
        status: 'awarded',
        runType: 'scheduled',
        dispatchedAt: '2026-08-16T12:00:00.000Z',
        snapshotInventoryIds: ['lot-9'],
        resolution: { totalValue: 1200 }
      }
    ];

    render(
      <WorkflowRunHistoryView
        supplierId="sup-101"
        liquidationAutomations={automations}
        automationRuns={runs}
      />
    );

    // flow-8 should appear in the Active Workflow Evaluations banner
    expect(screen.getByText(/Active Workflow Evaluations In-Progress \(1\)/i)).toBeInTheDocument();
    expect(screen.getByText(/#N-FLOW-8/i)).toBeInTheDocument();

    // In the History list below, only flow-9 (non-active) should be rendered as a strategy card
    const strategyCards = screen.getAllByTestId('workflow-strategy-card');
    expect(strategyCards).toHaveLength(1);
    expect(screen.getByText('Workflow flow-9')).toBeInTheDocument();

    // flow-8 should only have 1 instance in the entire document (in the Active banner)
    expect(screen.getAllByText('Workflow flow-8')).toHaveLength(1);
  });
});

