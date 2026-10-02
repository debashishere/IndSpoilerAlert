import { describe, it, expect, beforeEach, vi } from 'vitest';
import { zapierSyncService } from '../services/zapierSyncService';
import { configureStore } from '@reduxjs/toolkit';
import zapierSyncReducer, {
  setZapierCredentials,
  fetchZapierRosterThunk,
  testZapierPingThunk,
  disconnectZapierFeedThunk,
} from '../store/slices/zapierSyncSlice';

describe('Slice 1: Zapier Sync Service & Redux Seam', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('zapierSyncService unit tests', () => {
    it('fetches roster for a given supplierId and ingressKey', async () => {
      const mockRoster = {
        success: true,
        supplierId: 'supplier-zap-123',
        ingressKey: 'zap_sec_live_key_777',
        connectedZaps: [
          {
            zapId: 'zap-alpha-1',
            zapName: 'Shopify to SpoilerAlert Webhook',
            triggerEvent: 'new_inventory_lot',
            status: 'active',
            lotCount: 85,
            lastSyncedAt: '2026-10-02T12:00:00.000Z',
          },
        ],
        deliveryLogs: [
          {
            timestamp: '2026-10-02T12:00:00.000Z',
            httpStatus: 200,
            latencyMs: 35,
            status: 'success',
          },
        ],
        totalZaps: 1,
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockRoster,
      } as any);

      const result = await zapierSyncService.fetchRoster({
        supplierId: 'supplier-zap-123',
        ingressKey: 'zap_sec_live_key_777',
      });

      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/ingestion/zapier/roster'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'x-supplier-id': 'supplier-zap-123',
            'x-ingress-key': 'zap_sec_live_key_777',
          }),
        })
      );
      expect(result.connectedZaps).toHaveLength(1);
      expect(result.connectedZaps[0].zapName).toBe('Shopify to SpoilerAlert Webhook');
      expect(result.ingressKey).toBe('zap_sec_live_key_777');
    });

    it('throws error when roster fetch returns non-ok response', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Zapier sync configuration not found.' }),
      } as any);

      await expect(
        zapierSyncService.fetchRoster({ supplierId: 'non-existent' })
      ).rejects.toThrow('Zapier sync configuration not found.');
    });

    it('sends test ping with X-Ingress-Key header and returns latency telemetry', async () => {
      const mockPingRes = {
        success: true,
        status: 'connected',
        supplierName: 'Veritas Provisions',
        latencyMs: 28,
        message: 'Connection verified. Ready for Zapier sync.',
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockPingRes,
      } as any);

      const res = await zapierSyncService.testPing({
        ingressKey: 'zap_sec_live_key_777',
      });

      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/ingestion/zapier/test-ping'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'x-ingress-key': 'zap_sec_live_key_777',
          }),
        })
      );
      expect(res.status).toBe('connected');
      expect(res.latencyMs).toBe(28);
    });

    it('disconnects a Zap feed via DELETE /api/v1/ingestion/zapier/disconnect', async () => {
      const mockDisconnectRes = {
        success: true,
        message: 'Zap feed zap-alpha-1 disconnected successfully.',
        remainingZaps: 0,
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockDisconnectRes,
      } as any);

      const res = await zapierSyncService.disconnectFeed({
        zapId: 'zap-alpha-1',
        supplierId: 'supplier-zap-123',
        ingressKey: 'zap_sec_live_key_777',
      });

      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/ingestion/zapier/disconnect'),
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({
            'x-ingress-key': 'zap_sec_live_key_777',
          }),
          body: JSON.stringify({
            zapId: 'zap-alpha-1',
            supplierId: 'supplier-zap-123',
          }),
        })
      );
      expect(res.success).toBe(true);
    });
  });

  describe('zapierSyncSlice Redux actions & thunks', () => {
    const createStore = () =>
      configureStore({
        reducer: {
          zapierSync: zapierSyncReducer,
        },
      });

    it('sets initial credentials explicitly', () => {
      const store = createStore();
      store.dispatch(
        setZapierCredentials({
          supplierId: 'sup-100',
          ingressKey: 'key-100',
          webhookUrl: 'https://api.test/webhook',
        })
      );

      const state = store.getState().zapierSync;
      expect(state.supplierId).toBe('sup-100');
      expect(state.ingressKey).toBe('key-100');
      expect(state.webhookUrl).toBe('https://api.test/webhook');
    });

    it('handles fetchZapierRosterThunk lifecycle', async () => {
      const store = createStore();
      vi.spyOn(zapierSyncService, 'fetchRoster').mockResolvedValueOnce({
        success: true,
        supplierId: 'sup-100',
        ingressKey: 'key-from-backend',
        connectedZaps: [
          {
            zapId: 'zap-1',
            zapName: 'Square POS Inbound',
            triggerEvent: 'order_completed',
            status: 'active',
            lotCount: 120,
            lastSyncedAt: '2026-10-02T14:00:00.000Z',
          },
        ],
        deliveryLogs: [],
        totalZaps: 1,
      });

      await store.dispatch(
        fetchZapierRosterThunk({ supplierId: 'sup-100', ingressKey: 'key-100' })
      );

      const state = store.getState().zapierSync;
      expect(state.status).toBe('succeeded');
      expect(state.connectedZaps).toHaveLength(1);
      expect(state.connectedZaps[0].zapName).toBe('Square POS Inbound');
      expect(state.ingressKey).toBe('key-from-backend');
    });

    it('handles testZapierPingThunk lifecycle for success and error', async () => {
      const store = createStore();
      vi.spyOn(zapierSyncService, 'testPing').mockResolvedValueOnce({
        success: true,
        status: 'connected',
        supplierName: 'Veritas Provisions',
        latencyMs: 19,
        message: 'Connection verified',
      });

      await store.dispatch(testZapierPingThunk({ ingressKey: 'key-100' }));
      let state = store.getState().zapierSync;
      expect(state.pingStatus).toBe('connected');
      expect(state.pingLatencyMs).toBe(19);

      // On ping error
      vi.spyOn(zapierSyncService, 'testPing').mockRejectedValueOnce(
        new Error('Unauthorized: Invalid Ingress Key')
      );

      await store.dispatch(testZapierPingThunk({ ingressKey: 'invalid-key' }));
      state = store.getState().zapierSync;
      expect(state.pingStatus).toBe('error');
      expect(state.error).toBe('Unauthorized: Invalid Ingress Key');
    });

    it('handles disconnectZapierFeedThunk and removes the zap from connectedZaps', async () => {
      const store = createStore();
      // Pre-seed connectedZaps
      vi.spyOn(zapierSyncService, 'fetchRoster').mockResolvedValueOnce({
        success: true,
        supplierId: 'sup-100',
        ingressKey: 'key-100',
        connectedZaps: [
          {
            zapId: 'zap-1',
            zapName: 'Zap 1',
            status: 'active',
            lotCount: 10,
          },
          {
            zapId: 'zap-2',
            zapName: 'Zap 2',
            status: 'active',
            lotCount: 20,
          },
        ],
        deliveryLogs: [],
        totalZaps: 2,
      });

      await store.dispatch(fetchZapierRosterThunk({ supplierId: 'sup-100' }));
      expect(store.getState().zapierSync.connectedZaps).toHaveLength(2);

      vi.spyOn(zapierSyncService, 'disconnectFeed').mockResolvedValueOnce({
        success: true,
        message: 'Disconnected',
        remainingZaps: 1,
      });

      await store.dispatch(
        disconnectZapierFeedThunk({
          zapId: 'zap-1',
          supplierId: 'sup-100',
          ingressKey: 'key-100',
        })
      );

      const state = store.getState().zapierSync;
      expect(state.connectedZaps).toHaveLength(1);
      expect(state.connectedZaps[0].zapId).toBe('zap-2');
      expect(state.totalZaps).toBe(1);
    });
  });
});
