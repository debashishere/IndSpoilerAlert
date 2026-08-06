import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LiquidationAutomationStudio } from '../components/LiquidationAutomationStudio';

const mockInventoryLots = [
  {
    _id: 'lot-1',
    lotNumber: 'LOT-99',
    availableQty: 500,
    quantityCases: 500,
    remainingShelfLife: 0.1,
    productId: { sku: 'MILK-1', description: 'Organic Milk', category: 'Dairy' }
  }
];

describe('Issue #46 / PRD 47: Studio Persistence & Dual Launch Execution', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
      if (url.includes('/inventory')) {
        return new Response(JSON.stringify(mockInventoryLots), { status: 200 });
      }
      return new Response(JSON.stringify({ _id: 'camp-123', status: 'draft' }), { status: 200 });
    }));
  });

  it('Slice 1 (Tracer Bullet): should render dual CTA buttons and persist draft campaign with status draft', async () => {
    const onSuccess = vi.fn();
    render(
      <LiquidationAutomationStudio
        supplierId="sup-101"
        inventoryLots={mockInventoryLots}
        buyers={[]}
        apiBaseUrl="http://localhost:3000/api"
        onSuccess={onSuccess}
      />
    );

    // Verify dual CTA buttons exist in UI
    const saveDraftBtns = screen.getAllByRole('button', { name: /Save as Draft/i });
    const launchActiveBtns = screen.getAllByRole('button', { name: /Launch Active Campaign/i });

    expect(saveDraftBtns.length).toBeGreaterThan(0);
    expect(launchActiveBtns.length).toBeGreaterThan(0);

    // Click Save as Draft
    fireEvent.click(saveDraftBtns[0]);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/liquidation-automations',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"status":"draft"')
        })
      );
    });

    expect(onSuccess).toHaveBeenCalledWith('saved');
  });

  it('Slice 2: should open Pre-Flight Audit modal and launch active campaign with status active', async () => {
    const onSuccess = vi.fn();
    render(
      <LiquidationAutomationStudio
        supplierId="sup-101"
        inventoryLots={mockInventoryLots}
        buyers={[]}
        apiBaseUrl="http://localhost:3000/api"
        onSuccess={onSuccess}
      />
    );

    // Wait for inventory load so launch button is enabled
    const launchActiveBtns = await screen.findAllByRole('button', { name: /Launch Active Campaign/i });
    await waitFor(() => expect(launchActiveBtns[0]).not.toBeDisabled());

    fireEvent.click(launchActiveBtns[0]);

    // Modal should appear
    expect(screen.getByText('Pre-Flight Automation Launch Audit')).toBeInTheDocument();

    // Click Confirm & Launch inside modal
    const confirmBtn = screen.getByRole('button', { name: /Confirm & Launch/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/liquidation-automations',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"status":"active"')
        })
      );
    });

    expect(onSuccess).toHaveBeenCalledWith('launched');
  });

  it('Slice 3: should hydrate studio state when editingCampaignId prop is provided', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url.includes('/liquidation-automations/camp-99')) {
        return new Response(JSON.stringify({
          _id: 'camp-99',
          name: 'Custom Holiday Clearance',
          startDate: '2026-11-01T00:00:00.000Z',
          endDate: '2026-11-15T00:00:00.000Z',
          templateName: 'category_liquidation',
          templateKey: 'category_liquidation',
          inventoryFilters: { category: 'Dairy', maxRsl: 0.15, minCases: 50 },
          emailTemplate: { subject: 'Holiday Exclusive Offer', blocks: [] }
        }), { status: 200 });
      }
      return new Response(JSON.stringify(mockInventoryLots), { status: 200 });
    }));

    render(
      <LiquidationAutomationStudio
        supplierId="sup-101"
        editingCampaignId="camp-99"
        inventoryLots={mockInventoryLots}
        buyers={[]}
        apiBaseUrl="http://localhost:3000/api"
      />
    );

    // Verify workflow name inputs are hydrated with saved name
    await waitFor(() => {
      const nameInputs = screen.getAllByDisplayValue('Custom Holiday Clearance');
      expect(nameInputs.length).toBeGreaterThan(0);
    });
  });

  it('Slice 4: should issue PUT request when saving an existing campaign with editingCampaignId', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url.includes('/liquidation-automations/camp-99')) {
        return new Response(JSON.stringify({
          _id: 'camp-99',
          name: 'Updated Holiday Strategy',
          status: 'draft'
        }), { status: 200 });
      }
      return new Response(JSON.stringify(mockInventoryLots), { status: 200 });
    }));

    const onSuccess = vi.fn();
    render(
      <LiquidationAutomationStudio
        supplierId="sup-101"
        editingCampaignId="camp-99"
        inventoryLots={mockInventoryLots}
        buyers={[]}
        apiBaseUrl="http://localhost:3000/api"
        onSuccess={onSuccess}
      />
    );

    await waitFor(() => {
      expect(screen.getAllByDisplayValue('Updated Holiday Strategy').length).toBeGreaterThan(0);
    });

    const saveDraftBtn = screen.getAllByRole('button', { name: /Save as Draft/i })[0];
    await waitFor(() => expect(saveDraftBtn).not.toBeDisabled());
    fireEvent.click(saveDraftBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/liquidation-automations/camp-99',
        expect.objectContaining({
          method: 'PUT',
          body: expect.stringContaining('"status":"draft"')
        })
      );
    });

    expect(onSuccess).toHaveBeenCalledWith('saved');
  });

  it('Slice 5: should handle Edit action in Saved Campaigns tab and switch sub-tab cleanly after saving', async () => {
    const { configureStore } = await import('@reduxjs/toolkit');
    const { Provider } = await import('react-redux');
    const { default: coreReducer } = await import('../store/slices/coreSlice');
    const { default: ingestionReducer } = await import('../store/slices/ingestionSlice');
    const { default: inventoryReducer } = await import('../store/slices/inventorySlice');
    const { default: workflowReducer } = await import('../store/slices/workflowSlice');
    const { WorkflowsView } = await import('../components/WorkflowsView');

    const store = configureStore({
      reducer: {
        core: coreReducer,
        ingestion: ingestionReducer,
        inventory: inventoryReducer,
        workflow: workflowReducer,
      },
    });

    store.dispatch({
      type: 'workflow/setLiquidationAutomations',
      payload: [
        {
          _id: 'camp-101',
          name: 'Q3 Dairy Clearance',
          templateName: 'short_dated_clearance',
          status: 'draft',
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

    // Click Saved Campaigns sub-tab button
    const savedTabBtn = screen.getByRole('button', { name: /Saved Campaigns/i });
    fireEvent.click(savedTabBtn);

    // Verify Saved Campaigns tab is rendered
    expect(screen.getByText('Q3 Dairy Clearance')).toBeInTheDocument();

    // Click actions menu and Edit
    const actionButtons = screen.getAllByRole('button', { name: 'Actions' });
    fireEvent.click(actionButtons[0]);

    const editBtn = screen.getByText('Edit');
    fireEvent.click(editBtn);

    // Verify Redux state updated to builder tab and editingCampaignId
    expect(store.getState().workflow.workflowSubTab).toBe('builder');
    expect(store.getState().workflow.editingCampaignId).toBe('camp-101');
  });
});
