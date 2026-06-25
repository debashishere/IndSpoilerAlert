import { Request, Response } from 'express';
import * as analyticsService from '../services/analyticsService';

export async function getAnalyticsSummary(req: Request, res: Response) {
  try {
    const summary = await analyticsService.getAnalyticsSummary();
    return res.json(summary);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
