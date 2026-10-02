import { API_BASE_URL } from './coreService';

export interface ConnectedZapInfo {
  zapId: string;
  zapName: string;
  triggerEvent?: string;
  status: 'active' | 'paused' | 'error' | string;
  lotCount?: number;
  lastSyncedAt?: string | null;
  lastSyncMetrics?: {
    totalRows: number;
    inserted: number;
    updated: number;
    depleted: number;
    errors: string[];
  };
  supplierTemplateId?: string;
}

export interface ZapDeliveryLogInfo {
  timestamp: string;
  httpStatus: number;
  latencyMs: number;
  samplePayload?: any;
  message?: string;
  status: 'success' | 'error' | string;
}

export interface ZapierRosterResponse {
  success: boolean;
  supplierId: string;
  ingressKey?: string;
  connectedZaps: ConnectedZapInfo[];
  deliveryLogs: ZapDeliveryLogInfo[];
  totalZaps: number;
  [key: string]: any;
}

export interface ZapierTestPingPayload {
  ingressKey: string;
}

export interface ZapierTestPingResponse {
  success: boolean;
  status: 'connected' | 'error' | string;
  supplierName?: string;
  latencyMs: number;
  message?: string;
  [key: string]: any;
}

export interface ZapierDisconnectPayload {
  zapId: string;
  supplierId?: string;
  ingressKey?: string;
}

export interface ZapierDisconnectResponse {
  success: boolean;
  message: string;
  remainingZaps?: number;
  [key: string]: any;
}

export interface ZapierSaveMappingPayload {
  supplierId: string;
  zapId: string;
  zapName?: string;
  templateName?: string;
  columnMappings: Record<string, string>;
  ingressKey?: string;
}

export interface ZapierSaveMappingResponse {
  success: boolean;
  supplierTemplateId: string;
  message: string;
  [key: string]: any;
}

const COMMON_HEADERS = {
  'Cache-Control': 'no-cache, no-store',
  Pragma: 'no-cache',
};

const JSON_HEADERS = {
  ...COMMON_HEADERS,
  'Content-Type': 'application/json',
};

export const zapierSyncService = {
  /**
   * Fetches Connected Zaps Roster and recent delivery logs
   */
  async fetchRoster(params: {
    supplierId?: string;
    ingressKey?: string;
  }): Promise<ZapierRosterResponse> {
    const queryParams = new URLSearchParams();
    if (params.supplierId) queryParams.set('supplierId', params.supplierId);
    if (params.ingressKey) queryParams.set('ingressKey', params.ingressKey);

    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const url = `${API_BASE_URL}/v1/ingestion/zapier/roster${queryString}`;

    const headers: Record<string, string> = { ...JSON_HEADERS };
    if (params.supplierId) headers['x-supplier-id'] = params.supplierId;
    if (params.ingressKey) headers['x-ingress-key'] = params.ingressKey;

    const res = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch Zapier roster.');
    }

    return await res.json();
  },

  /**
   * Dispatches test ping with latency calculation
   */
  async testPing(payload: ZapierTestPingPayload): Promise<ZapierTestPingResponse> {
    const startTime = performance.now();
    const url = `${API_BASE_URL}/v1/ingestion/zapier/test-ping`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        ...JSON_HEADERS,
        'x-ingress-key': payload.ingressKey,
      },
    });

    const elapsed = Math.round(performance.now() - startTime);

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Test ping failed');
    }

    const data = await res.json();
    return {
      ...data,
      latencyMs: typeof data.latencyMs === 'number' ? data.latencyMs : elapsed,
    };
  },

  /**
   * Disconnects a registered Zap feed
   */
  async disconnectFeed(payload: ZapierDisconnectPayload): Promise<ZapierDisconnectResponse> {
    const url = `${API_BASE_URL}/v1/ingestion/zapier/disconnect`;

    const headers: Record<string, string> = { ...JSON_HEADERS };
    if (payload.ingressKey) headers['x-ingress-key'] = payload.ingressKey;
    if (payload.supplierId) headers['x-supplier-id'] = payload.supplierId;

    const res = await fetch(url, {
      method: 'DELETE',
      headers,
      body: JSON.stringify({
        zapId: payload.zapId,
        supplierId: payload.supplierId,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to disconnect Zap feed.');
    }

    return await res.json();
  },

  /**
   * Saves column mappings for a specific Zap feed
   */
  async saveMapping(payload: ZapierSaveMappingPayload): Promise<ZapierSaveMappingResponse> {
    const url = `${API_BASE_URL}/v1/ingestion/zapier/mapping`;

    const headers: Record<string, string> = { ...JSON_HEADERS };
    if (payload.ingressKey) headers['x-ingress-key'] = payload.ingressKey;
    if (payload.supplierId) headers['x-supplier-id'] = payload.supplierId;

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        supplierId: payload.supplierId,
        zapId: payload.zapId,
        zapName: payload.zapName,
        templateName: payload.templateName,
        columnMappings: payload.columnMappings,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to save Zapier column mapping.');
    }

    return await res.json();
  },
};

export default zapierSyncService;
