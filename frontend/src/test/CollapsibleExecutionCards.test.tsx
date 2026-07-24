import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WorkflowsView } from '../components/WorkflowsView';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import coreReducer from '../store/slices/coreSlice';
import ingestionReducer from '../store/slices/ingestionSlice';
import inventoryReducer from '../store/slices/inventorySlice';
import workflowReducer from '../store/slices/workflowSlice';

describe('TDD Suite: Unified Collapsible Workflow Execution Cards & Section Controls', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify([]), { status: 200 })));
  });

  const createMockStore = () => {
    const store = configureStore({
      reducer: {
        core: coreReducer,
        ingestion: ingestionReducer,
        inventory: inventoryReducer,
        workflow: workflowReducer,
      },
    });

    const mockAutomations = [
      {
        _id: 'auto-101',
        name: 'Short-Dated Organic Dairy Clearance',
        templateName: 'category_liquidation',
        status: 'active'
      }
    ];

    const mockRuns = [
      {
        _id: 'run-historical-1',
        automationId: 'auto-101',
        dispatchedAt: '2026-07-24T10:00:00.000Z',
        evaluationEndsAt: '2026-07-25T10:00:00.000Z',
        status: 'awarded',
        runType: 'scheduled',
        snapshotInventoryIds: ['lot-1', 'lot-2'],
        resolution: {
          action: 'auto_award',
          targetBuyerId: { companyName: 'Metro Grocery Buyers', email: 'bids@metrogrocery.com' },
          winningPrice: 18.5,
          totalCases: 450,
          totalValue: 8325.0
        }
      },
      {
        _id: 'run-historical-2',
        automationId: 'auto-101',
        dispatchedAt: '2026-07-23T08:00:00.000Z',
        evaluationEndsAt: '2026-07-24T08:00:00.000Z',
        status: 'fallback_executed',
        runType: 'manual',
        snapshotInventoryIds: ['lot-3'],
        resolution: {
          action: 'auto_donate',
          targetEntity: 'City Food Bank',
          totalCases: 200
        }
      }
    ];

    store.dispatch({ type: 'workflow/setLiquidationAutomations', payload: mockAutomations });
    store.dispatch({ type: 'workflow/setAutomationRuns', payload: mockRuns });
    store.dispatch({ type: 'workflow/setWorkflowSubTab', payload: 'runs' });

    return store;
  };

  it('Test 1: should render Run History as collapsible execution cards instead of a flat table, and render global section toolbar controls', async () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <WorkflowsView supplierId="sup-101" apiBaseUrl="http://localhost:3000/api" />
      </Provider>
    );

    // Section title should be present
    expect(screen.getByText('Run History & Audit Log')).toBeInTheDocument();

    // Global collapse/expand controls should be rendered in the section header
    const expandAllBtn = screen.getByRole('button', { name: /Expand All Cards/i });
    const collapseAllBtn = screen.getByRole('button', { name: /Collapse All Cards/i });
    expect(expandAllBtn).toBeInTheDocument();
    expect(collapseAllBtn).toBeInTheDocument();

    // Historical execution items should be rendered as cards with data-testid="history-execution-card"
    const historyCards = screen.getAllByTestId('history-execution-card');
    expect(historyCards.length).toBe(2);

    // Check summary contents in history card headers
    expect(screen.getAllByText(/Short-Dated Organic Dairy Clearance/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/awarded/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/\$8,325.00 Recovered/i)).toBeInTheDocument();
  });

  it('Test 2: should toggle individual card collapse state when clicking header toggle button', async () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <WorkflowsView supplierId="sup-101" apiBaseUrl="http://localhost:3000/api" />
      </Provider>
    );

    // Initially 2 metrics grids visible
    expect(screen.getAllByText('Total Bids Received').length).toBe(2);

    // Click collapse button on the first card
    const collapseToggle = screen.getAllByRole('button', { name: /Collapse card/i })[0];
    fireEvent.click(collapseToggle);

    // Metric grid count should drop to 1
    expect(screen.getAllByText('Total Bids Received').length).toBe(1);

    // Click expand button to restore
    const expandToggle = screen.getAllByRole('button', { name: /Expand card/i })[0];
    fireEvent.click(expandToggle);

    expect(screen.getAllByText('Total Bids Received').length).toBe(2);
  });

  it('Test 3: should expand and collapse all historical cards when clicking global section toolbar buttons', async () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <WorkflowsView supplierId="sup-101" apiBaseUrl="http://localhost:3000/api" />
      </Provider>
    );

    const collapseAllBtn = screen.getByRole('button', { name: /Collapse All Cards/i });
    const expandAllBtn = screen.getByRole('button', { name: /Expand All Cards/i });

    // Click Collapse All Cards
    fireEvent.click(collapseAllBtn);
    expect(screen.queryByText('Total Bids Received')).not.toBeInTheDocument();

    // Click Expand All Cards
    fireEvent.click(expandAllBtn);
    expect(screen.getAllByText('Total Bids Received').length).toBeGreaterThan(0);
  });

  it('Test 4: should render Execution Details panel sub-tabs and switch tabs in-place without modal popups', async () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <WorkflowsView supplierId="sup-101" apiBaseUrl="http://localhost:3000/api" />
      </Provider>
    );

    // Click Details button on the first card
    const detailsBtn = screen.getAllByRole('button', { name: /Details/i })[0];
    fireEvent.click(detailsBtn);

    // Inline Details panel should be visible with Overview tab default
    expect(screen.getByText('Execution Details & Audit Panel')).toBeInTheDocument();
    expect(screen.getByText('Run Identifier')).toBeInTheDocument();

    // Click Target Lots tab
    const lotsTabBtn = screen.getByRole('button', { name: /Target Lots/i });
    fireEvent.click(lotsTabBtn);

    expect(screen.getByText(/Snapshot Lot Identifiers/i)).toBeInTheDocument();
    expect(screen.getByText('Lot ID: lot-1')).toBeInTheDocument();

    // Click Stage History tab
    const stagesTabBtn = screen.getByRole('button', { name: /Stage History/i });
    fireEvent.click(stagesTabBtn);

    expect(screen.getByText(/Stage Progression Record:/i)).toBeInTheDocument();

    // Click Raw Audit tab
    const auditTabBtn = screen.getByRole('button', { name: /Raw Audit/i });
    fireEvent.click(auditTabBtn);

    expect(screen.getByText(/"action": "auto_award"/i)).toBeInTheDocument();
  });
});
