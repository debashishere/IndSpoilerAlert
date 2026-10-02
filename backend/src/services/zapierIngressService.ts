import ZapierSyncConfig, { IZapierSyncConfig, IConnectedZap, IZapDeliveryLog } from '../models/ZapierSyncConfig';
import SupplierTemplate from '../models/SupplierTemplate';
import InventoryLot from '../models/InventoryLot';
import { suggestMappings } from '../utils/mapper';
import { IngestionBatch, IngestionBatchResult } from '../utils/ingestionNormalization';
import * as ingestService from './ingestService';

export interface ZapierWebhookResult {
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

export interface SaveZapierMappingParams {
  supplierId: string;
  zapId: string;
  zapName?: string;
  templateName?: string;
  columnMappings: Record<string, string>;
}

export function toCellString(val: any): string {
  if (val === null || val === undefined) return '';
  return typeof val === 'string' ? val.trim() : String(val).trim();
}

export function normalizeColumnMappings(mappings: Record<string, string>): Record<string, string> {
  const canonicalFields = new Set([
    'sku', 'description', 'brand', 'quantityCases', 'availableQty',
    'expirationDate', 'originalPrice', 'costPerCase', 'price',
    'lotNumber', 'productionDate', 'category', 'subCategory',
    'status', 'standardSellPrice', 'warehouse', 'location', 'comment', 'fdaRegulated'
  ]);

  const normalized: Record<string, string> = {};

  for (const [key, value] of Object.entries(mappings)) {
    if (!key || !value) continue;
    // If the value is a canonical field and key is not, e.g. item_code: 'sku'
    if (canonicalFields.has(value) && !canonicalFields.has(key)) {
      normalized[value] = key;
    } else {
      normalized[key] = value;
    }
  }

  return normalized;
}

export async function validateZapierIngressKey(ingressKey?: string): Promise<IZapierSyncConfig | null> {
  if (!ingressKey || typeof ingressKey !== 'string' || ingressKey.trim().length === 0) {
    return null;
  }
  return ZapierSyncConfig.findOne({ ingressKey: ingressKey.trim() });
}

export function normalizeRawZapierPayload(rawPayload: any): {
  zapId: string;
  zapName: string;
  triggerEvent: string;
  headers: string[];
  rows: string[][];
  samplePayload: any;
} {
  let items: any[] = [];
  let zapId = 'default-zap';
  let zapName = 'Zapier Inbound Feed';
  let triggerEvent = 'new_inventory_lot';

  if (Array.isArray(rawPayload)) {
    items = rawPayload;
    if (items.length > 0) {
      if (items[0].zapId) zapId = String(items[0].zapId);
      if (items[0].zapName) zapName = String(items[0].zapName);
      if (items[0].triggerEvent) triggerEvent = String(items[0].triggerEvent);
    }
  } else if (typeof rawPayload === 'object' && rawPayload !== null) {
    if (rawPayload.zapId) zapId = String(rawPayload.zapId);
    if (rawPayload.zapName) zapName = String(rawPayload.zapName);
    if (rawPayload.triggerEvent) triggerEvent = String(rawPayload.triggerEvent);

    const candidateArray = rawPayload.lots || rawPayload.items || rawPayload.data || rawPayload.rows;
    if (Array.isArray(candidateArray)) {
      items = candidateArray;
    } else {
      items = [rawPayload];
    }
  }

  const metaKeys = new Set(['zapId', 'zapName', 'triggerEvent']);
  const headerSet = new Set<string>();

  for (const item of items) {
    if (typeof item === 'object' && item !== null) {
      for (const key of Object.keys(item)) {
        if (!metaKeys.has(key)) {
          headerSet.add(key);
        }
      }
    }
  }

  const headers = Array.from(headerSet);
  const rows: string[][] = [];

  for (const item of items) {
    if (typeof item === 'object' && item !== null) {
      const row = headers.map(h => toCellString(item[h]));
      rows.push(row);
    }
  }

  const samplePayload = Array.isArray(rawPayload)
    ? rawPayload.slice(0, 3)
    : rawPayload;

  return {
    zapId,
    zapName,
    triggerEvent,
    headers,
    rows,
    samplePayload
  };
}

export async function processZapierWebhook(
  config: IZapierSyncConfig,
  rawPayload: any,
  latencyMs: number = 0
): Promise<ZapierWebhookResult> {
  const now = new Date();
  const supplierId = config.supplierId.toString();

  const { zapId, zapName, triggerEvent, headers, rows, samplePayload } = normalizeRawZapierPayload(rawPayload);

  // Resolve Template column mappings or fallback to canonical suggestMappings
  let columnMappings: Record<string, string> = {};

  const matchingZap = config.connectedZaps?.find(z => z.zapId === zapId);
  const effectiveTemplateId = matchingZap?.supplierTemplateId;

  if (effectiveTemplateId) {
    const template = await SupplierTemplate.findById(effectiveTemplateId);
    if (template && template.columnMappings) {
      const rawMap = template.columnMappings instanceof Map
        ? Object.fromEntries(template.columnMappings)
        : (template.columnMappings as any);
      columnMappings = normalizeColumnMappings(rawMap);
    }
  }

  if (Object.keys(columnMappings).length === 0) {
    const template = await SupplierTemplate.findOne({ supplierId });
    if (template && template.columnMappings) {
      const rawMap = template.columnMappings instanceof Map
        ? Object.fromEntries(template.columnMappings)
        : (template.columnMappings as any);
      columnMappings = normalizeColumnMappings(rawMap);
    }
  }

  if (Object.keys(columnMappings).length === 0 || Object.values(columnMappings).every(v => !v)) {
    columnMappings = suggestMappings(headers);
  }

  // Construct normalized IngestionBatch for delegation to ingestService
  const batch: IngestionBatch = {
    supplierId,
    headers,
    rows,
    columnMappings,
    source: 'zapier',
    metadata: {
      zapId,
      zapName,
      triggerEvent,
      configId: config._id.toString()
    }
  };

  const batchResult: IngestionBatchResult = await ingestService.processBatch(batch);

  const isSuccessful = batchResult.errors.length === 0 || (batchResult.inserted + batchResult.updated + batchResult.depleted > 0);
  const syncStatus: 'success' | 'error' = isSuccessful ? 'success' : 'error';

  // Update or auto-register connectedZap
  const updatedConnectedZaps = [...(config.connectedZaps || [])];
  const existingZapIdx = updatedConnectedZaps.findIndex(z => z.zapId === zapId);

  const zapMetrics = {
    totalRows: batchResult.totalRows,
    inserted: batchResult.inserted,
    updated: batchResult.updated,
    depleted: batchResult.depleted,
    errors: batchResult.errors
  };

  if (existingZapIdx >= 0) {
    updatedConnectedZaps[existingZapIdx].zapName = zapName || updatedConnectedZaps[existingZapIdx].zapName;
    updatedConnectedZaps[existingZapIdx].status = 'active';
    updatedConnectedZaps[existingZapIdx].lastSyncedAt = now;
    updatedConnectedZaps[existingZapIdx].lastSyncMetrics = zapMetrics;
  } else {
    updatedConnectedZaps.push({
      zapId,
      zapName,
      triggerEvent,
      status: 'active',
      lotCount: 0,
      lastSyncedAt: now,
      lastSyncMetrics: zapMetrics,
      supplierTemplateId: effectiveTemplateId
    });
  }

  // Append delivery log entry and cap to last 10 entries
  const newDeliveryLog: IZapDeliveryLog = {
    timestamp: now,
    httpStatus: isSuccessful ? 200 : 422,
    latencyMs,
    samplePayload,
    message: isSuccessful ? 'Zapier batch processed successfully' : (batchResult.errors[0] || 'Ingestion errors'),
    status: isSuccessful ? 'success' : 'error'
  };

  const deliveryLogs = [newDeliveryLog, ...(config.deliveryLogs || [])].slice(0, 10);

  // Atomically update config
  await ZapierSyncConfig.findByIdAndUpdate(
    config._id,
    {
      $set: {
        connectedZaps: updatedConnectedZaps,
        deliveryLogs
      }
    },
    { new: true }
  );

  return {
    success: isSuccessful,
    syncStatus,
    lastSyncedAt: now,
    metrics: zapMetrics
  };
}

export async function saveZapierMapping(params: SaveZapierMappingParams): Promise<{ supplierTemplateId: string }> {
  const { supplierId, zapId, zapName, templateName, columnMappings } = params;
  if (!supplierId || !columnMappings || typeof columnMappings !== 'object' || Object.keys(columnMappings).length === 0) {
    throw new Error('supplierId and columnMappings are required.');
  }

  const effectiveTemplateName = templateName || (zapName ? `Zapier: ${zapName}` : (zapId ? `Zapier: ${zapId}` : 'Zapier Template'));
  const normalizedMappings = normalizeColumnMappings(columnMappings);

  let template = await SupplierTemplate.findOne({
    supplierId,
    templateName: effectiveTemplateName
  });

  if (template) {
    template.columnMappings = normalizedMappings as any;
    await template.save();
  } else {
    template = await SupplierTemplate.create({
      supplierId,
      templateName: effectiveTemplateName,
      columnMappings: normalizedMappings,
      hasHeaderRow: true,
      dateFormat: 'YYYY-MM-DD',
      delimiter: ','
    });
  }

  const templateId = template._id.toString();

  const config = await ZapierSyncConfig.findOne({ supplierId });
  if (config) {
    const updatedZaps = [...(config.connectedZaps || [])];
    const matchIdx = updatedZaps.findIndex(z => z.zapId === zapId);
    if (matchIdx >= 0) {
      updatedZaps[matchIdx].supplierTemplateId = template._id as any;
      if (zapName) updatedZaps[matchIdx].zapName = zapName;
    } else {
      updatedZaps.push({
        zapId: zapId || 'default-zap',
        zapName: zapName || 'Zapier Inbound Feed',
        status: 'active',
        lotCount: 0,
        lastSyncMetrics: { totalRows: 0, inserted: 0, updated: 0, depleted: 0, errors: [] },
        supplierTemplateId: template._id as any
      });
    }

    config.connectedZaps = updatedZaps;
    await config.save();
  }

  return { supplierTemplateId: templateId };
}

export async function getZapierRoster(config: IZapierSyncConfig) {
  const connectedZaps = await Promise.all(
    (config.connectedZaps || []).map(async (zap: any) => {
      const zapObj = zap.toObject ? zap.toObject() : { ...zap };
      const activeLotCount = await InventoryLot.countDocuments({
        supplierId: config.supplierId,
        status: { $ne: 'depleted' },
        'attributes.zapId': zap.zapId
      });
      const fallbackLotCount = (zap.lastSyncMetrics?.inserted || 0) + (zap.lastSyncMetrics?.updated || 0);
      return {
        ...zapObj,
        lotCount: activeLotCount > 0 ? activeLotCount : fallbackLotCount
      };
    })
  );

  return {
    supplierId: config.supplierId.toString(),
    ingressKey: config.ingressKey,
    connectedZaps,
    deliveryLogs: config.deliveryLogs || [],
    totalZaps: connectedZaps.length
  };
}
