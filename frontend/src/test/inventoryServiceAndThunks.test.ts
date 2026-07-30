import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { store } from '../store';

describe('Issue #38 Tracer Bullet 2: InventoryService & Async Thunks', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should call all endpoints via InventoryService with exact headers and paths', async () => {
    const { InventoryService } = await import('../services/inventoryService');

    const fetchSpy = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.includes('/inventory/lot/lot-1/assess-risk')) {
        return {
          ok: true,
          json: async () => ({ riskLevel: 'HIGH', score: 85 })
        } as Response;
      }
      if (url.includes('/inventory/lot/lot-1/compliance')) {
        return {
          ok: true,
          json: async () => ({ docType: 'COA', url: '/docs/coa.pdf' })
        } as Response;
      }
      if (url.includes('/inventory/lot/lot-1') && init?.method === 'PUT') {
        return {
          ok: true,
          json: async () => ({ _id: 'lot-1', fdaRegulated: true })
        } as Response;
      }
      if (url.includes('/inventory/lot-1/bids/enable') && init?.method === 'POST') {
        return {
          ok: true,
          json: async () => ({ _id: 'lot-1', status: 'active', listing: { _id: 'list-1', allowBidding: true } })
        } as Response;
      }
      if (url.includes('/inventory/lot-1/bids/bid-1/award') && init?.method === 'POST') {
        return {
          ok: true,
          json: async () => ({ _id: 'lot-1', status: 'sold', emailSentResult: { previewUrl: '/preview' } })
        } as Response;
      }
      if (url.includes('/inventory') && !url.includes('/lot')) {
        return {
          ok: true,
          json: async () => ([{ _id: 'lot-1', status: 'pending' }])
        } as Response;
      }
      return { ok: false, status: 404, json: async () => ({ error: 'Not found' }) } as Response;
    });

    vi.stubGlobal('fetch', fetchSpy);

    // Test fetchInventoryLots
    const lots = await InventoryService.fetchInventoryLots('cycle-123');
    expect(lots[0]._id).toBe('lot-1');
    expect(fetchSpy.mock.calls[0][0]).toContain('/inventory?liquidationCycleId=cycle-123');

    // Test assessLotRisk
    const risk = await InventoryService.assessLotRisk('lot-1');
    expect(risk.riskLevel).toBe('HIGH');
    expect(fetchSpy.mock.calls[1][0]).toContain('/inventory/lot/lot-1/assess-risk');

    // Test updateLotCompliance
    const updatedLot = await InventoryService.updateLotCompliance('lot-1', { fdaRegulated: true });
    expect(updatedLot.fdaRegulated).toBe(true);
    expect(fetchSpy.mock.calls[2][1]?.method).toBe('PUT');
    expect(JSON.parse(fetchSpy.mock.calls[2][1]?.body as string)).toEqual({ fdaRegulated: true });

    // Test uploadComplianceDoc
    const file = new File(['dummy content'], 'coa.pdf', { type: 'application/pdf' });
    const docRes = await InventoryService.uploadComplianceDoc('lot-1', 'COA', file);
    expect(docRes.docType).toBe('COA');
    expect(fetchSpy.mock.calls[3][1]?.method).toBe('POST');
    expect(fetchSpy.mock.calls[3][1]?.body instanceof FormData).toBe(true);

    // Test enableBidding
    const enableRes = await InventoryService.enableBidding('lot-1', { startingPrice: 10 });
    expect(enableRes.listing.allowBidding).toBe(true);
    expect(fetchSpy.mock.calls[4][1]?.method).toBe('POST');
    expect(JSON.parse(fetchSpy.mock.calls[4][1]?.body as string)).toEqual({ startingPrice: 10 });

    // Test awardBid
    const awardRes = await InventoryService.awardBid('lot-1', 'bid-1', { emailSent: 'Award body', awardedQty: 50 });
    expect(awardRes.status).toBe('sold');
    expect(fetchSpy.mock.calls[5][1]?.method).toBe('POST');
    expect(JSON.parse(fetchSpy.mock.calls[5][1]?.body as string)).toEqual({ emailSent: 'Award body', awardedQty: 50 });
  });

  it('should execute async thunks updating Redux store state seamlessly', async () => {
    const { 
      fetchInventoryLotsThunk, 
      assessLotRiskThunk, 
      enableBiddingThunk,
      awardBidThunk
    } = await import('../services/inventoryService');

    const fetchSpy = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.includes('/assess-risk')) {
        return { ok: true, json: async () => ({ riskLevel: 'LOW', score: 20 }) } as Response;
      }
      if (url.includes('/bids/enable')) {
        return { ok: true, json: async () => ({ _id: 'lot-thunk', status: 'active', availableQty: 100 }) } as Response;
      }
      if (url.includes('/award')) {
        return { ok: true, json: async () => ({ _id: 'lot-thunk', status: 'sold', emailSentResult: { previewUrl: '/award-email' } }) } as Response;
      }
      if (init?.method === 'PUT') {
        return { ok: true, json: async () => ({ _id: 'lot-thunk', fdaRegulated: false }) } as Response;
      }
      return { ok: true, json: async () => ([{ _id: 'lot-thunk', status: 'pending', availableQty: 100 }]) } as Response;
    });

    vi.stubGlobal('fetch', fetchSpy);

    // Dispatch fetchInventoryLotsThunk
    await store.dispatch(fetchInventoryLotsThunk());
    const state = (store.getState() as any).inventory;
    expect(state.inventoryList.length).toBe(1);
    expect(state.inventoryList[0]._id).toBe('lot-thunk');

    // Dispatch assessLotRiskThunk
    await store.dispatch(assessLotRiskThunk('lot-thunk'));
    expect((store.getState() as any).inventory.riskAssessment.data?.riskLevel).toBe('LOW');

    // Dispatch enableBiddingThunk
    await store.dispatch(enableBiddingThunk({ lotId: 'lot-thunk', payload: { startingPrice: 5 } }));
    expect((store.getState() as any).inventory.inventoryList[0].status).toBe('active');

    // Dispatch awardBidThunk
    await store.dispatch(awardBidThunk({ lotId: 'lot-thunk', bidId: 'bid-99', payload: { emailSent: 'You won!' } }));
    expect((store.getState() as any).inventory.modals.showAwardModal).toBe(false);
    expect((store.getState() as any).inventory.modals.showEmailSentVisualizer).toBe(true);
    expect((store.getState() as any).inventory.modals.visualizerEmailDetails?.previewUrl).toBe('/award-email');
  });
});
