import Agenda from 'agenda';
import mongoose from 'mongoose';
import LiquidationAutomation from '../models/LiquidationAutomation';
import InventoryLot from '../models/InventoryLot';
import AutomationRun from '../models/AutomationRun';
import Buyer from '../models/Buyer';
import BuyerList from '../models/BuyerList';
import Activity from '../models/Activity';
import EmailDispatchLog from '../models/EmailDispatchLog';
import { sendEmailHelper, syncEmailToThread, sendCampaignEmail } from './emailService';
import { compileTemplate, compileSubject } from './emailTemplateService';
import { resolveStageBuyers } from './stageResolver';

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/ind-spoiler-alert';

// 1. Initialize Agenda
export const agenda = new Agenda({
  db: {
    address: mongoUri,
    collection: 'agendaJobs'
  }
} as any);

// 2. Helper to compile cron expression from timezone schedule
export function compileCron(schedule: any): string {
  if (!schedule) return '0 9 * * 1';
  if (schedule.cronExpression && String(schedule.cronExpression).trim()) {
    return String(schedule.cronExpression).trim();
  }
  if (schedule.timeOfDay) {
    let timeStr = String(schedule.timeOfDay).trim();
    let isPM = false;
    let isAM = false;
    if (/pm/i.test(timeStr)) { isPM = true; timeStr = timeStr.replace(/pm/i, '').trim(); }
    if (/am/i.test(timeStr)) { isAM = true; timeStr = timeStr.replace(/am/i, '').trim(); }

    const parts = timeStr.split(':');
    let hour = parseInt(parts[0], 10) || 0;
    const minute = parseInt(parts[1], 10) || 0;

    if (isPM && hour < 12) hour += 12;
    if (isAM && hour === 12) hour = 0;

    const days = schedule.daysOfWeek && schedule.daysOfWeek.length > 0
      ? schedule.daysOfWeek.join(',')
      : '*';
    return `${minute} ${hour} * * ${days}`;
  }
  return '0 9 * * 1'; // Default to Monday 9:00 AM
}

// 3. Define trigger-liquidation-workflow job
agenda.define('trigger-liquidation-workflow', async (job: any) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/ind-spoiler-alert';
      await mongoose.connect(mongoUri);
    }

    const { automationId } = job.attrs.data;
    const automation = await LiquidationAutomation.findById(automationId);
    if (!automation || !automation.isActive) return;

    const filters = automation.inventoryFilters || {};
    const explicitIds = (filters.explicitLotIds || []).map((e: any) => e.toString());
    const excludedIds = (filters.excludedLotIds || []).map((e: any) => e.toString());
    const mode = filters.selectorMode || (explicitIds.length > 0 ? 'explicit' : 'automatic');
    
    // Find matching active inventory lots (query explicitly selected lots directly when in explicit mode)
    let lots: any[] = [];
    if (mode === 'explicit' && explicitIds.length > 0) {
      lots = await InventoryLot.find({ _id: { $in: explicitIds } }).populate('productId');
    } else {
      lots = await InventoryLot.find({
        supplierId: automation.supplierId,
        status: 'active'
      }).populate('productId');
    }

    const matchedLots = lots.filter((lot: any) => {
      const id = lot._id.toString();

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

    try {
      await createAutomationRun(automation, matchedLots, 'scheduled');
    } catch (runErr: any) {
      if (runErr.message === 'A run is already in progress for this workflow') {
        console.warn(`[trigger-liquidation-workflow] Skipping workflow ${automationId}: A run is already in progress`);
        if (job.attrs && job.attrs.nextRunAt) {
          await LiquidationAutomation.findByIdAndUpdate(automationId, { nextRunAt: job.attrs.nextRunAt });
        }
        return;
      }
      throw runErr;
    }

    if (job.attrs && job.attrs.nextRunAt) {
      await LiquidationAutomation.findByIdAndUpdate(automationId, { nextRunAt: job.attrs.nextRunAt });
    }
  } catch (err: any) {
    console.error('Error executing trigger-liquidation-workflow job:', err.message || err);
  }
});

// Define trigger-workflow-stage job
agenda.define('trigger-workflow-stage', async (job: any) => {
  try {
    const { runId, stageIndex } = job.attrs.data;
    await executeWorkflowStage({ runId, stageIndex });
  } catch (err: any) {
    console.error('Error executing trigger-workflow-stage job:', err.message || err);
  }
});

