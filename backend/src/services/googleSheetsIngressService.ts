import GoogleSheetsSyncConfig, { IGoogleSheetsSyncConfig } from '../models/GoogleSheetsSyncConfig';
import SupplierTemplate from '../models/SupplierTemplate';
import { suggestMappings } from '../utils/mapper';
import { IngestionBatch, IngestionBatchResult } from '../utils/ingestionNormalization';
import * as ingestService from './ingestService';

export interface IngressPayload {
  spreadsheetId?: string;
  sheetName?: string;
  headers?: string[];
  rows?: string[][];
}

export interface IngressResult {
  success: boolean;
  syncStatus: 'success' | 'error';
  lastSyncedAt: Date;
  metrics: {
    totalRows: number;
    inserted: number;
    updated: number;
    depleted: number;
    errors: string[];
  };
}

export async function validateIngressKey(ingressKey?: string): Promise<IGoogleSheetsSyncConfig | null> {
  if (!ingressKey || typeof ingressKey !== 'string' || ingressKey.trim().length === 0) {
    return null;
  }
  return GoogleSheetsSyncConfig.findOne({ ingressKey: ingressKey.trim() });
}

export async function processGoogleSheetsWebhook(
  config: IGoogleSheetsSyncConfig,
  payload: IngressPayload
): Promise<IngressResult> {
  const now = new Date();
  const rawHeaders = payload.headers || [];
  const rawRows = payload.rows || [];
  const supplierId = config.supplierId.toString();

  // Resolve Template column mappings or fallback to canonical suggestMappings
  let columnMappings: Record<string, string> = {};
  if (config.supplierTemplateId) {
    const template = await SupplierTemplate.findById(config.supplierTemplateId);
    if (template && template.columnMappings) {
      columnMappings = template.columnMappings instanceof Map
        ? Object.fromEntries(template.columnMappings)
        : (template.columnMappings as any);
    }
  }

  if (Object.keys(columnMappings).length === 0) {
    const template = await SupplierTemplate.findOne({ supplierId });
    if (template && template.columnMappings) {
      columnMappings = template.columnMappings instanceof Map
        ? Object.fromEntries(template.columnMappings)
        : (template.columnMappings as any);
    }
  }

  if (Object.keys(columnMappings).length === 0 || Object.values(columnMappings).every(v => !v)) {
    columnMappings = suggestMappings(rawHeaders);
  }

  // Construct normalized IngestionBatch for delegation to ingestService
  const batch: IngestionBatch = {
    supplierId,
    headers: rawHeaders,
    rows: rawRows,
    columnMappings,
    source: 'google-sheets',
    metadata: {
      spreadsheetId: payload.spreadsheetId || config.spreadsheetId,
      sheetName: payload.sheetName || config.sheetName,
      configId: config._id.toString()
    }
  };

  const batchResult: IngestionBatchResult = await ingestService.processBatch(batch);

  // Atomically persist sync lifecycle metrics and state via ingestService
  const updatedConfig = await ingestService.recordSyncCompletion(config._id, batchResult);

  const isSuccessful = batchResult.errors.length === 0 || (batchResult.inserted + batchResult.updated + batchResult.depleted > 0);
  const syncStatus: 'success' | 'error' = (updatedConfig?.syncStatus === 'error' || !isSuccessful) ? 'error' : 'success';
  const lastSyncedAt = updatedConfig?.lastSyncedAt || now;

  return {
    success: isSuccessful,
    syncStatus,
    lastSyncedAt,
    metrics: {
      totalRows: batchResult.totalRows,
      inserted: batchResult.inserted,
      updated: batchResult.updated,
      depleted: batchResult.depleted,
      errors: batchResult.errors
    }
  };
}
