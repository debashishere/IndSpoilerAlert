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

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (typeof url === 'string' && url.includes('/liquidation-automations/runs')) {
        return new Response(JSON.stringify(mockRuns), { status: 200 });
      }
      if (typeof url === 'string' && url.includes('/liquidation-automations')) {
        return new Response(JSON.stringify(mockAutomations), { status: 200 });
      }
      return new Response(JSON.stringify([]), { status: 200 });
    }));
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

    store.dispatch({ type: 'workflow/setLiquidationAutomations', payload: mockAutomations });
    store.dispatch({ type: 'workflow/setAutomationRuns', payload: mockRuns });
    store.dispatch({ type: 'workflow/setWorkflowSubTab', payload: 'runs' });

    return store;
  };

  it('Test 1: should render Run History with workflow strategy cards and section toolbar controls', async () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <WorkflowsView supplierId="sup-101" apiBaseUrl="http://localhost:3000/api" />
      </Provider>
    );

    // Global collapse/expand controls should be rendered in the section header
    const expandAllBtn = screen.getByRole('button', { name: /Expand All/i });
    const collapseAllBtn = screen.getByRole('button', { name: /Collapse All/i });
    expect(expandAllBtn).toBeInTheDocument();
    expect(collapseAllBtn).toBeInTheDocument();

    // Check summary contents in history card headers
    expect(screen.getAllByText(/Short-Dated Organic Dairy Clearance/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/awarded/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/\$8,325.00/i).length).toBeGreaterThan(0);
  });

  it('Test 2: should toggle individual workflow card collapse state when clicking collapse/expand toggle button', async () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <WorkflowsView supplierId="sup-101" apiBaseUrl="http://localhost:3000/api" />
      </Provider>
    );

    // Initially runs under the workflow are visible
    expect(screen.getAllByTestId('execution-run-row').length).toBe(2);
    expect(screen.getByText('#ORICAL-1')).toBeInTheDocument();

    // Click collapse button on the workflow card
    const collapseToggle = screen.getByRole('button', { name: /Collapse workflow/i });
    fireEvent.click(collapseToggle);

    // Run item should not be visible
    expect(screen.queryByTestId('execution-run-row')).not.toBeInTheDocument();
    expect(screen.queryByText('#ORICAL-1')).not.toBeInTheDocument();

    // Click expand button to restore
    const expandToggle = screen.getByRole('button', { name: /Expand workflow/i });
    fireEvent.click(expandToggle);

    expect(screen.getAllByTestId('execution-run-row').length).toBe(2);
    expect(screen.getByText('#ORICAL-1')).toBeInTheDocument();
  });

  it('Test 3: should expand and collapse all workflow cards when clicking global section toolbar buttons', async () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <WorkflowsView supplierId="sup-101" apiBaseUrl="http://localhost:3000/api" />
      </Provider>
    );

    const collapseAllBtn = screen.getByRole('button', { name: /Collapse All/i });
    const expandAllBtn = screen.getByRole('button', { name: /Expand All/i });

    // Click Collapse All
    fireEvent.click(collapseAllBtn);
    expect(screen.queryByTestId('execution-run-row')).not.toBeInTheDocument();
    expect(screen.queryByText('#ORICAL-1')).not.toBeInTheDocument();

    // Click Expand All
    fireEvent.click(expandAllBtn);
    expect(screen.getAllByTestId('execution-run-row').length).toBe(2);
    expect(screen.getByText('#ORICAL-1')).toBeInTheDocument();
  });

  it('Test 4: should open Full-Screen Audit Log modal and navigate tabs', async () => {
    const store = createMockStore();

    render(
      <Provider store={store}>
        <WorkflowsView supplierId="sup-101" apiBaseUrl="http://localhost:3000/api" />
      </Provider>
    );

    // Click Full-Screen Audit Log button on the first card
    const auditBtn = screen.getAllByRole('button', { name: /Full-Screen Audit Log/i })[0];
    fireEvent.click(auditBtn);

    // Full-Screen Audit Inspector modal should be visible
    expect(screen.getByTestId('workflow-run-audit-modal')).toBeInTheDocument();
    expect(screen.getByText('ID: #ORICAL-1')).toBeInTheDocument();

    // Click Inventory Scope tab
    const lotsTabBtn = screen.getByRole('button', { name: /Inventory Scope/i });
    fireEvent.click(lotsTabBtn);

    expect(screen.getByText(/Evaluated Inventory Lots/i)).toBeInTheDocument();
    expect(screen.getByText('LOT-ot-1')).toBeInTheDocument();

    // Click Strategy Snapshot tab
    const stagesTabBtn = screen.getByRole('button', { name: /Strategy Snapshot/i });
    fireEvent.click(stagesTabBtn);

    expect(screen.getByText(/Strategy Configuration Active at Dispatch/i)).toBeInTheDocument();

    // Click Raw Telemetry tab
    const auditTabBtn = screen.getByRole('button', { name: /Raw Telemetry/i });
    fireEvent.click(auditTabBtn);

    expect(screen.getByText(/auto_award/i)).toBeInTheDocument();
  });
});
