import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import React from 'react';
import {
  WorkflowRunTimelineStepper,
  StageAllocatedLotsSection,
} from '../components/WorkflowRunTimelineStepper';

describe('Stage Audit -> ALLOCATED LOTS Pagination and Page Size (Max 30)', () => {
  const generateLots = (count: number) => {
    return Array.from({ length: count }, (_, i) => ({
      _id: `lot-${i + 1}`,
      lotNumber: `LOT-ITEM-${String(i + 1).padStart(3, '0')}`,
      sku: `SKU-PROD-${String(i + 1).padStart(3, '0')}`,
      description: `Test Product Item ${i + 1}`,
      quantityCases: 10 * (i + 1),
    }));
  };

  const mockRun = {
    _id: 'run-audit-test-01',
    status: 'awarded',
    runType: 'scheduled',
    dispatchedAt: '2026-08-16T12:00:00.000Z',
    snapshotInventoryIds: [],
    resolution: {
      action: 'auto_award',
      winningPrice: 20.0,
      totalCases: 500,
    },
  };

  describe('StageAllocatedLotsSection Isolated Component Tests', () => {
    it('renders empty state when there are 0 allocated lots', () => {
      render(
        <StageAllocatedLotsSection
          stage={{ stageNumber: 1, name: 'Liquidation Stage', allocatedLotIds: [] }}
          inventoryList={[]}
          run={mockRun}
        />
      );

      expect(screen.getByTestId('stage-allocated-lots-section')).toBeInTheDocument();
      expect(screen.getByTestId('stage-allocated-lots-header')).toHaveTextContent(/ALLOCATED LOTS/i);
      expect(screen.getByTestId('stage-lots-empty')).toHaveTextContent(/No specific inventory lots allocated to this stage/i);
      expect(screen.queryByTestId('stage-allocated-lots-pagination')).not.toBeInTheDocument();
    });

    it('renders 10 lots by default with pagination information and controls for 25 lots', () => {
      const lots25 = generateLots(25);
      const stage = {
        stageNumber: 1,
        name: 'Liquidation Clearance',
        allocatedLotIds: lots25.map((l) => l._id),
      };

      render(
        <StageAllocatedLotsSection
          stage={stage}
          inventoryList={lots25}
          run={mockRun}
        />
      );

      // Section header and count
      expect(screen.getByText('25 Lots Allocated')).toBeInTheDocument();

      // Only first 10 lots rendered on page 1
      const rows = screen.getAllByTestId('stage-allocated-lot-row');
      expect(rows).toHaveLength(10);
      expect(rows[0]).toHaveTextContent('LOT-ITEM-001');
      expect(rows[9]).toHaveTextContent('LOT-ITEM-010');

      // Pagination summary
      const pageInfo = screen.getByTestId('stage-allocated-lots-page-info');
      expect(pageInfo).toHaveTextContent(/Showing 1 to 10 of 25 lots/i);

      // Prev button is disabled on page 1
      const prevBtn = screen.getByTestId('stage-allocated-lots-page-prev');
      expect(prevBtn).toBeDisabled();

      // Next button is enabled
      const nextBtn = screen.getByTestId('stage-allocated-lots-page-next');
      expect(nextBtn).not.toBeDisabled();

      // 3 pages for 25 items at 10 items/page
      expect(screen.getByTestId('stage-allocated-lots-page-btn-1')).toBeInTheDocument();
      expect(screen.getByTestId('stage-allocated-lots-page-btn-2')).toBeInTheDocument();
      expect(screen.getByTestId('stage-allocated-lots-page-btn-3')).toBeInTheDocument();
    });

    it('navigates through pages using Next and Prev buttons', () => {
      const lots25 = generateLots(25);
      const stage = {
        stageNumber: 1,
        name: 'Liquidation Clearance',
        allocatedLotIds: lots25.map((l) => l._id),
      };

      render(
        <StageAllocatedLotsSection
          stage={stage}
          inventoryList={lots25}
          run={mockRun}
        />
      );

      const nextBtn = screen.getByTestId('stage-allocated-lots-page-next');
      const prevBtn = screen.getByTestId('stage-allocated-lots-page-prev');

      // Click Next -> Page 2
      fireEvent.click(nextBtn);
      expect(screen.getByTestId('stage-allocated-lots-page-info')).toHaveTextContent(/Showing 11 to 20 of 25 lots/i);
      let rows = screen.getAllByTestId('stage-allocated-lot-row');
      expect(rows).toHaveLength(10);
      expect(rows[0]).toHaveTextContent('LOT-ITEM-011');
      expect(rows[9]).toHaveTextContent('LOT-ITEM-020');
      expect(prevBtn).not.toBeDisabled();
      expect(nextBtn).not.toBeDisabled();

      // Click Next -> Page 3
      fireEvent.click(nextBtn);
      expect(screen.getByTestId('stage-allocated-lots-page-info')).toHaveTextContent(/Showing 21 to 25 of 25 lots/i);
      rows = screen.getAllByTestId('stage-allocated-lot-row');
      expect(rows).toHaveLength(5);
      expect(rows[0]).toHaveTextContent('LOT-ITEM-021');
      expect(rows[4]).toHaveTextContent('LOT-ITEM-025');
      expect(prevBtn).not.toBeDisabled();
      expect(nextBtn).toBeDisabled();

      // Click Prev -> Back to Page 2
      fireEvent.click(prevBtn);
      expect(screen.getByTestId('stage-allocated-lots-page-info')).toHaveTextContent(/Showing 11 to 20 of 25 lots/i);
    });

    it('navigates directly using page number buttons', () => {
      const lots25 = generateLots(25);
      const stage = {
        stageNumber: 1,
        name: 'Liquidation Clearance',
        allocatedLotIds: lots25.map((l) => l._id),
      };

      render(
        <StageAllocatedLotsSection
          stage={stage}
          inventoryList={lots25}
          run={mockRun}
        />
      );

      const page3Btn = screen.getByTestId('stage-allocated-lots-page-btn-3');
      fireEvent.click(page3Btn);

      expect(screen.getByTestId('stage-allocated-lots-page-info')).toHaveTextContent(/Showing 21 to 25 of 25 lots/i);
      const rows = screen.getAllByTestId('stage-allocated-lot-row');
      expect(rows).toHaveLength(5);
      expect(rows[0]).toHaveTextContent('LOT-ITEM-021');
    });

    it('changes page size and clamps to max 30', () => {
      const lots50 = generateLots(50);
      const stage = {
        stageNumber: 1,
        name: 'Liquidation Clearance',
        allocatedLotIds: lots50.map((l) => l._id),
      };

      render(
        <StageAllocatedLotsSection
          stage={stage}
          inventoryList={lots50}
          run={mockRun}
        />
      );

      const pageSizeSelect = screen.getByTestId('stage-allocated-lots-page-size-select');

      // Verify page size options exist up to max 30
      expect(within(pageSizeSelect).getByRole('option', { name: '5' })).toBeInTheDocument();
      expect(within(pageSizeSelect).getByRole('option', { name: '10' })).toBeInTheDocument();
      expect(within(pageSizeSelect).getByRole('option', { name: '20' })).toBeInTheDocument();
      expect(within(pageSizeSelect).getByRole('option', { name: '30 (max)' })).toBeInTheDocument();

      // Change page size to 5
      fireEvent.change(pageSizeSelect, { target: { value: '5' } });
      expect(screen.getAllByTestId('stage-allocated-lot-row')).toHaveLength(5);
      expect(screen.getByTestId('stage-allocated-lots-page-info')).toHaveTextContent(/Showing 1 to 5 of 50 lots/i);
      expect(screen.getByTestId('stage-allocated-lots-page-btn-10')).toBeInTheDocument();

      // Change page size to 30 (max)
      fireEvent.change(pageSizeSelect, { target: { value: '30' } });
      expect(screen.getAllByTestId('stage-allocated-lot-row')).toHaveLength(30);
      expect(screen.getByTestId('stage-allocated-lots-page-info')).toHaveTextContent(/Showing 1 to 30 of 50 lots/i);
      expect(screen.getByTestId('stage-allocated-lots-page-btn-1')).toBeInTheDocument();
      expect(screen.getByTestId('stage-allocated-lots-page-btn-2')).toBeInTheDocument();
      expect(screen.queryByTestId('stage-allocated-lots-page-btn-3')).not.toBeInTheDocument();

      // Navigate to page 2 (lots 31-50 -> 20 lots)
      const page2Btn = screen.getByTestId('stage-allocated-lots-page-btn-2');
      fireEvent.click(page2Btn);
      expect(screen.getAllByTestId('stage-allocated-lot-row')).toHaveLength(20);
      expect(screen.getByTestId('stage-allocated-lots-page-info')).toHaveTextContent(/Showing 31 to 50 of 50 lots/i);
    });

    it('enforces maximum page size of 30 when initialPageSize exceeds 30', () => {
      const lots50 = generateLots(50);
      const stage = {
        stageNumber: 1,
        name: 'Liquidation Clearance',
        allocatedLotIds: lots50.map((l) => l._id),
      };

      render(
        <StageAllocatedLotsSection
          stage={stage}
          inventoryList={lots50}
          run={mockRun}
          initialPageSize={100}
        />
      );

      // Max capped at 30
      expect(screen.getAllByTestId('stage-allocated-lot-row')).toHaveLength(30);
      expect(screen.getByTestId('stage-allocated-lots-page-info')).toHaveTextContent(/Showing 1 to 30 of 50 lots/i);
    });
  });

  describe('Integrated Stepper Stage Types (Liquidation, Donation, Landfill)', () => {
    it('supports pagination in expanded Liquidation stage audit', () => {
      const lots = generateLots(15);
      const stages = [
        {
          stageNumber: 1,
          name: 'Liquidation Tier',
          stageType: 'liquidation',
          allocatedLotIds: lots.map((l) => l._id),
        },
      ];

      render(
        <WorkflowRunTimelineStepper
          run={mockRun}
          stages={stages}
          inventoryList={lots}
        />
      );

      const stageCard = screen.getByTestId('stage-step-1');
      fireEvent.click(stageCard.querySelector('[data-testid="expand-audit-btn"]') as HTMLElement);

      const lotsSection = stageCard.querySelector('[data-testid="stage-allocated-lots-section"]') as HTMLElement;
      expect(lotsSection).toBeInTheDocument();
      expect(within(lotsSection).getByTestId('stage-allocated-lots-header')).toHaveTextContent(/ALLOCATED LOTS/i);
      expect(within(lotsSection).getAllByTestId('stage-allocated-lot-row')).toHaveLength(10);
      expect(within(lotsSection).getByTestId('stage-allocated-lots-page-info')).toHaveTextContent(/Showing 1 to 10 of 15 lots/i);

      // Navigate to page 2
      fireEvent.click(within(lotsSection).getByTestId('stage-allocated-lots-page-next'));
      expect(within(lotsSection).getAllByTestId('stage-allocated-lot-row')).toHaveLength(5);
      expect(within(lotsSection).getByTestId('stage-allocated-lots-page-info')).toHaveTextContent(/Showing 11 to 15 of 15 lots/i);
    });

    it('supports pagination in expanded Donation stage audit', () => {
      const lots = generateLots(22);
      const stages = [
        {
          stageNumber: 1,
          name: 'Nonprofit Donation Gate',
          stageType: 'donation',
          waitHours: 24,
          allocatedLotIds: lots.map((l) => l._id),
        },
      ];

      render(
        <WorkflowRunTimelineStepper
          run={mockRun}
          stages={stages}
          inventoryList={lots}
        />
      );

      const stageCard = screen.getByTestId('stage-step-1');
      fireEvent.click(stageCard.querySelector('[data-testid="expand-audit-btn"]') as HTMLElement);

      const lotsSection = stageCard.querySelector('[data-testid="stage-allocated-lots-section"]') as HTMLElement;
      expect(lotsSection).toBeInTheDocument();
      expect(within(lotsSection).getAllByTestId('stage-allocated-lot-row')).toHaveLength(10);
      expect(within(lotsSection).getByTestId('stage-allocated-lots-page-info')).toHaveTextContent(/Showing 1 to 10 of 22 lots/i);

      // Change page size to 20
      const select = within(lotsSection).getByTestId('stage-allocated-lots-page-size-select');
      fireEvent.change(select, { target: { value: '20' } });
      expect(within(lotsSection).getAllByTestId('stage-allocated-lot-row')).toHaveLength(20);
      expect(within(lotsSection).getByTestId('stage-allocated-lots-page-info')).toHaveTextContent(/Showing 1 to 20 of 22 lots/i);
    });

    it('supports pagination in expanded Landfill stage audit', () => {
      const lots = generateLots(12);
      const stages = [
        {
          stageNumber: 1,
          name: 'Eco Disposal Gate',
          stageType: 'landfill',
          waitHours: 12,
          allocatedLotIds: lots.map((l) => l._id),
        },
      ];

      render(
        <WorkflowRunTimelineStepper
          run={mockRun}
          stages={stages}
          inventoryList={lots}
        />
      );

      const stageCard = screen.getByTestId('stage-step-1');
      fireEvent.click(stageCard.querySelector('[data-testid="expand-audit-btn"]') as HTMLElement);

      const lotsSection = stageCard.querySelector('[data-testid="stage-allocated-lots-section"]') as HTMLElement;
      expect(lotsSection).toBeInTheDocument();
      expect(within(lotsSection).getAllByTestId('stage-allocated-lot-row')).toHaveLength(10);
      expect(within(lotsSection).getByTestId('stage-allocated-lots-page-info')).toHaveTextContent(/Showing 1 to 10 of 12 lots/i);

      // Click Next
      fireEvent.click(within(lotsSection).getByTestId('stage-allocated-lots-page-next'));
      expect(within(lotsSection).getAllByTestId('stage-allocated-lot-row')).toHaveLength(2);
      expect(within(lotsSection).getByTestId('stage-allocated-lots-page-info')).toHaveTextContent(/Showing 11 to 12 of 12 lots/i);
    });
  });
});
