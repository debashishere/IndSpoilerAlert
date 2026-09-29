import { Request, Response } from 'express';
import { validateIngressKey, processGoogleSheetsWebhook } from '../services/googleSheetsIngressService';

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

    const GoogleSheetsSyncConfig = (await import('../models/GoogleSheetsSyncConfig')).default;
    const { generateGoogleAppsScript } = await import('../services/googleAppsScriptGenerator');

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

    const Supplier = (await import('../models/Supplier')).default;
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

    const SupplierTemplate = (await import('../models/SupplierTemplate')).default;
    const existingTemplate = await SupplierTemplate.findOne({ supplierId });

    // Deterministic sample headers and preview rows for spreadsheet handshake
    const rawHeaders = ['SKU / Item Code', 'Product Title', 'Cases Available', 'Expiry Date', 'Unit Price ($)', 'Warehouse Location'];
    const sampleRow1 = ['SKU-ORG-101', 'Organic Almond Milk 1L', '240', '2026-11-30', '3.85', 'Cold Facility A'];
    const sampleRow2 = ['SKU-ORG-102', 'Organic Oat Barista 1L', '180', '2026-12-15', '4.10', 'Ambient Bay 4'];
    const sampleRow3 = ['SKU-ORG-103', 'Greek Yogurt Plain 500g', '95', '2026-10-18', '2.40', 'Cold Facility B'];

    let suggestedMapping: Record<string, string> = {
      sku: 'SKU / Item Code',
      description: 'Product Title',
      quantity: 'Cases Available',
      expirationDate: 'Expiry Date',
      originalPrice: 'Unit Price ($)',
      warehouse: 'Warehouse Location'
    };

    if (existingTemplate && existingTemplate.columnMappings) {
      const templateMappings: Record<string, string> = {};
      existingTemplate.columnMappings.forEach((val: string, key: string) => {
        templateMappings[key] = val;
      });
      suggestedMapping = { ...suggestedMapping, ...templateMappings };
    }

    return res.status(200).json({
      success: true,
      documentId: `gsheet-handshake-${spreadsheetId.slice(0, 8)}`,
      fileName: `Google Sheets: ${sheetName}`,
      rawGrid: [rawHeaders, sampleRow1, sampleRow2, sampleRow3],
      suggestedMapping
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

    const GoogleSheetsSyncConfig = (await import('../models/GoogleSheetsSyncConfig')).default;
    const InventoryLot = (await import('../models/InventoryLot')).default;

    let config = null;
    if (rawIngressKey) {
      config = await validateIngressKey(rawIngressKey);
    } else if (supplierId) {
      config = await GoogleSheetsSyncConfig.findOne({ supplierId });
    }

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
    } else {
      config.syncStatus = 'success';
      config.lastSyncedAt = new Date();
      await config.save();
    }

    const syncedLotCount = await InventoryLot.countDocuments({
      supplierId: config.supplierId,
      status: { $ne: 'depleted' }
    });

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

    const SupplierTemplate = (await import('../models/SupplierTemplate')).default;
    const GoogleSheetsSyncConfig = (await import('../models/GoogleSheetsSyncConfig')).default;

    let template = await SupplierTemplate.findOne({
      supplierId,
      templateName: templateName || 'Google Sheets Template'
    });

    if (template) {
      template.columnMappings = columnMappings;
      await template.save();
    } else {
      template = await SupplierTemplate.create({
        supplierId,
        templateName: templateName || 'Google Sheets Template',
        columnMappings,
        hasHeaderRow: true,
        dateFormat: 'YYYY-MM-DD',
        delimiter: ','
      });
    }

    // Bind template to GoogleSheetsSyncConfig
    const config = await GoogleSheetsSyncConfig.findOne({ supplierId });
    if (config) {
      config.supplierTemplateId = template._id;
      if (spreadsheetId) config.spreadsheetId = spreadsheetId;
      if (sheetName) config.sheetName = sheetName;
      await config.save();
    }

    return res.status(200).json({
      success: true,
      supplierTemplateId: template._id.toString(),
      message: 'Google Sheets column mapping saved and bound to sync configuration successfully.'
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error'
    });
  }
}
