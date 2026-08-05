import Agenda from 'agenda';
import mongoose from 'mongoose';
import LiquidationAutomation from '../models/LiquidationAutomation';
import InventoryLot from '../models/InventoryLot';
import AutomationRun from '../models/AutomationRun';
import Buyer from '../models/Buyer';
import Activity from '../models/Activity';
import { sendEmailHelper, syncEmailToThread } from './emailService';

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
  if (schedule.cronExpression) return schedule.cronExpression;
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
    
    // Find matching active inventory lots
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
      if (filters.maxRsl && lot.remainingShelfLife > filters.maxRsl) {
        return false;
      }
      return true;
    });

    await createAutomationRun(automation, matchedLots, 'scheduled');

    if (job.attrs && job.attrs.nextRunAt) {
      await LiquidationAutomation.findByIdAndUpdate(automationId, { nextRunAt: job.attrs.nextRunAt });
    }
  } catch (err: any) {
    console.error('Error executing trigger-liquidation-workflow job:', err.message || err);
  }
});

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

  const buyerEmails: string[] = [];
  const evaluatedBuyerIds: any[] = [];

  let allBuyers: any[] = [];
  if (mongoose.connection.readyState === 1) {
    try {
      // Only include active buyers in workflow execution
      allBuyers = await Buyer.find({ isActive: { $ne: false } });
    } catch (e) {}
  }


  if (Array.isArray(automation.stages)) {
    for (const stage of automation.stages) {
      // Determine stage type to enforce opt-in checks
      const stageType: string = (stage.type || stage.stageType || '').toLowerCase();
      const isBiddingStage = stageType.includes('bid') || stageType === 'bidding';
      const isSalesStage = stageType.includes('sale') || stageType === 'sales' || stageType === 'direct_sale';

      if (stage.buyerMode === 'custom') {
        if (Array.isArray(stage.customBuyers)) {
          stage.customBuyers.forEach((b: any) => {
            if (b.email && !buyerEmails.includes(b.email)) buyerEmails.push(b.email);
          });
        }
      } else {
        allBuyers.forEach((b: any) => {
          // Skip buyers that have opted out of this stage type
          if (isBiddingStage && b.optInBidding === false) return;
          if (isSalesStage && b.optInSales === false) return;

          if (b.email && !buyerEmails.includes(b.email)) {
            buyerEmails.push(b.email);
            if (!evaluatedBuyerIds.includes(b._id)) evaluatedBuyerIds.push(b._id);
          }
        });
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
      evaluationEndsAt
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
    evaluationEndsAt
  });

  if (mongoose.connection.readyState === 1) {
    try {
      await run.save();
    } catch (e) {}
  }


  // Dispatch emails and record Activity logs
  const emailSubject = automation.emailTemplate?.subject || `Distressed Inventory Liquidation Offer - ${automation.name || 'Clearance'}`;
  const emailText = `Surplus Inventory Liquidation Offer for ${matchedLots.length} lot(s). Total Cases: ${affectedInventoryLots.reduce((acc: number, l: any) => acc + (l.cases || 0), 0)}. Reply to place bid.`;

  const EmailDispatchLog = mongoose.model('EmailDispatchLog');

  for (const email of buyerEmails.slice(0, 15)) {
    try {
      let buyerObj = allBuyers.find((b: any) => b.email === email);
      if (!buyerObj && Array.isArray(automation.stages)) {
        for (const st of automation.stages) {
          if (Array.isArray(st.customBuyers)) {
            const cb = st.customBuyers.find((b: any) => b.email === email);
            if (cb) {
              buyerObj = { _id: cb.id, companyName: cb.name, name: cb.name, email: cb.email } as any;
              break;
            }
          }
        }
      }
      const compiledBuyerName = (buyerObj as any)?.companyName || (buyerObj as any)?.name || 'Valued Buyer';

      await sendEmailHelper(email, emailSubject, emailText);

      if (mongoose.connection.readyState === 1) {
        try {
          await syncEmailToThread({
            supplierId: automation.supplierId?.toString() || 'default',
            buyerEmail: email,
            subject: emailSubject,
            body: emailText,
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


      if (matchedLots.length > 0) {
        await Activity.create({
          lotId: matchedLots[0]._id,
          type: 'email',
          subject: emailSubject,
          content: emailText,
          recipient: email,
          sender: automation.createdBy || 'IndSpoilerAlert Engine',
          timestamp: new Date()
        });
      }
    } catch (err: any) {
      console.error(`Failed to send email to ${email}:`, err.message || err);
    }
  }

  if (mongoose.connection.readyState === 1) {
    try {
      const fallbackJob = await agenda.schedule(
        evaluationEndsAt,
        'execute-workflow-fallback',
        { runId: run._id }
      );
      if (fallbackJob && fallbackJob.attrs && fallbackJob.attrs._id) {
        run.fallbackJobId = fallbackJob.attrs._id.toString();
        await run.save();
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
  // Find active evaluating run containing this lot
  const activeRun = await AutomationRun.findOne({
    snapshotInventoryIds: lot._id,
    status: 'evaluating'
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
    // 1. Cancel fallback job
    if (activeRun.fallbackJobId) {
      try {
        await agenda.cancel({ _id: new mongoose.Types.ObjectId(activeRun.fallbackJobId) } as any);
      } catch (err: any) {
        console.error('Failed to cancel Agenda fallback job:', err.message || err);
      }
    }

    // 2. Execute auto-award logic
    const { awardBid } = require('./inventoryService');
    await awardBid(lot._id.toString(), offer._id.toString(), offer.quantity, 'Auto-awarded by workflow.');

    // 3. Resolve run status
    activeRun.status = 'awarded';
    activeRun.resolution = {
      action: 'auto_award',
      targetBuyerId: offer.buyerId,
      winningOfferId: offer._id,
      resolvedAt: new Date()
    };
    await activeRun.save();

    await LiquidationAutomation.findByIdAndUpdate(automation._id, {
      $inc: { 'stats.totalAwarded': 1 }
    });
  } else {
    // onSuccess === 'hold_confirmation'
    activeRun.status = 'awarded';
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

  if (!automation.isActive) {
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
