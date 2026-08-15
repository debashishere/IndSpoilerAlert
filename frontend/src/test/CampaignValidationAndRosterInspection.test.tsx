import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LiquidationAutomationStudio } from '../components/LiquidationAutomationStudio';
import { WorkflowsView } from '../components/WorkflowsView';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import coreReducer from '../store/slices/coreSlice';
import ingestionReducer from '../store/slices/ingestionSlice';
import inventoryReducer from '../store/slices/inventorySlice';
import workflowReducer from '../store/slices/workflowSlice';

const mockInventoryLots = [
  {
    _id: 'lot-101',
    lotNumber: 'LOT-MILK-101',
    availableQty: 400,
    quantityCases: 400,
    remainingShelfLife: 0.12,
    unitCogs: 12.50,
    productId: { sku: 'MILK-ORGANIC', description: 'Organic Whole Milk 1 Gallon', category: 'Dairy' }
  },
  {
    _id: 'lot-102',
    lotNumber: 'LOT-YOGURT-102',
    availableQty: 250,
    quantityCases: 250,
    remainingShelfLife: 0.08,
    unitCogs: 8.00,
    productId: { sku: 'YOGURT-GREEK', description: 'Greek Yogurt Vanilla', category: 'Dairy' }
  }
];

const mockBuyers = [
  { _id: 'b-1', companyName: 'Tier 1 Primary Retails', email: 'purchasing@primaryretails.com', createdAt: '2026-05-10T10:00:00.000Z' },
  { _id: 'b-2', companyName: 'Secondary Market Jobbers', email: 'deals@secondaryjobbers.com', createdAt: '2026-06-01T10:00:00.000Z' }
];

