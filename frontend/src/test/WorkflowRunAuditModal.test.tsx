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
      expect(screen.getByText('Short-Dated Bakery & Dairy Clearance')).toBeInTheDocument();
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

      // Switch to Strategy Snapshot
      fireEvent.click(screen.getByRole('button', { name: /strategy snapshot/i }));
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

      // Switch to Raw Telemetry & JSON
      fireEvent.click(screen.getByRole('button', { name: /raw telemetry & json/i }));
      expect(screen.getByPlaceholderText('Filter JSON fields or values...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /copy json/i })).toBeInTheDocument();
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
      expect(within(modal).getByText('Short-Dated Bakery & Dairy Clearance')).toBeInTheDocument();
      expect(within(modal).getByText('250 Total Cases Evaluated')).toBeInTheDocument();

      // Click close button
      const closeBtn = screen.getByLabelText('Close Audit Inspector');
      fireEvent.click(closeBtn);

      // Modal is dismissed
      expect(screen.queryByTestId('workflow-run-audit-modal')).not.toBeInTheDocument();
    });
  });

  describe('Slice 3: Granular Scope Tabs', () => {
    describe('Strategy Snapshot Tab', () => {
      it('renders the exact immutable strategy configuration active at dispatch including discount schedules and audience targeting', () => {
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

        // Click Strategy Snapshot tab
        fireEvent.click(screen.getByRole('button', { name: /strategy snapshot/i }));

        // Check Strategy headers and config
        expect(screen.getAllByText('Frozen Seafood Clearance').length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('Frozen & Seafood')).toBeInTheDocument();
        expect(screen.getByText('15% Remaining Shelf Life')).toBeInTheDocument();
        expect(screen.getByText('80 Cases')).toBeInTheDocument();

        // Check Stage 1
        expect(screen.getByText(/Stage 1: Priority Wholesale Outlets/i)).toBeInTheDocument();
        expect(screen.getByText(/25% \(percentage off wholesale\)/i)).toBeInTheDocument();
        expect(screen.getByText(/18 hours/i)).toBeInTheDocument();
        expect(screen.getByText('Enabled')).toBeInTheDocument();
        expect(screen.getByText('Audience: Wholesale Tier 1')).toBeInTheDocument();

        // Check Stage 2
        expect(screen.getByText(/Stage 2: Secondary Food Rescue/i)).toBeInTheDocument();
        expect(screen.getByText(/Fixed Price \$0\.00/i)).toBeInTheDocument();
        expect(screen.getByText(/\b8 hours/i)).toBeInTheDocument();
        expect(screen.getByText('Manual Approval')).toBeInTheDocument();
        expect(screen.getByText('Audience: 1 Custom Partner')).toBeInTheDocument();
      });

      it('renders input-aware formatted execution windows for minutes, days, and hours in Strategy Snapshot tab', () => {
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

        fireEvent.click(screen.getByRole('button', { name: /strategy snapshot/i }));

        expect(screen.getByText('30 Mins')).toBeInTheDocument();
        expect(screen.getByText('3 Days')).toBeInTheDocument();
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

    describe('Raw Telemetry Tab Search, Clipboard Copy & Download', () => {
      it('filters raw JSON payload dynamically based on search query', () => {
        render(
          <WorkflowRunAuditModal
            run={mockRunAwarded}
            onClose={vi.fn()}
          />
        );

        // Switch to Raw Telemetry & JSON tab
        fireEvent.click(screen.getByRole('button', { name: /raw telemetry & json/i }));

        const searchInput = screen.getByPlaceholderText('Filter JSON fields or values...');
        expect(searchInput).toBeInTheDocument();

        // Search for winningPrice
        fireEvent.change(searchInput, { target: { value: 'winningPrice' } });
        expect(screen.getByText(/winningPrice/i)).toBeInTheDocument();
      });

      it('copies raw JSON payload to clipboard and displays Copied! confirmation badge', async () => {
        const writeTextMock = vi.fn().mockResolvedValue(undefined);
        Object.assign(navigator, {
          clipboard: {
            writeText: writeTextMock
          }
        });

        render(
          <WorkflowRunAuditModal
            run={mockRunAwarded}
            onClose={vi.fn()}
          />
        );

        // Switch to Raw Telemetry tab
        fireEvent.click(screen.getByRole('button', { name: /raw telemetry & json/i }));

        const copyBtn = screen.getByRole('button', { name: /copy json/i });
        fireEvent.click(copyBtn);

        expect(writeTextMock).toHaveBeenCalledTimes(1);
        expect(writeTextMock).toHaveBeenCalledWith(JSON.stringify(mockRunAwarded, null, 2));
        expect(screen.getByText('Copied!')).toBeInTheDocument();
      });

      it('triggers Download Payload action from Raw Telemetry tab', () => {
        const originalCreateElement = document.createElement.bind(document);
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

        fireEvent.click(screen.getByRole('button', { name: /raw telemetry & json/i }));
        const downloadPayloadBtn = screen.getByRole('button', { name: /download payload/i });
        fireEvent.click(downloadPayloadBtn);

        expect(clickMock).toHaveBeenCalledTimes(1);

        createElementSpy.mockRestore();
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
});

