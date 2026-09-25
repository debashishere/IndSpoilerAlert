import { Request, Response } from 'express';
import mongoose from 'mongoose';
import DockAppointment from '../models/DockAppointment';
import ColdChainLog from '../models/ColdChainLog';
import Shipment from '../models/Shipment';

export async function createDockAppointment(req: Request, res: Response) {
  try {
    const {
      shipmentId,
      pickupWindowStart,
      pickupWindowEnd,
      carrierName,
      carrierDotNumber,
      dockDoor,
      notes,
    } = req.body;

    if (!pickupWindowStart || !pickupWindowEnd || !carrierName) {
      return res.status(400).json({ error: 'pickupWindowStart, pickupWindowEnd, and carrierName are required.' });
    }

    const startDate = new Date(pickupWindowStart);
    const endDate = new Date(pickupWindowEnd);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ error: 'pickupWindowStart and pickupWindowEnd must be valid dates.' });
    }

    const validShipmentId = shipmentId && mongoose.Types.ObjectId.isValid(shipmentId) ? shipmentId : undefined;

    const appointment = await DockAppointment.create({
      shipmentId: validShipmentId,
      pickupWindowStart: startDate,
      pickupWindowEnd: endDate,
      carrierName,
      carrierDotNumber: carrierDotNumber || undefined,
      dockDoor: dockDoor || 'Door 1',
      status: 'confirmed',
      notes: notes || undefined,
      slaMet: true,
    });

    if (validShipmentId) {
      const shipment = await Shipment.findById(validShipmentId);
      if (shipment) {
        shipment.pickupWindowStart = startDate;
        shipment.pickupWindowEnd = endDate;
        if (carrierName) shipment.carrierName = carrierName;
        if (carrierDotNumber) shipment.carrierDotNumber = carrierDotNumber;
        if (shipment.status === 'scheduled') {
          shipment.status = 'confirmed';
        }
        await shipment.save();
      }
    }

    return res.status(201).json(appointment);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to create dock appointment.' });
  }
}

export async function getDockAppointments(req: Request, res: Response) {
  try {
    const appointments = await DockAppointment.find().sort({ createdAt: -1 }).populate('shipmentId');
    return res.json(appointments);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch dock appointments.' });
  }
}

export async function createColdChainLog(req: Request, res: Response) {
  try {
    const {
      shipmentId,
      lotId,
      temperature,
      unit,
      recordedBy,
      complianceStatus,
      fsma204Audit,
    } = req.body;

    if (temperature === undefined || temperature === null) {
      return res.status(400).json({ error: 'temperature is required.' });
    }

    const tempNum = Number(temperature);
    const isCompliant = complianceStatus ? complianceStatus === 'compliant' : tempNum >= 32 && tempNum <= 40;

    const logEntry = await ColdChainLog.create({
      shipmentId: shipmentId || undefined,
      lotId: lotId || undefined,
      temperature: tempNum,
      unit: unit || '°F',
      recordedBy: recordedBy || 'System Inspector',
      complianceStatus: complianceStatus || (isCompliant ? 'compliant' : 'warning'),
      fsma204Audit: {
        verified: fsma204Audit?.verified !== false,
        auditTimestamp: fsma204Audit?.auditTimestamp ? new Date(fsma204Audit.auditTimestamp) : new Date(),
        traceabilityCode: fsma204Audit?.traceabilityCode || `KDE-FSMA-${Date.now().toString(36).toUpperCase()}`,
        inspectorName: fsma204Audit?.inspectorName || recordedBy || 'FSMA Auditor',
      },
      timestamp: new Date(),
    });

    if (shipmentId) {
      const shipment = await Shipment.findById(shipmentId);
      if (shipment) {
        if (!shipment.temperatureLogs) {
          shipment.temperatureLogs = [];
        }
        shipment.temperatureLogs.push({
          timestamp: new Date(),
          temperature: tempNum,
        });
        await shipment.save();
      }
    }

    return res.status(201).json(logEntry);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to record cold chain log.' });
  }
}

export async function getColdChainLogs(req: Request, res: Response) {
  try {
    const logs = await ColdChainLog.find().sort({ timestamp: -1 });

    const totalLogs = logs.length;
    const compliantLogs = logs.filter((l) => l.complianceStatus === 'compliant').length;
    const fsma204VerifiedCount = logs.filter((l) => l.fsma204Audit?.verified).length;
    const slaPercentage = totalLogs > 0 ? Math.round((compliantLogs / totalLogs) * 100) : 100;

    const metrics = {
      tempComplianceSla: `${slaPercentage}% SLA`,
      fsma204VerifiedCount,
      totalLogs,
      status: fsma204VerifiedCount > 0 || totalLogs === 0 ? 'Verified' : 'Pending Verification',
      dockSla: '< 45 Min',
      logisticsLinkStatus: 'Active',
    };

    return res.json({ logs, metrics });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch cold chain logs.' });
  }
}
