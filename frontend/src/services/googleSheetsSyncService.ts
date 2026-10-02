import { API_BASE_URL } from './coreService';
import type { IngestionParsedResult } from '../store/slices/ingestionSlice';

export interface ScriptTemplateResponse {
  success: boolean;
  supplierId: string;
  spreadsheetId: string;
  sheetName: string;
  ingressKey: string;
  webhookUrl: string;
  testPingUrl: string;
  script: string;
  [key: string]: any;
}

export interface TestPingPayload {
  ingressKey: string;
  spreadsheetId?: string;
  sheetName?: string;
}

export interface TestPingResponse {
  success: boolean;
  status: 'connected' | 'error' | string;
  supplierName?: string;
  spreadsheetId?: string;
  sheetName?: string;
  lastSyncedAt?: string | null;
  message?: string;
  latencyMs: number;
  [key: string]: any;
}

export interface HandshakeFetchPayload {
  supplierId: string;
  spreadsheetId: string;
  sheetName?: string;
}

export interface SyncNowPayload {
  supplierId?: string;
  ingressKey?: string;
  headers?: string[];
  rows?: string[][];
}

export interface SyncNowResponse {
  success: boolean;
  syncStatus: string;
  lastSyncedAt: string;
  syncedLotCount: number;
  metrics?: {
    totalRows: number;
    inserted: number;
    updated: number;
    depleted: number;
    errors: string[];
  };
  message?: string;
  [key: string]: any;
}

export interface ConnectedSheetInfo {
  spreadsheetId: string;
  spreadsheetTitle?: string;
  sheetName: string;
  syncStatus?: 'idle' | 'success' | 'error' | string;
  lastSyncedAt?: string | null;
  lotCount?: number;
  lastSyncMetrics?: {
    totalRows: number;
    inserted: number;
    updated: number;
    depleted: number;
    errors: string[];
  };
  supplierTemplateId?: string;
}

