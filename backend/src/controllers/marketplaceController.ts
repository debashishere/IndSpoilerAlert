import { Request, Response } from 'express';
import * as marketplaceService from '../services/marketplaceService';

export async function suggestPricing(req: Request, res: Response) {
  const { id } = req.params;
  const { daysRemaining, quantity } = req.body;
  try {
    const pricing = await marketplaceService.suggestPricing(id, daysRemaining, quantity);
    return res.json(pricing);
  } catch (error: any) {
    console.error('Error suggesting pricing:', error.message || error);
    return res.status(500).json({ error: error.message || error });
  }
}

export async function recommendBuyers(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const result = await marketplaceService.recommendBuyers(id);
    return res.json(result);
  } catch (error: any) {
    console.error('Error matching buyers:', error.message || error);
    return res.status(500).json({ error: error.message || error });
  }
}

export async function placeBid(req: Request, res: Response) {
  const listingId = req.params.id || req.body.listingId || req.body.listing_id;
  try {
    const result = await marketplaceService.placeBid(listingId, req.body);
    return res.status(201).json(result);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function publishMarketplaceListing(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const listing = await marketplaceService.publishLotToMarketplace(id);
    return res.status(200).json({ success: true, listing });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message || 'Publication invariant error' });
  }
}

export async function getListings(req: Request, res: Response) {
  try {
    const { search, category, region, discountTier } = req.query;
    const listings = await marketplaceService.getMarketplaceListings({
      search: search as string,
      category: category as string,
      region: region as string,
      discountTier: discountTier as string,
    });
    return res.status(200).json({ success: true, listings });
  } catch (error: any) {
    console.error('Error fetching marketplace listings:', error.message || error);
    return res.status(500).json({ success: false, error: error.message || error });
  }
}


