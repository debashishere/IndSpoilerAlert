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

export async function declineBid(req: Request, res: Response) {
  const { id } = req.params;
  const { reason, rationale } = req.body;
  if (!reason || typeof reason !== 'string' || !reason.trim()) {
    return res.status(400).json({ error: 'Decline reason is required.' });
  }
  try {
    const offer = await offersService.declineBid(id, reason.trim(), rationale ? rationale.trim() : undefined);
    return res.json(offer);
  } catch (error: any) {
    if (error.message === 'Offer not found.') {
      return res.status(404).json({ error: error.message });
    }
    return res.status(500).json({ error: error.message });
  }
}

export async function resetBid(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const offer = await offersService.resetBid(id);
    return res.json(offer);
  } catch (error: any) {
    if (error.message === 'Offer not found.') {
      return res.status(404).json({ error: error.message });
    }
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

export async function renegotiateBid(req: Request, res: Response) {
  const { id } = req.params;
  const { counterPrice, counterQuantity, messageText, templateHtml, messageHtml, emailSubject } = req.body;

  if (counterPrice === undefined || counterPrice === null || typeof counterPrice !== 'number' || counterPrice <= 0 || isNaN(counterPrice)) {
    return res.status(400).json({ error: 'counterPrice is required and must be greater than 0.' });
  }

  if (
    counterQuantity === undefined ||
    counterQuantity === null ||
    typeof counterQuantity !== 'number' ||
    counterQuantity <= 0 ||
    !Number.isInteger(counterQuantity)
  ) {
    return res.status(400).json({ error: 'counterQuantity is required and must be a positive integer.' });
  }

  try {
    const result = await offersService.renegotiateBid(id, counterPrice, counterQuantity, messageText, {
      templateHtml: templateHtml || messageHtml,
      emailSubject
    });
    return res.json(result);
  } catch (error: any) {
    if (error.message === 'Offer not found.') {
      return res.status(404).json({ error: error.message });
    }
    return res.status(500).json({ error: error.message });
  }
}

export async function acceptBid(req: Request, res: Response) {
  const { id } = req.params;
  const { awardedQuantity, pickupAddress, pickupHours, templateHtml, messageHtml, emailSubject } = req.body;

  if (awardedQuantity !== undefined && awardedQuantity !== null) {
    if (typeof awardedQuantity !== 'number' || awardedQuantity <= 0 || !Number.isInteger(awardedQuantity)) {
      return res.status(400).json({ error: 'awardedQuantity must be a positive integer.' });
    }
  }

  try {
    const result = await offersService.acceptBid(id, {
      awardedQuantity,
      pickupAddress,
      pickupHours,
      templateHtml: templateHtml || messageHtml,
      emailSubject
    });
    return res.json(result);
  } catch (error: any) {
    if (error.message === 'Offer not found.') {
      return res.status(404).json({ error: error.message });
    }
    if (error.message.includes('already been accepted')) {
      return res.status(409).json({ error: error.message });
    }
    if (
      error.message.includes('rejected offer') ||
      error.message.includes('Insufficient inventory') ||
      error.message.includes('cannot exceed') ||
      error.message.includes('concurrent modification')
    ) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: error.message });
  }
}

export async function resendSettlement(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const result = await offersService.resendSettlementEmail(id);
    return res.json(result);
  } catch (error: any) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    return res.status(500).json({ error: error.message });
  }
}



