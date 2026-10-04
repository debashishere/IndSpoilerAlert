import GoogleSheetsSyncConfig, { IGoogleSheetsSyncConfig } from '../models/GoogleSheetsSyncConfig';
import SupplierTemplate from '../models/SupplierTemplate';
import { suggestMappings } from '../utils/mapper';
import { IngestionBatch, IngestionBatchResult } from '../utils/ingestionNormalization';
import * as ingestService from './ingestService';

export interface IngressPayload {
  spreadsheetId?: string;
  spreadsheetTitle?: string;
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

  const targetSpreadsheetId = payload.spreadsheetId?.trim() || config.spreadsheetId;
  const targetSheetName = payload.sheetName?.trim() || config.sheetName || 'Sheet1';
  const targetSpreadsheetTitle = payload.spreadsheetTitle?.trim();

  // Resolve Template column mappings or fallback to canonical suggestMappings
  let columnMappings: Record<string, string> = {};

  // Check if target sheet has a bound template in connectedSheets
  const matchingConnectedSheet = config.connectedSheets?.find(
    s => s.spreadsheetId === targetSpreadsheetId && s.sheetName === targetSheetName
  );

  const effectiveTemplateId = matchingConnectedSheet?.supplierTemplateId || config.supplierTemplateId;

  if (effectiveTemplateId) {
    const template = await SupplierTemplate.findById(effectiveTemplateId);
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
      spreadsheetId: targetSpreadsheetId,
      sheetName: targetSheetName,
      spreadsheetTitle: targetSpreadsheetTitle,
      configId: config._id.toString()
    }
  };

  const batchResult: IngestionBatchResult = await ingestService.processBatch(batch);

  // Atomically persist sync lifecycle metrics and state via ingestService
  const updatedConfig = await ingestService.recordSyncCompletion(
    config._id,
    batchResult,
    undefined,
    targetSpreadsheetId ? {
      spreadsheetId: targetSpreadsheetId,
      spreadsheetTitle: targetSpreadsheetTitle || matchingConnectedSheet?.spreadsheetTitle,
      sheetName: targetSheetName,
      supplierTemplateId: effectiveTemplateId,
      sampleHeaders: rawHeaders.length > 0 ? rawHeaders : matchingConnectedSheet?.sampleHeaders,
      sampleRows: rawRows.length > 0 ? rawRows.slice(0, 10) : matchingConnectedSheet?.sampleRows
    } : undefined
  );

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
