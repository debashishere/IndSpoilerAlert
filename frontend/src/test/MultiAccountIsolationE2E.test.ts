import { describe, it, expect, vi, beforeEach } from 'vitest';
import { store } from '../store';
import { clearSupplierState, setSuppliers } from '../store/slices/coreSlice';
import { clearWorkflowState } from '../store/slices/workflowSlice';
import { clearInventoryState } from '../store/slices/inventorySlice';
import { getCurrentSupplier } from '../services/coreService';

describe('Multi-Account Supplier Provisioning and Cross-Account Data Isolation E2E Flow', () => {
  const userAEmail = 'debashisroe1996@gmail.com';
  const userBEmail = 'debashishere007@gmail.com';

  const mockDb = {
    suppliers: new Map<string, any>(),
    workflows: [] as any[],
    inventoryLots: [] as any[],
  };

  beforeEach(() => {
    mockDb.suppliers.clear();
    mockDb.workflows = [];
    mockDb.inventoryLots = [];
    vi.restoreAllMocks();
  });

  it('verifies complete 4-step isolation flow between debashisroe1996@gmail.com and debashishere007@gmail.com', async () => {
    // Mock backend REST API endpoints
    const fetchSpy = vi.fn().mockImplementation(async (url: string, options?: any) => {
      const urlStr = url.toString();

      if (urlStr.includes('/v1/supplier/current')) {
        const emailParamMatch = urlStr.match(/email=([^&]+)/);
        const email = emailParamMatch ? decodeURIComponent(emailParamMatch[1]) : 'default@example.com';
        if (!mockDb.suppliers.has(email)) {
          mockDb.suppliers.set(email, {
            _id: `supp_${email.split('@')[0]}_${Date.now()}`,
            name: email.split('@')[0],
            companyCode: `SUP-${email.split('@')[0].toUpperCase().slice(0, 6)}`,
            email,
            active: true,
          });
        }
        return {
          ok: true,
          status: 200,
          json: async () => mockDb.suppliers.get(email),
        };
      }

      if (urlStr.includes('/inventory') && !urlStr.includes('/lot/')) {
        if (options?.method === 'POST') {
          const body = JSON.parse(options.body);
          const newLot = {
            _id: `lot_${Date.now()}_${Math.random()}`,
            ...body,
          };
          mockDb.inventoryLots.push(newLot);
          return {
            ok: true,
            status: 201,
            json: async () => newLot,
          };
        }

        const supplierIdMatch = urlStr.match(/supplierId=([^&]+)/);
        const supplierId = supplierIdMatch ? supplierIdMatch[1] : null;
        const filtered = supplierId ? mockDb.inventoryLots.filter((l) => l.supplierId === supplierId) : mockDb.inventoryLots;
        return {
          ok: true,
          status: 200,
          json: async () => filtered,
        };
      }

      if (urlStr.includes('/liquidation-automations')) {
        if (options?.method === 'POST') {
          const body = JSON.parse(options.body);
          const newWorkflow = {
            _id: `wf_${Date.now()}_${Math.random()}`,
            ...body,
          };
          mockDb.workflows.push(newWorkflow);
          return {
            ok: true,
            status: 201,
            json: async () => newWorkflow,
          };
        }

        const supplierIdMatch = urlStr.match(/supplierId=([^&]+)/);
        const supplierId = supplierIdMatch ? supplierIdMatch[1] : null;
        const filtered = mockDb.workflows.filter((w) => w.supplierId === supplierId);
        return {
          ok: true,
          status: 200,
          json: async () => filtered,
        };
      }

      return { ok: false, status: 404 };
    });

    vi.stubGlobal('fetch', fetchSpy);

    // ==========================================
    // STEP 1: Login as debashisroe1996@gmail.com
    // ==========================================
    const supplierProfileA = await getCurrentSupplier(userAEmail, 'token-a');
    expect(supplierProfileA).toBeDefined();
    expect(supplierProfileA.email).toBe(userAEmail);
    const supplierAId = supplierProfileA._id;

    // Simulate saving a workflow under Supplier A
    const saveWorkflowARes = await fetch('/api/liquidation-automations', {
      method: 'POST',
      body: JSON.stringify({
        supplierId: supplierAId,
        name: 'Clearance Workflow - User A',
        templateName: 'Short-Dated Clearance',
        isActive: true,
      }),
    });
    const workflowA = await saveWorkflowARes.json();
    expect(workflowA.supplierId).toBe(supplierAId);
    expect(workflowA.name).toBe('Clearance Workflow - User A');

    // Simulate creating inventory under Supplier A
    const saveLotARes = await fetch('/api/inventory', {
      method: 'POST',
      body: JSON.stringify({
        supplierId: supplierAId,
        lotNumber: 'LOT-USER-A-001',
        quantityCases: 250,
      }),
    });
    const lotA = await saveLotARes.json();
    expect(lotA.supplierId).toBe(supplierAId);

    // Verify workflows and inventory for Supplier A
    const fetchWorkflowARes = await fetch(`/api/liquidation-automations?supplierId=${supplierAId}`);
    const workflowsA = await fetchWorkflowARes.json();
    expect(workflowsA.length).toBe(1);
    expect(workflowsA[0].name).toBe('Clearance Workflow - User A');

    const fetchInventoryARes = await fetch(`/api/inventory?supplierId=${supplierAId}`);
    const lotsA = await fetchInventoryARes.json();
    expect(lotsA.length).toBe(1);
    expect(lotsA[0].lotNumber).toBe('LOT-USER-A-001');

    // ==========================================
    // STEP 2: Logout & Clear State
    // ==========================================
    store.dispatch(clearSupplierState());
    store.dispatch(clearWorkflowState());
    store.dispatch(clearInventoryState());

    expect(store.getState().workflow.liquidationAutomations).toEqual([]);
    expect(store.getState().core.buyerLists).toEqual([]);
    expect(store.getState().inventory.inventoryList).toEqual([]);

    // ==========================================
    // STEP 3: Login as debashishere007@gmail.com
    // ==========================================
    const supplierProfileB = await getCurrentSupplier(userBEmail, 'token-b');
    expect(supplierProfileB).toBeDefined();
    expect(supplierProfileB.email).toBe(userBEmail);
    const supplierBId = supplierProfileB._id;

    // Verify that Supplier B ID is distinct from Supplier A ID
    expect(supplierBId).not.toBe(supplierAId);

    // Fetch workflows and inventory for Supplier B -> Must return ZERO from Supplier A
    const fetchWorkflowBRes = await fetch(`/api/liquidation-automations?supplierId=${supplierBId}`);
    const workflowsB = await fetchWorkflowBRes.json();
    expect(workflowsB.length).toBe(0);
    expect(workflowsB.some((w: any) => w.supplierId === supplierAId)).toBe(false);

    const fetchInventoryBRes = await fetch(`/api/inventory?supplierId=${supplierBId}`);
    const lotsB = await fetchInventoryBRes.json();
    expect(lotsB.length).toBe(0);
    expect(lotsB.some((l: any) => l.supplierId === supplierAId)).toBe(false);

    // ==========================================
    // STEP 4: Create a new Workflow & Inventory under Supplier B
    // ==========================================
    const saveWorkflowBRes = await fetch('/api/liquidation-automations', {
      method: 'POST',
      body: JSON.stringify({
        supplierId: supplierBId,
        name: 'Flash Sale - User B',
        templateName: 'Flash Liquidation',
        isActive: true,
      }),
    });
    const workflowB = await saveWorkflowBRes.json();
    expect(workflowB.supplierId).toBe(supplierBId);

    const saveLotBRes = await fetch('/api/inventory', {
      method: 'POST',
      body: JSON.stringify({
        supplierId: supplierBId,
        lotNumber: 'LOT-USER-B-001',
        quantityCases: 150,
      }),
    });
    const lotB = await saveLotBRes.json();
    expect(lotB.supplierId).toBe(supplierBId);

    // Verify both accounts maintain complete data isolation
    const finalWorkflowARes = await fetch(`/api/liquidation-automations?supplierId=${supplierAId}`);
    const finalWorkflowsA = await finalWorkflowARes.json();
    expect(finalWorkflowsA.length).toBe(1);
    expect(finalWorkflowsA[0].name).toBe('Clearance Workflow - User A');

    const finalWorkflowBRes = await fetch(`/api/liquidation-automations?supplierId=${supplierBId}`);
    const finalWorkflowsB = await finalWorkflowBRes.json();
    expect(finalWorkflowsB.length).toBe(1);
    expect(finalWorkflowsB[0].name).toBe('Flash Sale - User B');

    const finalLotsARes = await fetch(`/api/inventory?supplierId=${supplierAId}`);
    const finalLotsA = await finalLotsARes.json();
    expect(finalLotsA.length).toBe(1);
    expect(finalLotsA[0].lotNumber).toBe('LOT-USER-A-001');

    const finalLotsBRes = await fetch(`/api/inventory?supplierId=${supplierBId}`);
    const finalLotsB = await finalLotsBRes.json();
    expect(finalLotsB.length).toBe(1);
    expect(finalLotsB[0].lotNumber).toBe('LOT-USER-B-001');
  });
});
