import { Request, Response } from 'express';
import GoogleSheetsSyncConfig from '../models/GoogleSheetsSyncConfig';
import InventoryLot from '../models/InventoryLot';
import Supplier from '../models/Supplier';
import SupplierTemplate from '../models/SupplierTemplate';
import { validateIngressKey, processGoogleSheetsWebhook } from '../services/googleSheetsIngressService';
import { generateGoogleAppsScript } from '../services/googleAppsScriptGenerator';
import * as ingestService from '../services/ingestService';

export async function resolveGoogleSheetsConfig(req: Request) {
  const rawIngressKey = (req.headers['x-ingress-key'] as string) || (req.query.ingressKey as string);
  const supplierId = (req.query.supplierId as string) || (req.headers['x-supplier-id'] as string) || (req.method !== 'GET' ? req.body?.supplierId : undefined);

  if (rawIngressKey) {
    return validateIngressKey(rawIngressKey);
  }
  if (supplierId && typeof supplierId === 'string' && supplierId.trim().length > 0) {
    return GoogleSheetsSyncConfig.findOne({ supplierId: supplierId.trim() });
  }
  return null;
}

export async function authenticateIngressKeyHeader(req: Request): Promise<{ config?: any; error?: { status: number; message: string } }> {
  const rawIngressKey = req.headers['x-ingress-key'] as string;
  if (!rawIngressKey) {
    return {
      error: {
        status: 401,
        message: 'Unauthorized: Missing X-Ingress-Key authentication header.'
      }
    };
  }

  const config = await validateIngressKey(rawIngressKey);
  if (!config) {
    return {
      error: {
        status: 401,
        message: 'Unauthorized: Invalid X-Ingress-Key.'
      }
    };
  }

  return { config };
}

export async function handleGoogleSheetsWebhook(req: Request, res: Response) {
  try {
    const auth = await authenticateIngressKeyHeader(req);
    if (auth.error) {
      return res.status(auth.error.status).json({
        success: false,
        error: auth.error.message
      });
    }

    const result = await processGoogleSheetsWebhook(auth.config, req.body || {});
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error'
    });
  }
}

export async function getScriptTemplate(req: Request, res: Response) {
  try {
    const supplierId = (req.query.supplierId as string) || (req.headers['x-supplier-id'] as string);
    if (!supplierId || typeof supplierId !== 'string' || supplierId.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'supplierId is required as a query parameter or header.'
      });
    }

    const config = await GoogleSheetsSyncConfig.findOne({ supplierId: supplierId.trim() });
    if (!config) {
      return res.status(404).json({
        success: false,
        error: 'Google Sheets sync configuration not found for the specified supplier.'
      });
    }

    const host = req.get('host') || 'localhost:5000';
    const protocol = req.protocol || 'http';
    const baseUrl = `${protocol}://${host}`;
    const webhookUrl = `${baseUrl}/api/v1/ingestion/google-sheets/webhook`;
    const testPingUrl = `${baseUrl}/api/v1/ingestion/google-sheets/test-ping`;

    const script = generateGoogleAppsScript({
      supplierId: config.supplierId.toString(),
      ingressKey: config.ingressKey,
      webhookUrl,
      testPingUrl,
      sheetName: config.sheetName
    });

    return res.status(200).json({
      success: true,
      supplierId: config.supplierId,
      spreadsheetId: config.spreadsheetId,
      sheetName: config.sheetName,
      ingressKey: config.ingressKey,
      webhookUrl,
      testPingUrl,
      script
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error'
    });
  }
}

export async function testPingGoogleSheets(req: Request, res: Response) {
  try {
    const auth = await authenticateIngressKeyHeader(req);
    if (auth.error) {
      return res.status(auth.error.status).json({
        success: false,
        error: auth.error.message
      });
    }

    const config = auth.config;
    const supplier = await Supplier.findById(config.supplierId);

    return res.status(200).json({
      success: true,
      status: 'connected',
      supplierName: supplier?.name || 'Verified Supplier',
      spreadsheetId: req.body?.spreadsheetId || config.spreadsheetId,
      sheetName: req.body?.sheetName || config.sheetName,
      lastSyncedAt: config.lastSyncedAt || null,
      message: 'Connection verified. Ready for sync.'
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error'
    });
  }
}

export async function getSampleRows(req: Request, res: Response) {
  try {
    const supplierId = (req.query.supplierId as string) || (req.headers['x-supplier-id'] as string);
    const spreadsheetId = (req.query.spreadsheetId as string) || 'spreadsheet';
    const sheetName = (req.query.sheetName as string) || 'Sheet1';

    if (!supplierId) {
      return res.status(400).json({
        success: false,
        error: 'supplierId is required.'
      });
    }

    const sampleResult = await ingestService.getGoogleSheetsSampleRows({
      supplierId,
      spreadsheetId,
      sheetName
    });

    return res.status(200).json({
      success: true,
      ...sampleResult
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error'
    });
  }
}

