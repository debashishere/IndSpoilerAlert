import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { WorkflowRunTimelineStepper } from '../components/WorkflowRunTimelineStepper';
import { WorkflowRunAuditModal } from '../components/WorkflowRunAuditModal';

describe('Issue 07: Execution Audit Inspector — Stage Timeline UI', () => {
  const mockStages = [
    {
      stageNumber: 1,
      name: 'Primary Tier Bargain',
      stageType: 'liquidation',
      discountType: 'percentage_off_wholesale',
      discountValue: 20,
      waitHours: 24,
      buyerMode: 'segment',
      buyerSegment: 'Wholesale Tier 1'
    },
    {
      stageNumber: 2,
      name: 'Donation Divert & Food Bank',
      stageType: 'donation',
      discountType: 'fixed_price',
      discountValue: 0,
      waitHours: 12,
      buyerMode: 'custom',
      customBuyers: ['Non-Profit Partner 1']
    }
  ];

  describe('Slice 1: Sequential stageExecutions rendering', () => {
    it('renders one node per entry in run.stageExecutions[] in stageIndex order with stage name, type, fired timestamp, buyer count, lot count, and status badge', () => {
      const mockRun = {
        _id: 'run-stage-seq-1',
        automationId: 'auto-101',
        status: 'partially_awarded',
        currentStageIndex: 0,
        stageExecutions: [
          {
            stageIndex: 1,
            firedAt: new Date('2026-08-18T10:00:00.000Z'),
            buyerEmails: ['partner@charity.org'],
            lotsOffered: [
              { lotId: 'lot-2', awardedQty: 0, remainingQty: 50 }
            ],
            status: 'pending'
          },
          {
            stageIndex: 0,
            firedAt: new Date('2026-08-18T08:00:00.000Z'),
            buyerEmails: ['buyer1@liquidation.com', 'buyer2@liquidation.com'],
            lotsOffered: [
              { lotId: 'lot-1', awardedQty: 100, remainingQty: 0 },
              { lotId: 'lot-2', awardedQty: 0, remainingQty: 50 }
            ],
            status: 'partially_awarded'
          }
        ],
        snapshotInventoryIds: ['lot-1', 'lot-2'],
      };

      render(
        <WorkflowRunTimelineStepper
          run={mockRun}
          stages={mockStages}
        />
      );

      // Verify node 1 (Stage index 0)
      const stage0Node = screen.getByTestId('stage-step-1');
      expect(stage0Node).toBeInTheDocument();
      expect(stage0Node).toHaveTextContent('Primary Tier Bargain');
      expect(stage0Node).toHaveTextContent(/liquidation/i);
      expect(stage0Node).toHaveTextContent(/partially awarded|partially_awarded/i);
      expect(stage0Node).toHaveTextContent('2 Buyers');
      expect(stage0Node).toHaveTextContent('2 Lots');

      // Verify node 2 (Stage index 1)
      const stage1Node = screen.getByTestId('stage-step-2');
      expect(stage1Node).toBeInTheDocument();
      expect(stage1Node).toHaveTextContent('Donation Divert & Food Bank');
      expect(stage1Node).toHaveTextContent(/donation/i);
      expect(stage1Node).toHaveTextContent(/pending/i);
      expect(stage1Node).toHaveTextContent('1 Buyer');
      expect(stage1Node).toHaveTextContent('1 Lot');
    });

    it('renders all configured stages even when only the active stage has an entry in stageExecutions', () => {
      const mockRunActiveStage0Only = {
        _id: 'run-stage-active-0-only',
        automationId: 'auto-101',
        status: 'evaluating',
        currentStageIndex: 0,
        stageExecutions: [
          {
            stageIndex: 0,
            firedAt: new Date('2026-08-18T08:00:00.000Z'),
            buyerEmails: ['buyer1@liquidation.com'],
            lotsOffered: [{ lotId: 'lot-1', awardedQty: 0, remainingQty: 100 }],
            status: 'dispatched',
          },
        ],
        snapshotInventoryIds: ['lot-1'],
      };

      const threeStages = [
        ...mockStages,
        {
          stageNumber: 3,
          name: 'Final Eco Landfill',
          stageType: 'landfill',
          waitHours: 6,
          buyerMode: 'all',
        },
      ];

      render(
        <WorkflowRunTimelineStepper
          run={mockRunActiveStage0Only}
          stages={threeStages}
        />
      );

      // Verify all 3 stages are rendered in the execution timeline
      expect(screen.getByTestId('stage-step-1')).toBeInTheDocument();
      expect(screen.getByTestId('stage-step-1')).toHaveTextContent('Primary Tier Bargain');
      expect(screen.getByTestId('stage-step-1')).toHaveTextContent(/active window/i);

      expect(screen.getByTestId('stage-step-2')).toBeInTheDocument();
      expect(screen.getByTestId('stage-step-2')).toHaveTextContent('Donation Divert & Food Bank');
      expect(screen.getByTestId('stage-step-2')).toHaveTextContent(/donation/i);

      expect(screen.getByTestId('stage-step-3')).toBeInTheDocument();
      expect(screen.getByTestId('stage-step-3')).toHaveTextContent('Final Eco Landfill');
      expect(screen.getByTestId('stage-step-3')).toHaveTextContent(/landfill/i);
    });

    it('renders exactly 4 stages without creating an extra 5th dynamic stage when 4 stages are configured and stageExecutions has stageIndex 0', () => {
      const fourStages = [
        { stageIndex: 1, name: 'Stage 1: Primary Buyers', waitHours: 24, stageType: 'liquidation' },
        { stageIndex: 2, name: 'Stage 2: Secondary Liquidators', waitHours: 48, stageType: 'liquidation' },
        { stageIndex: 3, name: 'Stage 3: Salvage Markdown', waitHours: 24, stageType: 'liquidation' },
        { stageIndex: 4, name: 'Stage 4: Final Eco Disposal', waitHours: 12, stageType: 'landfill' },
      ];

      const mockRun = {
        _id: 'run-4-stages',
        automationId: 'auto-404',
        status: 'evaluating',
        currentStageIndex: 0,
        stageExecutions: [
          {
            stageIndex: 0,
            firedAt: new Date('2026-08-18T08:00:00.000Z'),
            buyerEmails: ['buyer1@example.com'],
            lotsOffered: [{ lotId: 'lot-1' }],
            status: 'dispatched',
          }
        ],
        snapshotInventoryIds: ['lot-1'],
      };

      render(
        <WorkflowRunTimelineStepper
          run={mockRun}
          stages={fourStages}
        />
      );

      expect(screen.getByTestId('stage-step-1')).toBeInTheDocument();
      expect(screen.getByTestId('stage-step-2')).toBeInTheDocument();
      expect(screen.getByTestId('stage-step-3')).toBeInTheDocument();
      expect(screen.getByTestId('stage-step-4')).toBeInTheDocument();
      expect(screen.queryByTestId('stage-step-5')).not.toBeInTheDocument();
      expect(screen.getByText(/4 Configured Stage Gates/i)).toBeInTheDocument();
    });
  });

  describe('Slice 2: Active stage countdown & escalation transition indicator', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('renders a live countdown timer for the active stage using firedAt + waitHours as deadline', () => {
      const baseTime = new Date('2026-08-18T10:00:00.000Z').getTime();
      vi.setSystemTime(baseTime);

      const mockRun = {
        _id: 'run-active-timer',
        automationId: 'auto-101',
        status: 'evaluating',
        currentStageIndex: 1,
        stageExecutions: [
          {
            stageIndex: 0,
            firedAt: new Date(baseTime - 24 * 3600000), // Fired 24h ago
            buyerEmails: ['tier1@buyer.com'],
            lotsOffered: [{ lotId: 'lot-1' }],
            status: 'expired'
          },
          {
            stageIndex: 1,
            firedAt: new Date(baseTime - 2 * 3600000), // Fired 2h ago, waitHours=12 -> 10h remaining
            buyerEmails: ['charity@partner.org'],
            lotsOffered: [{ lotId: 'lot-1' }],
            status: 'dispatched'
          }
        ],
      };

      render(
        <WorkflowRunTimelineStepper
          run={mockRun}
          stages={mockStages}
        />
      );

      const activeTimer = screen.getByTestId('stage-countdown-timer-2');
      expect(activeTimer).toBeInTheDocument();
      expect(activeTimer).toHaveTextContent('10h 00m 00s');
    });

    it('renders transition indicator "Escalating to Stage 2..." when run.status = escalating', () => {
      const mockRun = {
        _id: 'run-escalating',
        automationId: 'auto-101',
        status: 'escalating',
        currentStageIndex: 0,
        stageExecutions: [
          {
            stageIndex: 0,
            firedAt: new Date('2026-08-18T08:00:00.000Z'),
            buyerEmails: ['buyer@liquidators.com'],
            lotsOffered: [{ lotId: 'lot-1' }],
            status: 'escalating'
          }
        ],
      };

      render(
        <WorkflowRunTimelineStepper
          run={mockRun}
          stages={mockStages}
        />
      );

      const escalatingIndicator = screen.getByTestId('stage-escalating-indicator');
      expect(escalatingIndicator).toBeInTheDocument();
      expect(escalatingIndicator).toHaveTextContent('Escalating to Stage 2...');
    });
  });

  describe('Slice 3: Inventory Scope Tab Awarded vs Remaining Lots distinction', () => {
    it('visually distinguishes awarded lots from remaining lots with strikethrough/muted style and badge in the Inventory Scope Tab', () => {
      const mockRun = {
        _id: 'run-partial-award-inv',
        automationId: 'auto-101',
        status: 'partially_awarded',
        currentStageIndex: 0,
        stageExecutions: [
          {
            stageIndex: 0,
            firedAt: new Date('2026-08-18T08:00:00.000Z'),
            buyerEmails: ['buyer@liquidators.com'],
            lotsOffered: [
              { lotId: 'lot-1', awardedQty: 100, remainingQty: 0 },
              { lotId: 'lot-2', awardedQty: 0, remainingQty: 50 }
            ],
            status: 'partially_awarded'
          }
        ],
        snapshotInventoryIds: ['lot-1', 'lot-2'],
      };

      const mockInventory = [
        {
          _id: 'lot-1',
          lotNumber: 'LOT-AWARDED-01',
          sku: 'SKU-DAIRY-YOGURT',
          description: 'Greek Yogurt 32oz',
          quantityCases: 100,
          rsl: 15,
          pricePerCase: 10
        },
        {
          _id: 'lot-2',
          lotNumber: 'LOT-REMAINING-02',
          sku: 'SKU-DAIRY-CHEESE',
          description: 'Cheddar Cheese Block',
          quantityCases: 50,
          rsl: 20,
          pricePerCase: 15
        }
      ];

      render(
        <WorkflowRunAuditModal
          run={mockRun}
          inventoryList={mockInventory}
          onClose={() => {}}
        />
      );

      // Switch to Inventory Scope tab
      const inventoryTabBtn = screen.getByRole('button', { name: /Inventory Scope/i });
      fireEvent.click(inventoryTabBtn);

      const awardedRow = screen.getByTestId('lot-row-awarded');
      expect(awardedRow).toBeInTheDocument();
      expect(awardedRow).toHaveTextContent('LOT-AWARDED-01');
      expect(awardedRow).toHaveTextContent(/Awarded/i);

      const remainingRow = screen.getByTestId('lot-row-remaining');
      expect(remainingRow).toBeInTheDocument();
      expect(remainingRow).toHaveTextContent('LOT-REMAINING-02');
      expect(remainingRow).toHaveTextContent(/Remaining|Active/i);
    });
  });

  describe('Slice 4: Legacy runs fallback', () => {
    it('gracefully falls back to configured flat stages timeline when stageExecutions is undefined or empty', () => {
      const legacyRun = {
        _id: 'run-legacy-123',
        automationId: 'auto-101',
        status: 'evaluating',
        dispatchedAt: '2026-08-18T08:00:00.000Z',
        snapshotInventoryIds: ['lot-1'],
        buyerEmails: ['buyer@legacy.com'],
      };

      render(
        <WorkflowRunTimelineStepper
          run={legacyRun}
          stages={mockStages}
        />
      );

      // Should render the configured 2 stage gates
      expect(screen.getByText(/2 Configured Stage Gates/i)).toBeInTheDocument();
      expect(screen.getByTestId('stage-step-1')).toHaveTextContent('Primary Tier Bargain');
      expect(screen.getByTestId('stage-step-2')).toHaveTextContent('Donation Divert & Food Bank');
    });
  });
});
