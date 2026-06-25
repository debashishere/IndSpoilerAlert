import { Request, Response } from 'express';
import * as inventoryService from '../services/inventoryService';

export async function getInventory(req: Request, res: Response) {
  try {
    const lots = await inventoryService.getInventoryLots(req.query);
    return res.json(lots);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function assessRisk(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const result = await inventoryService.assessRisk(id);
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function enableBidding(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const listing = await inventoryService.enableBidding(id);
    return res.json({ message: 'Bidding enabled. Simulated bids will arrive in 5 seconds.', listing });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function getBids(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const bids = await inventoryService.getBids(id);
    return res.json({ bids });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function awardBid(req: Request, res: Response) {
  const { id, bidId } = req.params;
  const { emailSent, emailSubject, awardedQty } = req.body;
  try {
    const result = await inventoryService.awardBid(id, bidId, emailSent, emailSubject, awardedQty);
    return res.json(result);
  } catch (error: any) {
    console.error('Error in awardBid:', error);
    return res.status(500).json({ error: error.message });
  }
}

export async function awardBidByOfferId(req: Request, res: Response) {
  const { id } = req.params;
  const { emailSent, emailSubject, awardedQty } = req.body;
  try {
    const result = await inventoryService.awardBidByOfferId(id, emailSent, emailSubject, awardedQty);
    return res.json(result);
  } catch (error: any) {
    console.error('Error in awardBidByOfferId:', error);
    return res.status(500).json({ error: error.message });
  }
}

export async function donateInventory(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const result = await inventoryService.donateInventory(id);
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function recycleInventory(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const result = await inventoryService.recycleInventory(id);
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function getActivities(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const activities = await inventoryService.getActivities(id);
    return res.json(activities);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function createActivity(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const activity = await inventoryService.createActivity(id, req.body);
    return res.status(201).json(activity);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function uploadComplianceDoc(req: Request, res: Response) {
  const { id } = req.params;
  const { docType } = req.body;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }
  if (!docType) {
    return res.status(400).json({ error: 'docType is required.' });
  }

  try {
    const result = await inventoryService.uploadComplianceDoc(
      id,
      docType,
      file.path,
      file.originalname
    );
    return res.status(201).json(result);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function confirmAppointment(req: Request, res: Response) {
  const { id } = req.params;
  const { pickupWindowStart, pickupWindowEnd, carrierName, carrierDotNumber } = req.body;
  
  if (!pickupWindowStart || !pickupWindowEnd) {
    return res.status(400).json({ error: 'pickupWindowStart and pickupWindowEnd are required.' });
  }

  try {
    const result = await inventoryService.confirmAppointment(
      id,
      pickupWindowStart,
      pickupWindowEnd,
      carrierName,
      carrierDotNumber
    );
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function updateShipmentStatus(req: Request, res: Response) {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'status is required.' });
  }

  try {
    const result = await inventoryService.updateShipmentStatus(id, status);
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function addShipmentTemperatureLog(req: Request, res: Response) {
  const { id } = req.params;
  const { temperature } = req.body;

  if (temperature === undefined) {
    return res.status(400).json({ error: 'temperature is required.' });
  }

  try {
    const result = await inventoryService.addShipmentTemperatureLog(id, parseFloat(temperature));
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function updateLot(req: Request, res: Response) {
  const { id } = req.params;
  const { fdaRegulated, temperatureMin, temperatureMax, comment } = req.body;
  try {
    const result = await inventoryService.updateLot(id, {
      fdaRegulated,
      temperatureMin: temperatureMin !== undefined && temperatureMin !== null && temperatureMin !== '' ? parseFloat(temperatureMin) : undefined,
      temperatureMax: temperatureMax !== undefined && temperatureMax !== null && temperatureMax !== '' ? parseFloat(temperatureMax) : undefined,
      comment
    });
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function getShipments(req: Request, res: Response) {
  try {
    const shipments = await inventoryService.getShipments();
    return res.json(shipments);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function getShipmentById(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const shipment = await inventoryService.getShipmentById(id);
    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found.' });
    }
    return res.json(shipment);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function getInventoryFacets(req: Request, res: Response) {
  try {
    const facets = await inventoryService.getInventoryFacets(req.query);
    return res.json(facets);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function getSales(req: Request, res: Response) {
  try {
    const sales = await inventoryService.getSales();
    return res.json(sales);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}





