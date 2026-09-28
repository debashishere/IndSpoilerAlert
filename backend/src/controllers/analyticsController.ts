import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import * as analyticsService from '../services/analyticsService';

export async function getAnalyticsSummary(req: Request, res: Response) {
  try {
    const summary = await analyticsService.getAnalyticsSummary();
    return res.json(summary);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function getSalesAnalytics(req: AuthenticatedRequest, res: Response) {
  try {
    const { timeframe, category, warehouse, supplierId } = req.query;
    const result = await analyticsService.getSalesAnalytics({
      timeframe: timeframe ? String(timeframe) : undefined,
      category: category ? String(category) : undefined,
      warehouse: warehouse ? String(warehouse) : undefined,
      supplierId: supplierId ? String(supplierId) : undefined,
      user: req.user,
    });
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
