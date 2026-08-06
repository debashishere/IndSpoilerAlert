import { Request, Response } from 'express';
import mongoose from 'mongoose';
import LiquidationCycle from '../models/LiquidationCycle';
import LiquidationAutomation from '../models/LiquidationAutomation';
import AutomationRun from '../models/AutomationRun';
import InventoryLot from '../models/InventoryLot';
import { scheduleWorkflow } from '../services/agendaService';

export async function createLiquidationCycle(req: Request, res: Response) {
  try {
    const { supplierId, name, startDate, endDate } = req.body;
    if (!supplierId || !name || !startDate || !endDate) {
      return res.status(400).json({ error: 'supplierId, name, startDate, and endDate are required.' });
    }

    const cycle = new LiquidationCycle({
      supplierId,
      name,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status: 'active'
    });

    await cycle.save();
    return res.status(201).json(cycle);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function getLiquidationCycles(req: Request, res: Response) {
  try {
    const { supplierId } = req.query;
    if (!supplierId) {
      return res.status(400).json({ error: 'supplierId query parameter is required.' });
    }

    const cycles = await LiquidationCycle.find({ supplierId });
    return res.json(cycles);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function updateLiquidationCycle(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { name, startDate, endDate, status } = req.body;

    const cycle = await LiquidationCycle.findByIdAndUpdate(
      id, 
      { name, startDate, endDate, status }, 
      { new: true }
    );
    if (!cycle) {
      return res.status(404).json({ error: 'Liquidation cycle not found.' });
    }

    return res.json(cycle);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function createLiquidationAutomation(req: Request, res: Response) {
  try {
    const { 
      supplierId, 
      liquidationCycleId, 
      name,
      templateName, 
      templateKey,
      inventoryFilters, 
      targetBuyerSelection, 
      schedule, 
      emailTemplate, 
      rules, 
      stages,
      isActive,
      status,
      createdBy
    } = req.body;

    const chosenTemplate = templateName || templateKey;

    if (!supplierId || !chosenTemplate) {
      return res.status(400).json({ error: 'supplierId and templateName are required.' });
    }

    const campaignStatus = status || (isActive === false ? 'draft' : 'active');
    const campaignIsActive = campaignStatus === 'active';
    const workflowName = (name && name.trim()) || chosenTemplate;

    if (workflowName) {
      const existing = await LiquidationAutomation.findOne({
        supplierId,
        name: { $regex: new RegExp(`^${workflowName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
      });
      if (existing) {
        return res.status(400).json({ error: `A saved workflow with the name "${workflowName}" already exists for this supplier.` });
      }
    }

    const automation = new LiquidationAutomation({
      supplierId,
      liquidationCycleId,
      name: workflowName,
      templateName: chosenTemplate,
      templateKey: chosenTemplate,
      inventoryFilters,
      targetBuyerSelection,
      schedule,
      emailTemplate,
      rules,
      stages,
      isActive: campaignIsActive,
      status: campaignStatus,
      createdBy: createdBy || 'Debashis Roy (Sales Mgr)'
    });

    await automation.save();
    // Schedule in Agenda if active
    if (campaignIsActive) {
      await scheduleWorkflow(automation);
    }

    return res.status(201).json(automation);
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'A saved workflow with this name already exists for this supplier.' });
    }
    return res.status(500).json({ error: error.message });
  }
}

export async function updateLiquidationAutomation(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    const targetAuto = await LiquidationAutomation.findById(id);
    if (!targetAuto) {
      return res.status(404).json({ error: 'Workflow template not found.' });
    }

    const chosenTemplate = updates.templateName || updates.templateKey;
    if (chosenTemplate) {
      updates.templateName = chosenTemplate;
      updates.templateKey = chosenTemplate;
    }

    if (updates.name && updates.name.trim()) {
      const existing = await LiquidationAutomation.findOne({
        _id: { $ne: id },
        supplierId: targetAuto.supplierId,
        name: { $regex: new RegExp(`^${updates.name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
      });
      if (existing) {
        return res.status(400).json({ error: `A saved workflow with the name "${updates.name.trim()}" already exists for this supplier.` });
      }
    }

    if (updates.status) {
      updates.isActive = updates.status === 'active';
    }

    const automation = await LiquidationAutomation.findByIdAndUpdate(id, updates, { new: true });

    // Reschedule or cancel in Agenda
    await scheduleWorkflow(automation);

    return res.json(automation);
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'A saved workflow with this name already exists for this supplier.' });
    }
    return res.status(500).json({ error: error.message });
  }
}

export async function patchLiquidationAutomationStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status || !['draft', 'active', 'stopped', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Valid status is required (draft, active, stopped, completed)' });
    }

    const isActive = status === 'active';
    const automation = await LiquidationAutomation.findByIdAndUpdate(
      id,
      { status, isActive },
      { new: true }
    );
    if (!automation) {
      return res.status(404).json({ error: 'Workflow automation not found.' });
    }

    if (isActive) {
      await scheduleWorkflow(automation);
    }

    return res.json(automation);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function deleteLiquidationAutomation(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const automation = await LiquidationAutomation.findByIdAndDelete(id);
    if (!automation) {
      return res.status(404).json({ error: 'Workflow automation not found.' });
    }
    return res.json({ message: 'Campaign deleted successfully', id });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}


export async function getLiquidationAutomations(req: Request, res: Response) {
  try {
    const { supplierId } = req.query;
    if (!supplierId) {
      return res.status(400).json({ error: 'supplierId query parameter is required.' });
    }

    const automations = await LiquidationAutomation.find({ supplierId }).sort({ updatedAt: -1 });
    // Deduplicate by name if duplicate documents exist from legacy saves
    const uniqueMap = new Map<string, any>();
    automations.forEach(auto => {
      const key = (auto.name && auto.name.trim()) || auto._id.toString();
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, auto);
      }
    });

    return res.json(Array.from(uniqueMap.values()));
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function getLiquidationAutomationById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const automation = await LiquidationAutomation.findById(id);
    if (!automation) {
      return res.status(404).json({ error: 'Liquidation automation not found.' });
    }
    return res.json(automation);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function triggerLiquidationAutomation(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const automation = await LiquidationAutomation.findById(id);
    if (!automation) {
      return res.status(404).json({ error: 'Workflow template not found.' });
    }

    const filters = automation.inventoryFilters || {};
    // Find active lots for this supplier
    const lots = await InventoryLot.find({ 
      supplierId: automation.supplierId, 
      status: 'active' 
    }).populate('productId');

    const matchedLots = lots.filter((lot: any) => {
      const id = lot._id.toString();
      const explicitIds = (filters.explicitLotIds || []).map((e: any) => e.toString());
      const excludedIds = (filters.excludedLotIds || []).map((e: any) => e.toString());
      const mode = filters.selectorMode || (explicitIds.length > 0 ? 'explicit' : 'automatic');

      if (mode === 'explicit') {
        return explicitIds.includes(id);
      }
      if (mode === 'hybrid') {
        if (excludedIds.includes(id)) return false;
        if (explicitIds.includes(id)) return true;
      }

      if (excludedIds.includes(id)) return false;
      if (explicitIds.includes(id)) return true;
      if (filters.category && lot.productId && lot.productId.category !== filters.category) {
        return false;
      }
      const lotRsl = typeof lot.remainingShelfLife === 'number' ? (lot.remainingShelfLife > 1 ? lot.remainingShelfLife / 100 : lot.remainingShelfLife) : 1;
      const maxRslVal = filters.maxRsl;
      const normalizedMaxRsl = (maxRslVal !== undefined && maxRslVal !== null && maxRslVal !== 0)
        ? (maxRslVal >= 100 ? 1.0 : (maxRslVal >= 1 ? (maxRslVal === 1 ? 1.0 : maxRslVal / 100) : maxRslVal))
        : null;
      if (normalizedMaxRsl !== null && normalizedMaxRsl < 1 && lotRsl > normalizedMaxRsl) {
        return false;
      }
      return true;
    });

    const { createAutomationRun } = require('../services/agendaService');
    const run = await createAutomationRun(automation, matchedLots, 'manual');
    return res.status(201).json(run);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function getAutomationRuns(req: Request, res: Response) {
  try {
    const { supplierId, automationId } = req.query;
    
    let query: any = {};
    if (automationId) {
      query.automationId = automationId;
    } else if (supplierId) {
      // Get all automations for this supplier, then find runs
      const automations = await LiquidationAutomation.find({ supplierId });
      const automationIds = automations.map(a => a._id);
      query.automationId = { $in: automationIds };
    } else {
      return res.status(400).json({ error: 'supplierId or automationId query parameter is required.' });
    }

    const runs = await AutomationRun.find(query)
      .populate('resolution.targetBuyerId')
      .populate('resolution.winningOfferId')
      .sort({ createdAt: -1 });
    return res.json(runs);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function getAutomationRunsByCampaignId(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const runs = await AutomationRun.find({ automationId: id })
      .populate('resolution.targetBuyerId')
      .populate('resolution.winningOfferId')
      .sort({ executedAt: -1, createdAt: -1 });
    return res.json(runs);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function getAutomationRunById(req: Request, res: Response) {
  try {
    const { runId } = req.params;
    const run = await AutomationRun.findById(runId)
      .populate('automationId')
      .populate('resolution.targetBuyerId')
      .populate('resolution.winningOfferId');
    if (!run) {
      return res.status(404).json({ error: 'Workflow execution run not found.' });
    }
    return res.json(run);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function previewEmail(req: Request, res: Response) {
  try {
    const { subject, body, inventoryFilters, supplierId } = req.body;
    if (!supplierId) {
      return res.status(400).json({ error: 'supplierId is required.' });
    }

    const filters = inventoryFilters || {};
    const lots = await InventoryLot.find({ 
      supplierId, 
      status: 'active' 
    }).populate('productId');

    const matchedLots = lots.filter((lot: any) => {
      const id = lot._id.toString();
      const explicitIds = (filters.explicitLotIds || []).map((e: any) => e.toString());
      const excludedIds = (filters.excludedLotIds || []).map((e: any) => e.toString());
      const mode = filters.selectorMode || (explicitIds.length > 0 ? 'explicit' : 'automatic');

      if (mode === 'explicit') {
        return explicitIds.includes(id);
      }
      if (mode === 'hybrid') {
        if (excludedIds.includes(id)) return false;
        if (explicitIds.includes(id)) return true;
      }

      if (excludedIds.includes(id)) return false;
      if (explicitIds.includes(id)) return true;
      if (filters.category && lot.productId && lot.productId.category !== filters.category) {
        return false;
      }
      const lotRsl = typeof lot.remainingShelfLife === 'number' ? (lot.remainingShelfLife > 1 ? lot.remainingShelfLife / 100 : lot.remainingShelfLife) : 1;
      const maxRslVal = filters.maxRsl;
      const normalizedMaxRsl = (maxRslVal !== undefined && maxRslVal !== null && maxRslVal !== 0)
        ? (maxRslVal >= 100 ? 1.0 : (maxRslVal >= 1 ? (maxRslVal === 1 ? 1.0 : maxRslVal / 100) : maxRslVal))
        : null;
      if (normalizedMaxRsl !== null && normalizedMaxRsl < 1 && lotRsl > normalizedMaxRsl) {
        return false;
      }
      return true;
    });

    if (matchedLots.length === 0) {
      const renderedBodyHtml = `
        <div class="warning-banner" style="background-color: hsl(var(--warning) / 10%); border: 1px solid hsl(var(--warning)); color: hsl(var(--warning)); padding: 12px; border-radius: 6px; margin-bottom: 16px;">
          ⚠️ Your current selection filters match 0 active inventory lots. No email will be sent.
        </div>
        ${body.replace('{{inventory_table}}', '<div style="color: hsl(var(--text-muted)); font-style: italic;">[No matching inventory lots found to generate table]</div>')
              .replace('{{contact_name}}', 'Retail Partner')
              .replace('{{buyer_company}}', 'Matched Buyer Corp')
              .split('\n').join('<br/>')}
      `;
      return res.json({
        renderedSubject: subject,
        renderedBodyHtml,
        matchesZeroLots: true
      });
    }

    // Build styled HTML table
    let tableHtml = `
      <table class="email-inventory-table" style="width: 100%; border-collapse: collapse; margin-top: 15px; font-family: sans-serif; border: 1px solid #dee2e6;">
        <thead>
          <tr style="background-color: #f8f9fa; border-bottom: 2px solid #dee2e6;">
            <th style="text-align: left; padding: 10px; border: 1px solid #dee2e6;">Product</th>
            <th style="text-align: right; padding: 10px; border: 1px solid #dee2e6;">Cases</th>
            <th style="text-align: left; padding: 10px; border: 1px solid #dee2e6;">Expiration</th>
            <th style="text-align: right; padding: 10px; border: 1px solid #dee2e6;">Standard Price</th>
          </tr>
        </thead>
        <tbody>
    `;
    for (const lot of matchedLots) {
      const prodName = (lot.productId as any)?.description || 'Unknown Product';
      const formattedDate = new Date(lot.expirationDate).toLocaleDateString();
      tableHtml += `
        <tr style="border-bottom: 1px solid #dee2e6;">
          <td style="padding: 10px; border: 1px solid #dee2e6;">${prodName}</td>
          <td style="text-align: right; padding: 10px; border: 1px solid #dee2e6;">${lot.quantityCases}</td>
          <td style="padding: 10px; border: 1px solid #dee2e6;">${formattedDate}</td>
          <td style="text-align: right; padding: 10px; border: 1px solid #dee2e6;">$${lot.standardSellPrice.toFixed(2)}</td>
        </tr>
      `;
    }
    tableHtml += `</tbody></table>`;

    // Process place holders
    let renderedBodyHtml = body;
    renderedBodyHtml = renderedBodyHtml.replace('{{inventory_table}}', tableHtml);
    renderedBodyHtml = renderedBodyHtml.replace('{{contact_name}}', 'Retail Partner');
    renderedBodyHtml = renderedBodyHtml.replace('{{buyer_company}}', 'Matched Buyer Corp');
    renderedBodyHtml = renderedBodyHtml.split('\n').join('<br/>');

    return res.json({
      renderedSubject: subject,
      renderedBodyHtml,
      matchesZeroLots: false
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function forceExpireRun(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const run = await AutomationRun.findById(id);
    if (!run) {
      return res.status(404).json({ error: 'Automation run not found.' });
    }
    if (run.status !== 'evaluating') {
      return res.status(400).json({ error: 'Run is not in evaluating state.' });
    }

    // Cancel the scheduled job in Agenda if it exists
    if (run.fallbackJobId) {
      try {
        const { agenda } = require('../services/agendaService');
        await agenda.cancel({ _id: new mongoose.Types.ObjectId(run.fallbackJobId) });
      } catch (err: any) {
        console.error('Failed to cancel fallback job in agenda:', err.message || err);
      }
    }

    // Execute the fallback logic directly
    const automation = await LiquidationAutomation.findById(run.automationId);
    if (!automation) {
      return res.status(404).json({ error: 'Associated automation template not found.' });
    }

    const onFallback = automation.rules?.onFallback || 'escalate_review';

    if (onFallback === 'auto_donate') {
      const { donateInventory } = require('../services/inventoryService');
      for (const lotId of run.snapshotInventoryIds) {
        try {
          await donateInventory(lotId.toString());
        } catch (err: any) {
          console.error(`Failed to auto-donate lot ${lotId} during forced fallback:`, err.message || err);
        }
      }
      run.status = 'fallback_executed';
      run.resolution = {
        action: 'auto_donate',
        resolvedAt: new Date()
      };
      await run.save();

      await LiquidationAutomation.findByIdAndUpdate(automation._id, {
        $inc: { 'stats.totalDonated': 1 }
      });
    } else if (onFallback === 'yield_markdown_retry') {
      run.status = 'fallback_executed';
      run.resolution = {
        action: 'yield_markdown',
        resolvedAt: new Date()
      };
      await run.save();
    } else {
      run.status = 'fallback_executed';
      run.resolution = {
        action: 'escalate_review',
        resolvedAt: new Date()
      };
      await run.save();
    }

    return res.json(run);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}



