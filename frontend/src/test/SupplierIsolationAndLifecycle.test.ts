import { describe, it, expect, vi, beforeEach } from 'vitest';
import { store } from '../store';
import { clearSupplierState, setSuppliers } from '../store/slices/coreSlice';
import { clearWorkflowState } from '../store/slices/workflowSlice';
import { clearInventoryState } from '../store/slices/inventorySlice';
import { getCurrentSupplier, getSuppliers } from '../services/coreService';

describe('Frontend Supplier Dynamic Resolution, Lifecycle & State Isolation (TDD)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('1. getCurrentSupplier should request /api/v1/supplier/current with email and auth token', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        _id: 'supplier-user-a',
        name: 'Debashis Roe 1996',
        companyCode: 'SUP-DEBASHISROE',
        email: 'debashisroe1996@gmail.com',
        active: true
      })
    });
    vi.stubGlobal('fetch', fetchSpy);

    const supplier = await getCurrentSupplier('debashisroe1996@gmail.com', 'mock-token-user-a');

    expect(supplier).toBeDefined();
    expect(supplier._id).toBe('supplier-user-a');
    expect(supplier.email).toBe('debashisroe1996@gmail.com');

    expect(fetchSpy).toHaveBeenCalled();
    const calledUrl = fetchSpy.mock.calls[0][0];
    const calledOptions = fetchSpy.mock.calls[0][1];
    expect(calledUrl).toContain('/v1/supplier/current');
    expect(calledUrl).toContain('email=debashisroe1996%40gmail.com');
    expect(calledOptions.headers['Authorization']).toBe('Bearer mock-token-user-a');
  });

  it('2. Dynamic supplier profiles for two different emails should have different supplier IDs', async () => {
    const fetchSpy = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('debashisroe1996')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            _id: 'supplier-profile-A-123',
            name: 'Debashis Roe 1996',
            companyCode: 'SUP-A123',
            email: 'debashisroe1996@gmail.com',
            active: true
          })
        };
      } else if (url.includes('debashishere007')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            _id: 'supplier-profile-B-456',
            name: 'Debashis Here 007',
            companyCode: 'SUP-B456',
            email: 'debashishere007@gmail.com',
            active: true
          })
        };
      }
      return { ok: false, status: 404 };
    });
    vi.stubGlobal('fetch', fetchSpy);

    const profileA = await getCurrentSupplier('debashisroe1996@gmail.com');
    const profileB = await getCurrentSupplier('debashishere007@gmail.com');

    expect(profileA._id).toBe('supplier-profile-A-123');
    expect(profileB._id).toBe('supplier-profile-B-456');
    expect(profileA._id).not.toBe(profileB._id);
  });

  it('3. clearSupplierState, clearWorkflowState, and clearInventoryState should purge all user data on logout', () => {
    // Populate store with dummy data
    store.dispatch(setSuppliers([{
      _id: 'supplier-profile-A-123',
      name: 'Debashis Roe 1996',
      companyCode: 'SUP-A123',
      preferredDisposition: 'sell'
    }]));

    // Clear state on logout
    store.dispatch(clearSupplierState());
    store.dispatch(clearWorkflowState());
    store.dispatch(clearInventoryState());

    const state = store.getState();
    expect(state.workflow.liquidationCycles).toEqual([]);
    expect(state.workflow.liquidationAutomations).toEqual([]);
    expect(state.inventory.inventoryList).toEqual([]);
    expect(state.core.buyerLists).toEqual([]);
  });

  it('4. InventoryService.fetchInventoryLots and fetchInventoryLotsThunk should append supplierId and headers', async () => {
    const { InventoryService, fetchInventoryLotsThunk } = await import('../services/inventoryService');
    const { setSelectedSupplier } = await import('../store/slices/ingestionSlice');

    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [{ _id: 'lot-isolated-1', supplierId: 'supplier-profile-A-123' }]
    });
    vi.stubGlobal('fetch', fetchSpy);

    // 1. Direct service call with options
    await InventoryService.fetchInventoryLots({
      cycleId: 'cycle-1',
      supplierId: 'supplier-profile-A-123',
      token: 'mock-token-123'
    });

    expect(fetchSpy).toHaveBeenCalled();
    const callUrl = fetchSpy.mock.calls[0][0];
    const callInit = fetchSpy.mock.calls[0][1];
    expect(callUrl).toContain('supplierId=supplier-profile-A-123');
    expect(callUrl).toContain('liquidationCycleId=cycle-1');
    expect(callInit.headers['Authorization']).toBe('Bearer mock-token-123');

    // 2. Thunk call resolving selectedSupplier from state
    store.dispatch(setSelectedSupplier('supplier-profile-B-456'));
    await store.dispatch(fetchInventoryLotsThunk());

    const thunkCallUrl = fetchSpy.mock.calls[1][0];
    expect(thunkCallUrl).toContain('supplierId=supplier-profile-B-456');
  });
});
