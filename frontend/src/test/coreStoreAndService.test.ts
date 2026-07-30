import { describe, it, expect, vi } from 'vitest';
import { store } from '../store';
import { 
  setActiveTab, 
  setSidebarExpanded, 
  toggleSidebarExpanded, 
  setHealthStatus, 
  setSuppliers, 
  setBuyers 
} from '../store/slices/coreSlice';

describe('Tracer Bullet 1: Core Store Initialization & Navigation Tab State', () => {
  it('should initialize store with coreSlice containing default activeTab as "ingestion"', () => {
    const state = store.getState();
    expect(state.core.activeTab).toBe('ingestion');
    expect(state.core.sidebarExpanded).toBe(false);
    expect(state.core.backendHealthy).toBe(null);
    expect(state.core.sidecarHealthy).toBe(null);
    expect(state.core.suppliers).toEqual([]);
    expect(state.core.buyers).toEqual([]);
  });

  it('should dispatch setActiveTab and update activeTab cleanly', () => {
    store.dispatch(setActiveTab('inventory'));
    expect(store.getState().core.activeTab).toBe('inventory');

    store.dispatch(setActiveTab('ingestion'));
    expect(store.getState().core.activeTab).toBe('ingestion');
  });

  it('should dispatch sidebar toggles, health status updates, and reference data actions cleanly', () => {
    store.dispatch(setSidebarExpanded(true));
    expect(store.getState().core.sidebarExpanded).toBe(true);

    store.dispatch(toggleSidebarExpanded());
    expect(store.getState().core.sidebarExpanded).toBe(false);

    store.dispatch(setHealthStatus({ backendHealthy: true, sidecarHealthy: false }));
    expect(store.getState().core.backendHealthy).toBe(true);
    expect(store.getState().core.sidecarHealthy).toBe(false);

    const mockSuppliers = [
      { _id: 'sup1', name: 'Danone', companyCode: 'DAN', preferredDisposition: 'liquidation' }
    ];
    const mockBuyers = [
      { _id: 'buy1', email: 'buyer@grocery.com', name: 'Discount Grocery' }
    ];

    store.dispatch(setSuppliers(mockSuppliers));
    expect(store.getState().core.suppliers).toEqual(mockSuppliers);

    store.dispatch(setBuyers(mockBuyers));
    expect(store.getState().core.buyers).toEqual(mockBuyers);
  });
});

describe('Cycle 3: CoreService & Async Thunks Integration', () => {
  it('should call exact endpoints and headers for health, sidecar health, suppliers, and buyers via CoreService', async () => {
    // We dynamically import coreService after creating it
    const coreServiceModule = await import('../services/coreService');
    const coreService = coreServiceModule.default || coreServiceModule.coreService;

    const fetchCalls: Array<{ url: string; options: any }> = [];
    vi.stubGlobal('fetch', async (url: any, options: any) => {
      fetchCalls.push({ url: url.toString(), options });
      if (url.toString().includes('/sidecar/health')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ status: 'OK' }),
        } as Response;
      }
      if (url.toString().includes('/health')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ status: 'healthy' }),
        } as Response;
      }
      if (url.toString().includes('/suppliers')) {
        return {
          ok: true,
          status: 200,
          json: async () => ([{ _id: 'sup1', name: 'Danone' }]),
        } as Response;
      }
      if (url.toString().includes('/buyers')) {
        return {
          ok: true,
          status: 200,
          json: async () => ([{ _id: 'buy1', email: 'test@buyer.com' }]),
        } as Response;
      }
      return { ok: false, status: 404 } as Response;
    });

    try {
      const healthResult = await coreService.checkHealth();
      expect(healthResult.backendHealthy).toBe(true);
      expect(healthResult.sidecarHealthy).toBe(true);

      const suppliersResult = await coreService.getSuppliers();
      expect(suppliersResult).toEqual([{ _id: 'sup1', name: 'Danone' }]);

      const buyersResult = await coreService.getBuyers();
      expect(buyersResult).toEqual([{ _id: 'buy1', email: 'test@buyer.com' }]);

      // Verify exact headers preservation (`Cache-Control: no-cache, no-store`, `Pragma: no-cache`)
      for (const call of fetchCalls) {
        expect(call.options?.headers?.['Cache-Control']).toBe('no-cache, no-store');
        expect(call.options?.headers?.['Pragma']).toBe('no-cache');
      }
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('should dispatch checkSystemHealth and fetchCoreReferenceData thunks to update store', async () => {
    const { checkSystemHealth, fetchCoreReferenceData } = await import('../store/slices/coreSlice');
    
    vi.stubGlobal('fetch', async (url: any) => {
      if (url.toString().includes('/sidecar/health')) {
        return { ok: true, status: 200, json: async () => ({ status: 'OK' }) } as Response;
      }
      if (url.toString().includes('/health')) {
        return { ok: true, status: 200, json: async () => ({ status: 'healthy' }) } as Response;
      }
      if (url.toString().includes('/suppliers')) {
        return { ok: true, status: 200, json: async () => ([{ _id: 'sup-thunk', name: 'Supplier Thunk' }]) } as Response;
      }
      if (url.toString().includes('/buyers')) {
        return { ok: true, status: 200, json: async () => ([{ _id: 'buy-thunk', email: 'thunk@buyer.com' }]) } as Response;
      }
      if (url.toString().includes('/buyer-lists')) {
        return { ok: true, status: 200, json: async () => ([{ _id: 'list-thunk', name: 'List Thunk' }]) } as Response;
      }
      return { ok: false, status: 404 } as Response;
    });

    try {
      await store.dispatch(checkSystemHealth());
      expect(store.getState().core.backendHealthy).toBe(true);
      expect(store.getState().core.sidecarHealthy).toBe(true);

      await store.dispatch(fetchCoreReferenceData());
      expect(store.getState().core.suppliers).toEqual([{ _id: 'sup-thunk', name: 'Supplier Thunk' }]);
      expect(store.getState().core.buyers).toEqual([{ _id: 'buy-thunk', email: 'thunk@buyer.com' }]);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('should request /api/buyers?all=true when getBuyers or fetchCoreReferenceData is called with { all: true }', async () => {
    const coreServiceModule = await import('../services/coreService');
    const coreService = coreServiceModule.default || coreServiceModule.coreService;
    const { fetchCoreReferenceData } = await import('../store/slices/coreSlice');

    const requestedUrls: string[] = [];
    vi.stubGlobal('fetch', async (url: any) => {
      requestedUrls.push(url.toString());
      if (url.toString().includes('/suppliers')) {
        return { ok: true, status: 200, json: async () => ([]) } as Response;
      }
      if (url.toString().includes('/buyers')) {
        return { ok: true, status: 200, json: async () => ([{ _id: 'buy-all', email: 'all@buyer.com' }]) } as Response;
      }
      if (url.toString().includes('/buyer-lists')) {
        return { ok: true, status: 200, json: async () => ([]) } as Response;
      }
      return { ok: false, status: 404 } as Response;
    });

    try {
      await coreService.getBuyers({ all: true });
      expect(requestedUrls.some((u) => u.includes('/api/buyers?all=true'))).toBe(true);

      requestedUrls.length = 0;
      await store.dispatch(fetchCoreReferenceData({ all: true }));
      expect(requestedUrls.some((u) => u.includes('/api/buyers?all=true'))).toBe(true);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

