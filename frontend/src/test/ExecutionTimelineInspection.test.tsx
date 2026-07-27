import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WorkflowsView } from '../components/WorkflowsView';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import coreReducer from '../store/slices/coreSlice';
import ingestionReducer from '../store/slices/ingestionSlice';
import inventoryReducer from '../store/slices/inventorySlice';
import workflowReducer from '../store/slices/workflowSlice';

describe('TDD Suite: Issues 0056-0057 (ExecutedAt Dropdown & Execution Audit Modal)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url.includes('/api/oauth/status')) {
        return new Response(JSON.stringify({ success: true, status: 'connected' }), { status: 200 });
      }
      if (url.includes('/liquidation-automations/runs/run-999')) {
        return new Response(JSON.stringify({
          _id: 'run-999',
          executedAt: '2026-07-23T18:30:00.000Z',
          runType: 'scheduled',
          status: 'evaluating',
          buyerEmails: ['purchasing@primaryretails.com', 'deals@secondaryjobbers.com'],
          affectedInventoryLots: [
            { lotId: 'lot-1', lotNumber: 'LOT-MILK-101', sku: 'MILK-ORGANIC', description: 'Organic Whole Milk', cases: 400, rsl: 0.12 }
          ],
          campaignSnapshot: {
            name: 'Dairy Flash Clearance Strategy',
            templateName: 'category_liquidation',
            inventoryFilters: { category: 'Dairy' },
            donationConfig: { enabled: true, maxCases: 500 }
          }
        }), { status: 200 });
      }
      return new Response(JSON.stringify([]), { status: 200 });
    }));
  });

  it('Cycle 3 & 4 (Issues 0056-0057): should render ExecutedAt dropdown column and open sales-friendly execution audit modal on selection', async () => {
    const store = configureStore({
      reducer: {
        core: coreReducer,
        ingestion: ingestionReducer,
        inventory: inventoryReducer,
        workflow: workflowReducer,
      },
    });

    const mockCampaign = {
      _id: 'c-100',
      name: 'Dairy Flash Clearance Strategy',
      templateName: 'category_liquidation',
      status: 'active',
      createdAt: new Date().toISOString()
    };

    const mockRuns = [
      {
        _id: 'run-999',
        automationId: 'c-100',
        executedAt: '2026-07-23T18:30:00.000Z',
        runType: 'scheduled',
        status: 'evaluating'
      },
      {
        _id: 'run-888',
        automationId: 'c-100',
        executedAt: '2026-07-22T10:15:00.000Z',
        runType: 'manual',
        status: 'awarded'
      }
    ];

    store.dispatch({ type: 'workflow/setLiquidationAutomations', payload: [mockCampaign] });
    store.dispatch({ type: 'workflow/setAutomationRuns', payload: mockRuns });

    render(
      <Provider store={store}>
        <WorkflowsView supplierId="sup-101" apiBaseUrl="http://localhost:3000/api" />
      </Provider>
    );

    // Switch to Saved Campaigns sub-tab
    const savedTabBtn = screen.getByRole('button', { name: /Saved Campaigns/i });
    fireEvent.click(savedTabBtn);

    // ExecutedAt column header should be in document
    expect(screen.getByText('ExecutedAt')).toBeInTheDocument();

    // Find history dropdown select
    const dropdownSelect = screen.getByLabelText(/Select Execution Timestamp/i);
    expect(dropdownSelect).toBeInTheDocument();

    // Select run-999 from dropdown
    fireEvent.change(dropdownSelect, { target: { value: 'run-999' } });

    // Inspection modal should open with execution title and sections
    expect(await screen.findByText(/Workflow Execution Timeline Data Snapshot/i)).toBeInTheDocument();
    expect(screen.getByText(/1. Affected Inventory Lots/i)).toBeInTheDocument();
    expect(screen.getByText('LOT-MILK-101')).toBeInTheDocument();
    expect(screen.getByText('MILK-ORGANIC')).toBeInTheDocument();
    expect(screen.getByText(/2. Targeted Buyer Email List/i)).toBeInTheDocument();
    expect(screen.getByText('purchasing@primaryretails.com')).toBeInTheDocument();
    expect(screen.getByText(/3. Frozen Campaign Settings & Rules Snapshot/i)).toBeInTheDocument();
    expect(screen.getByText(/4. Execution Resolution Outcome/i)).toBeInTheDocument();
  });
});
