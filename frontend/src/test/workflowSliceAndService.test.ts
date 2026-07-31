import { describe, it, expect, vi, beforeEach } from 'vitest';
import { workflowSlice, selectLiveImpactMetrics, setFilterCategory, toggleExplicitLot, setSelectorMode, updateStageGate, resetCampaignWizard } from '../store/slices/workflowSlice';
import { WorkflowService } from '../services/workflowService';

describe('WorkflowService & workflowSlice Integration (Tracer Bullet)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should call WorkflowService endpoints with exact headers and paths', async () => {
    const fetchSpy = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.includes('/liquidation-cycles') && (!init || !init.method || init.method === 'GET')) {
        return new Response(JSON.stringify([{ _id: 'cycle-1', name: 'Q3 Closeout' }]), { status: 200 });
      }
      if (url.includes('/liquidation-cycles') && init?.method === 'POST') {
        return new Response(JSON.stringify({ _id: 'cycle-2', name: 'New Campaign' }), { status: 201 });
      }
      if (url.includes('/liquidation-automations/preview-email') && init?.method === 'POST') {
        return new Response(JSON.stringify({ html: '<table class="inventory_table"><tr><td>Lot 101</td></tr></table>' }), { status: 200 });
      }
      if (url.includes('/automation-runs') && (!init || !init.method || init.method === 'GET')) {
        return new Response(JSON.stringify([{ _id: 'run-1', status: 'evaluating' }]), { status: 200 });
      }
      if (url.includes('/automation-runs/run-1/force-expire') && init?.method === 'POST') {
        return new Response(JSON.stringify({ success: true, runId: 'run-1', status: 'awarded' }), { status: 200 });
      }
      return new Response(JSON.stringify({}), { status: 200 });
    });
    vi.stubGlobal('fetch', fetchSpy);

    const cycles = await WorkflowService.fetchLiquidationCycles('sup-1');
    expect(cycles).toEqual([{ _id: 'cycle-1', name: 'Q3 Closeout' }]);
    expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining('/api/liquidation-cycles?supplierId=sup-1'), expect.any(Object));

    const preview = await WorkflowService.previewEmailToken({ supplierId: 'sup-1', templateId: 'temp-1' });
    expect(preview).toEqual({ html: '<table class="inventory_table"><tr><td>Lot 101</td></tr></table>' });

    const expired = await WorkflowService.forceExpireRun('run-1');
    expect(expired).toEqual({ success: true, runId: 'run-1', status: 'awarded' });
  });

  it('should compute selectLiveImpactMetrics cleanly via Reselect given inventory and workflow slice filters', () => {
    const mockState = {
      inventory: {
        inventoryList: [
          { _id: 'lot-1', availableQty: 100, costPerCase: 15, remainingShelfLife: 0.10, productId: { category: 'Produce', description: 'Apples', sku: 'APP-1' } },
          { _id: 'lot-2', availableQty: 200, costPerCase: 20, remainingShelfLife: 0.50, productId: { category: 'Dairy', description: 'Milk', sku: 'MLK-1' } },
          { _id: 'lot-3', availableQty: 50, costPerCase: 10, remainingShelfLife: 0.05, productId: { category: 'Produce', description: 'Berries', sku: 'BER-1' } },
        ]
      },
      workflow: workflowSlice.reducer(undefined, { type: '@@INIT' })
    };

    let metrics = selectLiveImpactMetrics(mockState as any);
    expect(metrics.totalLots).toBe(3);
    expect(metrics.totalCases).toBe(350); // 100 + 200 + 50
    expect(metrics.totalValue).toBe(15*100 + 20*200 + 10*50); // 1500 + 4000 + 500 = 6000
    expect(metrics.urgentLots).toBe(2); // lot-1 (0.10) and lot-3 (0.05) <= 0.15

    // Update filter category to 'Produce'
    const updatedState = {
      ...mockState,
      workflow: workflowSlice.reducer(mockState.workflow, setFilterCategory('Produce'))
    };
    metrics = selectLiveImpactMetrics(updatedState as any);
    expect(metrics.totalLots).toBe(2); // lot-1 and lot-3
    expect(metrics.totalCases).toBe(150);
    expect(metrics.totalValue).toBe(2000); // 1500 + 500
    expect(metrics.urgentLots).toBe(2);
  });

  it('should handle explicit and hybrid selector modes inside selectLiveImpactMetrics', () => {
    const mockState = {
      inventory: {
        inventoryList: [
          { _id: 'lot-1', availableQty: 100, costPerCase: 15, remainingShelfLife: 0.10, productId: { category: 'Produce' } },
          { _id: 'lot-2', availableQty: 200, costPerCase: 20, remainingShelfLife: 0.50, productId: { category: 'Dairy' } },
        ]
      },
      workflow: workflowSlice.reducer(undefined, { type: '@@INIT' })
    };

    // Set explicit mode and toggle lot-2
    let s = workflowSlice.reducer(mockState.workflow, setSelectorMode('explicit'));
    s = workflowSlice.reducer(s, toggleExplicitLot({ lotId: 'lot-2', included: false })); // includes lot-2 in explicit
    expect(s.explicitLotIds).toContain('lot-2');

    let metrics = selectLiveImpactMetrics({ ...mockState, workflow: s } as any);
    expect(metrics.totalLots).toBe(1);
    expect(metrics.matchedLots[0]._id).toBe('lot-2');

    // Switch to hybrid mode and exclude lot-1
    s = workflowSlice.reducer(s, setSelectorMode('hybrid'));
    s = workflowSlice.reducer(s, toggleExplicitLot({ lotId: 'lot-1', included: true })); // excludes lot-1
    expect(s.excludedLotIds).toContain('lot-1');
    metrics = selectLiveImpactMetrics({ ...mockState, workflow: s } as any);
    expect(metrics.totalLots).toBe(1);
    expect(metrics.matchedLots[0]._id).toBe('lot-2');
  });

  it('should update stage gate rules and reset wizard state cleanly', () => {
    let s = workflowSlice.reducer(undefined, { type: '@@INIT' });
    s = workflowSlice.reducer(s, updateStageGate({ index: 0, updates: { discountValue: 25, waitHours: 12 } }));
    expect(s.stageGates[0].discountValue).toBe(25);
    expect(s.stageGates[0].waitHours).toBe(12);

    s = workflowSlice.reducer(s, resetCampaignWizard());
    expect(s.campaignWizardStep).toBe(1);
    expect(s.stageGates[0].discountValue).toBe(15);
  });

  it('should call WorkflowService.patchLiquidationAutomationStatus and deleteLiquidationAutomation', async () => {
    const fetchSpy = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.includes('/liquidation-automations/auto-1/status') && init?.method === 'PATCH') {
        return new Response(JSON.stringify({ _id: 'auto-1', status: 'active', isActive: true }), { status: 200 });
      }
      if (url.includes('/liquidation-automations/auto-1') && init?.method === 'DELETE') {
        return new Response(JSON.stringify({ message: 'Campaign deleted successfully', id: 'auto-1' }), { status: 200 });
      }
      return new Response(JSON.stringify({}), { status: 200 });
    });
    vi.stubGlobal('fetch', fetchSpy);

    const patched = await WorkflowService.patchLiquidationAutomationStatus('auto-1', 'active');
    expect(patched.status).toBe('active');
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/liquidation-automations/auto-1/status'),
      expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ status: 'active' }) })
    );

    const deleted = await WorkflowService.deleteLiquidationAutomation('auto-1');
    expect(deleted.id).toBe('auto-1');
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/liquidation-automations/auto-1'),
      expect.objectContaining({ method: 'DELETE' })
    );
  });

  it('should handle patchLiquidationAutomationStatusThunk.fulfilled and deleteLiquidationAutomationThunk.fulfilled in workflowSlice', () => {
    const initialState = {
      ...workflowSlice.reducer(undefined, { type: '@@INIT' }),
      liquidationAutomations: [
        { _id: 'auto-1', name: 'Campaign 1', status: 'draft', isActive: false },
        { _id: 'auto-2', name: 'Campaign 2', status: 'active', isActive: true },
      ]
    };

    // Test status patch fulfilled
    const patchedState = workflowSlice.reducer(initialState, {
      type: 'workflow/patchLiquidationAutomationStatus/fulfilled',
      payload: { _id: 'auto-1', name: 'Campaign 1', status: 'active', isActive: true }
    });
    expect(patchedState.liquidationAutomations[0].status).toBe('active');
    expect(patchedState.liquidationAutomations[0].isActive).toBe(true);

    // Test delete fulfilled
    const deletedState = workflowSlice.reducer(patchedState, {
      type: 'workflow/deleteLiquidationAutomation/fulfilled',
      meta: { arg: 'auto-1' }
    });
    expect(deletedState.liquidationAutomations).toHaveLength(1);
    expect(deletedState.liquidationAutomations[0]._id).toBe('auto-2');
  });
});