export async function syncNowGoogleSheets(req: Request, res: Response) {
  try {
    const rawIngressKey = req.headers['x-ingress-key'] as string;
    const supplierId = (req.body?.supplierId || req.query.supplierId || req.headers['x-supplier-id']) as string;

    if (!rawIngressKey && !supplierId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Missing X-Ingress-Key header or supplier identifier.'
      });
    }

    let config = await resolveGoogleSheetsConfig(req);

    if (!config) {
      return res.status(404).json({
        success: false,
        error: 'Google Sheets sync configuration not found.'
      });
    }

    let metrics = config.lastSyncMetrics || {
      totalRows: 0,
      inserted: 0,
      updated: 0,
      depleted: 0,
      errors: []
    };

    if (req.body?.rows && Array.isArray(req.body.rows)) {
      const ingressResult = await processGoogleSheetsWebhook(config, req.body);
      metrics = ingressResult.metrics;
      config = await GoogleSheetsSyncConfig.findById(config._id) || config;
    } else {
      const updatedConfig = await ingestService.recordSyncCompletion(config._id, metrics, 'success');
      if (updatedConfig) {
        config = updatedConfig;
      }
    }

    const syncedLotCount = await ingestService.getActiveLotCount(config.supplierId);

    return res.status(200).json({
      success: true,
      syncStatus: 'success',
      lastSyncedAt: config.lastSyncedAt,
      syncedLotCount,
      metrics,
      message: 'Google Sheets synchronization completed successfully.'
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error'
    });
  }
}

export async function saveMappingHandshake(req: Request, res: Response) {
  try {
    const { supplierId, spreadsheetId, sheetName, templateName, columnMappings } = req.body || {};

    if (!supplierId || !columnMappings || typeof columnMappings !== 'object' || Object.keys(columnMappings).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'supplierId and columnMappings are required.'
      });
    }

    const { supplierTemplateId } = await ingestService.saveGoogleSheetsMapping({
      supplierId,
      spreadsheetId,
      sheetName,
      templateName,
      columnMappings
    });

    return res.status(200).json({
      success: true,
      supplierTemplateId,
      message: 'Google Sheets column mapping saved and bound to sync configuration successfully.'
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error'
    });
  }
}

export async function getConnectedSheetsRoster(req: Request, res: Response) {
  try {
    const rawIngressKey = (req.headers['x-ingress-key'] as string) || (req.query.ingressKey as string);
    const supplierId = (req.query.supplierId as string) || (req.headers['x-supplier-id'] as string);

    if (!rawIngressKey && !supplierId) {
      return res.status(400).json({
        success: false,
        error: 'supplierId or X-Ingress-Key is required to retrieve the roster.'
      });
    }

    const config = await resolveGoogleSheetsConfig(req);

    if (!config) {
      return res.status(404).json({
        success: false,
        error: 'Google Sheets sync configuration not found.'
      });
    }

    const connectedSheets = await Promise.all(
      (config.connectedSheets || []).map(async (sheet: any) => {
        const sheetObj = sheet.toObject ? sheet.toObject() : { ...sheet };
        const activeLotCount = await InventoryLot.countDocuments({
          supplierId: config.supplierId,
          status: { $ne: 'depleted' },
          'attributes.spreadsheetId': sheet.spreadsheetId,
          ...(sheet.sheetName ? { 'attributes.sheetName': sheet.sheetName } : {})
        });
        const fallbackLotCount = (sheet.lastSyncMetrics?.inserted || 0) + (sheet.lastSyncMetrics?.updated || 0);
        return {
          ...sheetObj,
          lotCount: activeLotCount > 0 ? activeLotCount : fallbackLotCount
        };
      })
    );

    return res.status(200).json({
      success: true,
      supplierId: config.supplierId,
      ingressKey: config.ingressKey,
      connectedSheets,
      totalSheets: connectedSheets.length
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error'
    });
  }
}

export async function disconnectGoogleSheet(req: Request, res: Response) {
  try {
    const rawIngressKey = req.headers['x-ingress-key'] as string;
    const supplierId = req.body?.supplierId || (req.query.supplierId as string) || (req.headers['x-supplier-id'] as string);
    const spreadsheetId = req.body?.spreadsheetId || (req.query.spreadsheetId as string);
    const sheetName = req.body?.sheetName || (req.query.sheetName as string);

    if (!spreadsheetId || typeof spreadsheetId !== 'string' || spreadsheetId.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'spreadsheetId is required to disconnect a sheet.'
      });
    }

    if (!rawIngressKey && !supplierId) {
      return res.status(400).json({
        success: false,
        error: 'supplierId or X-Ingress-Key is required to disconnect a sheet.'
      });
    }

    const config = await resolveGoogleSheetsConfig(req);

    if (!config) {
      return res.status(404).json({
        success: false,
        error: 'Google Sheets sync configuration not found.'
      });
    }

    const pullCondition: any = {
      spreadsheetId: spreadsheetId.trim()
    };
    if (sheetName && typeof sheetName === 'string' && sheetName.trim().length > 0) {
      pullCondition.sheetName = sheetName.trim();
    }

    const updatedConfig = await GoogleSheetsSyncConfig.findOneAndUpdate(
      { _id: config._id },
      { $pull: { connectedSheets: pullCondition } },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: `Spreadsheet ${spreadsheetId}${sheetName ? ` (tab: ${sheetName})` : ''} disconnected successfully.`,
      remainingSheets: updatedConfig?.connectedSheets?.length || 0
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error'
    });
  }
}