// Helper to execute subsequent workflow stages
export async function executeWorkflowStage({ runId, stageIndex }: { runId: string; stageIndex: number }) {
  if (mongoose.connection.readyState !== 1) {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/ind-spoiler-alert';
    await mongoose.connect(mongoUri);
  }

  const run = await AutomationRun.findById(runId);
  if (!run) return;
  if (run.status === 'awarded' || run.status === 'fallback_executed') return;

  // Idempotency: Prevent duplicate execution of the same stage
  if (Array.isArray(run.stageExecutions) && run.stageExecutions.some((se: any) => se.stageIndex === stageIndex)) {
    return;
  }

  const automation = await LiquidationAutomation.findById(run.automationId);
  if (!automation || !automation.isActive) return;

  const stages = automation.stages || [];
  const currentStage = stages[stageIndex];
  if (!currentStage) return;

  // Compute awarded quantities across all prior stage executions
  const lotAwardedMap = new Map<string, number>();
  if (Array.isArray(run.stageExecutions)) {
    for (const execution of run.stageExecutions) {
      if (Array.isArray(execution.lotsOffered)) {
        for (const offer of execution.lotsOffered) {
          const lId = offer.lotId?.toString();
          if (lId) {
            lotAwardedMap.set(lId, (lotAwardedMap.get(lId) || 0) + (offer.awardedQty || 0));
          }
        }
      }
    }
  }

  // Find all matched lots from snapshot/inventory
  let snapshotLots: any[] = [];
  if (run.snapshotInventoryIds && run.snapshotInventoryIds.length > 0) {
    try {
      snapshotLots = await InventoryLot.find({ _id: { $in: run.snapshotInventoryIds } }).populate('productId');
    } catch (e) {}
  }

  // Fallback to affectedInventoryLots if query empty or unpopulated
  const lotSourceList = (snapshotLots.length > 0)
    ? snapshotLots
    : (run.affectedInventoryLots || []).map((l: any) => ({
        _id: l.lotId,
        lotNumber: l.lotNumber,
        sku: l.sku,
        description: l.description,
        availableQty: l.cases,
        quantityCases: l.cases,
        remainingShelfLife: l.rsl
      }));

  // Build remaining pool with partial quantity carry-forward
  const totalUnsoldLots: any[] = [];
  for (const lot of lotSourceList) {
    const lId = (lot._id || lot.lotId)?.toString();
    const totalQty = lot.availableQty !== undefined ? lot.availableQty : (lot.quantityCases || lot.cases || 0);
    const awardedQty = lotAwardedMap.get(lId) || 0;
    const remainingQty = Math.max(0, totalQty - awardedQty);
    if (remainingQty > 0) {
      totalUnsoldLots.push({
        lot,
        lotId: lot._id || lot.lotId,
        remainingQty
      });
    }
  }

  // If remaining lot pool is completely empty, cancel cascade and close run as awarded
  if (totalUnsoldLots.length === 0) {
    run.status = 'awarded';
    await run.save();
    return;
  }

  // Filter for stage-allocated lots if allocatedLotIds is configured
  const stageAllocatedLotIds = Array.isArray(currentStage.allocatedLotIds) && currentStage.allocatedLotIds.length > 0
    ? currentStage.allocatedLotIds.map((id: any) => id.toString())
    : null;

  const stageLots = stageAllocatedLotIds
    ? totalUnsoldLots.filter(item => stageAllocatedLotIds.includes(item.lotId.toString()))
    : totalUnsoldLots;

  if (stageLots.length === 0 && totalUnsoldLots.length === 0) {
    run.status = 'awarded';
    await run.save();
    return;
  }

  // Resolve Stage N buyers
  const { buyerEmails, evaluatedBuyerIds, resolvedBuyerMap } = await resolveStageBuyers(currentStage, automation);

  // Set run status to escalating
  run.status = 'escalating';
  run.currentStageIndex = stageIndex;
  await run.save();

  // Create stageExecution record
  const stageExecutionRecord: any = {
    stageIndex,
    firedAt: new Date(),
    buyerEmails,
    lotsOffered: stageLots.map(item => ({
      lotId: item.lotId,
      remainingQty: item.remainingQty,
      awardedQty: 0
    })),
    status: 'dispatched'
  };

  if (!run.stageExecutions) {
    run.stageExecutions = [];
  }
  run.stageExecutions.push(stageExecutionRecord);

  // Calculate stage wait time and window
  const stageWaitHours = typeof currentStage.waitHours === 'number' && currentStage.waitHours > 0
    ? currentStage.waitHours
    : 24;
  const stageEvaluationEndsAt = new Date(Date.now() + stageWaitHours * 60 * 60 * 1000);
  run.evaluationEndsAt = stageEvaluationEndsAt;

  // Prepare email dispatching for Stage N buyers
  const stageType = (currentStage.stageType || currentStage.type || '').toLowerCase();
  const rawSubject = currentStage.emailSubject || automation.emailTemplate?.subject || `Distressed Inventory Liquidation Offer - ${automation.name || 'Clearance'}`;
  const rawBodyHtml = currentStage.emailBodyHtml || automation.emailTemplate?.body || `
<div style="font-family: sans-serif; padding: 20px; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; background: #ffffff;">
  <h2 style="color: #4f46e5; margin-top: 0;">Clearance Opportunity | {{supplier_name}}</h2>
  <p>Hello <strong>{{buyer_name}}</strong>,</p>
  <p>We have immediate surplus inventory available for liquidation. Stage offer: <strong>{{current_stage_discount}}</strong> (Response window: {{expiry_hours}}). Please review the itemized offer sheet below:</p>
  <div data-token="inventory_table" style="margin: 16px 0;">{{inventory_table}}</div>
  <br/>
  <p style="text-align: center;">
    <a href="{{quick_bid_link}}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
      Bid Now
    </a>
  </p>
</div>
  `;

  const effectiveMatchedLots = stageLots.map(item => item.lot);
  const totalCases = stageLots.reduce((acc: number, item: any) => acc + item.remainingQty, 0);
  const primaryLot = effectiveMatchedLots[0] || (snapshotLots[0] || {});
  const lotTitle = primaryLot ? ((primaryLot.productId as any)?.description || primaryLot.description || `${stageLots.length} Surplus Inventory Lots`) : 'Surplus Inventory Lot';

  const inventoryItems = stageLots.map(item => {
    const lot = item.lot;
    const prodName = (lot.productId as any)?.description || lot.description || 'Surplus Item';
    const rsl = typeof lot.remainingShelfLife === 'number' ? (lot.remainingShelfLife > 1 ? lot.remainingShelfLife : lot.remainingShelfLife * 100) : 14;
    return {
      sku: (lot.productId as any)?.sku || lot.sku || 'SKU-LOT',
      description: prodName,
      cases: item.remainingQty,
      expiryDays: Math.round(rsl),
      unitPrice: lot.standardSellPrice || lot.costPerCase || 0
    };
  });

  let stageDiscount = currentStage.discountValue ? `${currentStage.discountValue}% OFF` : 'Special Clearance Price';
  if (stageType === 'donation') {
    stageDiscount = 'Surplus Donation Transfer (Complimentary)';
  } else if (stageType === 'landfill') {
    stageDiscount = 'Scheduled Removal & Disposal';
  }

  let stageExpiry = '24 Hours';
  if (currentStage.waitHours !== undefined && currentStage.waitHours !== null) {
    const num = typeof currentStage.waitHours === 'number' ? currentStage.waitHours : parseFloat(currentStage.waitHours);
    if (!isNaN(num)) {
      if (num < 1 && num > 0) {
        const mins = Math.round(num * 60);
        stageExpiry = `${mins} Minute${mins === 1 ? '' : 's'}`;
      } else {
        stageExpiry = Number.isInteger(num) ? `${num} Hours` : `${num.toFixed(1)} Hours`;
      }
    }
  }

  const disposalDeadlineStr = currentStage.disposalDeadline || '';
  const uniqueBuyerEmails = Array.from(new Set(buyerEmails.map((e: string) => e.trim().toLowerCase())));

  for (const email of uniqueBuyerEmails) {
    try {
      let buyerObj = resolvedBuyerMap.get(email);
      if (!buyerObj && mongoose.connection.readyState === 1) {
        try {
          buyerObj = await Buyer.findOne({ email: new RegExp(`^${email}$`, 'i') });
        } catch (e) {}
      }
      const compiledBuyerName = (buyerObj as any)?.companyName || (buyerObj as any)?.name || 'Valued Buyer';
      const quickBidLink = `https://indspoileralert.com/bid?supplierId=${automation.supplierId}&listingId=${primaryLot?._id || 'deal'}`;

      const context = {
        buyer_name: compiledBuyerName,
        supplier_name: 'IndSpoiler Alert Operations',
        lot_title: lotTitle,
        total_cases: totalCases,
        quick_bid_link: quickBidLink,
        current_stage_discount: stageDiscount,
        expiry_hours: stageType === 'landfill' ? (disposalDeadlineStr || stageExpiry) : stageExpiry,
        offer_expiration_time: stageExpiry,
        disposal_deadline: disposalDeadlineStr,
        inventory_table: inventoryItems,
        inventoryItems
      };

      const emailSubject = compileSubject(rawSubject, context);
      const emailBodyHtml = compileTemplate(rawBodyHtml, context);
      const emailPlainText = `Surplus Inventory Liquidation Offer for ${stageLots.length} lot(s). Total Cases: ${totalCases}. Reply to place bid. Link: ${quickBidLink}`;

      await sendEmailHelper(email, emailSubject, emailBodyHtml || emailPlainText, undefined, undefined, automation.supplierId?.toString() || 'default');

      if (mongoose.connection.readyState === 1) {
        try {
          await syncEmailToThread({
            supplierId: automation.supplierId?.toString() || 'default',
            buyerEmail: email,
            subject: emailSubject,
            body: emailBodyHtml || emailPlainText,
            senderType: 'supplier',
            listingId: effectiveMatchedLots.length > 0 ? effectiveMatchedLots[0]._id?.toString() : undefined
          });

          await EmailDispatchLog.create({
            dispatchId: `dispatch-${run._id}-${stageIndex}-${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
            supplierId: automation.supplierId?.toString(),
            buyerEmail: email,
            buyerId: buyerObj?._id?.toString() || (buyerObj as any)?.id,
            compiledBuyerName,
            status: 'sent',
            dispatchedAt: new Date()
          });
        } catch (e) {}
      }
    } catch (err: any) {
      console.error(`Failed to send email to ${email} for stage ${stageIndex}:`, err.message || err);
    }
  }

  // Cascade termination rules & scheduling
  const nextStageIndex = stageIndex + 1;
  const hasNextStage = nextStageIndex < stages.length;

  if (hasNextStage) {
    try {
      const nextStageJob = await agenda.schedule(
        stageEvaluationEndsAt,
        'trigger-workflow-stage',
        { runId: run._id, stageIndex: nextStageIndex }
      );
      if (nextStageJob && nextStageJob.attrs && nextStageJob.attrs._id) {
        stageExecutionRecord.agendaJobId = nextStageJob.attrs._id.toString();
      }
    } catch (e) {}
  } else {
    // Stage N is last stage
    if (stageType === 'landfill') {
      run.status = 'fallback_executed';
      run.resolution = {
        action: 'landfill_dispatched',
        resolvedAt: new Date()
      };
      run.markModified('stageExecutions');
      await run.save();
      return;
    } else {
      try {
        const fallbackJob = await agenda.schedule(
          stageEvaluationEndsAt,
          'execute-workflow-fallback',
          { runId: run._id }
        );
        if (fallbackJob && fallbackJob.attrs && fallbackJob.attrs._id) {
          run.fallbackJobId = fallbackJob.attrs._id.toString();
        }
      } catch (e) {}
    }
  }

  run.status = 'evaluating';
  run.markModified('stageExecutions');
  await run.save();
}

// Define execute-workflow-fallback timeout job
agenda.define('execute-workflow-fallback', async (job: any) => {
  const { runId } = job.attrs.data;
  const run = await AutomationRun.findById(runId);
  if (!run || run.status !== 'evaluating') return;

  const automation = await LiquidationAutomation.findById(run.automationId);
  if (!automation) return;

  const onFallback = automation.rules?.onFallback || 'escalate_review';

  if (onFallback === 'auto_donate') {
    const { donateInventory } = require('./inventoryService');
    const donationConfig = automation.donationConfig || {};
    const entities = donationConfig.donatingEntities || [];
    const entityAllocations: Array<{ entityName: string; lotCount: number }> = [];

    let entIdx = 0;
    for (const lotId of run.snapshotInventoryIds) {
      try {
        const targetEntity = entities.length > 0 ? entities[entIdx % entities.length] : undefined;
        await donateInventory(lotId.toString(), targetEntity);
        entIdx++;
      } catch (err: any) {
        console.error(`Failed to auto-donate lot ${lotId} during fallback:`, err.message || err);
      }
    }

    if (entities.length > 0) {
      entities.forEach((ent: any) => {
        entityAllocations.push({ entityName: ent.name || 'Unnamed Partner', lotCount: Math.ceil(run.snapshotInventoryIds.length / entities.length) });
      });
    }

    run.status = 'fallback_executed';
    run.resolution = {
      action: 'auto_donate',
      resolvedAt: new Date(),
      donationConfigSummary: {
        maxCases: donationConfig.maxCases || 0,
        diversionStrategy: donationConfig.diversionStrategy || 'percentage_split',
        allocations: entityAllocations
      }
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
});

// Helper to create decoupled runs and register fallbacks
export async function createAutomationRun(
  automation: any, 
  matchedLots: any[], 
  runType: 'scheduled' | 'manual'
) {
  if (mongoose.connection.readyState === 1 && automation?._id) {
    const activeRun = await AutomationRun.findOne({
      automationId: automation._id,
      status: { $in: ['evaluating', 'partially_awarded', 'escalating'] }
    });
    if (activeRun) {
      throw new Error('A run is already in progress for this workflow');
    }
  }

  let windowHours = automation.rules?.evaluationWindowHours;
  if (Array.isArray(automation.stages) && automation.stages.length > 0) {
    const stage1Wait = automation.stages[0]?.waitHours;
    if (typeof stage1Wait === 'number' && stage1Wait > 0) {
      windowHours = stage1Wait;
    }
  }
  if (!windowHours) windowHours = 48;

  const evaluationEndsAt = new Date(Date.now() + windowHours * 60 * 60 * 1000);

  const affectedInventoryLots = matchedLots.map((l: any) => ({
    lotId: l._id,
    lotNumber: l.lotNumber || `LOT-${l._id.toString().slice(-6)}`,
    sku: l.productId?.sku || l.sku || 'N/A',
    description: l.productId?.description || l.description || 'Surplus Inventory',
    cases: l.availableQty !== undefined ? l.availableQty : (l.quantityCases || 0),
    rsl: l.remainingShelfLife !== undefined ? l.remainingShelfLife : 0.10
  }));

  let buyerEmails: string[] = [];
  let evaluatedBuyerIds: any[] = [];
  let resolvedBuyerMap = new Map<string, any>();

  if (Array.isArray(automation.stages) && automation.stages.length > 0) {
    const stage1 = automation.stages[0];
    const resolved = await resolveStageBuyers(stage1, automation);
    buyerEmails = resolved.buyerEmails;
    evaluatedBuyerIds = resolved.evaluatedBuyerIds as any[];
    resolvedBuyerMap = resolved.resolvedBuyerMap;
  } else {
    // If no stages defined, check top-level automation config
    if (automation.emailTemplate?.customBuyerIds?.length > 0 && mongoose.connection.readyState === 1) {
      try {
        const customBuyers = await Buyer.find({ _id: { $in: automation.emailTemplate.customBuyerIds }, isActive: { $ne: false } });
        for (const b of customBuyers) {
          if (b.email) {
            const cleanEmail = b.email.trim().toLowerCase();
            if (!buyerEmails.includes(cleanEmail)) {
              buyerEmails.push(cleanEmail);
              if (!evaluatedBuyerIds.includes(b._id)) evaluatedBuyerIds.push(b._id);
              resolvedBuyerMap.set(cleanEmail, b);
            }
          }
        }
      } catch (e) {}
    } else if (automation.targetBuyerSelection === 'all' || automation.emailTemplate?.targetBuyers === 'all_buyers') {
      if (mongoose.connection.readyState === 1) {
        try {
          const allDbBuyers = await Buyer.find({ isActive: { $ne: false } });
          for (const b of allDbBuyers) {
            if (b.email) {
              const cleanEmail = b.email.trim().toLowerCase();
              if (!buyerEmails.includes(cleanEmail)) {
                buyerEmails.push(cleanEmail);
                if (!evaluatedBuyerIds.includes(b._id)) evaluatedBuyerIds.push(b._id);
                resolvedBuyerMap.set(cleanEmail, b);
              }
            }
          }
        } catch (e) {}
      }
    }
  }

  const campaignSnapshot = {
    name: automation.name,
    startDate: automation.startDate,
    endDate: automation.endDate,
    templateName: automation.templateName || automation.templateKey,
    inventoryFilters: automation.inventoryFilters,
    stages: automation.stages,
    donationConfig: automation.donationConfig
  };

  const hasStages = Array.isArray(automation.stages) && automation.stages.length > 0;
  const firstStage = hasStages ? automation.stages[0] : null;
  const stageType = (firstStage?.stageType || firstStage?.type || '').toLowerCase();

  // Filter lots based on stage's allocatedLotIds if custom subset is configured
  const stageAllocatedLotIds = Array.isArray(firstStage?.allocatedLotIds) && firstStage.allocatedLotIds.length > 0
    ? firstStage.allocatedLotIds.map((id: any) => id.toString())
    : null;

  const targetLots = stageAllocatedLotIds
    ? matchedLots.filter((lot: any) => stageAllocatedLotIds.includes(lot._id?.toString() || lot.id?.toString()))
    : matchedLots;

  const effectiveLots = targetLots.length > 0 ? targetLots : matchedLots;

  const initialStageExecutions = hasStages
    ? [
        {
          stageIndex: 0,
          firedAt: new Date(),
          buyerEmails,
          lotsOffered: effectiveLots.map((l: any) => ({
            lotId: l._id || l.id,
            remainingQty: l.availableQty !== undefined ? l.availableQty : (l.quantityCases || l.cases || 0),
            awardedQty: 0
          })),
          status: 'dispatched' as const
        }
      ]
    : undefined;

  if (buyerEmails.length === 0) {
    const run = new AutomationRun({
      automationId: automation._id,
      runType,
      status: 'error',
      errorReason: 'Execution failed: Selected buyer segment/list contains 0 target buyers',
      snapshotInventoryIds: matchedLots.map(l => l._id),
      evaluatedBuyerIds: [],
      dispatchedAt: new Date(),
      executedAt: new Date(),
      buyerEmails: [],
      affectedInventoryLots,
      campaignSnapshot,
      evaluationEndsAt,
      currentStageIndex: hasStages ? 0 : undefined,
      stageExecutions: initialStageExecutions
    });

    if (mongoose.connection.readyState === 1) {
      try {
        await run.save();
      } catch (e) {}
    }
    return run;
  }

  const run = new AutomationRun({
    automationId: automation._id,
    runType,
    status: 'evaluating',
    snapshotInventoryIds: matchedLots.map(l => l._id),
    evaluatedBuyerIds,
    dispatchedAt: new Date(),
    executedAt: new Date(),
    buyerEmails,
    affectedInventoryLots,
    campaignSnapshot,
    evaluationEndsAt,
    currentStageIndex: hasStages ? 0 : undefined,
    stageExecutions: initialStageExecutions
  });

  if (mongoose.connection.readyState === 1) {
    try {
      await run.save();
    } catch (e) {}
  }


  // Dispatch emails and record Activity logs
  const rawSubject = automation.stages?.[0]?.emailSubject || automation.emailTemplate?.subject || `Distressed Inventory Liquidation Offer - ${automation.name || 'Clearance'}`;
  const rawBodyHtml = automation.stages?.[0]?.emailBodyHtml || automation.emailTemplate?.body || `
<div style="font-family: sans-serif; padding: 20px; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; background: #ffffff;">
  <h2 style="color: #4f46e5; margin-top: 0;">Clearance Opportunity | {{supplier_name}}</h2>
  <p>Hello <strong>{{buyer_name}}</strong>,</p>
  <p>We have immediate surplus inventory available for liquidation. Stage offer: <strong>{{current_stage_discount}}</strong> (Response window: {{expiry_hours}}). Please review the itemized offer sheet below:</p>
  <div data-token="inventory_table" style="margin: 16px 0;">{{inventory_table}}</div>
  <br/>
  <p style="text-align: center;">
    <a href="{{quick_bid_link}}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
      Bid Now
    </a>
  </p>
</div>
  `;

  const totalCases = effectiveLots.reduce((acc: number, l: any) => acc + (l.availableQty ?? l.quantityCases ?? l.cases ?? 0), 0);
  const primaryLot = effectiveLots[0] || matchedLots[0];
  const lotTitle = primaryLot ? ((primaryLot.productId as any)?.description || primaryLot.description || `${effectiveLots.length} Surplus Inventory Lots`) : 'Surplus Inventory Lot';

  const inventoryItems = effectiveLots.map((lot: any) => {
    const prodName = (lot.productId as any)?.description || lot.description || 'Surplus Item';
    const rsl = typeof lot.remainingShelfLife === 'number' ? (lot.remainingShelfLife > 1 ? lot.remainingShelfLife : lot.remainingShelfLife * 100) : 14;
    return {
      sku: (lot.productId as any)?.sku || lot.sku || 'SKU-LOT',
      description: prodName,
      cases: lot.quantityCases || lot.availableQty || 0,
      expiryDays: Math.round(rsl),
      unitPrice: lot.standardSellPrice || lot.costPerCase || 0
    };
  });

  let stageDiscount = firstStage?.discountValue ? `${firstStage.discountValue}% OFF` : 'Special Clearance Price';
  if (stageType === 'donation') {
    stageDiscount = 'Surplus Donation Transfer (Complimentary)';
  } else if (stageType === 'landfill') {
    stageDiscount = 'Scheduled Removal & Disposal';
  }
  
  const rawWaitHours = firstStage?.waitHours;
  let stageExpiry = '24 Hours';
  if (rawWaitHours !== undefined && rawWaitHours !== null) {
    const num = typeof rawWaitHours === 'number' ? rawWaitHours : parseFloat(rawWaitHours);
    if (!isNaN(num)) {
      if (num < 1 && num > 0) {
        const mins = Math.round(num * 60);
        stageExpiry = `${mins} Minute${mins === 1 ? '' : 's'}`;
      } else {
        stageExpiry = Number.isInteger(num) ? `${num} Hours` : `${num.toFixed(1)} Hours`;
      }
    }
  }

  const disposalDeadlineStr = firstStage?.disposalDeadline || '';
  const uniqueBuyerEmails = Array.from(new Set(buyerEmails.map((e: string) => e.trim().toLowerCase())));

  for (const email of uniqueBuyerEmails) {
    try {
      let buyerObj = resolvedBuyerMap.get(email);
      if (!buyerObj && mongoose.connection.readyState === 1) {
        try {
          buyerObj = await Buyer.findOne({ email: new RegExp(`^${email}$`, 'i') });
        } catch (e) {}
      }
      const compiledBuyerName = (buyerObj as any)?.companyName || (buyerObj as any)?.name || 'Valued Buyer';
      const quickBidLink = `https://indspoileralert.com/bid?supplierId=${automation.supplierId}&listingId=${primaryLot?._id || 'deal'}`;

      const context = {
        buyer_name: compiledBuyerName,
        supplier_name: 'IndSpoiler Alert Operations',
        lot_title: lotTitle,
        total_cases: totalCases,
        quick_bid_link: quickBidLink,
        current_stage_discount: stageDiscount,
        expiry_hours: stageType === 'landfill' ? (disposalDeadlineStr || stageExpiry) : stageExpiry,
        offer_expiration_time: stageExpiry,
        disposal_deadline: disposalDeadlineStr,
        inventory_table: inventoryItems,
        inventoryItems
      };

      const emailSubject = compileSubject(rawSubject, context);
      const emailBodyHtml = compileTemplate(rawBodyHtml, context);
      const emailPlainText = `Surplus Inventory Liquidation Offer for ${matchedLots.length} lot(s). Total Cases: ${totalCases}. Reply to place bid. Link: ${quickBidLink}`;

      await sendEmailHelper(email, emailSubject, emailBodyHtml || emailPlainText, undefined, undefined, automation.supplierId?.toString() || 'default');

      if (mongoose.connection.readyState === 1) {
        try {
          await syncEmailToThread({
            supplierId: automation.supplierId?.toString() || 'default',
            buyerEmail: email,
            subject: emailSubject,
            body: emailBodyHtml || emailPlainText,
            senderType: 'supplier',
            listingId: matchedLots.length > 0 ? matchedLots[0]._id?.toString() : undefined
          });

          await EmailDispatchLog.create({
            dispatchId: `dispatch-${run._id}-${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
            supplierId: automation.supplierId?.toString(),
            buyerEmail: email,
            buyerId: buyerObj?._id?.toString() || (buyerObj as any)?.id,
            compiledBuyerName,
            status: 'sent',
            dispatchedAt: new Date()
          });
        } catch (e) {}
      }

      if (matchedLots.length > 0 && mongoose.connection.readyState === 1) {
        try {
          await Activity.create({
            lotId: matchedLots[0]._id,
            type: 'email',
            subject: emailSubject,
            content: emailBodyHtml || emailPlainText,
            recipient: email,
            sender: automation.createdBy || 'IndSpoilerAlert Engine',
            timestamp: new Date()
          });
        } catch (e) {}
      }
    } catch (err: any) {
      console.error(`Failed to send email to ${email}:`, err.message || err);
    }
  }

  if (mongoose.connection.readyState === 1) {
    try {
      if (hasStages && automation.stages.length > 1) {
        const nextStageJob = await agenda.schedule(
          evaluationEndsAt,
          'trigger-workflow-stage',
          { runId: run._id, stageIndex: 1 }
        );
        if (nextStageJob && nextStageJob.attrs && nextStageJob.attrs._id) {
          if (Array.isArray(run.stageExecutions) && run.stageExecutions.length > 0) {
            run.stageExecutions[0].agendaJobId = nextStageJob.attrs._id.toString();
            run.markModified('stageExecutions');
            await run.save();
          }
        }
      } else if (hasStages && stageType === 'landfill') {
        run.status = 'fallback_executed';
        run.resolution = {
          action: 'landfill_dispatched',
          resolvedAt: new Date()
        };
        run.markModified('stageExecutions');
        await run.save();
        return run;
      } else {
        const fallbackJob = await agenda.schedule(
          evaluationEndsAt,
          'execute-workflow-fallback',
          { runId: run._id }
        );
        if (fallbackJob && fallbackJob.attrs && fallbackJob.attrs._id) {
          run.fallbackJobId = fallbackJob.attrs._id.toString();
          await run.save();
        }
      }
    } catch (agendaErr) {}
  }

  if (mongoose.connection.readyState === 1 && automation._id) {
    try {
      await LiquidationAutomation.findByIdAndUpdate(automation._id, {
        $inc: { 'stats.totalRuns': 1 }
      });
    } catch (e) {}
  }


  return run;
}



// Hook to check marketplace bids against active workflow runs
export async function checkBidAgainstActiveWorkflows(lot: any, offer: any, listing: any) {
  // Find active evaluating or partially_awarded run containing this lot
  const activeRun = await AutomationRun.findOne({
    snapshotInventoryIds: lot._id,
    status: { $in: ['evaluating', 'partially_awarded'] }
  });

  if (!activeRun) return;

  const automation = await LiquidationAutomation.findById(activeRun.automationId);
  if (!automation) return;

  const floorPrice = automation.rules?.minimumBidFloorPrice;
  const yieldPercent = automation.rules?.minimumYieldRecoveryPercent;

  let meetsFloor = true;
  if (floorPrice !== undefined && offer.price < floorPrice) {
    meetsFloor = false;
  }
  if (yieldPercent !== undefined && offer.price < (lot.costPerCase * yieldPercent / 100)) {
    meetsFloor = false;
  }

  if (!meetsFloor) return; // Bid didn't pass floor checks

  const onSuccess = automation.rules?.onSuccess || 'auto_award';

  if (onSuccess === 'auto_award') {
    // Execute auto-award logic via awardBid (which manages partial/full status & job cancellation)
    const { awardBid } = require('./inventoryService');
    await awardBid(lot._id.toString(), offer._id.toString(), 'Auto-awarded by workflow.', undefined, offer.quantity);
  } else {
    // onSuccess === 'hold_confirmation'
    activeRun.resolution = {
      action: 'hold_confirmation',
      targetBuyerId: offer.buyerId,
      winningOfferId: offer._id,
      resolvedAt: new Date()
    };
    await activeRun.save();
  }
}

// 4. Register or cancel template schedule
export async function scheduleWorkflow(automation: any): Promise<void> {
  // Cancel existing jobs first to prevent double triggers
  await agenda.cancel({ 'data.automationId': automation._id } as any);

  if (!automation.isActive || automation.schedule?.type === 'immediate') {
    await LiquidationAutomation.findByIdAndUpdate(automation._id, { $unset: { nextRunAt: '' } });
    return;
  }

  const cronString = compileCron(automation.schedule);
  const timezone = automation.schedule?.timezone || 'Asia/Calcutta';
  
  const job = agenda.create('trigger-liquidation-workflow', { automationId: automation._id });
  job.unique({ 'data.automationId': automation._id });
  job.repeatEvery(cronString, { timezone });
  await job.save();

  if (job && job.attrs && job.attrs.nextRunAt) {
    await LiquidationAutomation.findByIdAndUpdate(automation._id, { nextRunAt: job.attrs.nextRunAt });
  }
}

// 5. Start Agenda Worker
export async function startAgenda(): Promise<void> {
  if (process.env.NODE_ENV === 'test') return;
  try {
    if (mongoose.connection.readyState !== 1) {
      const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/ind-spoiler-alert';
      await mongoose.connect(mongoUri);
    }
    await agenda.start();
    console.log('Agenda job engine started successfully.');

    // Sync all active automations with Agenda on startup
    const activeAutomations = await LiquidationAutomation.find({ status: 'active', isActive: true });
    for (const auto of activeAutomations) {
      const existingJob = await agenda.jobs({ 'data.automationId': auto._id, name: 'trigger-liquidation-workflow' });
      if (!existingJob || existingJob.length === 0) {
        await scheduleWorkflow(auto);
      }
    }
  } catch (err: any) {
    console.warn('Agenda start error:', err.message || err);
  }
}
