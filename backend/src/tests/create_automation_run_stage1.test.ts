import mongoose from 'mongoose';
import Buyer from '../models/Buyer';
import BuyerList from '../models/BuyerList';
import AutomationRun from '../models/AutomationRun';
import EmailDispatchLog from '../models/EmailDispatchLog';
import { createAutomationRun, agenda } from '../services/agendaService';
import * as emailService from '../services/emailService';

describe('Issue 03: createAutomationRun() - Stage 1 Dispatch Only', () => {
  let supplierId: mongoose.Types.ObjectId;
  let buyerStage1: any;
  let buyerStage2: any;
  let buyerListStage1: any;
  let buyerListStage2: any;
  let lot1: any;
  let sendEmailHelperSpy: jest.SpyInstance;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ind-spoiler-alert-test';
      await mongoose.connect(uri);
    }
  });

  beforeEach(async () => {
    supplierId = new mongoose.Types.ObjectId();

    buyerStage1 = await Buyer.create({
      name: 'Stage 1 VIP Buyer',
      companyName: 'Stage 1 VIPs Ltd',
      email: `stage1_${Date.now()}@vip.com`,
      isActive: true,
      optInBidding: true,
      optInSales: true
    });

    buyerStage2 = await Buyer.create({
      name: 'Stage 2 Discount Buyer',
      companyName: 'Stage 2 Bargains LLC',
      email: `stage2_${Date.now()}@bargains.com`,
      isActive: true,
      optInBidding: true,
      optInSales: true
    });

    buyerListStage1 = await BuyerList.create({
      name: 'VIP Stage 1 List',
      supplierId,
      buyerIds: [buyerStage1._id]
    });

    buyerListStage2 = await BuyerList.create({
      name: 'Bargain Stage 2 List',
      supplierId,
      buyerIds: [buyerStage2._id]
    });

    lot1 = {
      _id: new mongoose.Types.ObjectId(),
      supplierId,
      sku: 'SKU-001',
      description: 'Organic Milk 1L',
      availableQty: 100,
      quantityCases: 100,
      costPerCase: 15,
      remainingShelfLife: 0.15
    };

    sendEmailHelperSpy = jest.spyOn(emailService, 'sendEmailHelper').mockResolvedValue({
      messageId: 'mock-id',
      success: true
    } as any);
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    if (buyerStage1?._id) await Buyer.findByIdAndDelete(buyerStage1._id);
    if (buyerStage2?._id) await Buyer.findByIdAndDelete(buyerStage2._id);
    if (buyerListStage1?._id) await BuyerList.findByIdAndDelete(buyerListStage1._id);
    if (buyerListStage2?._id) await BuyerList.findByIdAndDelete(buyerListStage2._id);
    if (supplierId) {
      await AutomationRun.deleteMany({ 'campaignSnapshot.supplierId': supplierId });
      await EmailDispatchLog.deleteMany({ supplierId: supplierId.toString() });
    }
  });

  afterAll(async () => {
    // cleanup
  });

  describe('Slice 1: Stage 1 Buyer Resolution & Dispatch Isolation', () => {
    it('dispatches emails only to Stage 1 buyers in a multi-stage workflow, ignoring Stage 2 buyers', async () => {
      const automation = {
        _id: new mongoose.Types.ObjectId(),
        supplierId,
        name: 'Multi-Stage Sequence Test',
        stages: [
          {
            stageIndex: 0,
            name: 'Stage 1 - Premium Bid',
            type: 'bidding',
            buyerMode: 'list',
            buyerListId: buyerListStage1._id.toString(),
            waitHours: 24,
            discountValue: 10
          },
          {
            stageIndex: 1,
            name: 'Stage 2 - Clearance',
            type: 'sales',
            buyerMode: 'list',
            buyerListId: buyerListStage2._id.toString(),
            waitHours: 48,
            discountValue: 50
          }
        ]
      };

      const run = await createAutomationRun(automation, [lot1], 'manual');

      expect(run).toBeDefined();
      expect(run.status).toBe('evaluating');
      // Must only contain Stage 1 buyer
      expect(run.buyerEmails).toEqual([buyerStage1.email.toLowerCase()]);
      expect(run.evaluatedBuyerIds.map((id: any) => id.toString())).toEqual([buyerStage1._id.toString()]);

      // Exactly 1 email sent to Stage 1 buyer
      expect(sendEmailHelperSpy).toHaveBeenCalledTimes(1);
      expect(sendEmailHelperSpy.mock.calls[0][0]).toBe(buyerStage1.email.toLowerCase());
    });

    it('falls back to legacy flat config buyer resolution when no stages array is provided', async () => {
      const legacyBuyer = await Buyer.create({
        name: 'Legacy Buyer',
        companyName: 'Legacy Co',
        email: `legacy_${Date.now()}@legacy.com`,
        isActive: true,
        optInBidding: true
      });

      const automation = {
        _id: new mongoose.Types.ObjectId(),
        supplierId,
        name: 'Legacy Flat Campaign',
        emailTemplate: {
          customBuyerIds: [legacyBuyer._id]
        }
      };

      const run = await createAutomationRun(automation, [lot1], 'manual');

      expect(run).toBeDefined();
      expect(run.status).toBe('evaluating');
      expect(run.buyerEmails).toEqual([legacyBuyer.email.toLowerCase()]);
      expect(sendEmailHelperSpy).toHaveBeenCalledTimes(1);
      expect(sendEmailHelperSpy.mock.calls[0][0]).toBe(legacyBuyer.email.toLowerCase());

      await Buyer.findByIdAndDelete(legacyBuyer._id);
    });
  });

  describe('Slice 2: stageExecutions[0] & currentStageIndex Population', () => {
    it('populates run.currentStageIndex = 0 and run.stageExecutions[0] on run creation', async () => {
      const automation = {
        _id: new mongoose.Types.ObjectId(),
        supplierId,
        name: 'Stage Execution Tracker Test',
        stages: [
          {
            stageIndex: 0,
            name: 'Stage 1 VIP',
            type: 'bidding',
            buyerMode: 'list',
            buyerListId: buyerListStage1._id.toString(),
            waitHours: 12
          }
        ]
      };

      const run = await createAutomationRun(automation, [lot1], 'manual');

      expect(run.currentStageIndex).toBe(0);
      expect(run.stageExecutions).toBeDefined();
      expect(run.stageExecutions).toHaveLength(1);

      const stage0 = run.stageExecutions![0];
      expect(stage0.stageIndex).toBe(0);
      expect(stage0.status).toBe('dispatched');
      expect(stage0.firedAt).toBeInstanceOf(Date);
      expect(stage0.buyerEmails).toEqual([buyerStage1.email.toLowerCase()]);
      expect(stage0.lotsOffered).toEqual([
        {
          lotId: lot1._id,
          remainingQty: 100,
          awardedQty: 0
        }
      ]);
    });

    it('populates lotsOffered scoped to allocatedLotIds when stage 1 defines custom allocatedLotIds', async () => {
      const lot2 = {
        _id: new mongoose.Types.ObjectId(),
        supplierId,
        sku: 'SKU-002',
        description: 'Organic Butter 500g',
        availableQty: 50,
        quantityCases: 50,
        costPerCase: 25,
        remainingShelfLife: 0.2
      };

      const automation = {
        _id: new mongoose.Types.ObjectId(),
        supplierId,
        name: 'Subset Lot Stage Test',
        stages: [
          {
            stageIndex: 0,
            name: 'Stage 1 Partial Lots',
            type: 'bidding',
            buyerMode: 'list',
            buyerListId: buyerListStage1._id.toString(),
            allocatedLotIds: [lot1._id.toString()],
            waitHours: 12
          }
        ]
      };

      const run = await createAutomationRun(automation, [lot1, lot2], 'manual');

      expect(run.stageExecutions).toHaveLength(1);
      const stage0 = run.stageExecutions![0];
      expect(stage0.lotsOffered).toHaveLength(1);
      expect(stage0.lotsOffered![0].lotId.toString()).toBe(lot1._id.toString());
      expect(stage0.lotsOffered![0].remainingQty).toBe(100);
      expect(stage0.lotsOffered![0].awardedQty).toBe(0);
    });

    it('does not populate stageExecutions when stages array is empty/undefined', async () => {
      const legacyBuyer = await Buyer.create({
        name: 'Legacy Buyer 2',
        companyName: 'Legacy Co 2',
        email: `legacy2_${Date.now()}@legacy.com`,
        isActive: true,
        optInBidding: true
      });

      const automation = {
        _id: new mongoose.Types.ObjectId(),
        supplierId,
        name: 'Legacy Without Stages',
        emailTemplate: {
          customBuyerIds: [legacyBuyer._id]
        }
      };

      const run = await createAutomationRun(automation, [lot1], 'manual');

      expect(run.currentStageIndex).toBeUndefined();
      expect(run.stageExecutions?.length || 0).toBe(0);

      await Buyer.findByIdAndDelete(legacyBuyer._id);
    });
  });

  describe('Slice 3: Agenda Job Scheduling Branching', () => {
    let agendaScheduleSpy: jest.SpyInstance;

    beforeEach(() => {
      agendaScheduleSpy = jest.spyOn(agenda, 'schedule').mockImplementation(((when: any, jobName: any, data: any) => {
        return Promise.resolve({
          attrs: {
            _id: new mongoose.Types.ObjectId(),
            name: jobName,
            data,
            nextRunAt: when
          }
        } as any);
      }) as any);
    });

    it('schedules trigger-workflow-stage job with { runId, stageIndex: 1 } when stages.length > 1 and records agendaJobId on stageExecutions[0]', async () => {
      const automation = {
        _id: new mongoose.Types.ObjectId(),
        supplierId,
        name: 'Multi-Stage Job Schedule Test',
        stages: [
          {
            stageIndex: 0,
            name: 'Stage 1 VIP',
            type: 'bidding',
            buyerMode: 'list',
            buyerListId: buyerListStage1._id.toString(),
            waitHours: 12
          },
          {
            stageIndex: 1,
            name: 'Stage 2 Clearance',
            type: 'sales',
            buyerMode: 'list',
            buyerListId: buyerListStage2._id.toString(),
            waitHours: 24
          }
        ]
      };

      const run = await createAutomationRun(automation, [lot1], 'manual');

      // Must schedule trigger-workflow-stage, NOT execute-workflow-fallback
      expect(agendaScheduleSpy).toHaveBeenCalledTimes(1);
      const [scheduledWhen, scheduledName, scheduledData] = agendaScheduleSpy.mock.calls[0];
      expect(scheduledName).toBe('trigger-workflow-stage');
      expect(scheduledData).toEqual({
        runId: run._id,
        stageIndex: 1
      });

      // Verify agendaJobId is attached to stageExecutions[0]
      expect(run.stageExecutions?.[0].agendaJobId).toBeDefined();
      expect(run.stageExecutions?.[0].agendaJobId).toBeTruthy();
      expect(run.fallbackJobId).toBeUndefined();
    });

    it('schedules execute-workflow-fallback when stages.length === 1', async () => {
      const automation = {
        _id: new mongoose.Types.ObjectId(),
        supplierId,
        name: 'Single Stage Fallback Test',
        stages: [
          {
            stageIndex: 0,
            name: 'Only Stage 1',
            type: 'bidding',
            buyerMode: 'list',
            buyerListId: buyerListStage1._id.toString(),
            waitHours: 12
          }
        ]
      };

      const run = await createAutomationRun(automation, [lot1], 'manual');

      expect(agendaScheduleSpy).toHaveBeenCalledTimes(1);
      const [scheduledWhen, scheduledName, scheduledData] = agendaScheduleSpy.mock.calls[0];
      expect(scheduledName).toBe('execute-workflow-fallback');
      expect(scheduledData).toEqual({
        runId: run._id
      });
      expect(run.fallbackJobId).toBeDefined();
      expect(run.stageExecutions?.[0].agendaJobId).toBeUndefined();
    });

    it('schedules execute-workflow-fallback for legacy workflow without stages', async () => {
      const legacyBuyer = await Buyer.create({
        name: 'Legacy Buyer 3',
        companyName: 'Legacy Co 3',
        email: `legacy3_${Date.now()}@legacy.com`,
        isActive: true,
        optInBidding: true
      });

      const automation = {
        _id: new mongoose.Types.ObjectId(),
        supplierId,
        name: 'Legacy Job Schedule Test',
        emailTemplate: {
          customBuyerIds: [legacyBuyer._id]
        }
      };

      const run = await createAutomationRun(automation, [lot1], 'manual');

      expect(agendaScheduleSpy).toHaveBeenCalledTimes(1);
      const [scheduledWhen, scheduledName, scheduledData] = agendaScheduleSpy.mock.calls[0];
      expect(scheduledName).toBe('execute-workflow-fallback');
      expect(scheduledData).toEqual({
        runId: run._id
      });
      expect(run.fallbackJobId).toBeDefined();

      await Buyer.findByIdAndDelete(legacyBuyer._id);
    });
  });
});