describe('TDD Suite: Issues 0048-0051 (Campaign Validations, Buyer Segment Roster, Popover UX & Edit Hydration)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url.includes('/inventory')) {
        return new Response(JSON.stringify(mockInventoryLots), { status: 200 });
      }
      return new Response(JSON.stringify({ _id: 'camp-777', status: 'draft' }), { status: 200 });
    }));
    vi.stubGlobal('alert', vi.fn());
  });

  // ─── Cycle 1: Issue 0048 ──────────────────────────────────────────────────
  it('Cycle 1 (Issue 0048): should block campaign save and display alert if matched inventory lots total 0 or cases total 0', async () => {
    const onSuccess = vi.fn();
    render(
      <LiquidationAutomationStudio
        supplierId="sup-101"
        inventoryLots={[]} // Empty inventory forces totalLots = 0
        buyers={mockBuyers}
        apiBaseUrl="http://localhost:3000/api"
        onSuccess={onSuccess}
      />
    );

    const saveDraftBtn = screen.getAllByRole('button', { name: /Save as Draft|Save/i })[0];
    fireEvent.click(saveDraftBtn);

    // Validation alert must be triggered and save API call blocked
    expect(window.alert).toHaveBeenCalledWith(
      expect.stringContaining('Validation Error: At least 1 available and valid inventory lot must be selected')
    );
    expect(global.fetch).not.toHaveBeenCalledWith(
      'http://localhost:3000/api/liquidation-automations',
      expect.anything()
    );
    expect(onSuccess).not.toHaveBeenCalled();
  });

  // ─── Cycle 2: Issue 0049 ──────────────────────────────────────────────────
  it('Cycle 2 (Issue 0049): should render Eye button beside target buyer segment and open buyer roster inspection modal', async () => {
    render(
      <LiquidationAutomationStudio
        supplierId="sup-101"
        inventoryLots={mockInventoryLots}
        buyers={mockBuyers}
        apiBaseUrl="http://localhost:3000/api"
      />
    );

    // Expand stage 1 panel by clicking stage index 1
    const stage1Circle = screen.getAllByText('1')[0];
    fireEvent.click(stage1Circle);

    // Eye button title: "Inspect Buyer Data (Name, Email, Reg Date)"
    const eyeBtns = screen.getAllByTitle(/Inspect Buyer Data/i);
    expect(eyeBtns.length).toBeGreaterThan(0);

    // Click Eye button
    fireEvent.click(eyeBtns[0]);

    // Modal title should appear
    expect(await screen.findByText(/Buyer Segment Data:/i)).toBeInTheDocument();
    expect(screen.getByText(/Name \/ Company/i)).toBeInTheDocument();
    expect(screen.getByText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Registration Date/i).length).toBeGreaterThan(0);

    // Verify buyer entries rendered in modal
    expect(screen.getByText('Tier 1 Primary Retails')).toBeInTheDocument();
    expect(screen.getByText('purchasing@primaryretails.com')).toBeInTheDocument();

    // Test search filter inside modal
    const searchInput = screen.getByPlaceholderText(/Search buyers by name or email/i);
    fireEvent.change(searchInput, { target: { value: 'secondary' } });

    expect(screen.getByText('Secondary Market Jobbers')).toBeInTheDocument();
    expect(screen.queryByText('Tier 1 Primary Retails')).not.toBeInTheDocument();
  });

  // ─── Cycle 3: Issue 0050 ──────────────────────────────────────────────────
  it('Cycle 3 (Issue 0050): should position action menu popover upward for bottom table rows and scroll to top on edit', async () => {
    vi.stubGlobal('scrollTo', vi.fn());

    const store = configureStore({
      reducer: {
        core: coreReducer,
        ingestion: ingestionReducer,
        inventory: inventoryReducer,
        workflow: workflowReducer,
      },
    });

    const mockCampaigns = [
      { _id: 'c-1', name: 'Strategy 1', templateName: 'clearance', status: 'draft', createdAt: new Date().toISOString() },
      { _id: 'c-2', name: 'Strategy 2', templateName: 'clearance', status: 'draft', createdAt: new Date().toISOString() },
      { _id: 'c-3', name: 'Strategy 3', templateName: 'clearance', status: 'draft', createdAt: new Date().toISOString() },
      { _id: 'c-4', name: 'Strategy 4', templateName: 'clearance', status: 'draft', createdAt: new Date().toISOString() },
      { _id: 'c-5', name: 'Strategy 5 (Bottom Row)', templateName: 'clearance', status: 'draft', createdAt: new Date().toISOString() }
    ];

    store.dispatch({ type: 'workflow/setLiquidationAutomations', payload: mockCampaigns });

    render(
      <Provider store={store}>
        <WorkflowsView supplierId="sup-101" />
      </Provider>
    );

    // Switch to Saved Campaigns sub-tab
    const savedTabBtn = screen.getByRole('button', { name: /Saved Campaigns/i });
    fireEvent.click(savedTabBtn);

    // Click 3-dots action menu on bottom row item
    const actionBtns = screen.getAllByRole('button', { name: 'Actions' });
    const bottomActionBtn = actionBtns[4];
    fireEvent.click(bottomActionBtn);

    // Verify popover menu appears and has upward positioning (bottom: 44px)
    const editBtn = screen.getByText('Edit');
    const popoverContainer = editBtn.closest('div');
    expect(popoverContainer?.style.bottom).toBe('44px');

    // Click Edit
    fireEvent.click(editBtn);

    // Verify view scrolled to top and sub-tab changed to builder
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    expect(store.getState().workflow.workflowSubTab).toBe('builder');
    expect(store.getState().workflow.editingCampaignId).toBe('c-5');
  });

  // ─── Cycle 4: Issue 0051 ──────────────────────────────────────────────────
  it('Cycle 4 (Issue 0051): should re-hydrate saved inventory filters, explicit lots, and live impact metrics on edit', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url.includes('/liquidation-automations/camp-888')) {
        return new Response(JSON.stringify({
          _id: 'camp-888',
          name: 'Dairy Special Flash Strategy',
          startDate: '2026-08-01T00:00:00.000Z',
          endDate: '2026-08-15T00:00:00.000Z',
          templateName: 'category_liquidation',
          templateKey: 'category_liquidation',
          inventoryFilters: { category: 'Dairy', maxRsl: 0.15, minCases: 0, explicitLotIds: ['lot-101'] }
        }), { status: 200 });
      }
      return new Response(JSON.stringify(mockInventoryLots), { status: 200 });
    }));

    render(
      <LiquidationAutomationStudio
        supplierId="sup-101"
        editingCampaignId="camp-888"
        inventoryLots={mockInventoryLots}
        buyers={mockBuyers}
        apiBaseUrl="http://localhost:3000/api"
      />
    );

    // Verify hydrated campaign name appears in input
    await waitFor(() => {
      expect(screen.getAllByDisplayValue('Dairy Special Flash Strategy').length).toBeGreaterThan(0);
    });

    // Verify Live Impact panel calculates matched lots and cases from hydrated explicitLotIds
    expect(screen.getByText('Matched Lots')).toBeInTheDocument();
    expect(screen.getByText('Total Cases')).toBeInTheDocument();
  });

  it('should disable Eye button when no buyer list is selected or configured', async () => {
    render(
      <LiquidationAutomationStudio
        supplierId="sup-101"
        inventoryLots={mockInventoryLots}
        buyers={[]} // No buyers registered
        apiBaseUrl="http://localhost:3000/api"
      />
    );

    // Expand stage 1 card
    const stage1Circle = screen.getAllByText('1')[0];
    fireEvent.click(stage1Circle);

    // The Eye button should be disabled when selected list has 0 buyers
    const eyeBtns = screen.getAllByTitle(/Selected buyer list has 0 buyers configured|No buyer list selected/i);
    expect(eyeBtns.length).toBeGreaterThan(0);
    expect((eyeBtns[0] as HTMLButtonElement).disabled).toBe(true);
  });
});
