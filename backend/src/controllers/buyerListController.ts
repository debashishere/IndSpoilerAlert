import { Request, Response } from 'express';
import BuyerList from '../models/BuyerList';

export async function getBuyerLists(req: Request, res: Response): Promise<void> {
  try {
    const { supplierId } = req.query;
    const query: any = {};
    if (supplierId) {
      query.supplierId = supplierId;
    }
    const lists = await BuyerList.find(query).populate('buyerIds').sort({ createdAt: 1 });
    res.status(200).json(lists);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch buyer lists' });
  }
}

export async function getBuyerListById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const list = await BuyerList.findById(id).populate('buyerIds');
    if (!list) {
      res.status(404).json({ error: 'Buyer list not found' });
      return;
    }
    res.status(200).json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch buyer list' });
  }
}

export async function createBuyerList(req: Request, res: Response): Promise<void> {
  try {
    const { name, description, supplierId, buyerIds, type } = req.body;
    if (!name) {
      res.status(400).json({ error: 'Name is required' });
      return;
    }

    const newList = new BuyerList({
      name,
      description: description || '',
      supplierId: supplierId || undefined,
      buyerIds: buyerIds || [],
      type: type || 'custom',
    });

    await newList.save();
    res.status(201).json(newList);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create buyer list' });
  }
}

export async function updateBuyerList(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const list = await BuyerList.findById(id);
    if (!list) {
      res.status(404).json({ error: 'Buyer list not found' });
      return;
    }

    if (name !== undefined) list.name = name;
    if (description !== undefined) list.description = description;

    await list.save();
    res.status(200).json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update buyer list' });
  }
}

export async function deleteBuyerList(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const list = await BuyerList.findById(id);

    if (!list) {
      res.status(404).json({ error: 'Buyer list not found' });
      return;
    }

    if (list.type === 'primary' || list.type === 'secondary') {
      res.status(400).json({ error: 'System default lists (primary/secondary) cannot be deleted' });
      return;
    }

    await BuyerList.findByIdAndDelete(id);
    res.status(200).json({ message: 'Buyer list deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to delete buyer list' });
  }
}

export async function updateBuyerListMembers(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { buyerIds } = req.body;

    if (!Array.isArray(buyerIds)) {
      res.status(400).json({ error: 'buyerIds must be an array' });
      return;
    }

    const list = await BuyerList.findById(id);
    if (!list) {
      res.status(404).json({ error: 'Buyer list not found' });
      return;
    }

    list.buyerIds = buyerIds;
    await list.save();
    res.status(200).json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update list members' });
  }
}