export interface ConnectedSheetsRosterResponse {
  success: boolean;
  supplierId: string;
  ingressKey?: string;
  connectedSheets: ConnectedSheetInfo[];
  totalSheets: number;
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

export const googleSheetsSyncService = {
  /**
   * Fetches personalized Google Apps Script snippet for a supplier
   */
  async fetchScriptTemplate(supplierId: string): Promise<ScriptTemplateResponse> {
    const url = `${API_BASE_URL}/v1/ingestion/google-sheets/script-template?supplierId=${encodeURIComponent(supplierId)}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: JSON_HEADERS,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch Google Sheets script template.');
    }

    return await res.json();
  },

  /**
   * Dispatches test ping with latency telemetry calculation.
   * Supports either (ingressKey: string, payload?: { spreadsheetId?: string; sheetName?: string })
   * or (payload: TestPingPayload).
   */
  async testPing(
    ingressKeyOrPayload: string | TestPingPayload,
    payload?: { spreadsheetId?: string; sheetName?: string }
  ): Promise<TestPingResponse> {
    const ingressKey = typeof ingressKeyOrPayload === 'string' ? ingressKeyOrPayload : ingressKeyOrPayload.ingressKey;
    const bodyPayload = typeof ingressKeyOrPayload === 'string' ? (payload || {}) : ingressKeyOrPayload;

    const startTime = performance.now();
    const url = `${API_BASE_URL}/v1/ingestion/google-sheets/test-ping`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        ...JSON_HEADERS,
        'x-ingress-key': ingressKey,
      },
      body: JSON.stringify({
        spreadsheetId: bodyPayload.spreadsheetId,
        sheetName: bodyPayload.sheetName,
      }),
    });

    const endTime = performance.now();
    const latencyMs = Math.round(endTime - startTime);

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Test ping failed.');
    }

    const data = await res.json();
    return {
      ...data,
      latencyMs,
    };
  },

  /**
   * Fetches sample rows from Google Sheets to hydrate GridMapperTable for column handshake.
   * Supports either (supplierId: string, spreadsheetId: string, sheetName?: string)
   * or (payload: HandshakeFetchPayload).
   */
  async fetchSampleRows(
    supplierIdOrPayload: string | HandshakeFetchPayload,
    spreadsheetId?: string,
    sheetName?: string
  ): Promise<IngestionParsedResult> {
    const sId = typeof supplierIdOrPayload === 'string' ? supplierIdOrPayload : supplierIdOrPayload.supplierId;
    const sheetId = typeof supplierIdOrPayload === 'string' ? (spreadsheetId || '') : supplierIdOrPayload.spreadsheetId;
    const tabName = typeof supplierIdOrPayload === 'string' ? (sheetName || 'Sheet1') : (supplierIdOrPayload.sheetName || 'Sheet1');

    const url = `${API_BASE_URL}/v1/ingestion/google-sheets/sample-rows?supplierId=${encodeURIComponent(
      sId
    )}&spreadsheetId=${encodeURIComponent(sheetId)}&sheetName=${encodeURIComponent(tabName)}`;

    const res = await fetch(url, {
      method: 'GET',
      headers: JSON_HEADERS,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch sample rows from Google Sheets.');
    }

    return await res.json();
  },

  /**
   * Fetches the connected multi-sheet roster for a supplier
   */
  async fetchRoster(
    supplierIdOrPayload: string | { supplierId?: string; ingressKey?: string }
  ): Promise<ConnectedSheetsRosterResponse> {
    const supplierId =
      typeof supplierIdOrPayload === 'string' ? supplierIdOrPayload : supplierIdOrPayload?.supplierId;
    const ingressKey =
      typeof supplierIdOrPayload === 'object' ? supplierIdOrPayload?.ingressKey : undefined;

    let url = `${API_BASE_URL}/v1/ingestion/google-sheets/roster`;
    if (supplierId) {
      url += `?supplierId=${encodeURIComponent(supplierId)}`;
    }

    const headers: Record<string, string> = { ...JSON_HEADERS };
    if (ingressKey) {
      headers['x-ingress-key'] = ingressKey;
    }

    const res = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch connected sheets roster.');
    }

    return await res.json();
  },

  /**
   * Triggers on-demand Google Sheets sync pass
   */
  async syncNow(payload: SyncNowPayload): Promise<SyncNowResponse> {
    const url = `${API_BASE_URL}/v1/ingestion/google-sheets/sync-now`;
    const headers: Record<string, string> = { ...JSON_HEADERS };
    if (payload?.ingressKey) {
      headers['x-ingress-key'] = payload.ingressKey;
    }

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload || {}),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to trigger on-demand sync.');
    }

    return await res.json();
  },

  /**
   * Disconnects a specific spreadsheet / sheetName for a supplier
   */
  async disconnectSheet(payload: {
    supplierId?: string;
    ingressKey?: string;
    spreadsheetId: string;
    sheetName?: string;
  }): Promise<{ success: boolean; message: string; remainingSheets?: number; [key: string]: any }> {
    const url = `${API_BASE_URL}/v1/ingestion/google-sheets/disconnect`;
    const headers: Record<string, string> = { ...JSON_HEADERS };
    if (payload?.ingressKey) {
      headers['x-ingress-key'] = payload.ingressKey;
    }

    const res = await fetch(url, {
      method: 'DELETE',
      headers,
      body: JSON.stringify({
        supplierId: payload.supplierId,
        spreadsheetId: payload.spreadsheetId,
        sheetName: payload.sheetName,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to disconnect spreadsheet.');
    }

    return await res.json();
  },

  /**
   * Saves column mapping schema and binds to supplier template / connected sheet
   */
  async saveMapping(payload: {
    supplierId?: string;
    ingressKey?: string;
    spreadsheetId?: string;
    sheetName?: string;
    templateName?: string;
    columnMappings: Record<string, string>;
  }): Promise<{ success: boolean; supplierTemplateId: string; message: string }> {
    const url = `${API_BASE_URL}/v1/ingestion/google-sheets/save-mapping`;
    const headers: Record<string, string> = { ...JSON_HEADERS };
    if (payload?.ingressKey) {
      headers['x-ingress-key'] = payload.ingressKey;
    }

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to save Google Sheets column mapping.');
    }

    return await res.json();
  },
};

export default googleSheetsSyncService;

