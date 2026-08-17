import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import React from 'react';
import { WorkflowRunAuditModal } from '../components/WorkflowRunAuditModal';
import { WorkflowRunTimelineStepper, formatTimeRemaining } from '../components/WorkflowRunTimelineStepper';
import { WorkflowRunHistoryView } from '../components/WorkflowRunHistoryView';

describe('Slice 2: Full-Screen Execution Audit Inspector & Stage-Gate Stepper', () => {
  const mockWorkflow = {
    _id: 'auto-101',
    name: 'Short-Dated Bakery & Dairy Clearance',
    categoryFilter: 'Dairy & Chilled',
    maxRslFilter: 25,
    minCasesFilter: 100,
    stages: [
      {
        stageNumber: 1,
        name: 'Tier 1 Wholesale Bargain',
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
        customBuyers: ['Non-Profit Partner 1', 'City Food Bank'],
        allocatedLotIds: ['lot-101', 'lot-102']
      },
      {
        stageNumber: 3,
        name: 'Eco Waste Disposal',
        stageType: 'landfill',
        waitHours: 6,
        buyerMode: 'all'
      }
    ]
  };

  const mockRunAwarded = {
    _id: 'run-99887766',
    automationId: 'auto-101',
    status: 'awarded',
    runType: 'scheduled',
    dispatchedAt: '2026-08-15T10:00:00.000Z',
    snapshotInventoryIds: ['lot-101', 'lot-102'],
    resolution: {
      action: 'auto_award',
      winningPrice: 24.50,
      totalCases: 250,
      totalValue: 6125.00,
      targetBuyerId: {
        _id: 'buyer-1',
        companyName: 'Apex Grocery Liquidators'
      },
      resolvedAt: '2026-08-15T14:30:00.000Z'
    },
    buyerEmails: ['purchasing@apexliquidators.com', 'buyer2@b2bwholesale.org']
  };

  const mockRunEvaluating = {
    _id: 'run-11223344',
    automationId: 'auto-101',
    status: 'evaluating',
    runType: 'manual',
    dispatchedAt: '2026-08-16T08:00:00.000Z',
    snapshotInventoryIds: ['lot-101'],
    buyerEmails: ['bids@liquidationhub.com']
  };

  const mockInventory = [
    {
      _id: 'lot-101',
      lotNumber: 'LOT-CHILLED-001',
      sku: 'SKU-DAIRY-YOGURT',
      description: 'Organic Greek Yogurt 32oz',
      quantityCases: 150,
      rsl: 18
    },
    {
      _id: 'lot-102',
      lotNumber: 'LOT-CHILLED-002',
      sku: 'SKU-DAIRY-MILK',
      description: 'Whole Milk Pasteurized 1gal',
      quantityCases: 100,
      rsl: 14
    }
  ];

  const mockBids = [
    {
      _id: 'bid-1',
      inventoryLotId: 'lot-101',
      buyerName: 'Apex Grocery Liquidators',
      sku: 'SKU-DAIRY-YOGURT',
      price: 24.50,
      quantityCases: 150,
      status: 'accepted'
    },
    {
      _id: 'bid-2',
      inventoryLotId: 'lot-101',
      buyerName: 'Discount Surplus Mart',
      sku: 'SKU-DAIRY-YOGURT',
      price: 18.00,
      quantityCases: 150,
      status: 'rejected'
    }
  ];

  describe('Sticky Executive Header & 4-Card Summary Overview', () => {
    it('renders the sticky executive audit header with key telemetry and indicators', () => {
      const handleClose = vi.fn();
      render(
        <WorkflowRunAuditModal
          run={mockRunAwarded}
          workflow={mockWorkflow}
          inventoryList={mockInventory}
          allBids={mockBids}
          onClose={handleClose}
        />
      );

      // Verify Header details
      expect(screen.getAllByText('Short-Dated Bakery & Dairy Clearance').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('ID: #99887766')).toBeInTheDocument();
      expect(screen.getByText('awarded')).toBeInTheDocument();
      expect(screen.getByText(/scheduled/i)).toBeInTheDocument();
      expect(screen.getByText(/Total Recovered/i)).toBeInTheDocument();
      expect(screen.getByText(/\$6,125\.00 Total Recovered/i)).toBeInTheDocument();

      // Verify Close Button interaction
      const closeBtn = screen.getByLabelText('Close Audit Inspector');
      fireEvent.click(closeBtn);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('renders 4-card metric overview and resolution audit details in Summary tab', () => {
      render(
        <WorkflowRunAuditModal
          run={mockRunAwarded}
          workflow={mockWorkflow}
          inventoryList={mockInventory}
          allBids={mockBids}
          onClose={vi.fn()}
        />
      );

      // 4-Card Metric Overview
      expect(screen.getByText('2 Lots')).toBeInTheDocument();
      expect(screen.getByText('250 Total Cases Evaluated')).toBeInTheDocument();
      expect(screen.getByText('$24.50/case')).toBeInTheDocument();
      expect(screen.getByText('Winning Bid Price')).toBeInTheDocument();
      expect(screen.getByText('$6,125.00')).toBeInTheDocument();
      expect(screen.getByText('Total Dollar Recovery')).toBeInTheDocument();

      // Resolution Audit details
      expect(screen.getByText(/Resolution Audit Details & Outcome/i)).toBeInTheDocument();
      expect(screen.getByText('auto award')).toBeInTheDocument();
      expect(screen.getByText('Apex Grocery Liquidators')).toBeInTheDocument();
    });
  });

  describe('Tab Bar — 5-tab contract (issue #01)', () => {
    it('renders exactly 5 audit tabs with no Raw Telemetry button', () => {
      render(
        <WorkflowRunAuditModal
          run={mockRunAwarded}
          workflow={mockWorkflow}
          inventoryList={mockInventory}
          allBids={mockBids}
          onClose={vi.fn()}
        />
      );

      // The 4 expected tabs must all be present
      expect(screen.getByRole('button', { name: /summary & timeline/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /inventory scope/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /communications log/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /bids & offers ledger/i })).toBeInTheDocument();

      // The Strategy Snapshot and Raw Telemetry tabs must be absent
      expect(screen.queryByRole('button', { name: /strategy snapshot/i })).toBeNull();
      expect(screen.queryByRole('button', { name: /raw telemetry/i })).toBeNull();
    });
  });

  describe('Stage Execution Stepper (WorkflowRunTimelineStepper)', () => {
    it('renders polymorphic stages with indicators, pricing rules, wait windows, and audience targets', () => {
      render(
        <WorkflowRunTimelineStepper
          run={mockRunAwarded}
          stages={mockWorkflow.stages}
        />
      );

      expect(screen.getByText(/Stage-Gate Execution Timeline & Escalation Trace/i)).toBeInTheDocument();
      expect(screen.getByText('3 Configured Stage Gates')).toBeInTheDocument();

      // Stage 1 - Liquidation
      expect(screen.getByText('Stage 1: Tier 1 Wholesale Bargain')).toBeInTheDocument();
      expect(screen.getByText('liquidation')).toBeInTheDocument();
      expect(screen.getByText(/1 Day/i)).toBeInTheDocument();
      expect(screen.getByText(/20% \(percentage off wholesale\)/i)).toBeInTheDocument();
      expect(screen.getByText('Wholesale Tier 1')).toBeInTheDocument();

      // Stage 2 - Donation
      expect(screen.getByText('Stage 2: Donation Divert & Food Bank')).toBeInTheDocument();
      expect(screen.getByText('donation')).toBeInTheDocument();
      expect(screen.getByText(/12 Hours/i)).toBeInTheDocument();
      expect(screen.getByText('2 Custom Partners')).toBeInTheDocument();
      expect(screen.getByText('2 Lots')).toBeInTheDocument();

      // Stage 3 - Landfill
      expect(screen.getByText('Stage 3: Eco Waste Disposal')).toBeInTheDocument();
      expect(screen.getByText('landfill')).toBeInTheDocument();
      expect(screen.getByText(/6 Hours/i)).toBeInTheDocument();
    });

    it('highlights stage progress properly for active evaluating run', () => {
      render(
        <WorkflowRunTimelineStepper
          run={mockRunEvaluating}
          stages={mockWorkflow.stages}
        />
      );

      // In evaluating state, stage 1 is active (renders stage 1 step number instead of completed checkmark)
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('displays input-aware formatted execution windows for minutes, hours, and days in timeline stepper', () => {
      const explicitUnitStages = [
        {
          stageNumber: 1,
          name: 'Flash Minute Window',
          stageType: 'liquidation',
          waitHours: 0.5,
          waitUnit: 'm' as const
        },
        {
          stageNumber: 2,
          name: 'Standard Day Window',
          stageType: 'donation',
          waitHours: 48,
          waitUnit: 'd' as const
        },
        {
          stageNumber: 3,
          name: 'Explicit Hour Window',
          stageType: 'landfill',
          waitHours: 12,
          waitUnit: 'h' as const
        }
      ];

      render(
        <WorkflowRunTimelineStepper
          run={mockRunAwarded}
          stages={explicitUnitStages}
        />
      );

      expect(screen.getByText('30 Mins')).toBeInTheDocument();
      expect(screen.getByText('2 Days')).toBeInTheDocument();
      expect(screen.getByText('12 Hours')).toBeInTheDocument();
    });
  });

  describe('Audit Tabs Navigation & Interactive Handlers', () => {
    it('switches between audit tabs and renders data snapshots correctly', () => {
      const handleSelectLot = vi.fn();
      const handleClose = vi.fn();

      render(
        <WorkflowRunAuditModal
          run={mockRunAwarded}
          workflow={mockWorkflow}
          inventoryList={mockInventory}
          allBids={mockBids}
          onClose={handleClose}
          onSelectLot={handleSelectLot}
        />
      );

      // Summary & Timeline (active by default) renders Strategy Configuration Active at Dispatch
      expect(screen.getByText('Strategy Configuration Active at Dispatch')).toBeInTheDocument();
      expect(screen.getByText('Dairy & Chilled')).toBeInTheDocument();
      expect(screen.getByText('25% Remaining Shelf Life')).toBeInTheDocument();
      expect(screen.getByText('100 Cases')).toBeInTheDocument();

      // Switch to Inventory Scope
      fireEvent.click(screen.getByRole('button', { name: /inventory scope \(2\)/i }));
      expect(screen.getByText('Evaluated Inventory Lots (2)')).toBeInTheDocument();
      expect(screen.getByText('LOT-CHILLED-001')).toBeInTheDocument();
      expect(screen.getByText('Organic Greek Yogurt 32oz')).toBeInTheDocument();
      expect(screen.getByText('18% RSL')).toBeInTheDocument();

      // Click "View in Lot Hub"
      const viewLotBtn = screen.getAllByRole('button', { name: /view in lot hub/i })[0];
      fireEvent.click(viewLotBtn);
      expect(handleClose).toHaveBeenCalled();
      expect(handleSelectLot).toHaveBeenCalledWith(mockInventory[0]);

      // Switch to Communications Log
      fireEvent.click(screen.getByRole('button', { name: /communications log \(2\)/i }));
      expect(screen.getByText('purchasing@apexliquidators.com')).toBeInTheDocument();
      expect(screen.getByText('buyer2@b2bwholesale.org')).toBeInTheDocument();
      expect(screen.getAllByText('Delivered')).toHaveLength(2);

      // Switch to Bids & Offers Ledger
      fireEvent.click(screen.getByRole('button', { name: /bids & offers ledger \(2\)/i }));
      expect(screen.getByText('Buyer Bids & Evaluation Ledger (2)')).toBeInTheDocument();
      expect(screen.getByText('$24.50')).toBeInTheDocument();
      expect(screen.getByText('Awarded / Winning')).toBeInTheDocument();
      expect(screen.getByText('Discount Surplus Mart')).toBeInTheDocument();
      expect(screen.getByText('Outbid')).toBeInTheDocument();
    });


    it('triggers onForceExpire for active evaluating run and onReTrigger action', () => {
      const handleForceExpire = vi.fn();
      const handleReTrigger = vi.fn();

      render(
        <WorkflowRunAuditModal
          run={mockRunEvaluating}
          workflow={mockWorkflow}
          inventoryList={mockInventory}
          onClose={vi.fn()}
          onForceExpire={handleForceExpire}
          onReTrigger={handleReTrigger}
        />
      );

      // Force Expire button
      const forceExpireBtn = screen.getByRole('button', { name: /force expire \/ resolve now/i });
      fireEvent.click(forceExpireBtn);
      expect(handleForceExpire).toHaveBeenCalledWith('run-11223344');

      // Re-trigger button
      const reTriggerBtn = screen.getByRole('button', { name: /re-trigger workflow/i });
      fireEvent.click(reTriggerBtn);
      expect(handleReTrigger).toHaveBeenCalledWith(mockRunEvaluating);
    });
  });

  describe('Integration with WorkflowRunHistoryView', () => {
    it('opens and closes the WorkflowRunAuditModal when clicking run rows in WorkflowRunHistoryView', () => {
      render(
        <WorkflowRunHistoryView
          supplierId="sup-101"
          liquidationAutomations={[mockWorkflow]}
          automationRuns={[mockRunAwarded]}
          inventoryList={mockInventory}
          allBids={mockBids}
        />
      );

      // Verify row exists
      const runRow = screen.getByText('#99887766');
      expect(runRow).toBeInTheDocument();

      // Click row to open modal
      fireEvent.click(runRow);

      // Audit modal is visible with full data
      const modal = screen.getByTestId('workflow-run-audit-modal');
      expect(modal).toBeInTheDocument();
      expect(within(modal).getAllByText('Short-Dated Bakery & Dairy Clearance').length).toBeGreaterThanOrEqual(1);
      expect(within(modal).getByText('250 Total Cases Evaluated')).toBeInTheDocument();

      // Click close button
      const closeBtn = screen.getByLabelText('Close Audit Inspector');
      fireEvent.click(closeBtn);

      // Modal is dismissed
      expect(screen.queryByTestId('workflow-run-audit-modal')).not.toBeInTheDocument();
    });
  });

  describe('Slice 3: Granular Scope Tabs', () => {
    describe('Strategy Configuration Active at Dispatch in Summary & Timeline', () => {
      it('renders the exact immutable strategy configuration active at dispatch including discount schedules and audience targeting in timeline', () => {
        const runWithSnapshotOnly = {
          _id: 'run-snapshot-1',
          status: 'evaluating',
          runType: 'scheduled',
          dispatchedAt: '2026-08-16T10:00:00.000Z',
          campaignSnapshot: {
            name: 'Frozen Seafood Clearance',
            categoryFilter: 'Frozen & Seafood',
            maxRslFilter: 15,
            minCasesFilter: 80,
            stages: [
              {
                stageNumber: 1,
                name: 'Priority Wholesale Outlets',
                stageType: 'liquidation',
                discountType: 'percentage_off_wholesale',
                discountValue: 25,
                waitHours: 18,
                autoExecute: true,
                buyerMode: 'segment',
                buyerSegment: 'Wholesale Tier 1'
              },
              {
                stageNumber: 2,
                name: 'Secondary Food Rescue',
                stageType: 'donation',
                discountType: 'fixed_price',
                discountValue: 0,
                waitHours: 8,
                autoExecute: false,
                buyerMode: 'custom',
                customBuyers: ['Harbor Food Relief']
              }
            ]
          }
        };

        render(
          <WorkflowRunAuditModal
            run={runWithSnapshotOnly}
            onClose={vi.fn()}
          />
        );

        // Check Strategy headers and config in Summary & Timeline
        expect(screen.getAllByText('Frozen Seafood Clearance').length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('Frozen & Seafood')).toBeInTheDocument();
        expect(screen.getByText('15% Remaining Shelf Life')).toBeInTheDocument();
        expect(screen.getByText('80 Cases')).toBeInTheDocument();

        // Check Stage 1 in Stepper
        expect(screen.getByText(/Stage 1: Priority Wholesale Outlets/i)).toBeInTheDocument();
        expect(screen.getByText(/25% \(percentage off wholesale\)/i)).toBeInTheDocument();
        expect(screen.getAllByText(/18 hours/i).length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('Wholesale Tier 1')).toBeInTheDocument();

        // Check Stage 2 in Stepper
        expect(screen.getByText(/Stage 2: Secondary Food Rescue/i)).toBeInTheDocument();
        expect(screen.getByText('donation')).toBeInTheDocument();
        expect(screen.getAllByText(/\b8 hours/i).length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText(/1 Custom Partner/i)).toBeInTheDocument();
      });

      it('renders input-aware formatted execution windows for minutes, days, and hours in Summary & Timeline', () => {
        const runWithExplicitUnits = {
          _id: 'run-units-test',
          status: 'evaluating',
          dispatchedAt: '2026-08-16T10:00:00.000Z',
          campaignSnapshot: {
            name: 'Produce Express Clearance',
            stages: [
              {
                stageNumber: 1,
                name: 'Express Bidding Round',
                stageType: 'liquidation',
                discountValue: 10,
                waitHours: 0.5,
                waitUnit: 'm' as const
              },
              {
                stageNumber: 2,
                name: 'Extended Clearance',
                stageType: 'donation',
                discountValue: 0,
                waitHours: 72,
                waitUnit: 'd' as const
              }
            ]
          }
        };

        render(
          <WorkflowRunAuditModal
            run={runWithExplicitUnits}
            onClose={vi.fn()}
          />
        );

        expect(screen.getAllByText('30 Mins').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('3 Days').length).toBeGreaterThanOrEqual(1);
      });
    });

    describe('Inventory Scope Tab', () => {
      it('renders itemized evaluated lots with SKU, description, cases, RSL, and lot valuation', () => {
        const mockInventoryLots = [
          {
            _id: 'lot-301',
            lotNumber: 'LOT-CHILLED-301',
            sku: 'SKU-CHEESE-BLOCK',
            description: 'Aged Cheddar Cheese Blocks',
            quantityCases: 200,
            rsl: 22,
            pricePerCase: 18.50
          },
          {
            _id: 'lot-302',
            lotNumber: 'LOT-CHILLED-302',
            sku: 'SKU-BUTTER-SALTED',
            description: 'Grade A Salted Butter 1lb',
            quantityCases: 120,
            rsl: 10,
            costPerCase: 15.00
          }
        ];

        const runWithLots = {
          _id: 'run-inv-test',
          status: 'evaluating',
          dispatchedAt: '2026-08-16T10:00:00.000Z',
          snapshotInventoryIds: ['lot-301', 'lot-302']
        };

        const handleSelectLot = vi.fn();
        const handleClose = vi.fn();

        render(
          <WorkflowRunAuditModal
            run={runWithLots}
            inventoryList={mockInventoryLots}
            onClose={handleClose}
            onSelectLot={handleSelectLot}
          />
        );

        // Click Inventory Scope tab
        fireEvent.click(screen.getByRole('button', { name: /inventory scope \(2\)/i }));

        // Check header summary
        expect(screen.getByText('Evaluated Inventory Lots (2)')).toBeInTheDocument();
        expect(screen.getByText('320 Total Cases Evaluated')).toBeInTheDocument();

        // Check Lot 1 values including Valuation
        expect(screen.getByText('LOT-CHILLED-301')).toBeInTheDocument();
        expect(screen.getByText('SKU-CHEESE-BLOCK')).toBeInTheDocument();
        expect(screen.getByText('Aged Cheddar Cheese Blocks')).toBeInTheDocument();
        expect(screen.getByText('200 cases')).toBeInTheDocument();
        expect(screen.getByText('22% RSL')).toBeInTheDocument();
        expect(screen.getByText('$3,700.00')).toBeInTheDocument(); // 200 * $18.50

        // Check Lot 2 values including Valuation
        expect(screen.getByText('LOT-CHILLED-302')).toBeInTheDocument();
        expect(screen.getByText('SKU-BUTTER-SALTED')).toBeInTheDocument();
        expect(screen.getByText('Grade A Salted Butter 1lb')).toBeInTheDocument();
        expect(screen.getByText('120 cases')).toBeInTheDocument();
        expect(screen.getByText('10% RSL')).toBeInTheDocument();
        expect(screen.getByText('$1,800.00')).toBeInTheDocument(); // 120 * $15.00

        // Deep link action check
        const viewButtons = screen.getAllByRole('button', { name: /view in lot hub/i });
        expect(viewButtons).toHaveLength(2);
        fireEvent.click(viewButtons[0]);
        expect(handleClose).toHaveBeenCalled();
        expect(handleSelectLot).toHaveBeenCalledWith(mockInventoryLots[0]);
      });

      it('renders informative empty state when no inventory lots are attached to run snapshot', () => {
        const runWithoutLots = {
          _id: 'run-no-lots',
          status: 'evaluating',
          dispatchedAt: '2026-08-16T10:00:00.000Z',
          snapshotInventoryIds: []
        };

        render(
          <WorkflowRunAuditModal
            run={runWithoutLots}
            inventoryList={[]}
            onClose={vi.fn()}
          />
        );

        // Click Inventory Scope tab
        fireEvent.click(screen.getByRole('button', { name: /inventory scope \(0\)/i }));

        expect(screen.getByText('No specific inventory lots attached to this execution snapshot.')).toBeInTheDocument();
      });
    });

    describe('Communications Log Tab', () => {
      it('renders itemized partner outreach emails with recipient details, dispatch timestamp, and OAuth Gmail status', () => {
        const mockBuyers = [
          { _id: 'buyer-alpha', email: 'procurement@alphafoods.com', companyName: 'Alpha Foods B2B' },
          { _id: 'buyer-beta', email: 'contact@betasurplus.org', companyName: 'Beta Surplus Co' }
        ];

        const runWithComms = {
          _id: 'run-comms-test',
          status: 'evaluating',
          dispatchedAt: '2026-08-16T14:15:00.000Z',
          buyerEmails: ['procurement@alphafoods.com', 'contact@betasurplus.org']
        };

        render(
          <WorkflowRunAuditModal
            run={runWithComms}
            allBuyers={mockBuyers}
            onClose={vi.fn()}
          />
        );

        // Click Communications Log tab
        fireEvent.click(screen.getByRole('button', { name: /communications log \(2\)/i }));

        // Check title and ledger items
        expect(screen.getByText('Partner Dispatch & Communications Log')).toBeInTheDocument();
        expect(screen.getByText('procurement@alphafoods.com')).toBeInTheDocument();
        expect(screen.getByText('Alpha Foods B2B')).toBeInTheDocument();
        expect(screen.getByText('contact@betasurplus.org')).toBeInTheDocument();
        expect(screen.getByText('Beta Surplus Co')).toBeInTheDocument();

        // Check delivery badges & channel info
        expect(screen.getAllByText(/OAuth Gmail Direct/i)).toHaveLength(2);
        expect(screen.getAllByText('Delivered')).toHaveLength(2);
      });

      it('renders empty state when no outreach emails were dispatched', () => {
        const runNoComms = {
          _id: 'run-no-comms',
          status: 'evaluating',
          dispatchedAt: '2026-08-16T14:15:00.000Z',
          buyerEmails: [],
          evaluatedBuyerIds: []
        };

        render(
          <WorkflowRunAuditModal
            run={runNoComms}
            onClose={vi.fn()}
          />
        );

        fireEvent.click(screen.getByRole('button', { name: /communications log \(0\)/i }));
        expect(screen.getByText('No direct outreach emails were dispatched during this run execution.')).toBeInTheDocument();
      });
    });

    describe('Bids & Offers Ledger Tab', () => {
      it('renders buyer bids evaluation table with bidder names, target SKU, valuation, and winning bid highlight', () => {
        const mockBuyersList = [
          { _id: 'buyer-99', companyName: 'Evergreen Food Liquidators' }
        ];

        const mockLotBids = [
          {
            _id: 'bid-101',
            inventoryLotId: 'lot-x1',
            buyerId: 'buyer-99',
            sku: 'SKU-FROZEN-FISH',
            price: 32.50,
            quantityCases: 100,
            status: 'accepted'
          },
          {
            _id: 'bid-102',
            inventoryLotId: 'lot-x1',
            buyerName: 'Surplus Pantry Mart',
            sku: 'SKU-FROZEN-FISH',
            price: 26.00,
            quantityCases: 100,
            status: 'rejected'
          }
        ];

        const runWithBids = {
          _id: 'run-bids-test',
          status: 'awarded',
          dispatchedAt: '2026-08-16T12:00:00.000Z',
          snapshotInventoryIds: ['lot-x1'],
          resolution: {
            action: 'auto_award',
            winningPrice: 32.50,
            totalCases: 100,
            totalValue: 3250.00
          }
        };

        render(
          <WorkflowRunAuditModal
            run={runWithBids}
            allBids={mockLotBids}
            allBuyers={mockBuyersList}
            onClose={vi.fn()}
          />
        );

        // Click Bids & Offers Ledger tab
        fireEvent.click(screen.getByRole('button', { name: /bids & offers ledger \(2\)/i }));

        // Check header
        expect(screen.getByText('Buyer Bids & Evaluation Ledger (2)')).toBeInTheDocument();

        // Check winning bidder row
        expect(screen.getByText('Evergreen Food Liquidators')).toBeInTheDocument();
        expect(screen.getAllByText('SKU-FROZEN-FISH')).toHaveLength(2);
        expect(screen.getByText('$32.50')).toBeInTheDocument();
        expect(screen.getByText('$3,250.00')).toBeInTheDocument();
        expect(screen.getByText('Awarded / Winning')).toBeInTheDocument();

        // Check losing bidder row
        expect(screen.getByText('Surplus Pantry Mart')).toBeInTheDocument();
        expect(screen.getByText('$26.00')).toBeInTheDocument();
        expect(screen.getByText('$2,600.00')).toBeInTheDocument();
        expect(screen.getByText('Outbid')).toBeInTheDocument();
      });

      it('renders empty state when no bids were submitted during the evaluation window', () => {
        const runNoBids = {
          _id: 'run-no-bids',
          status: 'evaluating',
          dispatchedAt: '2026-08-16T12:00:00.000Z',
          snapshotInventoryIds: ['lot-x1']
        };

        render(
          <WorkflowRunAuditModal
            run={runNoBids}
            allBids={[]}
            onClose={vi.fn()}
          />
        );

        fireEvent.click(screen.getByRole('button', { name: /bids & offers ledger \(0\)/i }));
        expect(screen.getByText('No buyer bids were received within the execution evaluation window.')).toBeInTheDocument();
      });
    });
  });

  describe('Slice 4: Live Evaluation Overrides, Re-Trigger Dispatch & JSON/CSV Audit Report Export', () => {
    const mockRunEvaluating = {
      _id: 'run-eval-4001',
      automationId: 'auto-101',
      status: 'evaluating',
      runType: 'scheduled',
      dispatchedAt: '2026-08-16T15:00:00.000Z',
      evaluationEndsAt: '2026-08-17T15:00:00.000Z',
      snapshotInventoryIds: ['lot-101'],
      campaignSnapshot: {
        name: 'Clearance Blitz',
        categoryFilter: 'Produce & Dairy'
      }
    };

    const mockRunAwarded = {
      _id: 'run-award-4002',
      automationId: 'auto-101',
      status: 'awarded',
      runType: 'manual',
      dispatchedAt: '2026-08-16T12:00:00.000Z',
      snapshotInventoryIds: ['lot-101'],
      resolution: {
        action: 'auto_award',
        winningPrice: 20.00,
        totalCases: 100,
        totalValue: 2000.00
      }
    };

    describe('Live Evaluation Override & Re-Trigger Header Controls', () => {
      it('renders Force Expire / Resolve Now button only for in-flight evaluating runs and fires onForceExpire callback', () => {
        const handleForceExpire = vi.fn();

        // 1. In-flight evaluating run
        const { rerender } = render(
          <WorkflowRunAuditModal
            run={mockRunEvaluating}
            onClose={vi.fn()}
            onForceExpire={handleForceExpire}
          />
        );

        const forceExpireBtn = screen.getByRole('button', { name: /force expire \/ resolve now/i });
        expect(forceExpireBtn).toBeInTheDocument();
        fireEvent.click(forceExpireBtn);
        expect(handleForceExpire).toHaveBeenCalledTimes(1);
        expect(handleForceExpire).toHaveBeenCalledWith('run-eval-4001');

        // 2. Completed / awarded run
        rerender(
          <WorkflowRunAuditModal
            run={mockRunAwarded}
            onClose={vi.fn()}
            onForceExpire={handleForceExpire}
          />
        );

        expect(screen.queryByRole('button', { name: /force expire \/ resolve now/i })).not.toBeInTheDocument();
      });

      it('renders Re-Trigger Workflow action button and fires onReTrigger callback with run object', () => {
        const handleReTrigger = vi.fn();

        render(
          <WorkflowRunAuditModal
            run={mockRunAwarded}
            onClose={vi.fn()}
            onReTrigger={handleReTrigger}
          />
        );

        const reTriggerBtn = screen.getByRole('button', { name: /re-trigger workflow/i });
        expect(reTriggerBtn).toBeInTheDocument();
        fireEvent.click(reTriggerBtn);
        expect(handleReTrigger).toHaveBeenCalledTimes(1);
        expect(handleReTrigger).toHaveBeenCalledWith(mockRunAwarded);
      });
    });

    describe('Audit Report Export (JSON)', () => {
      it('triggers download of formatted structured JSON audit report with complete execution metadata', () => {
        const originalCreateElement = document.createElement.bind(document);
        const appendChildSpy = vi.spyOn(document.body, 'appendChild');

        // Mock anchor click
        const clickMock = vi.fn();
        const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
          const el = originalCreateElement(tagName);
          if (tagName === 'a') {
            el.click = clickMock;
          }
          return el;
        });

        render(
          <WorkflowRunAuditModal
            run={mockRunAwarded}
            onClose={vi.fn()}
          />
        );

        const exportBtn = screen.getByRole('button', { name: /export audit report \(json\)/i });
        expect(exportBtn).toBeInTheDocument();
        fireEvent.click(exportBtn);

        expect(clickMock).toHaveBeenCalledTimes(1);

        createElementSpy.mockRestore();
        appendChildSpy.mockRestore();
      });
    });

    describe('Active Stage Live Countdown & Execution Window Formatting', () => {
      it('renders active stage live countdown hero widget with execution window duration and progress for evaluating run', () => {
        render(
          <WorkflowRunAuditModal
            run={mockRunEvaluating}
            workflow={mockWorkflow}
            onClose={vi.fn()}
          />
        );

        // Active stage countdown hero widget should be in the document
        expect(screen.getByTestId('active-stage-countdown-card')).toBeInTheDocument();
        expect(screen.getByText(/Current Active Stage: Tier 1 Wholesale Bargain/i)).toBeInTheDocument();
        expect(screen.getByText('Live Evaluation')).toBeInTheDocument();
        expect(screen.getByText(/Window Time Remaining/i)).toBeInTheDocument();
        expect(screen.getByText(/Stage Window Elapsed:/i)).toBeInTheDocument();
        expect(screen.getByText(/Total Window Duration:/i)).toBeInTheDocument();
        expect(screen.getAllByText('1 Day').length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('Slice 3: Active Stage Live Countdown Timer & Progress Tracking (TDD)', () => {
    describe('formatTimeRemaining helper', () => {
      it('correctly formats remaining milliseconds into hh mm ss string', () => {
        expect(formatTimeRemaining(3661000)).toBe('01h 01m 01s');
        expect(formatTimeRemaining(72000000)).toBe('20h 00m 00s');
        expect(formatTimeRemaining(45000)).toBe('00h 00m 45s');
      });

      it('returns 00h 00m 00s for zero or negative values', () => {
        expect(formatTimeRemaining(0)).toBe('00h 00m 00s');
        expect(formatTimeRemaining(-5000)).toBe('00h 00m 00s');
      });
    });

    describe('WorkflowRunTimelineStepper Live Countdown & Expiration', () => {
      beforeEach(() => {
        vi.useFakeTimers();
      });

      afterEach(() => {
        vi.useRealTimers();
      });

      it('renders in-stepper live countdown badge on active stage with remaining time and ticks every second', () => {
        const baseTime = new Date('2026-08-16T10:00:00.000Z').getTime();
        vi.setSystemTime(baseTime);

        const runEvaluating = {
          _id: 'run-stepper-eval',
          status: 'evaluating',
          dispatchedAt: '2026-08-16T10:00:00.000Z',
          evaluationEndsAt: '2026-08-16T12:00:00.000Z' // 2 hours window
        };

        const stages = [
          {
            stageNumber: 1,
            name: 'Rapid Discount Stage',
            stageType: 'liquidation',
            waitHours: 2
          },
          {
            stageNumber: 2,
            name: 'Donation Stage',
            stageType: 'donation',
            waitHours: 4
          }
        ];

        render(<WorkflowRunTimelineStepper run={runEvaluating} stages={stages} />);

        // Stage 1 active badge with countdown
        expect(screen.getByText(/Stage Window Countdown: 02h 00m 00s remaining/i)).toBeInTheDocument();

        // Advance timer by 10 seconds inside act
        React.act(() => {
          vi.advanceTimersByTime(10000);
        });

        expect(screen.getByText(/Stage Window Countdown: 01h 59m 50s remaining/i)).toBeInTheDocument();
      });

      it('renders "Window Expired – Resolution / Escalation in Progress" when stage window expires', () => {
        const baseTime = new Date('2026-08-16T12:05:00.000Z').getTime();
        vi.setSystemTime(baseTime);

        const runExpired = {
          _id: 'run-stepper-expired',
          status: 'evaluating',
          dispatchedAt: '2026-08-16T10:00:00.000Z',
          evaluationEndsAt: '2026-08-16T12:00:00.000Z' // expired 5 mins ago
        };

        const stages = [
          {
            stageNumber: 1,
            name: 'Expired Liquidation Gate',
            stageType: 'liquidation',
            waitHours: 2
          }
        ];

        render(<WorkflowRunTimelineStepper run={runExpired} stages={stages} />);

        expect(screen.getByText('Window Expired – Resolution / Escalation in Progress')).toBeInTheDocument();
      });
    });

    describe('WorkflowRunAuditModal Hero Countdown & Progress Bar', () => {
      beforeEach(() => {
        vi.useFakeTimers();
      });

      afterEach(() => {
        vi.useRealTimers();
      });

      it('renders ticking hero countdown card with progress percentage and updates on interval', () => {
        const baseTime = new Date('2026-08-16T10:00:00.000Z').getTime();
        vi.setSystemTime(baseTime);

        const runEvaluating = {
          _id: 'run-modal-eval-1',
          status: 'evaluating',
          runType: 'scheduled',
          dispatchedAt: '2026-08-16T10:00:00.000Z',
          evaluationEndsAt: '2026-08-16T12:00:00.000Z', // 2 hours = 120 mins
          snapshotInventoryIds: ['lot-101'],
          campaignSnapshot: {
            name: 'Speed Clearance',
            stages: [
              {
                stageNumber: 1,
                name: 'Speed Bargain 1',
                stageType: 'liquidation',
                waitHours: 2,
                waitUnit: 'h'
              }
            ]
          }
        };

        render(
          <WorkflowRunAuditModal
            run={runEvaluating}
            onClose={vi.fn()}
          />
        );

        // Initial state at 10:00:00
        const heroCard = screen.getByTestId('active-stage-countdown-card');
        expect(heroCard).toBeInTheDocument();
        expect(within(heroCard).getByText('Current Active Stage: Speed Bargain 1')).toBeInTheDocument();
        expect(within(heroCard).getByText('02h 00m 00s')).toBeInTheDocument();
        expect(within(heroCard).getByText('0%')).toBeInTheDocument();

        // Advance by 1 hour (3600 seconds) -> 50% elapsed, 1 hour remaining
        React.act(() => {
          vi.advanceTimersByTime(3600000);
        });

        expect(within(heroCard).getByText('01h 00m 00s')).toBeInTheDocument();
        expect(within(heroCard).getByText('50%')).toBeInTheDocument();
      });

      it('renders "00h 00m 00s (Expired)" and 100% progress when evaluationEndsAt has elapsed', () => {
        const baseTime = new Date('2026-08-16T12:30:00.000Z').getTime();
        vi.setSystemTime(baseTime);

        const runExpired = {
          _id: 'run-modal-expired-1',
          status: 'evaluating',
          runType: 'scheduled',
          dispatchedAt: '2026-08-16T10:00:00.000Z',
          evaluationEndsAt: '2026-08-16T12:00:00.000Z',
          snapshotInventoryIds: ['lot-101'],
          campaignSnapshot: {
            name: 'Expired Blitz',
            stages: [
              {
                stageNumber: 1,
                name: 'Late Stage',
                stageType: 'liquidation',
                waitHours: 2
              }
            ]
          }
        };

        render(
          <WorkflowRunAuditModal
            run={runExpired}
            onClose={vi.fn()}
          />
        );

        const heroCard = screen.getByTestId('active-stage-countdown-card');
        expect(within(heroCard).getByText('00h 00m 00s (Expired)')).toBeInTheDocument();
        expect(within(heroCard).getByText('100%')).toBeInTheDocument();
      });

      it('does not render active stage hero countdown card for awarded/completed runs', () => {
        const runAwarded = {
          _id: 'run-modal-awarded-1',
          status: 'awarded',
          runType: 'scheduled',
          dispatchedAt: '2026-08-16T10:00:00.000Z',
          snapshotInventoryIds: ['lot-101'],
          resolution: {
            action: 'auto_award',
            winningPrice: 25,
            totalCases: 100,
            totalValue: 2500
          }
        };

        render(
          <WorkflowRunAuditModal
            run={runAwarded}
            onClose={vi.fn()}
          />
        );

        expect(screen.queryByTestId('active-stage-countdown-card')).not.toBeInTheDocument();
      });
    });
  });

  describe('Issue #02 — Stage Card Expand Affordance', () => {
    // A 3-stage run with a realistic mix of states:
    //   Stage 1 → completed (awarded run, stage 1 always completes on award)
    //   Stage 2 → skipped  (awarded on stage 1 — later stages are skipped)
    //   Stage 3 → skipped
    const threeStages = [
      { stageNumber: 1, name: 'Tier 1 Bargain', stageType: 'liquidation', discountValue: 15, waitHours: 24, buyerMode: 'all' },
      { stageNumber: 2, name: 'Broad Clearance',  stageType: 'liquidation', discountValue: 30, waitHours: 48, buyerMode: 'all' },
      { stageNumber: 3, name: 'Donation Divert',  stageType: 'donation',    discountValue: 0,  waitHours: 12, buyerMode: 'all' },
    ];

    describe('Chevron visibility — only completed and active stages show the affordance', () => {
      it('renders an expand-audit chevron button on a completed stage card', () => {
        // awarded run → stage 1 is completed
        render(
          <WorkflowRunTimelineStepper
            run={mockRunAwarded}
            stages={threeStages}
          />
        );

        const stage1Card = screen.getByTestId('stage-step-1');
        expect(stage1Card.querySelector('[data-testid="expand-audit-btn"]')).toBeInTheDocument();
      });

      it('renders no expand-audit chevron button on skipped stage cards', () => {
        // awarded run → stages 2 and 3 are skipped
        render(
          <WorkflowRunTimelineStepper
            run={mockRunAwarded}
            stages={threeStages}
          />
        );

        const stage2Card = screen.getByTestId('stage-step-2');
        const stage3Card = screen.getByTestId('stage-step-3');
        expect(stage2Card.querySelector('[data-testid="expand-audit-btn"]')).toBeNull();
        expect(stage3Card.querySelector('[data-testid="expand-audit-btn"]')).toBeNull();
      });

      it('renders an expand-audit chevron button on an active stage card', () => {
        // evaluating run → stage 1 is active
        render(
          <WorkflowRunTimelineStepper
            run={mockRunEvaluating}
            stages={threeStages}
          />
        );

        const stage1Card = screen.getByTestId('stage-step-1');
        expect(stage1Card.querySelector('[data-testid="expand-audit-btn"]')).toBeInTheDocument();
      });

      it('renders no expand-audit chevron button on pending stage cards', () => {
        // evaluating run → stages 2 and 3 are pending
        render(
          <WorkflowRunTimelineStepper
            run={mockRunEvaluating}
            stages={threeStages}
          />
        );

        const stage2Card = screen.getByTestId('stage-step-2');
        const stage3Card = screen.getByTestId('stage-step-3');
        expect(stage2Card.querySelector('[data-testid="expand-audit-btn"]')).toBeNull();
        expect(stage3Card.querySelector('[data-testid="expand-audit-btn"]')).toBeNull();
      });
    });

    describe('Accordion toggle — panel opens/closes independently per stage card', () => {
      it('clicking the chevron on stage 1 expands its audit panel without affecting stage 2', () => {
        // fallback_executed → stages 1 and 2 completed, stage 3 active
        render(
          <WorkflowRunTimelineStepper
            run={{ ...mockRunAwarded, status: 'fallback_executed' }}
            stages={threeStages}
          />
        );

        // Initially no audit panel is visible
        const stage1Card = screen.getByTestId('stage-step-1');
        const stage2Card = screen.getByTestId('stage-step-2');
        expect(stage1Card.querySelector('[data-testid="stage-audit-panel"]')).toBeNull();
        expect(stage2Card.querySelector('[data-testid="stage-audit-panel"]')).toBeNull();

        // Clicking stage 1 chevron expands stage 1's panel
        const stage1Chevron = stage1Card.querySelector('[data-testid="expand-audit-btn"]') as HTMLElement;
        fireEvent.click(stage1Chevron);

        expect(stage1Card.querySelector('[data-testid="stage-audit-panel"]')).toBeInTheDocument();
        // Stage 2 panel remains closed
        expect(stage2Card.querySelector('[data-testid="stage-audit-panel"]')).toBeNull();
      });

      it('clicking the same chevron again collapses the panel', () => {
        render(
          <WorkflowRunTimelineStepper
            run={mockRunAwarded}
            stages={threeStages}
          />
        );

        const stage1Card = screen.getByTestId('stage-step-1');
        const btn = stage1Card.querySelector('[data-testid="expand-audit-btn"]') as HTMLElement;

        // open
        fireEvent.click(btn);
        expect(stage1Card.querySelector('[data-testid="stage-audit-panel"]')).toBeInTheDocument();

        // close
        fireEvent.click(btn);
        expect(stage1Card.querySelector('[data-testid="stage-audit-panel"]')).toBeNull();
      });

      it('renders Stage Audit section label with its own collapse chevron and closes when clicked', () => {
        render(
          <WorkflowRunTimelineStepper
            run={mockRunAwarded}
            stages={threeStages}
          />
        );

        const stage1Card = screen.getByTestId('stage-step-1');
        const expandBtn = stage1Card.querySelector('[data-testid="expand-audit-btn"]') as HTMLElement;
        fireEvent.click(expandBtn);

        // Stage Audit label should be present
        const panel = stage1Card.querySelector('[data-testid="stage-audit-panel"]');
        expect(panel).toBeInTheDocument();
        expect(within(panel as HTMLElement).getByText('Stage Audit')).toBeInTheDocument();

        // Inner collapse chevron button
        const collapseBtn = stage1Card.querySelector('[data-testid="collapse-stage-audit-btn"]') as HTMLElement;
        expect(collapseBtn).toBeInTheDocument();
        fireEvent.click(collapseBtn);

        expect(stage1Card.querySelector('[data-testid="stage-audit-panel"]')).toBeNull();
      });
    });

    describe('Audit Props Wiring & Layout Non-Regression', () => {
      it('accepts allBuyers, allBids, inventoryList, and run props cleanly', () => {
        render(
          <WorkflowRunTimelineStepper
            run={mockRunAwarded}
            stages={threeStages}
            allBuyers={[{ _id: 'buyer-1', companyName: 'Apex Grocery Liquidators' }]}
            allBids={mockBids}
            inventoryList={mockInventory}
          />
        );

        // Core stepper elements remain intact
        expect(screen.getByText('Stage 1: Tier 1 Bargain')).toBeInTheDocument();
        expect(screen.getByText('Stage 2: Broad Clearance')).toBeInTheDocument();
        expect(screen.getByText('Stage 3: Donation Divert')).toBeInTheDocument();
      });
    });
  });

  describe('Issue #03 — Read-Only Stage Config Summary & Audience Section (All Stage Types)', () => {
    const polymorphicStages = [
      {
        stageNumber: 1,
        name: 'Flash Clearance Round',
        stageType: 'liquidation',
        waitHours: 0.5,
        waitUnit: 'm' as const,
        autoExecute: true,
        buyerMode: 'segment',
        buyerSegment: 'Tier 1 Wholesale'
      },
      {
        stageNumber: 2,
        name: 'Donation Divert & Food Bank',
        stageType: 'donation',
        waitHours: 24,
        waitUnit: 'h' as const,
        autoExecute: false,
        buyerMode: 'custom',
        customBuyers: ['buyer-101', 'buyer-102']
      },
      {
        stageNumber: 3,
        name: 'Eco Waste Disposal',
        stageType: 'landfill',
        waitHours: 72,
        waitUnit: 'd' as const,
        autoExecute: true,
        buyerMode: 'all'
      }
    ];

    describe('Seam A — Stage Configuration Summary Section', () => {
      it('renders ⬤ STAGE CONFIGURATION header with small uppercased styling', () => {
        render(
          <WorkflowRunTimelineStepper
            run={mockRunAwarded}
            stages={polymorphicStages}
          />
        );

        const stage1Card = screen.getByTestId('stage-step-1');
        const expandBtn = stage1Card.querySelector('[data-testid="expand-audit-btn"]') as HTMLElement;
        fireEvent.click(expandBtn);

        const panel = stage1Card.querySelector('[data-testid="stage-audit-panel"]');
        expect(panel).toBeInTheDocument();

        // Config header should be present
        const configHeader = stage1Card.querySelector('[data-testid="stage-config-summary-header"]');
        expect(configHeader).toBeInTheDocument();
        expect(within(stage1Card).getByText(/STAGE CONFIGURATION/i)).toBeInTheDocument();
      });

      it('renders stage name, color-coded stage type badges, formatted execution window, and auto-execute badge', () => {
        render(
          <WorkflowRunTimelineStepper
            run={{ ...mockRunAwarded, status: 'fallback_executed' }}
            stages={polymorphicStages}
          />
        );

        // Expand Stage 1 (Liquidation)
        const stage1Card = screen.getByTestId('stage-step-1');
        fireEvent.click(stage1Card.querySelector('[data-testid="expand-audit-btn"]') as HTMLElement);

        const configSection1 = stage1Card.querySelector('[data-testid="stage-config-summary-section"]') as HTMLElement;
        expect(configSection1).toBeInTheDocument();
        expect(within(configSection1).getByText('Flash Clearance Round')).toBeInTheDocument();
        expect(within(configSection1).getByTestId('stage-type-badge')).toHaveTextContent(/liquidation/i);
        expect(within(configSection1).getByText('30 Mins')).toBeInTheDocument();
        expect(within(configSection1).getByText('Auto-Execute On')).toBeInTheDocument();

        // Expand Stage 2 (Donation)
        const stage2Card = screen.getByTestId('stage-step-2');
        fireEvent.click(stage2Card.querySelector('[data-testid="expand-audit-btn"]') as HTMLElement);

        const configSection2 = stage2Card.querySelector('[data-testid="stage-config-summary-section"]') as HTMLElement;
        expect(configSection2).toBeInTheDocument();
        expect(within(configSection2).getByText('Donation Divert & Food Bank')).toBeInTheDocument();
        expect(within(configSection2).getByTestId('stage-type-badge')).toHaveTextContent(/donation/i);
        expect(within(configSection2).getByText('24 Hours')).toBeInTheDocument();
        expect(within(configSection2).getByText('Manual Approval')).toBeInTheDocument();

        // Expand Stage 3 (Landfill)
        const stage3Card = screen.getByTestId('stage-step-3');
        fireEvent.click(stage3Card.querySelector('[data-testid="expand-audit-btn"]') as HTMLElement);

        const configSection3 = stage3Card.querySelector('[data-testid="stage-config-summary-section"]') as HTMLElement;
        expect(configSection3).toBeInTheDocument();
        expect(within(configSection3).getByText('Eco Waste Disposal')).toBeInTheDocument();
        expect(within(configSection3).getByTestId('stage-type-badge')).toHaveTextContent(/landfill/i);
        expect(within(configSection3).getByText('3 Days')).toBeInTheDocument();
        expect(within(configSection3).getByText('Auto-Execute On')).toBeInTheDocument();
      });
    });

    describe('Seam B — Audience Targeting Section & Contact Roster', () => {
      const mockAllBuyers = [
        { _id: 'buyer-101', name: 'Apex Foods Inc', email: 'procurement@apexfoods.com', tier: 'tier1' },
        { _id: 'buyer-102', companyName: 'Bargain Mart Surplus', email: 'bids@bargainmart.org', tier: 'tier2' },
        { _id: 'buyer-103', name: 'City Rescue Mission', email: 'relief@cityrescue.org', tier: 'custom' },
      ];

      it('renders ⬤ AUDIENCE TARGETING header and segment/list badge with partner count', () => {
        render(
          <WorkflowRunTimelineStepper
            run={mockRunAwarded}
            stages={polymorphicStages}
            allBuyers={mockAllBuyers}
          />
        );

        const stage1Card = screen.getByTestId('stage-step-1');
        fireEvent.click(stage1Card.querySelector('[data-testid="expand-audit-btn"]') as HTMLElement);

        const audienceSection = stage1Card.querySelector('[data-testid="stage-audience-targeting-section"]') as HTMLElement;
        expect(audienceSection).toBeInTheDocument();
        expect(within(audienceSection).getByText(/AUDIENCE TARGETING/i)).toBeInTheDocument();

        // Header badge with segment name & count
        const audienceBadge = within(audienceSection).getByTestId('stage-audience-header-badge');
        expect(audienceBadge).toBeInTheDocument();
        expect(audienceBadge).toHaveTextContent(/Tier 1 Wholesale/i);
        expect(audienceBadge).toHaveTextContent(/1 Partner/i);
      });

      it('expands individual contact rows showing Name, Email, and color-coded Tier badge when toggled', () => {
        render(
          <WorkflowRunTimelineStepper
            run={{ ...mockRunAwarded, status: 'fallback_executed' }}
            stages={polymorphicStages}
            allBuyers={mockAllBuyers}
          />
        );

        // Expand Stage 2 (customBuyers: buyer-101 and buyer-102)
        const stage2Card = screen.getByTestId('stage-step-2');
        fireEvent.click(stage2Card.querySelector('[data-testid="expand-audit-btn"]') as HTMLElement);

        const audienceSection = stage2Card.querySelector('[data-testid="stage-audience-targeting-section"]') as HTMLElement;
        expect(audienceSection).toBeInTheDocument();

        // Check header badge
        const audienceBadge = within(audienceSection).getByTestId('stage-audience-header-badge');
        expect(audienceBadge).toHaveTextContent(/2 Partners/i);

        // Click toggle to expand contacts
        const toggleBtn = within(audienceSection).getByTestId('toggle-contacts-btn');
        expect(toggleBtn).toBeInTheDocument();
        fireEvent.click(toggleBtn);

        // Contact rows should now be rendered
        const contactRows = within(audienceSection).getAllByTestId('stage-audience-contact-row');
        expect(contactRows).toHaveLength(2);

        // Row 1: Apex Foods Inc
        expect(within(contactRows[0]).getByText('Apex Foods Inc')).toBeInTheDocument();
        expect(within(contactRows[0]).getByText('procurement@apexfoods.com')).toBeInTheDocument();
        expect(within(contactRows[0]).getByTestId('contact-tier-badge')).toHaveTextContent(/tier1/i);

        // Row 2: Bargain Mart Surplus
        expect(within(contactRows[1]).getByText('Bargain Mart Surplus')).toBeInTheDocument();
        expect(within(contactRows[1]).getByText('bids@bargainmart.org')).toBeInTheDocument();
        expect(within(contactRows[1]).getByTestId('contact-tier-badge')).toHaveTextContent(/tier2/i);

        // Clicking toggle again collapses the contacts list
        fireEvent.click(toggleBtn);
        expect(within(audienceSection).queryByTestId('stage-audience-contact-row')).toBeNull();
      });

      it('correctly resolves all registered partners for buyerMode "all"', () => {
        render(
          <WorkflowRunTimelineStepper
            run={{ ...mockRunAwarded, status: 'fallback_executed' }}
            stages={polymorphicStages}
            allBuyers={mockAllBuyers}
          />
        );

        // Expand Stage 3 (buyerMode: 'all')
        const stage3Card = screen.getByTestId('stage-step-3');
        fireEvent.click(stage3Card.querySelector('[data-testid="expand-audit-btn"]') as HTMLElement);

        const audienceSection = stage3Card.querySelector('[data-testid="stage-audience-targeting-section"]') as HTMLElement;
        const audienceBadge = within(audienceSection).getByTestId('stage-audience-header-badge');
        expect(audienceBadge).toHaveTextContent(/All Registered Partners/i);
        expect(audienceBadge).toHaveTextContent(/3 Partners/i);

        // Expand contacts
        fireEvent.click(within(audienceSection).getByTestId('toggle-contacts-btn'));
        const contactRows = within(audienceSection).getAllByTestId('stage-audience-contact-row');
        expect(contactRows).toHaveLength(3);
      });
    });

    describe('Seam C — Structural Consistency & Section Dividers Across All Stage Types', () => {
      it('renders Config Summary, Audience Targeting, and stage-specific content separated by dividers', () => {
        render(
          <WorkflowRunTimelineStepper
            run={{ ...mockRunAwarded, status: 'fallback_executed' }}
            stages={polymorphicStages}
          />
        );

        // Verify all 3 stages have Config and Audience sections
        for (let stageNum = 1; stageNum <= 3; stageNum++) {
          const stageCard = screen.getByTestId(`stage-step-${stageNum}`);
          fireEvent.click(stageCard.querySelector('[data-testid="expand-audit-btn"]') as HTMLElement);

          const panel = stageCard.querySelector('[data-testid="stage-audit-panel"]') as HTMLElement;
          expect(panel).toBeInTheDocument();

          // Has Config Section
          expect(within(panel).getByTestId('stage-config-summary-section')).toBeInTheDocument();
          expect(within(panel).getByText(/STAGE CONFIGURATION/i)).toBeInTheDocument();

          // Has Audience Section
          expect(within(panel).getByTestId('stage-audience-targeting-section')).toBeInTheDocument();
          expect(within(panel).getByText(/AUDIENCE TARGETING/i)).toBeInTheDocument();
        }

        // Stage 1 (Liquidation) has Pricing & Timing section
        const stage1Panel = screen.getByTestId('stage-step-1').querySelector('[data-testid="stage-audit-panel"]') as HTMLElement;
        expect(within(stage1Panel).getByTestId('stage-pricing-timing-section')).toBeInTheDocument();

        // Stage 3 (Landfill) has disposal deadline section
        const stage3Panel = screen.getByTestId('stage-step-3').querySelector('[data-testid="stage-audit-panel"]') as HTMLElement;
        expect(within(stage3Panel).getByTestId('stage-disposal-deadline-section')).toBeInTheDocument();
      });

      it('handles customBuyers specified as objects directly in the stage config', () => {
        const stageWithDirectObjects = [
          {
            stageNumber: 1,
            name: 'Direct Custom Buyers Stage',
            stageType: 'liquidation',
            waitHours: 12,
            buyerMode: 'custom',
            customBuyers: [
              { id: 'custom-1', name: 'Direct Wholesale Mart', email: 'dmart@example.com', tier: 'liquidator' }
            ]
          }
        ];

        render(
          <WorkflowRunTimelineStepper
            run={mockRunAwarded}
            stages={stageWithDirectObjects}
            allBuyers={[]}
          />
        );

        const stageCard = screen.getByTestId('stage-step-1');
        fireEvent.click(stageCard.querySelector('[data-testid="expand-audit-btn"]') as HTMLElement);

        const audienceSection = stageCard.querySelector('[data-testid="stage-audience-targeting-section"]') as HTMLElement;
        expect(audienceSection).toBeInTheDocument();

        // Toggle contacts
        fireEvent.click(within(audienceSection).getByTestId('toggle-contacts-btn'));
        const row = within(audienceSection).getByTestId('stage-audience-contact-row');
        expect(within(row).getByText('Direct Wholesale Mart')).toBeInTheDocument();
        expect(within(row).getByText('dmart@example.com')).toBeInTheDocument();
        expect(within(row).getByTestId('contact-tier-badge')).toHaveTextContent(/liquidator/i);
      });
    });
  });

  describe('Issue 04: Liquidation Stage Audit — Pricing & Timing, Bids Ledger, Allocated Lots', () => {
    describe('Seam 1 — Pricing & Timing Section', () => {
      it('renders ⬤ PRICING & TIMING section with rule, discount, and response window for liquidation stages', () => {
        const liquidationStages = [
          {
            stageNumber: 1,
            name: 'AI Dynamic Markdown',
            stageType: 'liquidation',
            discountType: 'ai_optimizer',
            discountValue: 25,
            waitHours: 24,
            waitUnit: 'h'
          },
          {
            stageNumber: 2,
            name: 'Fixed Markdown Stage',
            stageType: 'liquidation',
            discountType: 'percentage_off_wholesale',
            discountValue: 40,
            waitHours: 48,
            waitUnit: 'h'
          },
          {
            stageNumber: 3,
            name: 'Floor Price Liquidation',
            stageType: 'liquidation',
            discountType: 'min_bid_floor',
            discountValue: 12.5,
            waitHours: 48,
            waitUnit: 'd'
          }
        ];

        render(
          <WorkflowRunTimelineStepper
            run={{ ...mockRunAwarded, status: 'fallback_executed' }}
            stages={liquidationStages}
          />
        );

        // Stage 1 - AI Yield Optimizer
        const stage1Card = screen.getByTestId('stage-step-1');
        fireEvent.click(stage1Card.querySelector('[data-testid="expand-audit-btn"]') as HTMLElement);

        const pricingSection1 = stage1Card.querySelector('[data-testid="stage-pricing-timing-section"]') as HTMLElement;
        expect(pricingSection1).toBeInTheDocument();
        expect(within(pricingSection1).getByTestId('stage-pricing-timing-header')).toHaveTextContent(/PRICING & TIMING/i);
        expect(within(pricingSection1).getByTestId('stage-pricing-rule-value')).toHaveTextContent('AI Yield Optimizer');
        expect(within(pricingSection1).getByTestId('stage-pricing-discount-value')).toHaveTextContent('25%');
        expect(within(pricingSection1).getByTestId('stage-pricing-window-value')).toHaveTextContent('24 Hours');

        // Stage 2 - Fixed Markdown %
        const stage2Card = screen.getByTestId('stage-step-2');
        fireEvent.click(stage2Card.querySelector('[data-testid="expand-audit-btn"]') as HTMLElement);
        const pricingSection2 = stage2Card.querySelector('[data-testid="stage-pricing-timing-section"]') as HTMLElement;
        expect(within(pricingSection2).getByTestId('stage-pricing-rule-value')).toHaveTextContent('Fixed Markdown %');
        expect(within(pricingSection2).getByTestId('stage-pricing-discount-value')).toHaveTextContent('40%');
        expect(within(pricingSection2).getByTestId('stage-pricing-window-value')).toHaveTextContent('48 Hours');

        // Stage 3 - Min Bid Floor $
        const stage3Card = screen.getByTestId('stage-step-3');
        fireEvent.click(stage3Card.querySelector('[data-testid="expand-audit-btn"]') as HTMLElement);
        const pricingSection3 = stage3Card.querySelector('[data-testid="stage-pricing-timing-section"]') as HTMLElement;
        expect(within(pricingSection3).getByTestId('stage-pricing-rule-value')).toHaveTextContent('Min Bid Floor $');
        expect(within(pricingSection3).getByTestId('stage-pricing-discount-value')).toHaveTextContent('$12.50');
        expect(within(pricingSection3).getByTestId('stage-pricing-window-value')).toHaveTextContent('2 Days');
      });
    });

    describe('Seam 2 — Bids & Offers Ledger Section', () => {
      const stageBids = [
        {
          _id: 'bid-101',
          inventoryLotId: 'lot-101',
          buyerName: 'Apex Foods Inc',
          price: 24.50,
          quantityCases: 150,
          status: 'accepted'
        },
        {
          _id: 'bid-102',
          inventoryLotId: 'lot-101',
          buyerName: 'Bargain Mart Surplus',
          price: 19.00,
          quantityCases: 100,
          status: 'rejected'
        }
      ];

      it('renders ⬤ BIDS & OFFERS LEDGER with columns, rows, and winning bid highlight (★) for awarded stage', () => {
        render(
          <WorkflowRunTimelineStepper
            run={mockRunAwarded}
            stages={[
              {
                stageNumber: 1,
                name: 'Tier 1 Wholesale Bargain',
                stageType: 'liquidation',
                allocatedLotIds: ['lot-101']
              }
            ]}
            allBids={stageBids}
          />
        );

        const stage1Card = screen.getByTestId('stage-step-1');
        fireEvent.click(stage1Card.querySelector('[data-testid="expand-audit-btn"]') as HTMLElement);

        const bidsSection = stage1Card.querySelector('[data-testid="stage-bids-ledger-section"]') as HTMLElement;
        expect(bidsSection).toBeInTheDocument();
        expect(within(bidsSection).getByTestId('stage-bids-ledger-header')).toHaveTextContent(/BIDS & OFFERS LEDGER/i);

        // Columns: Buyer Name, Bid/Case, Quantity, Total Offer, Status
        expect(within(bidsSection).getByText('Buyer Name')).toBeInTheDocument();
        expect(within(bidsSection).getByText('Bid/Case')).toBeInTheDocument();
        expect(within(bidsSection).getByText('Quantity')).toBeInTheDocument();
        expect(within(bidsSection).getByText('Total Offer')).toBeInTheDocument();
        expect(within(bidsSection).getByText('Status')).toBeInTheDocument();

        // Bid rows
        const bidRows = within(bidsSection).getAllByTestId('stage-bid-row');
        expect(bidRows).toHaveLength(2);

        // Winning row (Apex Foods Inc)
        const winningRow = bidRows[0];
        expect(winningRow).toHaveTextContent('Apex Foods Inc');
        expect(winningRow).toHaveTextContent('$24.50');
        expect(winningRow).toHaveTextContent('150 Cases');
        expect(winningRow).toHaveTextContent('$3,675.00');
        expect(within(winningRow).getByTestId('winning-bid-marker')).toBeInTheDocument();
        expect(within(winningRow).getByTestId('winning-bid-marker')).toHaveTextContent('★');

        // Non-winning row (Bargain Mart Surplus)
        const nonWinningRow = bidRows[1];
        expect(nonWinningRow).toHaveTextContent('Bargain Mart Surplus');
        expect(nonWinningRow).toHaveTextContent('$19.00');
        expect(nonWinningRow).toHaveTextContent('100 Cases');
        expect(nonWinningRow).toHaveTextContent('$1,900.00');
        expect(within(nonWinningRow).queryByTestId('winning-bid-marker')).toBeNull();
      });

      it('renders bids received so far with NO winning bid highlight for active/evaluating stages', () => {
        render(
          <WorkflowRunTimelineStepper
            run={mockRunEvaluating}
            stages={[
              {
                stageNumber: 1,
                name: 'Tier 1 Wholesale Bargain',
                stageType: 'liquidation',
                allocatedLotIds: ['lot-101']
              }
            ]}
            allBids={stageBids}
          />
        );

        const stage1Card = screen.getByTestId('stage-step-1');
        fireEvent.click(stage1Card.querySelector('[data-testid="expand-audit-btn"]') as HTMLElement);

        const bidsSection = stage1Card.querySelector('[data-testid="stage-bids-ledger-section"]') as HTMLElement;
        expect(bidsSection).toBeInTheDocument();

        const bidRows = within(bidsSection).getAllByTestId('stage-bid-row');
        expect(bidRows).toHaveLength(2);

        // Neither row should have winning marker in active stage
        expect(within(bidsSection).queryByTestId('winning-bid-marker')).toBeNull();
      });

      it('renders appropriate empty state message when no bids are scoped to this stage', () => {
        render(
          <WorkflowRunTimelineStepper
            run={mockRunAwarded}
            stages={[
              {
                stageNumber: 1,
                name: 'Tier 1 Wholesale Bargain',
                stageType: 'liquidation',
                allocatedLotIds: ['lot-999-no-bids']
              }
            ]}
            allBids={stageBids}
          />
        );

        const stage1Card = screen.getByTestId('stage-step-1');
        fireEvent.click(stage1Card.querySelector('[data-testid="expand-audit-btn"]') as HTMLElement);

        const bidsSection = stage1Card.querySelector('[data-testid="stage-bids-ledger-section"]') as HTMLElement;
        expect(bidsSection).toBeInTheDocument();
        expect(within(bidsSection).getByTestId('stage-bids-empty')).toBeInTheDocument();
        expect(within(bidsSection).getByTestId('stage-bids-empty')).toHaveTextContent(/No bids received/i);
      });
    });

    describe('Seam 3 — Allocated Lots Section & Seam 4 — Polymorphic Stage Isolation', () => {
      it('renders ⬤ ALLOCATED LOTS section with assigned lot identifiers, SKU, description, and case counts', () => {
        const mockStageInventory = [
          {
            _id: 'lot-101',
            lotNumber: 'LOT-CHILLED-001',
            sku: 'SKU-DAIRY-YOGURT',
            description: 'Organic Greek Yogurt 32oz',
            quantityCases: 150,
            rsl: 18
          },
          {
            _id: 'lot-102',
            lotNumber: 'LOT-CHILLED-002',
            sku: 'SKU-DAIRY-MILK',
            description: 'Whole Milk Pasteurized 1gal',
            quantityCases: 100,
            rsl: 14
          }
        ];

        render(
          <WorkflowRunTimelineStepper
            run={mockRunAwarded}
            stages={[
              {
                stageNumber: 1,
                name: 'Tier 1 Wholesale Bargain',
                stageType: 'liquidation',
                allocatedLotIds: ['lot-101']
              }
            ]}
            inventoryList={mockStageInventory}
          />
        );

        const stage1Card = screen.getByTestId('stage-step-1');
        fireEvent.click(stage1Card.querySelector('[data-testid="expand-audit-btn"]') as HTMLElement);

        const lotsSection = stage1Card.querySelector('[data-testid="stage-allocated-lots-section"]') as HTMLElement;
        expect(lotsSection).toBeInTheDocument();
        expect(within(lotsSection).getByTestId('stage-allocated-lots-header')).toHaveTextContent(/ALLOCATED LOTS/i);

        const lotRows = within(lotsSection).getAllByTestId('stage-allocated-lot-row');
        expect(lotRows).toHaveLength(1);
        expect(lotRows[0]).toHaveTextContent('LOT-CHILLED-001');
        expect(lotRows[0]).toHaveTextContent('SKU-DAIRY-YOGURT');
        expect(lotRows[0]).toHaveTextContent('Organic Greek Yogurt 32oz');
        expect(lotRows[0]).toHaveTextContent('150 Cases');
      });

      it('does NOT render Pricing & Timing or Bids Ledger for Donation and Landfill stages', () => {
        const nonLiquidationStages = [
          {
            stageNumber: 1,
            name: 'Food Bank Relief',
            stageType: 'donation',
            waitHours: 12
          },
          {
            stageNumber: 2,
            name: 'Compost Disposal',
            stageType: 'landfill',
            waitHours: 6
          }
        ];

        render(
          <WorkflowRunTimelineStepper
            run={{ ...mockRunAwarded, status: 'fallback_executed' }}
            stages={nonLiquidationStages}
          />
        );

        for (let i = 1; i <= 2; i++) {
          const card = screen.getByTestId(`stage-step-${i}`);
          fireEvent.click(card.querySelector('[data-testid="expand-audit-btn"]') as HTMLElement);

          expect(card.querySelector('[data-testid="stage-pricing-timing-section"]')).toBeNull();
          expect(card.querySelector('[data-testid="stage-bids-ledger-section"]')).toBeNull();
        }
        const landfillCard = screen.getByTestId('stage-step-2');
        expect(landfillCard.querySelector('[data-testid="stage-disposal-deadline-section"]')).toBeInTheDocument();
      });
    });
  });

  describe('Issue 05: Donation Stage Audit — Offer Window, Allocated Lots & Acceptance Outcome', () => {
    describe('Seam 1 — Offer Expiration Window Section', () => {
      it('renders ⬤ OFFER EXPIRATION WINDOW with configured duration and acceptance elapsed time when accepted', () => {
        const donationStages = [
          {
            stageNumber: 1,
            name: 'Food Bank Relief Dispatch',
            stageType: 'donation',
            waitHours: 12,
            waitUnit: 'h',
            acceptedAt: '2026-08-15T14:30:00.000Z',
            status: 'accepted'
          }
        ];

        const donationRun = {
          ...mockRunAwarded,
          dispatchedAt: '2026-08-15T10:00:00.000Z',
          resolution: {
            action: 'donation_accepted',
            resolvedAt: '2026-08-15T14:30:00.000Z',
            targetBuyerId: {
              _id: 'np-1',
              companyName: 'Greater Boston Food Rescue'
            }
          }
        };

        render(
          <WorkflowRunTimelineStepper
            run={donationRun}
            stages={donationStages}
          />
        );

        const stageCard = screen.getByTestId('stage-step-1');
        fireEvent.click(stageCard.querySelector('[data-testid="expand-audit-btn"]') as HTMLElement);

        const offerSection = stageCard.querySelector('[data-testid="stage-offer-window-section"]') as HTMLElement;
        expect(offerSection).toBeInTheDocument();
        expect(within(offerSection).getByTestId('stage-offer-window-header')).toHaveTextContent(/OFFER EXPIRATION WINDOW/i);
        expect(within(offerSection).getByTestId('stage-offer-duration-value')).toHaveTextContent('12 Hours');
        expect(within(offerSection).getByTestId('stage-offer-elapsed-time')).toHaveTextContent('Accepted in 4h 30m');
        expect(within(offerSection).getByTestId('stage-offer-accepted-timestamp')).toBeInTheDocument();
      });

      it('renders "Expired — escalated to next stage" in amber when stage expired/escalated', () => {
        const donationStages = [
          {
            stageNumber: 1,
            name: 'Emergency Surplus Food Drive',
            stageType: 'donation',
            waitHours: 6,
            waitUnit: 'h',
            status: 'escalated'
          }
        ];

        const escalatedRun = {
          _id: 'run-esc-1',
          status: 'fallback_executed',
          dispatchedAt: '2026-08-15T10:00:00.000Z'
        };

        render(
          <WorkflowRunTimelineStepper
            run={escalatedRun}
            stages={donationStages}
          />
        );

        const stageCard = screen.getByTestId('stage-step-1');
        fireEvent.click(stageCard.querySelector('[data-testid="expand-audit-btn"]') as HTMLElement);

        const offerSection = stageCard.querySelector('[data-testid="stage-offer-window-section"]') as HTMLElement;
        expect(offerSection).toBeInTheDocument();
        expect(within(offerSection).getByTestId('stage-offer-duration-value')).toHaveTextContent('6 Hours');
        const escalatedLabel = within(offerSection).getByTestId('stage-offer-escalated-label');
        expect(escalatedLabel).toBeInTheDocument();
        expect(escalatedLabel).toHaveTextContent(/Expired — escalated to next stage/i);
      });
    });

    describe('Seam 2 — Allocated Lots Section for Donation', () => {
      it('renders ⬤ ALLOCATED LOTS section with assigned lot identifiers, SKU, description, and case counts for donation stages', () => {
        const donationStages = [
          {
            stageNumber: 1,
            name: 'Food Bank Direct Transfer',
            stageType: 'donation',
            waitHours: 24,
            allocatedLotIds: ['lot-d1', 'lot-d2']
          }
        ];

        const donationInventory = [
          {
            _id: 'lot-d1',
            lotNumber: 'LOT-DONATE-001',
            sku: 'SKU-CEREAL-OAT',
            description: 'Organic Rolled Oats 5lb',
            quantityCases: 80
          },
          {
            _id: 'lot-d2',
            lotNumber: 'LOT-DONATE-002',
            sku: 'SKU-JUICE-APPLE',
            description: '100% Apple Juice 64oz',
            quantityCases: 120
          }
        ];

        render(
          <WorkflowRunTimelineStepper
            run={mockRunAwarded}
            stages={donationStages}
            inventoryList={donationInventory}
          />
        );

        const stageCard = screen.getByTestId('stage-step-1');
        fireEvent.click(stageCard.querySelector('[data-testid="expand-audit-btn"]') as HTMLElement);

        const lotsSection = stageCard.querySelector('[data-testid="stage-allocated-lots-section"]') as HTMLElement;
        expect(lotsSection).toBeInTheDocument();
        expect(within(lotsSection).getByTestId('stage-allocated-lots-header')).toHaveTextContent(/ALLOCATED LOTS/i);

        const lotRows = within(lotsSection).getAllByTestId('stage-allocated-lot-row');
        expect(lotRows).toHaveLength(2);

        expect(lotRows[0]).toHaveTextContent('LOT-DONATE-001');
        expect(lotRows[0]).toHaveTextContent('SKU-CEREAL-OAT');
        expect(lotRows[0]).toHaveTextContent('Organic Rolled Oats 5lb');
        expect(lotRows[0]).toHaveTextContent('80 Cases');

        expect(lotRows[1]).toHaveTextContent('LOT-DONATE-002');
        expect(lotRows[1]).toHaveTextContent('SKU-JUICE-APPLE');
        expect(lotRows[1]).toHaveTextContent('100% Apple Juice 64oz');
        expect(lotRows[1]).toHaveTextContent('120 Cases');
      });

      it('renders empty state message when no lots are allocated to donation stage', () => {
        const donationStages = [
          {
            stageNumber: 1,
            name: 'Food Bank Zero Allocation',
            stageType: 'donation',
            waitHours: 12,
            allocatedLotIds: []
          }
        ];

        render(
          <WorkflowRunTimelineStepper
            run={{ ...mockRunAwarded, snapshotInventoryIds: [] }}
            stages={donationStages}
            inventoryList={[]}
          />
        );

        const stageCard = screen.getByTestId('stage-step-1');
        fireEvent.click(stageCard.querySelector('[data-testid="expand-audit-btn"]') as HTMLElement);

        const lotsSection = stageCard.querySelector('[data-testid="stage-allocated-lots-section"]') as HTMLElement;
        expect(lotsSection).toBeInTheDocument();
        expect(within(lotsSection).getByTestId('stage-lots-empty')).toBeInTheDocument();
        expect(within(lotsSection).getByTestId('stage-lots-empty')).toHaveTextContent(/No specific inventory lots allocated/i);
      });
    });

    describe('Seam 3 — Acceptance / Rejection Outcome Section', () => {
      it('renders ⬤ ACCEPTANCE OUTCOME with Accepted green status badge and accepting partner name', () => {
        const donationStages = [
          {
            stageNumber: 1,
            name: 'Food Bank Rescue',
            stageType: 'donation',
            waitHours: 24,
            status: 'accepted',
            acceptingPartnerName: 'Greater Boston Food Bank'
          }
        ];

        render(
          <WorkflowRunTimelineStepper
            run={mockRunAwarded}
            stages={donationStages}
          />
        );

        const stageCard = screen.getByTestId('stage-step-1');
        fireEvent.click(stageCard.querySelector('[data-testid="expand-audit-btn"]') as HTMLElement);

        const outcomeSection = stageCard.querySelector('[data-testid="stage-acceptance-outcome-section"]') as HTMLElement;
        expect(outcomeSection).toBeInTheDocument();
        expect(within(outcomeSection).getByTestId('stage-acceptance-outcome-header')).toHaveTextContent(/ACCEPTANCE OUTCOME/i);

        const statusBadge = within(outcomeSection).getByTestId('stage-acceptance-status-badge');
        expect(statusBadge).toHaveTextContent(/Accepted/i);

        const partnerName = within(outcomeSection).getByTestId('stage-accepting-partner-name');
        expect(partnerName).toHaveTextContent('Greater Boston Food Bank');
      });

      it('renders Declined status badge in red when donation offer was declined', () => {
        const donationStages = [
          {
            stageNumber: 1,
            name: 'Local Food Pantry Offer',
            stageType: 'donation',
            waitHours: 12,
            status: 'declined',
            declineReason: 'Capacity limit reached'
          }
        ];

        render(
          <WorkflowRunTimelineStepper
            run={{ ...mockRunAwarded, status: 'fallback_executed' }}
            stages={donationStages}
          />
        );

        const stageCard = screen.getByTestId('stage-step-1');
        fireEvent.click(stageCard.querySelector('[data-testid="expand-audit-btn"]') as HTMLElement);

        const outcomeSection = stageCard.querySelector('[data-testid="stage-acceptance-outcome-section"]') as HTMLElement;
        expect(outcomeSection).toBeInTheDocument();
        const statusBadge = within(outcomeSection).getByTestId('stage-acceptance-status-badge');
        expect(statusBadge).toHaveTextContent(/Declined/i);
      });

      it('renders Escalated status badge in amber when donation offer expired and escalated', () => {
        const donationStages = [
          {
            stageNumber: 1,
            name: 'Surplus Food Drive',
            stageType: 'donation',
            waitHours: 12,
            status: 'escalated'
          }
        ];

        render(
          <WorkflowRunTimelineStepper
            run={{ ...mockRunAwarded, status: 'fallback_executed' }}
            stages={donationStages}
          />
        );

        const stageCard = screen.getByTestId('stage-step-1');
        fireEvent.click(stageCard.querySelector('[data-testid="expand-audit-btn"]') as HTMLElement);

        const outcomeSection = stageCard.querySelector('[data-testid="stage-acceptance-outcome-section"]') as HTMLElement;
        expect(outcomeSection).toBeInTheDocument();
        const statusBadge = within(outcomeSection).getByTestId('stage-acceptance-status-badge');
        expect(statusBadge).toHaveTextContent(/Escalated/i);
      });
    });

    describe('Seam 4 — Polymorphic Stage Isolation', () => {
      it('strictly renders type-specific audit sections for Liquidation, Donation, and Landfill stages', () => {
        const polymorphicStages = [
          {
            stageNumber: 1,
            name: 'Tier 1 Wholesale Clearing',
            stageType: 'liquidation',
            discountType: 'percentage_off_wholesale',
            discountValue: 20,
            waitHours: 24,
            allocatedLotIds: ['lot-101']
          },
          {
            stageNumber: 2,
            name: 'Charity Food Rescue Divert',
            stageType: 'donation',
            waitHours: 12,
            allocatedLotIds: ['lot-101'],
            status: 'accepted',
            acceptingPartnerName: 'Community Food Bank'
          },
          {
            stageNumber: 3,
            name: 'Bio-waste Eco Disposal',
            stageType: 'landfill',
            waitHours: 6
          }
        ];

        render(
          <WorkflowRunTimelineStepper
            run={{ ...mockRunAwarded, status: 'fallback_executed' }}
            stages={polymorphicStages}
          />
        );

        // Stage 1 - Liquidation checks
        const card1 = screen.getByTestId('stage-step-1');
        fireEvent.click(card1.querySelector('[data-testid="expand-audit-btn"]') as HTMLElement);
        expect(card1.querySelector('[data-testid="stage-config-summary-section"]')).toBeInTheDocument();
        expect(card1.querySelector('[data-testid="stage-audience-targeting-section"]')).toBeInTheDocument();
        expect(card1.querySelector('[data-testid="stage-pricing-timing-section"]')).toBeInTheDocument();
        expect(card1.querySelector('[data-testid="stage-bids-ledger-section"]')).toBeInTheDocument();
        expect(card1.querySelector('[data-testid="stage-allocated-lots-section"]')).toBeInTheDocument();
        expect(card1.querySelector('[data-testid="stage-offer-window-section"]')).toBeNull();
        expect(card1.querySelector('[data-testid="stage-acceptance-outcome-section"]')).toBeNull();
        expect(card1.querySelector('[data-testid="stage-audit-shell"]')).toBeNull();

        // Stage 2 - Donation checks
        const card2 = screen.getByTestId('stage-step-2');
        fireEvent.click(card2.querySelector('[data-testid="expand-audit-btn"]') as HTMLElement);
        expect(card2.querySelector('[data-testid="stage-config-summary-section"]')).toBeInTheDocument();
        expect(card2.querySelector('[data-testid="stage-audience-targeting-section"]')).toBeInTheDocument();
        expect(card2.querySelector('[data-testid="stage-pricing-timing-section"]')).toBeNull();
        expect(card2.querySelector('[data-testid="stage-bids-ledger-section"]')).toBeNull();
        expect(card2.querySelector('[data-testid="stage-offer-window-section"]')).toBeInTheDocument();
        expect(card2.querySelector('[data-testid="stage-allocated-lots-section"]')).toBeInTheDocument();
        expect(card2.querySelector('[data-testid="stage-acceptance-outcome-section"]')).toBeInTheDocument();
        expect(card2.querySelector('[data-testid="stage-audit-shell"]')).toBeNull();

        // Stage 3 - Landfill checks
        const card3 = screen.getByTestId('stage-step-3');
        fireEvent.click(card3.querySelector('[data-testid="expand-audit-btn"]') as HTMLElement);
        expect(card3.querySelector('[data-testid="stage-config-summary-section"]')).toBeInTheDocument();
        expect(card3.querySelector('[data-testid="stage-audience-targeting-section"]')).toBeInTheDocument();
        expect(card3.querySelector('[data-testid="stage-pricing-timing-section"]')).toBeNull();
        expect(card3.querySelector('[data-testid="stage-bids-ledger-section"]')).toBeNull();
        expect(card3.querySelector('[data-testid="stage-offer-window-section"]')).toBeNull();
        expect(card3.querySelector('[data-testid="stage-acceptance-outcome-section"]')).toBeNull();
        expect(card3.querySelector('[data-testid="stage-disposal-deadline-section"]')).toBeInTheDocument();
        expect(card3.querySelector('[data-testid="stage-allocated-lots-section"]')).toBeInTheDocument();
        expect(card3.querySelector('[data-testid="stage-pickup-status-section"]')).toBeInTheDocument();
        expect(card3.querySelector('[data-testid="stage-audit-shell"]')).toBeNull();
      });
    });
  });

  describe('Issue 06 — Landfill Stage Audit: Disposal Deadline, Allocated Lots & Pickup Status', () => {
    describe('Seam 1 — Disposal & Removal Deadline Section', () => {
      it('renders ⬤ DISPOSAL & REMOVAL DEADLINE with formatted deadline date and "Scheduled" status for upcoming deadline', () => {
        const futureDate = new Date(Date.now() + 86400000 * 3).toISOString();
        const landfillStages = [
          {
            stageNumber: 1,
            name: 'Eco Waste Disposal',
            stageType: 'landfill',
            waitHours: 72,
            disposalDeadline: futureDate
          }
        ];

        render(
          <WorkflowRunTimelineStepper
            run={mockRunEvaluating}
            stages={landfillStages}
          />
        );

        const stageCard = screen.getByTestId('stage-step-1');
        fireEvent.click(stageCard.querySelector('[data-testid="expand-audit-btn"]') as HTMLElement);

        const deadlineSection = stageCard.querySelector('[data-testid="stage-disposal-deadline-section"]') as HTMLElement;
        expect(deadlineSection).toBeInTheDocument();
        expect(within(deadlineSection).getByTestId('stage-disposal-deadline-header')).toHaveTextContent(/DISPOSAL & REMOVAL DEADLINE/i);

        const deadlineValue = within(deadlineSection).getByTestId('stage-disposal-deadline-value');
        expect(deadlineValue).toHaveTextContent(new Date(futureDate).toLocaleDateString());

        const statusBadge = within(deadlineSection).getByTestId('stage-disposal-deadline-status');
        expect(statusBadge).toHaveTextContent(/Scheduled/i);
      });

      it('renders "Overdue" status when deadline is in the past and pickup is not confirmed', () => {
        const pastDate = new Date(Date.now() - 86400000 * 2).toISOString();
        const landfillStages = [
          {
            stageNumber: 1,
            name: 'Eco Waste Disposal',
            stageType: 'landfill',
            waitHours: 24,
            disposalDeadline: pastDate,
            pickupConfirmed: false
          }
        ];

        render(
          <WorkflowRunTimelineStepper
            run={{ ...mockRunAwarded, status: 'fallback_executed' }}
            stages={landfillStages}
          />
        );

        const stageCard = screen.getByTestId('stage-step-1');
        fireEvent.click(stageCard.querySelector('[data-testid="expand-audit-btn"]') as HTMLElement);

        const deadlineSection = stageCard.querySelector('[data-testid="stage-disposal-deadline-section"]') as HTMLElement;
        expect(deadlineSection).toBeInTheDocument();
        const statusBadge = within(deadlineSection).getByTestId('stage-disposal-deadline-status');
        expect(statusBadge).toHaveTextContent(/Overdue/i);
      });

      it('renders "Completed" status when pickup is confirmed regardless of deadline', () => {
        const pastDate = new Date(Date.now() - 86400000).toISOString();
        const landfillStages = [
          {
            stageNumber: 1,
            name: 'Eco Waste Disposal',
            stageType: 'landfill',
            waitHours: 24,
            disposalDeadline: pastDate,
            pickupConfirmed: true,
            disposalPartnerName: 'GreenWaste Hauling Services'
          }
        ];

        render(
          <WorkflowRunTimelineStepper
            run={mockRunAwarded}
            stages={landfillStages}
          />
        );

        const stageCard = screen.getByTestId('stage-step-1');
        fireEvent.click(stageCard.querySelector('[data-testid="expand-audit-btn"]') as HTMLElement);

        const deadlineSection = stageCard.querySelector('[data-testid="stage-disposal-deadline-section"]') as HTMLElement;
        expect(deadlineSection).toBeInTheDocument();
        const statusBadge = within(deadlineSection).getByTestId('stage-disposal-deadline-status');
        expect(statusBadge).toHaveTextContent(/Completed/i);
      });
    });

    describe('Seam 2 — Allocated Lots Section', () => {
      it('renders ⬤ ALLOCATED LOTS section with assigned lot identifiers, SKU, description, and case counts for landfill stage', () => {
        const landfillStages = [
          {
            stageNumber: 1,
            name: 'Eco Waste Disposal',
            stageType: 'landfill',
            waitHours: 24,
            allocatedLotIds: ['lot-lf-1', 'lot-lf-2']
          }
        ];

        const landfillInventory = [
          {
            _id: 'lot-lf-1',
            lotNumber: 'LOT-DISPOSE-001',
            sku: 'SKU-EXPIRED-MILK',
            description: 'Expired Whole Milk Cases',
            quantityCases: 200
          },
          {
            _id: 'lot-lf-2',
            lotNumber: 'LOT-DISPOSE-002',
            sku: 'SKU-EXPIRED-YOGURT',
            description: 'Expired Yogurt Packs',
            quantityCases: 75
          }
        ];

        render(
          <WorkflowRunTimelineStepper
            run={mockRunAwarded}
            stages={landfillStages}
            inventoryList={landfillInventory}
          />
        );

        const stageCard = screen.getByTestId('stage-step-1');
        fireEvent.click(stageCard.querySelector('[data-testid="expand-audit-btn"]') as HTMLElement);

        const lotsSection = stageCard.querySelector('[data-testid="stage-allocated-lots-section"]') as HTMLElement;
        expect(lotsSection).toBeInTheDocument();
        expect(within(lotsSection).getByTestId('stage-allocated-lots-header')).toHaveTextContent(/ALLOCATED LOTS/i);

        const lotRows = within(lotsSection).getAllByTestId('stage-allocated-lot-row');
        expect(lotRows).toHaveLength(2);

        expect(lotRows[0]).toHaveTextContent('LOT-DISPOSE-001');
        expect(lotRows[0]).toHaveTextContent('SKU-EXPIRED-MILK');
        expect(lotRows[0]).toHaveTextContent('Expired Whole Milk Cases');
        expect(lotRows[0]).toHaveTextContent('200 Cases');

        expect(lotRows[1]).toHaveTextContent('LOT-DISPOSE-002');
        expect(lotRows[1]).toHaveTextContent('SKU-EXPIRED-YOGURT');
        expect(lotRows[1]).toHaveTextContent('Expired Yogurt Packs');
        expect(lotRows[1]).toHaveTextContent('75 Cases');
      });

      it('renders empty state message when no lots are allocated to landfill stage', () => {
        const landfillStages = [
          {
            stageNumber: 1,
            name: 'Eco Waste Disposal Zero Lots',
            stageType: 'landfill',
            waitHours: 24,
            allocatedLotIds: []
          }
        ];

        render(
          <WorkflowRunTimelineStepper
            run={{ ...mockRunAwarded, snapshotInventoryIds: [] }}
            stages={landfillStages}
            inventoryList={[]}
          />
        );

        const stageCard = screen.getByTestId('stage-step-1');
        fireEvent.click(stageCard.querySelector('[data-testid="expand-audit-btn"]') as HTMLElement);

        const lotsSection = stageCard.querySelector('[data-testid="stage-allocated-lots-section"]') as HTMLElement;
        expect(lotsSection).toBeInTheDocument();
        expect(within(lotsSection).getByTestId('stage-lots-empty')).toBeInTheDocument();
        expect(within(lotsSection).getByTestId('stage-lots-empty')).toHaveTextContent(/No specific inventory lots allocated/i);
      });
    });

    describe('Seam 3 — Pickup / Execution Status Section', () => {
      it('renders ⬤ PICKUP / EXECUTION STATUS with Pickup Confirmed green badge and disposal partner name', () => {
        const landfillStages = [
          {
            stageNumber: 1,
            name: 'Bio-waste Haul',
            stageType: 'landfill',
            waitHours: 24,
            pickupConfirmed: true,
            disposalPartnerName: 'EcoHaul Waste Logistics'
          }
        ];

        render(
          <WorkflowRunTimelineStepper
            run={mockRunAwarded}
            stages={landfillStages}
          />
        );

        const stageCard = screen.getByTestId('stage-step-1');
        fireEvent.click(stageCard.querySelector('[data-testid="expand-audit-btn"]') as HTMLElement);

        const pickupSection = stageCard.querySelector('[data-testid="stage-pickup-status-section"]') as HTMLElement;
        expect(pickupSection).toBeInTheDocument();
        expect(within(pickupSection).getByTestId('stage-pickup-status-header')).toHaveTextContent(/PICKUP \/ EXECUTION STATUS/i);

        const badge = within(pickupSection).getByTestId('stage-pickup-status-badge');
        expect(badge).toHaveTextContent(/Pickup Confirmed/i);

        const partner = within(pickupSection).getByTestId('stage-disposal-partner-name');
        expect(partner).toHaveTextContent('EcoHaul Waste Logistics');
      });

      it('renders Pending status badge when pickup is not confirmed and deadline is upcoming', () => {
        const futureDate = new Date(Date.now() + 86400000 * 2).toISOString();
        const landfillStages = [
          {
            stageNumber: 1,
            name: 'Bio-waste Haul',
            stageType: 'landfill',
            waitHours: 48,
            disposalDeadline: futureDate,
            pickupConfirmed: false
          }
        ];

        render(
          <WorkflowRunTimelineStepper
            run={mockRunEvaluating}
            stages={landfillStages}
          />
        );

        const stageCard = screen.getByTestId('stage-step-1');
        fireEvent.click(stageCard.querySelector('[data-testid="expand-audit-btn"]') as HTMLElement);

        const pickupSection = stageCard.querySelector('[data-testid="stage-pickup-status-section"]') as HTMLElement;
        expect(pickupSection).toBeInTheDocument();
        const badge = within(pickupSection).getByTestId('stage-pickup-status-badge');
        expect(badge).toHaveTextContent(/Pending/i);
      });

      it('renders Overdue status badge when deadline is in the past and pickup is unconfirmed', () => {
        const pastDate = new Date(Date.now() - 86400000 * 2).toISOString();
        const landfillStages = [
          {
            stageNumber: 1,
            name: 'Bio-waste Haul',
            stageType: 'landfill',
            waitHours: 24,
            disposalDeadline: pastDate,
            pickupConfirmed: false
          }
        ];

        render(
          <WorkflowRunTimelineStepper
            run={{ ...mockRunAwarded, status: 'fallback_executed' }}
            stages={landfillStages}
          />
        );

        const stageCard = screen.getByTestId('stage-step-1');
        fireEvent.click(stageCard.querySelector('[data-testid="expand-audit-btn"]') as HTMLElement);

        const pickupSection = stageCard.querySelector('[data-testid="stage-pickup-status-section"]') as HTMLElement;
        expect(pickupSection).toBeInTheDocument();
        const badge = within(pickupSection).getByTestId('stage-pickup-status-badge');
        expect(badge).toHaveTextContent(/Overdue/i);
      });
    });

    describe('Seam 4 — Polymorphic Stage Gate Isolation & Exclusivity', () => {
      it('strictly isolates landfill stage from pricing/bids/donation sections and renders all 3 landfill sections', () => {
        const landfillStage = [
          {
            stageNumber: 1,
            name: 'Eco Waste Removal',
            stageType: 'landfill',
            waitHours: 48,
            disposalDeadline: '2026-08-20T12:00:00.000Z',
            pickupConfirmed: true,
            disposalPartnerName: 'CleanEarth Hauling Co.',
            allocatedLotIds: ['lot-lf-1']
          }
        ];

        render(
          <WorkflowRunTimelineStepper
            run={mockRunAwarded}
            stages={landfillStage}
            inventoryList={[
              {
                _id: 'lot-lf-1',
                lotNumber: 'LOT-LF-999',
                sku: 'SKU-BIO-WASTE',
                description: 'Expired Dairy Batch',
                quantityCases: 300
              }
            ]}
          />
        );

        const card = screen.getByTestId('stage-step-1');
        fireEvent.click(card.querySelector('[data-testid="expand-audit-btn"]') as HTMLElement);

        // Core sections present
        expect(card.querySelector('[data-testid="stage-config-summary-section"]')).toBeInTheDocument();
        expect(card.querySelector('[data-testid="stage-audience-targeting-section"]')).toBeInTheDocument();

        // Landfill specific sections present
        expect(card.querySelector('[data-testid="stage-disposal-deadline-section"]')).toBeInTheDocument();
        expect(card.querySelector('[data-testid="stage-allocated-lots-section"]')).toBeInTheDocument();
        expect(card.querySelector('[data-testid="stage-pickup-status-section"]')).toBeInTheDocument();

        // Excluded sections absent
        expect(card.querySelector('[data-testid="stage-pricing-timing-section"]')).toBeNull();
        expect(card.querySelector('[data-testid="stage-bids-ledger-section"]')).toBeNull();
        expect(card.querySelector('[data-testid="stage-offer-window-section"]')).toBeNull();
        expect(card.querySelector('[data-testid="stage-acceptance-outcome-section"]')).toBeNull();
        expect(card.querySelector('[data-testid="stage-audit-shell"]')).toBeNull();
      });
    });
  });

  describe('Issue 07 — Stage Email Preview Panel (All Stage Types)', () => {
    describe('Seam 1 — Section Placement & Subject Display across All Stage Types', () => {
      it('renders ⬤ EMAIL PREVIEW as the last section in Liquidation, Donation, and Landfill expanded stage panels', () => {
        const polymorphicStages = [
          {
            stageNumber: 1,
            name: 'Wholesale Markdown',
            stageType: 'liquidation',
            emailSubject: 'Urgent Clearance: {{buyer_name}}',
            emailBodyHtml: '<p>Liquidation body for {{buyer_name}}</p>'
          },
          {
            stageNumber: 2,
            name: 'Food Bank Rescue',
            stageType: 'donation',
            emailSubject: 'Donation Offer: {{partner_name}}',
            emailBodyHtml: '<p>Donation body for {{partner_name}}</p>'
          },
          {
            stageNumber: 3,
            name: 'Disposal Service',
            stageType: 'landfill',
            emailSubject: 'Disposal Request: {{partner_name}}',
            emailBodyHtml: '<p>Landfill body for {{partner_name}}</p>'
          }
        ];

        render(
          <WorkflowRunTimelineStepper
            run={{ ...mockRunAwarded, status: 'fallback_executed' }}
            stages={polymorphicStages}
          />
        );

        for (let i = 1; i <= 3; i++) {
          const card = screen.getByTestId(`stage-step-${i}`);
          fireEvent.click(card.querySelector('[data-testid="expand-audit-btn"]') as HTMLElement);

          const emailSection = card.querySelector('[data-testid="stage-email-preview-section"]') as HTMLElement;
          expect(emailSection).toBeInTheDocument();
          expect(within(emailSection).getByTestId('stage-email-preview-header')).toHaveTextContent(/EMAIL PREVIEW/i);
          
          // Verify it is the last child section inside the stage audit panel
          const auditPanel = card.querySelector('[data-testid="stage-audit-panel"]') as HTMLElement;
          const sectionElements = Array.from(auditPanel.querySelectorAll('[data-testid$="-section"]'));
          expect(sectionElements[sectionElements.length - 1]).toBe(emailSection);
        }
      });

      it('renders read-only labeled email subject above the preview frame', () => {
        const stage = [
          {
            stageNumber: 1,
            name: 'Wholesale Markdown',
            stageType: 'liquidation',
            emailSubject: 'Distressed Stock Clearance Offer',
            emailBodyHtml: '<p>Hello world</p>'
          }
        ];

        render(
          <WorkflowRunTimelineStepper
            run={mockRunAwarded}
            stages={stage}
          />
        );

        const card = screen.getByTestId('stage-step-1');
        fireEvent.click(card.querySelector('[data-testid="expand-audit-btn"]') as HTMLElement);

        const emailSection = card.querySelector('[data-testid="stage-email-preview-section"]') as HTMLElement;
        expect(emailSection).toBeInTheDocument();

        const subjectField = within(emailSection).getByTestId('stage-email-subject');
        expect(subjectField).toHaveTextContent('Distressed Stock Clearance Offer');
      });
    });

    describe('Seam 2 — Sandboxed Preview Frame & Empty State', () => {
      it('renders sandboxed inline iframe with srcDoc when emailBodyHtml is configured', () => {
        const stage = [
          {
            stageNumber: 1,
            name: 'Wholesale Markdown',
            stageType: 'liquidation',
            emailSubject: 'Distressed Stock Clearance Offer',
            emailBodyHtml: '<div class="email-body">Hello Buyer</div>'
          }
        ];

        render(
          <WorkflowRunTimelineStepper
            run={mockRunAwarded}
            stages={stage}
          />
        );

        const card = screen.getByTestId('stage-step-1');
        fireEvent.click(card.querySelector('[data-testid="expand-audit-btn"]') as HTMLElement);

        const emailSection = card.querySelector('[data-testid="stage-email-preview-section"]') as HTMLElement;
        const iframe = within(emailSection).getByTestId('stage-email-preview-frame') as HTMLIFrameElement;
        expect(iframe).toBeInTheDocument();
        expect(iframe.tagName.toLowerCase()).toBe('iframe');
        expect(iframe.getAttribute('sandbox')).toBeDefined();
        expect(iframe.getAttribute('srcdoc')).toContain('Hello Buyer');
      });

      it('renders "No email configured for this stage" empty state when no email body is configured', () => {
        const stage = [
          {
            stageNumber: 1,
            name: 'Wholesale Markdown',
            stageType: 'liquidation'
            // No emailSubject or emailBodyHtml
          }
        ];

        render(
          <WorkflowRunTimelineStepper
            run={mockRunAwarded}
            stages={stage}
          />
        );

        const card = screen.getByTestId('stage-step-1');
        fireEvent.click(card.querySelector('[data-testid="expand-audit-btn"]') as HTMLElement);

        const emailSection = card.querySelector('[data-testid="stage-email-preview-section"]') as HTMLElement;
        expect(emailSection).toBeInTheDocument();

        const emptyState = within(emailSection).getByTestId('stage-email-empty');
        expect(emptyState).toBeInTheDocument();
        expect(emptyState).toHaveTextContent(/No email configured for this stage/i);
        expect(within(emailSection).queryByTestId('stage-email-preview-frame')).toBeNull();
      });
    });

    describe('Seam 3 — Context-Aware Dynamic Token Substitution (Liquidation, Donation, Landfill)', () => {
      it('resolves Liquidation tokens: {{buyer_name}}, {{current_stage_discount}}, {{inventory_table}}, and {{response_deadline}}', () => {
        const liquidationStage = [
          {
            stageNumber: 1,
            name: 'Tier 1 Wholesale Clearance',
            stageType: 'liquidation',
            discountType: 'percentage_off_wholesale',
            discountValue: 25,
            waitHours: 24,
            waitUnit: 'h',
            emailSubject: 'Clearance Offer for {{buyer_name}} ({{current_stage_discount}} OFF)',
            emailBodyHtml: '<p>Dear {{buyer_name}}, response deadline: {{response_deadline}}</p><div>{{inventory_table}}</div>',
            allocatedLotIds: ['lot-liq-1']
          }
        ];

        const mockLots = [
          {
            _id: 'lot-liq-1',
            lotNumber: 'LOT-LIQ-100',
            sku: 'SKU-YOGURT-CHOBANI',
            description: 'Chobani Vanilla 32oz',
            quantityCases: 250
          }
        ];

        const mockBuyers = [
          {
            _id: 'b-1',
            companyName: 'Apex Wholesale Goods',
            tier: 'tier1',
            email: 'apex@example.com'
          }
        ];

        render(
          <WorkflowRunTimelineStepper
            run={mockRunAwarded}
            stages={liquidationStage}
            inventoryList={mockLots}
            allBuyers={mockBuyers}
          />
        );

        const card = screen.getByTestId('stage-step-1');
        fireEvent.click(card.querySelector('[data-testid="expand-audit-btn"]') as HTMLElement);

        const emailSection = card.querySelector('[data-testid="stage-email-preview-section"]') as HTMLElement;
        const subject = within(emailSection).getByTestId('stage-email-subject');
        expect(subject).toHaveTextContent('Clearance Offer for Apex Wholesale Goods (25% OFF)');

        const iframe = within(emailSection).getByTestId('stage-email-preview-frame') as HTMLIFrameElement;
        const srcdoc = iframe.getAttribute('srcdoc') || '';
        expect(srcdoc).toContain('Dear Apex Wholesale Goods');
        expect(srcdoc).toContain('24 Hours');
        expect(srcdoc).toContain('LOT-LIQ-100');
        expect(srcdoc).toContain('SKU-YOGURT-CHOBANI');
        expect(srcdoc).toContain('250 Cases');
      });

      it('resolves Donation tokens: {{partner_name}}, {{offer_expiration_time}}, and {{inventory_table}}', () => {
        const donationStage = [
          {
            stageNumber: 1,
            name: 'Charity Food Donation Drive',
            stageType: 'donation',
            waitHours: 12,
            waitUnit: 'h',
            acceptingPartnerName: 'Greater Boston Food Rescue',
            emailSubject: 'Surplus Food Transfer for {{partner_name}}',
            emailBodyHtml: '<p>Hello {{partner_name}}, please confirm within {{offer_expiration_time}}.</p>{{inventory_table}}',
            allocatedLotIds: ['lot-don-1']
          }
        ];

        const mockLots = [
          {
            _id: 'lot-don-1',
            lotNumber: 'LOT-OATS-500',
            sku: 'SKU-OATS-ORGANIC',
            description: 'Organic Rolled Oats 5lb',
            quantityCases: 100
          }
        ];

        render(
          <WorkflowRunTimelineStepper
            run={mockRunAwarded}
            stages={donationStage}
            inventoryList={mockLots}
          />
        );

        const card = screen.getByTestId('stage-step-1');
        fireEvent.click(card.querySelector('[data-testid="expand-audit-btn"]') as HTMLElement);

        const emailSection = card.querySelector('[data-testid="stage-email-preview-section"]') as HTMLElement;
        const subject = within(emailSection).getByTestId('stage-email-subject');
        expect(subject).toHaveTextContent('Surplus Food Transfer for Greater Boston Food Rescue');

        const iframe = within(emailSection).getByTestId('stage-email-preview-frame') as HTMLIFrameElement;
        const srcdoc = iframe.getAttribute('srcdoc') || '';
        expect(srcdoc).toContain('Hello Greater Boston Food Rescue');
        expect(srcdoc).toContain('12 Hours');
        expect(srcdoc).toContain('LOT-OATS-500');
        expect(srcdoc).toContain('SKU-OATS-ORGANIC');
        expect(srcdoc).toContain('100 Cases');
      });

      it('resolves Landfill tokens: {{partner_name}}, {{disposal_deadline}}, and {{inventory_table}}', () => {
        const landfillStage = [
          {
            stageNumber: 1,
            name: 'Organic Waste Disposal',
            stageType: 'landfill',
            waitHours: 48,
            disposalPartnerName: 'EcoHaul Waste Management',
            disposalDeadline: '2026-08-25T10:00:00.000Z',
            emailSubject: 'Disposal Service Request - {{partner_name}}',
            emailBodyHtml: '<p>Partner: {{partner_name}} | Removal Deadline: {{disposal_deadline}}</p>{{inventory_table}}',
            allocatedLotIds: ['lot-lf-1']
          }
        ];

        const mockLots = [
          {
            _id: 'lot-lf-1',
            lotNumber: 'LOT-BIO-900',
            sku: 'SKU-EXPIRED-MILK',
            description: 'Expired Dairy Batch',
            quantityCases: 50
          }
        ];

        render(
          <WorkflowRunTimelineStepper
            run={mockRunAwarded}
            stages={landfillStage}
            inventoryList={mockLots}
          />
        );

        const card = screen.getByTestId('stage-step-1');
        fireEvent.click(card.querySelector('[data-testid="expand-audit-btn"]') as HTMLElement);

        const emailSection = card.querySelector('[data-testid="stage-email-preview-section"]') as HTMLElement;
        const subject = within(emailSection).getByTestId('stage-email-subject');
        expect(subject).toHaveTextContent('Disposal Service Request - EcoHaul Waste Management');

        const iframe = within(emailSection).getByTestId('stage-email-preview-frame') as HTMLIFrameElement;
        const srcdoc = iframe.getAttribute('srcdoc') || '';
        expect(srcdoc).toContain('Partner: EcoHaul Waste Management');
        expect(srcdoc).toContain(new Date('2026-08-25T10:00:00.000Z').toLocaleDateString());
        expect(srcdoc).toContain('LOT-BIO-900');
        expect(srcdoc).toContain('SKU-EXPIRED-MILK');
      });
    });

    describe('Seam 4 — Bracketed Placeholder Fallbacks for Unresolvable Tokens', () => {
      it('replaces unresolvable tokens with bracketed uppercase-formatted placeholders rather than raw {{token}}', () => {
        const stageWithUnresolvedTokens = [
          {
            stageNumber: 1,
            name: 'Fallback Tokens Test',
            stageType: 'liquidation',
            // No buyers, no lots, no discount
            emailSubject: 'Notification for {{buyer_name}} regarding {{custom_promo_code}}',
            emailBodyHtml: '<p>Dear {{buyer_name}}, your discount is {{current_stage_discount}}. Table: {{inventory_table}}. Unknown: {{unregistered_custom_token}}</p>'
          }
        ];

        render(
          <WorkflowRunTimelineStepper
            run={{ ...mockRunAwarded, snapshotInventoryIds: [] }}
            stages={stageWithUnresolvedTokens}
            inventoryList={[]}
            allBuyers={[]}
          />
        );

        const card = screen.getByTestId('stage-step-1');
        fireEvent.click(card.querySelector('[data-testid="expand-audit-btn"]') as HTMLElement);

        const emailSection = card.querySelector('[data-testid="stage-email-preview-section"]') as HTMLElement;
        const subject = within(emailSection).getByTestId('stage-email-subject');
        expect(subject).toHaveTextContent('Notification for [Buyer Name] regarding [Custom Promo Code]');
        expect(subject.textContent).not.toContain('{{');
        expect(subject.textContent).not.toContain('}}');

        const iframe = within(emailSection).getByTestId('stage-email-preview-frame') as HTMLIFrameElement;
        const srcdoc = iframe.getAttribute('srcdoc') || '';
        expect(srcdoc).toContain('[Buyer Name]');
        expect(srcdoc).toContain('[Current Stage Discount]');
        expect(srcdoc).toContain('[Inventory Table]');
        expect(srcdoc).toContain('[Unregistered Custom Token]');
        expect(srcdoc).not.toContain('{{');
        expect(srcdoc).not.toContain('}}');
      });
    });
  });
});






