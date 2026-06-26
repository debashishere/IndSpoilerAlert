import { Request, Response } from 'express';
import * as offersService from '../services/offersService';

export async function sendMessage(req: Request, res: Response) {
  const { id } = req.params;
  const { sender, content, proposedPrice, proposedQuantity } = req.body;
  try {
    const offer = await offersService.sendMessage(id, sender, content, proposedPrice, proposedQuantity);
    return res.json(offer);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function rejectBid(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const offer = await offersService.rejectBid(id);
    return res.json(offer);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function getBids(req: Request, res: Response) {
  try {
    const bids = await offersService.getAllOffers();
    return res.json(bids);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

