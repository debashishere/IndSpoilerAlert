import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import networkService from '../services/networkService';
import { 
  fetchBuyerLists, 
  fetchCoreReferenceData, 
  selectBuyerLists, 
  coreSlice,
  type BuyerList,
  type Buyer
} from '../store/slices/coreSlice';
import { configureStore } from '@reduxjs/toolkit';

describe('01 - Buyer API Service Layer', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('networkService Buyer CRUD', () => {
    it('getBuyerById calls GET /buyers/:id', async () => {
      const mockBuyer = { _id: 'b1', name: 'Buyer 1', email: 'b1@example.com', emailThreadCount: 5 };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockBuyer,
      } as any);

      const res = await networkService.getBuyerById('b1');
      expect(res).toEqual(mockBuyer);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/buyers/b1'),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('getAllBuyers calls GET /buyers?all=true', async () => {
      const mockBuyers = [
        { _id: 'b1', name: 'Active Buyer', isActive: true },
        { _id: 'b2', name: 'Inactive Buyer', isActive: false }
      ];
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockBuyers,
      } as any);

      const res = await networkService.getAllBuyers();
      expect(res).toEqual(mockBuyers);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/buyers?all=true'),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('updateBuyer calls PUT /buyers/:id with payload', async () => {
      const payload = { name: 'Updated Name', phone: '555-0199' };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ _id: 'b1', ...payload }),
      } as any);

      const res = await networkService.updateBuyer('b1', payload);
      expect(res).toEqual({ _id: 'b1', ...payload });
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/buyers/b1'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(payload),
        })
      );
    });

    it('deactivateBuyer calls PATCH /buyers/:id/deactivate with reason', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ _id: 'b1', isActive: false, deactivatedReason: 'Out of business' }),
      } as any);

      const res = await networkService.deactivateBuyer('b1', 'Out of business');
      expect(res.isActive).toBe(false);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/buyers/b1/deactivate'),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ reason: 'Out of business' }),
        })
      );
    });

    it('reactivateBuyer calls PATCH /buyers/:id/reactivate', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ _id: 'b1', isActive: true }),
      } as any);

      const res = await networkService.reactivateBuyer('b1');
      expect(res.isActive).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/buyers/b1/reactivate'),
        expect.objectContaining({
          method: 'PATCH',
        })
      );
    });
  });

  describe('networkService Buyer List CRUD', () => {
    it('getBuyerLists calls GET /buyer-lists', async () => {
      const mockLists = [{ _id: 'l1', name: 'VIP Buyers', type: 'primary', buyerIds: [] }];
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockLists,
      } as any);

      const res = await networkService.getBuyerLists();
      expect(res).toEqual(mockLists);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/buyer-lists'),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('createBuyerList calls POST /buyer-lists', async () => {
      const payload = { name: 'Custom Tier 1', description: 'Top tier buyers', type: 'custom' };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ _id: 'l2', ...payload, buyerIds: [] }),
      } as any);

      const res = await networkService.createBuyerList(payload);
      expect(res._id).toBe('l2');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/buyer-lists'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(payload),
        })
      );
    });

    it('updateBuyerList calls PUT /buyer-lists/:id', async () => {
      const payload = { name: 'Updated List Name' };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ _id: 'l1', ...payload }),
      } as any);

      const res = await networkService.updateBuyerList('l1', payload);
      expect(res.name).toBe('Updated List Name');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/buyer-lists/l1'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(payload),
        })
      );
    });

    it('deleteBuyerList calls DELETE /buyer-lists/:id', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      } as any);

      const res = await networkService.deleteBuyerList('l1');
      expect(res).toEqual({ success: true });
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/buyer-lists/l1'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('updateBuyerListMembers calls PUT /buyer-lists/:id/members', async () => {
      const buyerIds = ['b1', 'b2'];
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ _id: 'l1', buyerIds }),
      } as any);

      const res = await networkService.updateBuyerListMembers('l1', buyerIds);
      expect(res.buyerIds).toEqual(buyerIds);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/buyer-lists/l1/members'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ buyerIds }),
        })
      );
    });
  });

  describe('networkService Email Threads Scoped to Buyer', () => {
    it('getEmailThreadsByBuyerEmail calls GET /email-threads?buyerEmail=<email>', async () => {
      const mockThreads = [{ _id: 't1', subject: 'Inquiry', buyerEmail: 'test@buyer.com' }];
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ threads: mockThreads }),
      } as any);

      const res = await networkService.getEmailThreadsByBuyerEmail('test@buyer.com');
      expect(res).toEqual(mockThreads);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/email-threads?buyerEmail=test%40buyer.com'),
        expect.objectContaining({ method: 'GET' })
      );
    });
  });

  describe('coreSlice BuyerList integration', () => {
    it('initial state has default Primary and Secondary buyer lists', () => {
      const testStore = configureStore({ reducer: { core: coreSlice.reducer } });
      expect(testStore.getState().core.buyerLists.length).toBe(2);
      expect(selectBuyerLists(testStore.getState()).length).toBe(2);
    });

    it('fetchBuyerLists updates buyerLists in store and ensures default lists', async () => {
      const testStore = configureStore({ reducer: { core: coreSlice.reducer } });
      const mockLists: BuyerList[] = [
        { _id: 'l1', name: 'Primary Buyers', type: 'primary', buyerIds: ['b1'] },
        { _id: 'l2', name: 'Secondary Liquidators', type: 'secondary', buyerIds: [] }
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockLists,
      } as any);

      await testStore.dispatch(fetchBuyerLists());
      expect(selectBuyerLists(testStore.getState())).toEqual(mockLists);
    });

    it('fetchCoreReferenceData fetches suppliers, buyers, and buyerLists and stores them in Redux', async () => {
      const testStore = configureStore({ reducer: { core: coreSlice.reducer } });
      const mockSuppliers = [{ _id: 's1', name: 'Supplier 1', companyCode: 'S1', preferredDisposition: 'liquidation' }];
      const mockBuyers: Buyer[] = [{ _id: 'b1', email: 'b1@buyer.com', name: 'Buyer 1', isActive: true, optInBidding: true }];
      const mockBuyerLists: BuyerList[] = [
        { _id: 'l1', name: 'Primary Buyers', type: 'primary', buyerIds: ['b1'] },
        { _id: 'l2', name: 'Secondary Liquidators', type: 'secondary', buyerIds: [] }
      ];

      global.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes('/suppliers')) {
          return Promise.resolve({ ok: true, status: 200, json: async () => mockSuppliers });
        }
        if (url.includes('/buyers')) {
          return Promise.resolve({ ok: true, status: 200, json: async () => mockBuyers });
        }
        if (url.includes('/buyer-lists')) {
          return Promise.resolve({ ok: true, status: 200, json: async () => mockBuyerLists });
        }
        return Promise.resolve({ ok: false, status: 404 });
      });

      await testStore.dispatch(fetchCoreReferenceData());
      const state = testStore.getState().core;
      expect(state.suppliers).toEqual(mockSuppliers);
      expect(state.buyers).toEqual(mockBuyers);
      expect(state.buyerLists).toEqual(mockBuyerLists);
    });
  });
});
