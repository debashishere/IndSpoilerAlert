import crypto from 'crypto';
import { Request, Response } from 'express';
import ZapierSyncConfig from '../models/ZapierSyncConfig';
import Supplier from '../models/Supplier';
import { processZapierWebhook, saveZapierMapping, getZapierRoster } from '../services/zapierIngressService';

export function timingSafeTokenCompare(provided: string, expected: string): boolean {
  if (typeof provided !== 'string' || typeof expected !== 'string') {
    return false;
  }
  const bufA = Buffer.from(provided);
  const bufB = Buffer.from(expected);
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

export async function authenticateZapierIngressKey(
  req: Request
): Promise<{ config?: any; error?: { status: number; message: string } }> {
  const rawIngressKey = (req.headers['x-ingress-key'] as string) || (req.query.ingressKey as string);
  if (!rawIngressKey || typeof rawIngressKey !== 'string' || rawIngressKey.trim().length === 0) {
    return {
      error: {
        status: 401,
        message: 'Unauthorized: Missing X-Ingress-Key authentication header.'
      }
    };
  }

  const trimmedKey = rawIngressKey.trim();
  const config = await ZapierSyncConfig.findOne({ ingressKey: trimmedKey });
  if (!config || !timingSafeTokenCompare(trimmedKey, config.ingressKey)) {
    return {
      error: {
        status: 401,
        message: 'Unauthorized: Invalid X-Ingress-Key.'
      }
    };
  }

  const supplierId = (req.headers['x-supplier-id'] as string) || (req.query.supplierId as string) || (req.method !== 'GET' ? req.body?.supplierId : undefined);
  if (supplierId && config.supplierId.toString() !== supplierId.toString().trim()) {
    return {
      error: {
        status: 403,
        message: 'Forbidden: Ingress key does not match supplierId.'
      }
    };
  }

  return { config };
}

export async function resolveZapierConfig(req: Request) {
  const auth = await authenticateZapierIngressKey(req);
  return auth.config || null;
}

export async function testPingZapier(req: Request, res: Response) {
  const startTime = Date.now();
  try {
    const auth = await authenticateZapierIngressKey(req);
    if (auth.error) {
      return res.status(auth.error.status).json({
        success: false,
        error: auth.error.message
      });
    }

    const config = auth.config;
    const supplier = await Supplier.findById(config.supplierId);
    const latencyMs = Math.max(1, Date.now() - startTime);

    return res.status(200).json({
      success: true,
      status: 'connected',
      supplierName: supplier?.name || 'Verified Supplier',
      latencyMs,
      message: 'Connection verified. Ready for Zapier sync.'
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error'
    });
  }
}

export async function handleZapierWebhook(req: Request, res: Response) {
  const startTime = Date.now();
  try {
    const auth = await authenticateZapierIngressKey(req);
    if (auth.error) {
      return res.status(auth.error.status).json({
        success: false,
        error: auth.error.message
      });
    }

    const latencyMs = Math.max(1, Date.now() - startTime);
    const result = await processZapierWebhook(auth.config, req.body || {}, latencyMs);

    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error'
    });
  }
}

export async function saveZapierMappingHandler(req: Request, res: Response) {
  try {
    const { zapId, zapName, templateName, columnMappings } = req.body || {};
    const rawIngressKey = (req.headers['x-ingress-key'] as string) || (req.query.ingressKey as string);
    const supplierId = req.body?.supplierId || (req.query.supplierId as string) || (req.headers['x-supplier-id'] as string);

    if (!columnMappings || typeof columnMappings !== 'object' || Object.keys(columnMappings).length === 0 || (!rawIngressKey && !supplierId)) {
      return res.status(400).json({
        success: false,
        error: 'supplierId and columnMappings are required.'
      });
    }

    const auth = await authenticateZapierIngressKey(req);
    if (auth.error) {
      return res.status(auth.error.status).json({
        success: false,
        error: auth.error.message
      });
    }

    const effectiveSupplierId = auth.config.supplierId.toString();

    const { supplierTemplateId } = await saveZapierMapping({
      supplierId: effectiveSupplierId,
      zapId: zapId || 'default-zap',
      zapName,
      templateName,
      columnMappings
    });

    return res.status(200).json({
      success: true,
      supplierTemplateId,
      message: 'Zapier column mapping saved and bound successfully.'
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error'
    });
  }
}

export async function getZapierRosterHandler(req: Request, res: Response) {
  try {
    const auth = await authenticateZapierIngressKey(req);
    if (auth.error) {
      return res.status(auth.error.status).json({
        success: false,
        error: auth.error.message
      });
    }

    const roster = await getZapierRoster(auth.config);
    return res.status(200).json({
      success: true,
      ...roster
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error'
    });
  }
}

export async function disconnectZapierFeedHandler(req: Request, res: Response) {
  try {
    const zapId = req.body?.zapId || (req.query.zapId as string);

    if (!zapId || typeof zapId !== 'string' || zapId.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'zapId is required to disconnect a Zap feed.'
      });
    }

    const auth = await authenticateZapierIngressKey(req);
    if (auth.error) {
      return res.status(auth.error.status).json({
        success: false,
        error: auth.error.message
      });
    }

    const config = auth.config;
    const action = req.body?.action || (req.query.action as string);

    if (action === 'archive') {
      const updatedConfig = await ZapierSyncConfig.findOneAndUpdate(
        { _id: config._id, 'connectedZaps.zapId': zapId.trim() },
        { $set: { 'connectedZaps.$.status': 'archived' } },
        { new: true }
      );

      return res.status(200).json({
        success: true,
        message: `Zap feed ${zapId} archived successfully.`,
        remainingZaps: updatedConfig?.connectedZaps?.length || 0
      });
    }

    const updatedConfig = await ZapierSyncConfig.findOneAndUpdate(
      { _id: config._id },
      { $pull: { connectedZaps: { zapId: zapId.trim() } } },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: `Zap feed ${zapId} disconnected successfully.`,
      remainingZaps: updatedConfig?.connectedZaps?.length || 0
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error'
    });
  }
}

