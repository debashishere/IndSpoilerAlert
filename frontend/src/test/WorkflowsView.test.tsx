import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import coreReducer from '../store/slices/coreSlice';
import ingestionReducer from '../store/slices/ingestionSlice';
import inventoryReducer from '../store/slices/inventorySlice';
import workflowReducer from '../store/slices/workflowSlice';
import { WorkflowsView, formatDurationHours, formatDurationShort } from '../components/WorkflowsView';
import { PreFlightAuditModal } from '../components/domain/workflows/PreFlightAuditModal';

const createTestStore = () =>
  configureStore({
    reducer: {
      core: coreReducer,
      ingestion: ingestionReducer,
      inventory: inventoryReducer,
      workflow: workflowReducer,
    },
  });

describe('Issue #40 Integration: WorkflowsView & Campaign Studio', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify([]), { status: 200 })));
  });

  it('should render WorkflowsView with 3 sub-tabs, default to Campaign Builder, and switch tabs cleanly', async () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <WorkflowsView supplierId="sup-101" />
      </Provider>
    );

    // Verify main header and 3 sub-tabs
    expect(screen.getByText('Liquidation Automations & Campaigns')).toBeInTheDocument();
    expect(screen.getByText('Campaign Builder')).toBeInTheDocument();
    expect(screen.getByText('Saved Campaigns')).toBeInTheDocument();
    expect(screen.getByText('Runs & History')).toBeInTheDocument();

    // Default sub-tab state should be 'builder'
    expect(store.getState().workflow.workflowSubTab).toBe('builder');

    // Click Saved Campaigns
    fireEvent.click(screen.getByText('Saved Campaigns'));
    expect(store.getState().workflow.workflowSubTab).toBe('saved');

    // Click Campaign Builder
    fireEvent.click(screen.getByText('Campaign Builder'));
    expect(store.getState().workflow.workflowSubTab).toBe('builder');
  });

  it('should configure campaign cycle details and sales strategy in Campaign Builder studio', async () => {
    const store = createTestStore();

    render(
      <Provider store={store}>
        <WorkflowsView supplierId="sup-101" />
      </Provider>
    );

    expect(screen.getByText('1. Sales Cycle & Workflow Template')).toBeInTheDocument();
    expect(screen.getByText('Campaign Cycle Name')).toBeInTheDocument();
    expect(screen.getByText('Cycle Start Date')).toBeInTheDocument();
    expect(screen.getByText('Cycle End Date')).toBeInTheDocument();

    // Fill Campaign Cycle Name
    const nameInput = screen.getByPlaceholderText('e.g. Q3 Surplus Liquidation Campaign');
    fireEvent.change(nameInput, { target: { value: 'Holiday Surplus Liquidation' } });
    expect(nameInput).toHaveValue('Holiday Surplus Liquidation');
  });

  it('should render saved campaigns table with status badges and handle 3-dots action menu (Edit, Activate, Stop, Delete)', async () => {
    const store = createTestStore();
    store.dispatch({
      type: 'workflow/setLiquidationAutomations',
      payload: [
        {
          _id: 'camp-1',
          name: 'Q3 Dairy Clearance',
          templateName: 'short_dated_clearance',
          status: 'draft',
          createdBy: 'Sales Mgr',
          createdAt: new Date().toISOString(),
          inventoryFilters: {}
        },
        {
          _id: 'camp-2',
          name: 'Produce Fast-Track',
          templateName: 'category_liquidation',
          status: 'active',
          createdBy: 'Sales Mgr',
          createdAt: new Date().toISOString(),
          inventoryFilters: {}
        }
      ]
    });

    render(
      <Provider store={store}>
        <WorkflowsView supplierId="sup-101" />
      </Provider>
    );

    // Switch to Saved Campaigns tab
    fireEvent.click(screen.getByText('Saved Campaigns'));

    expect(screen.getByText('Q3 Dairy Clearance')).toBeInTheDocument();
    expect(screen.getByText('Produce Fast-Track')).toBeInTheDocument();
    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();

    // Click 3-dots actions menu for camp-1
    const actionButtons = screen.getAllByRole('button', { name: 'Actions' });
    fireEvent.click(actionButtons[0]);

    // Check action menu items
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Activate')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();

    // Click Edit -> should switch to builder tab and set editingCampaignId
    fireEvent.click(screen.getByText('Edit'));
    expect(store.getState().workflow.workflowSubTab).toBe('builder');
    expect(store.getState().workflow.editingCampaignId).toBe('camp-1');
  });


  it('should render PreFlightAuditModal with live impact metrics and email preview containing token table', () => {
    const mockMetrics = {
      totalLots: 12,
      totalCases: 4500,
      totalValue: 85000
    };

    const mockStages = [
      { stageIndex: 1, name: 'VIP Wholesalers', discountType: 'fixed', discountValue: 15, waitHours: 24, buyerMode: 'segment', buyerSegment: 'all_verified' }
    ];

    const previewHtmlWithToken = `<div class="email-body"><p>See table below:</p><table class="inventory_table"><tr><th>Lot</th><th>Qty</th></tr><tr><td>LOT-99</td><td>500 cs</td></tr></table></div>`;

    const onClose = vi.fn();
    const onLaunch = vi.fn();

    render(
      <PreFlightAuditModal
        showModal={true}
        onClose={onClose}
        onLaunch={onLaunch}
        isSubmitting={false}
        impactMetrics={mockMetrics}
        stages={mockStages}
        executionType="immediate"
        scheduleTime="09:00"
        workflowTimezone="America/New_York"
        emailSubject="Distressed Inventory Special Offer"
        previewHtml={previewHtmlWithToken}
      />
    );

    expect(screen.getByText('Pre-Flight Automation Launch Audit')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('4,500')).toBeInTheDocument();
    expect(screen.getByText('$85,000')).toBeInTheDocument();
    expect(screen.getByText('VIP Wholesalers')).toBeInTheDocument();
    expect(screen.getByText(/Run Immediately/i)).toBeInTheDocument();

    // Verify email preview renders HTML with table
    expect(screen.getByText('See table below:')).toBeInTheDocument();
    expect(screen.getByText('LOT-99')).toBeInTheDocument();

    // Click Confirm & Launch
    fireEvent.click(screen.getByText('🚀 Confirm & Launch'));
    expect(onLaunch).toHaveBeenCalledTimes(1);
  });

  it('should format fractional hours into readable mins/hrs in formatDurationHours and formatDurationShort', () => {
    expect(formatDurationHours(0.16666666666666666)).toBe('10 Mins');
    expect(formatDurationHours(0.5)).toBe('30 Mins');
    expect(formatDurationHours(1)).toBe('1 Hour');
    expect(formatDurationHours(1.5)).toBe('1 Hour 30 Mins');
    expect(formatDurationHours(24)).toBe('24 Hours');

    expect(formatDurationShort(0.16666666666666666)).toBe('10m');
    expect(formatDurationShort(1.5)).toBe('1h 30m');
  });

  it('should render modular WorkflowRunHistoryView when switching to Runs & History sub-tab', async () => {
    const store = createTestStore();
    store.dispatch({
      type: 'workflow/setLiquidationAutomations',
      payload: [
        {
          _id: 'camp-1',
          name: 'Q3 Dairy Clearance',
          templateName: 'short_dated_clearance',
          status: 'active'
        }
      ]
    });
    store.dispatch({
      type: 'workflow/setAutomationRuns',
      payload: [
        {
          _id: 'run-99',
          automationId: 'camp-1',
          status: 'awarded',
          dispatchedAt: new Date().toISOString(),
          snapshotInventoryIds: ['lot-1'],
          resolution: { totalValue: 5400 }
        }
      ]
    });

    render(
      <Provider store={store}>
        <WorkflowsView supplierId="sup-101" />
      </Provider>
    );

    // Click Runs & History sub-tab
    fireEvent.click(screen.getByText('Runs & History'));

    // Should render WorkflowRunHistoryView
    expect(screen.getByTestId('workflow-run-history-view')).toBeInTheDocument();
    expect(screen.getByText('Q3 Dairy Clearance')).toBeInTheDocument();
    expect(screen.getByText('1 Run')).toBeInTheDocument();
  });

  it('should render Saved Campaigns executive KPI metric strip and allow searching campaigns by query', async () => {
    const store = createTestStore();
    store.dispatch({
      type: 'workflow/setLiquidationAutomations',
      payload: [
        {
          _id: 'camp-10',
          name: 'Summer Dairy Clearance',
          templateName: 'category_liquidation',
          status: 'active',
          inventoryFilters: { category: 'dairy' }
        },
        {
          _id: 'camp-20',
          name: 'Winter Bakery Rescue',
          templateName: 'short_dated_clearance',
          status: 'draft',
          inventoryFilters: { category: 'bakery' }
        }
      ]
    });

    render(
      <Provider store={store}>
        <WorkflowsView supplierId="sup-101" />
      </Provider>
    );

    // Switch to Saved Campaigns
    fireEvent.click(screen.getByText('Saved Campaigns'));

    // Verify executive KPI metrics
    expect(screen.getByText('Total Strategies')).toBeInTheDocument();
    expect(screen.getByText('Active Dispatchers')).toBeInTheDocument();
    expect(screen.getByText('Inventory In Scope')).toBeInTheDocument();

    // Verify both campaigns are displayed initially
    expect(screen.getByText('Summer Dairy Clearance')).toBeInTheDocument();
    expect(screen.getByText('Winter Bakery Rescue')).toBeInTheDocument();

    // Type 'Bakery' into the search input
    const searchInput = screen.getByPlaceholderText('Search campaigns by name, template...');
    fireEvent.change(searchInput, { target: { value: 'Bakery' } });

    // Only Bakery campaign should be visible
    expect(screen.getByText('Winter Bakery Rescue')).toBeInTheDocument();
    expect(screen.queryByText('Summer Dairy Clearance')).not.toBeInTheDocument();

    // Clear search
    const clearButton = screen.getByLabelText('Clear Search');
    fireEvent.click(clearButton);

    // Both should be visible again
    expect(screen.getByText('Summer Dairy Clearance')).toBeInTheDocument();
    expect(screen.getByText('Winter Bakery Rescue')).toBeInTheDocument();
  });

  it('should filter Saved Campaigns by status and show filter empty state with reset option', async () => {
    const store = createTestStore();
    store.dispatch({
      type: 'workflow/setLiquidationAutomations',
      payload: [
        {
          _id: 'camp-10',
          name: 'Summer Dairy Clearance',
          templateName: 'category_liquidation',
          status: 'active',
          inventoryFilters: {}
        },
        {
          _id: 'camp-20',
          name: 'Winter Bakery Rescue',
          templateName: 'short_dated_clearance',
          status: 'draft',
          inventoryFilters: {}
        }
      ]
    });

    render(
      <Provider store={store}>
        <WorkflowsView supplierId="sup-101" />
      </Provider>
    );

    fireEvent.click(screen.getByText('Saved Campaigns'));

    // Click Active Pipelines filter
    fireEvent.click(screen.getByText('Active Pipelines'));
    expect(screen.getByText('Summer Dairy Clearance')).toBeInTheDocument();
    expect(screen.queryByText('Winter Bakery Rescue')).not.toBeInTheDocument();

    // Click Stopped Pipelines filter (0 stopped campaigns)
    fireEvent.click(screen.getByText('Stopped Pipelines'));
    expect(screen.getByText('No matching campaign strategies')).toBeInTheDocument();
    expect(screen.getByText('Reset Filters')).toBeInTheDocument();

    // Click Reset Filters
    fireEvent.click(screen.getByText('Reset Filters'));
    expect(screen.getByText('Summer Dairy Clearance')).toBeInTheDocument();
    expect(screen.getByText('Winter Bakery Rescue')).toBeInTheDocument();
  });

  it('should open Strategy Stage Pipeline modal with stage waterfall and edit via footer', async () => {
    const store = createTestStore();
    store.dispatch({
      type: 'workflow/setLiquidationAutomations',
      payload: [
        {
          _id: 'camp-30',
          name: 'Tiered Liquidation Cascade',
          templateName: 'waterfall_liquidation',
          status: 'active',
          stages: [
            { stageIndex: 1, name: 'Tier 1 Buyers', discountType: 'fixed', discountValue: 10, waitHours: 24 },
            { stageIndex: 2, name: 'Liquidator Network', discountType: 'fixed', discountValue: 30, waitHours: 48 }
          ]
        }
      ]
    });

    render(
      <Provider store={store}>
        <WorkflowsView supplierId="sup-101" />
      </Provider>
    );

    fireEvent.click(screen.getByText('Saved Campaigns'));

    // Click Stages badge
    fireEvent.click(screen.getByText('Stages →'));

    // Modal should be open
    expect(screen.getByText('Strategy Action Breakdown & Stage Pipeline')).toBeInTheDocument();
    expect(screen.getByText('STAGE 1')).toBeInTheDocument();
    expect(screen.getByText('STAGE 2')).toBeInTheDocument();
    expect(screen.getByText('FALLBACK GATE')).toBeInTheDocument();

    // Click Edit in Campaign Builder from the ergonomic footer
    fireEvent.click(screen.getByText('Edit in Campaign Builder'));

    // Should switch to builder subtab with editingCampaignId set
    expect(store.getState().workflow.workflowSubTab).toBe('builder');
    expect(store.getState().workflow.editingCampaignId).toBe('camp-30');
  });

  it('should open Matched Inventory Scope modal with in-modal search and close via footer', async () => {
    const store = createTestStore();
    store.dispatch({
      type: 'workflow/setLiquidationAutomations',
      payload: [
        {
          _id: 'camp-40',
          name: 'Produce Batch Strategy',
          templateName: 'category_liquidation',
          status: 'active',
          inventoryFilters: {}
        }
      ]
    });
    store.dispatch({
      type: 'inventory/setInventoryList',
      payload: [
        { _id: 'lot-1', lotNumber: 'LOT-101', description: 'Fresh Apples', availableQty: 200 },
        { _id: 'lot-2', lotNumber: 'LOT-102', description: 'Fresh Oranges', availableQty: 300 }
      ]
    });

    render(
      <Provider store={store}>
        <WorkflowsView
          supplierId="sup-101"
          inventoryLots={[
            { _id: 'lot-1', lotNumber: 'LOT-101', description: 'Fresh Apples', availableQty: 200 },
            { _id: 'lot-2', lotNumber: 'LOT-102', description: 'Fresh Oranges', availableQty: 300 }
          ]}
        />
      </Provider>
    );

    fireEvent.click(screen.getByText('Saved Campaigns'));

    // Click View button in Matched Inventory column
    fireEvent.click(screen.getByText('View'));

    // Modal should open
    expect(screen.getByText('Matched Inventory Scope & Bidding Audit')).toBeInTheDocument();
    expect(screen.getByText('LOT-101')).toBeInTheDocument();
    expect(screen.getByText('LOT-102')).toBeInTheDocument();

    // Test in-modal search
    const filterInput = screen.getByPlaceholderText('Filter matched lots by SKU, title, lot number, or DC...');
    fireEvent.change(filterInput, { target: { value: 'Oranges' } });
    expect(screen.getByText('LOT-102')).toBeInTheDocument();
    expect(screen.queryByText('LOT-101')).not.toBeInTheDocument();

    // Click Close from the ergonomic modal footer
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByText('Matched Inventory Scope & Bidding Audit')).not.toBeInTheDocument();
  });
});

