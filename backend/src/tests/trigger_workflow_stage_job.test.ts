import mongoose from 'mongoose';
import Buyer from '../models/Buyer';
import BuyerList from '../models/BuyerList';
import AutomationRun from '../models/AutomationRun';
import LiquidationAutomation from '../models/LiquidationAutomation';
import InventoryLot from '../models/InventoryLot';
import { executeWorkflowStage, agenda } from '../services/agendaService';
import * as emailService from '../services/emailService';

describe('Issue 04: trigger-workflow-stage Agenda Job', () => {
  let supplierId: mongoose.Types.ObjectId;
  let buyer1: any;
  let buyer2: any;
  let buyerList1: any;
  let buyerList2: any;
  let lot1Id: mongoose.Types.ObjectId;
  let lot2Id: mongoose.Types.ObjectId;
  let lot1Doc: any;
  let lot2Doc: any;
  let automationDoc: any;
  let sendEmailHelperSpy: jest.SpyInstance;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ind-spoiler-alert-test';
      await mongoose.connect(uri);
    }
  });

  beforeEach(async () => {
    supplierId = new mongoose.Types.ObjectId();

    buyer1 = await Buyer.create({
      name: 'Stage 1 Buyer',
      companyName: 'Stage 1 Co',
      email: `stage1_${Date.now()}@test.com`,
      isActive: true,
      optInBidding: true,
      optInSales: true
    });

    buyer2 = await Buyer.create({
      name: 'Stage 2 Buyer',
      companyName: 'Stage 2 Co',
      email: `stage2_${Date.now()}@test.com`,
      isActive: true,
      optInBidding: true,
      optInSales: true
    });

    buyerList1 = await BuyerList.create({
      name: 'Stage 1 List',
      supplierId,
      buyerIds: [buyer1._id]
    });

    buyerList2 = await BuyerList.create({
      name: 'Stage 2 List',
      supplierId,
      buyerIds: [buyer2._id]
    });

    lot1Id = new mongoose.Types.ObjectId();
    lot2Id = new mongoose.Types.ObjectId();
    const mockDcId = new mongoose.Types.ObjectId();
    const mockProdId1 = new mongoose.Types.ObjectId();
    const mockProdId2 = new mongoose.Types.ObjectId();

    lot1Doc = await InventoryLot.create({
      _id: lot1Id,
      supplierId,
      distributionCenterId: mockDcId,
      productId: mockProdId1,
      lotNumber: 'LOT-001',
      expirationDate: new Date(Date.now() + 86400000 * 30),
      sku: 'SKU-001',
      description: 'Organic Milk 1L',
      availableQty: 200,
      quantityCases: 200,
      costPerCase: 10,
      standardSellPrice: 15,
      remainingShelfLife: 0.20,
      status: 'active'
    });

    lot2Doc = await InventoryLot.create({
      _id: lot2Id,
      supplierId,
      distributionCenterId: mockDcId,
      productId: mockProdId2,
      lotNumber: 'LOT-002',
      expirationDate: new Date(Date.now() + 86400000 * 30),
      sku: 'SKU-002',
      description: 'Organic Yogurt 500g',
      availableQty: 100,
      quantityCases: 100,
      costPerCase: 20,
      standardSellPrice: 28,
      remainingShelfLife: 0.15,
      status: 'active'
    });

    automationDoc = await LiquidationAutomation.create({
      supplierId,
      name: `Multi-Stage Test Automation ${Date.now()}`,
      templateName: 'Multi-Stage Flow',
      isActive: true,
      stages: [
        {
          stageIndex: 0,
          name: 'Stage 1 - Premium Tier',
          type: 'bidding',
          buyerMode: 'list',
          buyerListId: buyerList1._id.toString(),
          waitHours: 12,
          discountValue: 10
        },
        {
          stageIndex: 1,
          name: 'Stage 2 - Secondary Tier',
          type: 'bidding',
          buyerMode: 'list',
          buyerListId: buyerList2._id.toString(),
          waitHours: 24,
          discountValue: 30
        }
      ]
    });

    sendEmailHelperSpy = jest.spyOn(emailService, 'sendEmailHelper').mockResolvedValue({
      messageId: 'mock-id',
      success: true
    } as any);
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    if (buyer1?._id) await Buyer.findByIdAndDelete(buyer1._id);
    if (buyer2?._id) await Buyer.findByIdAndDelete(buyer2._id);
    if (buyerList1?._id) await BuyerList.findByIdAndDelete(buyerList1._id);
    if (buyerList2?._id) await BuyerList.findByIdAndDelete(buyerList2._id);
    if (lot1Id) await InventoryLot.findByIdAndDelete(lot1Id);
    if (lot2Id) await InventoryLot.findByIdAndDelete(lot2Id);
    if (automationDoc?._id) await LiquidationAutomation.findByIdAndDelete(automationDoc._id);
    if (supplierId) {
      await AutomationRun.deleteMany({ 'campaignSnapshot.supplierId': supplierId });
    }
  });

  describe('Slice 1: Guarding, Remaining Inventory Pool & Partial Award Carry-Forward', () => {
    it('aborts without modifications if run status is awarded or fallback_executed', async () => {
      const awardedRun = await AutomationRun.create({
        automationId: automationDoc._id,
        runType: 'scheduled',
        status: 'awarded',
        snapshotInventoryIds: [lot1Id],
        evaluatedBuyerIds: [buyer1._id],
        evaluationEndsAt: new Date(Date.now() + 3600000),
        currentStageIndex: 0,
        stageExecutions: [
          {
            stageIndex: 0,
            firedAt: new Date(),
            buyerEmails: [buyer1.email],
            lotsOffered: [{ lotId: lot1Id, remainingQty: 200, awardedQty: 200 }],
            status: 'awarded'
          }
        ]
      });

      const fallbackRun = await AutomationRun.create({
        automationId: automationDoc._id,
        runType: 'scheduled',
        status: 'fallback_executed',
        snapshotInventoryIds: [lot1Id],
        evaluatedBuyerIds: [buyer1._id],
        evaluationEndsAt: new Date(Date.now() + 3600000),
        currentStageIndex: 0,
        stageExecutions: [
          {
            stageIndex: 0,
            firedAt: new Date(),
            buyerEmails: [buyer1.email],
            lotsOffered: [{ lotId: lot1Id, remainingQty: 200, awardedQty: 0 }],
            status: 'expired'
          }
        ]
      });

      await executeWorkflowStage({ runId: awardedRun._id.toString(), stageIndex: 1 });
      await executeWorkflowStage({ runId: fallbackRun._id.toString(), stageIndex: 1 });

      const checkAwarded = await AutomationRun.findById(awardedRun._id);
      const checkFallback = await AutomationRun.findById(fallbackRun._id);

      expect(checkAwarded?.stageExecutions).toHaveLength(1);
      expect(checkAwarded?.currentStageIndex).toBe(0);
      expect(checkFallback?.stageExecutions).toHaveLength(1);
      expect(checkFallback?.currentStageIndex).toBe(0);
      expect(sendEmailHelperSpy).not.toHaveBeenCalled();

      await AutomationRun.findByIdAndDelete(awardedRun._id);
      await AutomationRun.findByIdAndDelete(fallbackRun._id);
    });

    it('computes remaining lot pool carrying forward partially awarded lot quantities', async () => {
      // Stage 0 had lot1 (200 cases total, 50 awarded -> 150 remaining) and lot2 (100 cases total, 0 awarded -> 100 remaining)
      const run = await AutomationRun.create({
        automationId: automationDoc._id,
        runType: 'scheduled',
        status: 'evaluating',
        snapshotInventoryIds: [lot1Id, lot2Id],
        affectedInventoryLots: [
          { lotId: lot1Id, sku: 'SKU-001', cases: 200, description: 'Organic Milk 1L' },
          { lotId: lot2Id, sku: 'SKU-002', cases: 100, description: 'Organic Yogurt 500g' }
        ],
        evaluatedBuyerIds: [buyer1._id],
        evaluationEndsAt: new Date(Date.now() + 3600000),
        currentStageIndex: 0,
        stageExecutions: [
          {
            stageIndex: 0,
            firedAt: new Date(),
            buyerEmails: [buyer1.email],
            lotsOffered: [
              { lotId: lot1Id, remainingQty: 200, awardedQty: 50 },
              { lotId: lot2Id, remainingQty: 100, awardedQty: 0 }
            ],
            status: 'partially_awarded'
          }
        ]
      });

      await executeWorkflowStage({ runId: run._id.toString(), stageIndex: 1 });

      const updatedRun = await AutomationRun.findById(run._id);
      expect(updatedRun?.stageExecutions).toHaveLength(2);
      const stage1Exec = updatedRun?.stageExecutions?.[1];
      expect(stage1Exec?.stageIndex).toBe(1);

      // Verify lot1 remaining is 150, lot2 remaining is 100
      const offeredLot1 = stage1Exec?.lotsOffered?.find((l: any) => l.lotId.toString() === lot1Id.toString());
      const offeredLot2 = stage1Exec?.lotsOffered?.find((l: any) => l.lotId.toString() === lot2Id.toString());

      expect(offeredLot1).toBeDefined();
      expect(offeredLot1?.remainingQty).toBe(150);
      expect(offeredLot1?.awardedQty).toBe(0);

      expect(offeredLot2).toBeDefined();
      expect(offeredLot2?.remainingQty).toBe(100);
      expect(offeredLot2?.awardedQty).toBe(0);

      await AutomationRun.findByIdAndDelete(run._id);
    });

    it('respects stage allocatedLotIds when computing stage pool and carries remaining qty', async () => {
      // Configure stage 1 to allocate only lot1
      await LiquidationAutomation.findByIdAndUpdate(automationDoc._id, {
        stages: [
          {
            stageIndex: 0,
            name: 'Stage 1',
            type: 'bidding',
            buyerListId: buyerList1._id.toString(),
            waitHours: 12
          },
          {
            stageIndex: 1,
            name: 'Stage 2 Custom Subset',
            type: 'bidding',
            buyerListId: buyerList2._id.toString(),
            allocatedLotIds: [lot1Id.toString()],
            waitHours: 24
          }
        ]
      });

      const run = await AutomationRun.create({
        automationId: automationDoc._id,
        runType: 'scheduled',
        status: 'evaluating',
        snapshotInventoryIds: [lot1Id, lot2Id],
        affectedInventoryLots: [
          { lotId: lot1Id, sku: 'SKU-001', cases: 200, description: 'Organic Milk 1L' },
          { lotId: lot2Id, sku: 'SKU-002', cases: 100, description: 'Organic Yogurt 500g' }
        ],
        evaluatedBuyerIds: [buyer1._id],
        evaluationEndsAt: new Date(Date.now() + 3600000),
        currentStageIndex: 0,
        stageExecutions: [
          {
            stageIndex: 0,
            firedAt: new Date(),
            buyerEmails: [buyer1.email],
            lotsOffered: [
              { lotId: lot1Id, remainingQty: 200, awardedQty: 60 },
              { lotId: lot2Id, remainingQty: 100, awardedQty: 0 }
            ],
            status: 'partially_awarded'
          }
        ]
      });

      await executeWorkflowStage({ runId: run._id.toString(), stageIndex: 1 });

      const updatedRun = await AutomationRun.findById(run._id);
      const stage1Exec = updatedRun?.stageExecutions?.[1];
      expect(stage1Exec?.lotsOffered).toHaveLength(1);
      expect(stage1Exec?.lotsOffered?.[0].lotId.toString()).toBe(lot1Id.toString());
      expect(stage1Exec?.lotsOffered?.[0].remainingQty).toBe(140);

      await AutomationRun.findByIdAndDelete(run._id);
    });

    it('cancels cascade and marks run as awarded if all lots have been fully awarded in prior stages', async () => {
      const run = await AutomationRun.create({
        automationId: automationDoc._id,
        runType: 'scheduled',
        status: 'evaluating',
        snapshotInventoryIds: [lot1Id],
        affectedInventoryLots: [
          { lotId: lot1Id, sku: 'SKU-001', cases: 200, description: 'Organic Milk 1L' }
        ],
        evaluatedBuyerIds: [buyer1._id],
        evaluationEndsAt: new Date(Date.now() + 3600000),
        currentStageIndex: 0,
        stageExecutions: [
          {
            stageIndex: 0,
            firedAt: new Date(),
            buyerEmails: [buyer1.email],
            lotsOffered: [
              { lotId: lot1Id, remainingQty: 200, awardedQty: 200 }
            ],
            status: 'awarded'
          }
        ]
      });

      await executeWorkflowStage({ runId: run._id.toString(), stageIndex: 1 });

      const updatedRun = await AutomationRun.findById(run._id);
      expect(updatedRun?.status).toBe('awarded');
      // No stage 1 execution should have been added because inventory pool is empty
      expect(updatedRun?.stageExecutions).toHaveLength(1);
      expect(sendEmailHelperSpy).not.toHaveBeenCalled();

      await AutomationRun.findByIdAndDelete(run._id);
    });
  });

  describe('Slice 2: Stage N Buyer Resolution, Email Dispatch & stageExecutions Recording', () => {
    it('dispatches emails only to Stage N buyers and records stageExecutions[N] with currentStageIndex = N', async () => {
      const buyer3 = await Buyer.create({
        name: 'Stage 3 Buyer',
        companyName: 'Stage 3 Liquidation Co',
        email: `stage3_${Date.now()}@test.com`,
        isActive: true,
        optInBidding: true
      });
      const buyerList3 = await BuyerList.create({
        name: 'Stage 3 List',
        supplierId,
        buyerIds: [buyer3._id]
      });

      await LiquidationAutomation.findByIdAndUpdate(automationDoc._id, {
        stages: [
          {
            stageIndex: 0,
            name: 'Stage 1',
            type: 'bidding',
            buyerListId: buyerList1._id.toString(),
            waitHours: 12
          },
          {
            stageIndex: 1,
            name: 'Stage 2',
            type: 'bidding',
            buyerListId: buyerList2._id.toString(),
            waitHours: 24,
            discountValue: 25
          },
          {
            stageIndex: 2,
            name: 'Stage 3',
            type: 'sales',
            buyerListId: buyerList3._id.toString(),
            waitHours: 48,
            discountValue: 50
          }
        ]
      });

      const run = await AutomationRun.create({
        automationId: automationDoc._id,
        runType: 'scheduled',
        status: 'evaluating',
        snapshotInventoryIds: [lot1Id],
        affectedInventoryLots: [
          { lotId: lot1Id, sku: 'SKU-001', cases: 200, description: 'Organic Milk 1L' }
        ],
        evaluatedBuyerIds: [buyer1._id],
        evaluationEndsAt: new Date(Date.now() + 3600000),
        currentStageIndex: 0,
        stageExecutions: [
          {
            stageIndex: 0,
            firedAt: new Date(Date.now() - 3600000),
            buyerEmails: [buyer1.email],
            lotsOffered: [{ lotId: lot1Id, remainingQty: 200, awardedQty: 0 }],
            status: 'expired'
          }
        ]
      });

      // Fire Stage 1
      await executeWorkflowStage({ runId: run._id.toString(), stageIndex: 1 });

      const updatedRun = await AutomationRun.findById(run._id);
      expect(updatedRun?.currentStageIndex).toBe(1);
      expect(updatedRun?.status).toBe('evaluating');
      expect(updatedRun?.stageExecutions).toHaveLength(2);

      const stage1Exec = updatedRun?.stageExecutions?.[1];
      expect(stage1Exec?.stageIndex).toBe(1);
      expect(stage1Exec?.status).toBe('dispatched');
      expect(stage1Exec?.buyerEmails).toEqual([buyer2.email.toLowerCase()]);
      expect(stage1Exec?.lotsOffered).toEqual([
        {
          lotId: lot1Id,
          remainingQty: 200,
          awardedQty: 0
        }
      ]);

      // Exactly 1 email sent, specifically to Buyer 2
      expect(sendEmailHelperSpy).toHaveBeenCalledTimes(1);
      expect(sendEmailHelperSpy.mock.calls[0][0]).toBe(buyer2.email.toLowerCase());

      // Cleanup
      await Buyer.findByIdAndDelete(buyer3._id);
      await BuyerList.findByIdAndDelete(buyerList3._id);
      await AutomationRun.findByIdAndDelete(run._id);
    });
  });

  describe('Slice 3: Cascade Termination & Follow-up Scheduling', () => {
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

    it('schedules trigger-workflow-stage for Stage N+1 when Stage N+1 exists, attaching agendaJobId to stageExecutions[N]', async () => {
      await LiquidationAutomation.findByIdAndUpdate(automationDoc._id, {
        stages: [
          { stageIndex: 0, name: 'Stage 1', type: 'bidding', buyerListId: buyerList1._id.toString(), waitHours: 12 },
          { stageIndex: 1, name: 'Stage 2', type: 'bidding', buyerListId: buyerList2._id.toString(), waitHours: 24 },
          { stageIndex: 2, name: 'Stage 3', type: 'sales', buyerListId: buyerList2._id.toString(), waitHours: 48 }
        ]
      });

      const run = await AutomationRun.create({
        automationId: automationDoc._id,
        runType: 'scheduled',
        status: 'evaluating',
        snapshotInventoryIds: [lot1Id],
        affectedInventoryLots: [{ lotId: lot1Id, sku: 'SKU-001', cases: 200, description: 'Organic Milk 1L' }],
        evaluatedBuyerIds: [buyer1._id],
        evaluationEndsAt: new Date(Date.now() + 3600000),
        currentStageIndex: 0,
        stageExecutions: [
          {
            stageIndex: 0,
            firedAt: new Date(Date.now() - 3600000),
            buyerEmails: [buyer1.email],
            lotsOffered: [{ lotId: lot1Id, remainingQty: 200, awardedQty: 0 }],
            status: 'expired'
          }
        ]
      });

      // Execute Stage 1
      await executeWorkflowStage({ runId: run._id.toString(), stageIndex: 1 });

      expect(agendaScheduleSpy).toHaveBeenCalledTimes(1);
      const [scheduledWhen, scheduledName, scheduledData] = agendaScheduleSpy.mock.calls[0];
      expect(scheduledName).toBe('trigger-workflow-stage');
      expect(scheduledData).toEqual({
        runId: run._id,
        stageIndex: 2
      });

      const updatedRun = await AutomationRun.findById(run._id);
      const stage1Exec = updatedRun?.stageExecutions?.[1];
      expect(stage1Exec?.agendaJobId).toBeDefined();
      expect(stage1Exec?.agendaJobId).toBeTruthy();
      expect(updatedRun?.fallbackJobId).toBeUndefined();

      await AutomationRun.findByIdAndDelete(run._id);
    });

    it('schedules execute-workflow-fallback when Stage N is the last stage and non-landfill', async () => {
      await LiquidationAutomation.findByIdAndUpdate(automationDoc._id, {
        stages: [
          { stageIndex: 0, name: 'Stage 1', type: 'bidding', buyerListId: buyerList1._id.toString(), waitHours: 12 },
          { stageIndex: 1, name: 'Stage 2', type: 'sales', buyerListId: buyerList2._id.toString(), waitHours: 24 }
        ]
      });

      const run = await AutomationRun.create({
        automationId: automationDoc._id,
        runType: 'scheduled',
        status: 'evaluating',
        snapshotInventoryIds: [lot1Id],
        affectedInventoryLots: [{ lotId: lot1Id, sku: 'SKU-001', cases: 200, description: 'Organic Milk 1L' }],
        evaluatedBuyerIds: [buyer1._id],
        evaluationEndsAt: new Date(Date.now() + 3600000),
        currentStageIndex: 0,
        stageExecutions: [
          {
            stageIndex: 0,
            firedAt: new Date(Date.now() - 3600000),
            buyerEmails: [buyer1.email],
            lotsOffered: [{ lotId: lot1Id, remainingQty: 200, awardedQty: 0 }],
            status: 'expired'
          }
        ]
      });

      // Execute last stage (Stage 1)
      await executeWorkflowStage({ runId: run._id.toString(), stageIndex: 1 });

      expect(agendaScheduleSpy).toHaveBeenCalledTimes(1);
      const [scheduledWhen, scheduledName, scheduledData] = agendaScheduleSpy.mock.calls[0];
      expect(scheduledName).toBe('execute-workflow-fallback');
      expect(scheduledData).toEqual({
        runId: run._id
      });

      const updatedRun = await AutomationRun.findById(run._id);
      expect(updatedRun?.fallbackJobId).toBeDefined();
      expect(updatedRun?.stageExecutions?.[1].agendaJobId).toBeUndefined();

      await AutomationRun.findByIdAndDelete(run._id);
    });

    it('terminates cascade and marks fallback_executed (landfill_dispatched) when last stage is landfill', async () => {
      await LiquidationAutomation.findByIdAndUpdate(automationDoc._id, {
        stages: [
          { stageIndex: 0, name: 'Stage 1', type: 'bidding', buyerListId: buyerList1._id.toString(), waitHours: 12 },
          { stageIndex: 1, name: 'Final Landfill Disposal', type: 'landfill', disposalDeadline: '24 Hours', waitHours: 24 }
        ]
      });

      const run = await AutomationRun.create({
        automationId: automationDoc._id,
        runType: 'scheduled',
        status: 'evaluating',
        snapshotInventoryIds: [lot1Id],
        affectedInventoryLots: [{ lotId: lot1Id, sku: 'SKU-001', cases: 200, description: 'Organic Milk 1L' }],
        evaluatedBuyerIds: [buyer1._id],
        evaluationEndsAt: new Date(Date.now() + 3600000),
        currentStageIndex: 0,
        stageExecutions: [
          {
            stageIndex: 0,
            firedAt: new Date(Date.now() - 3600000),
            buyerEmails: [buyer1.email],
            lotsOffered: [{ lotId: lot1Id, remainingQty: 200, awardedQty: 0 }],
            status: 'expired'
          }
        ]
      });

      // Execute last stage (Stage 1 - landfill)
      await executeWorkflowStage({ runId: run._id.toString(), stageIndex: 1 });

      // No fallback job scheduled
      expect(agendaScheduleSpy).not.toHaveBeenCalled();

      const updatedRun = await AutomationRun.findById(run._id);
      expect(updatedRun?.status).toBe('fallback_executed');
      expect(updatedRun?.resolution?.action).toBe('landfill_dispatched');
      expect(updatedRun?.resolution?.resolvedAt).toBeInstanceOf(Date);

      await AutomationRun.findByIdAndDelete(run._id);
    });

    it('3-stage workflow integration: executes stage 1, schedules stage 2, then executes stage 2 and schedules fallback', async () => {
      await LiquidationAutomation.findByIdAndUpdate(automationDoc._id, {
        stages: [
          { stageIndex: 0, name: 'Stage 1', type: 'bidding', buyerListId: buyerList1._id.toString(), waitHours: 12 },
          { stageIndex: 1, name: 'Stage 2', type: 'bidding', buyerListId: buyerList2._id.toString(), waitHours: 24 },
          { stageIndex: 2, name: 'Stage 3', type: 'sales', buyerListId: buyerList1._id.toString(), waitHours: 48 }
        ]
      });

      const run = await AutomationRun.create({
        automationId: automationDoc._id,
        runType: 'scheduled',
        status: 'evaluating',
        snapshotInventoryIds: [lot1Id],
        affectedInventoryLots: [{ lotId: lot1Id, sku: 'SKU-001', cases: 200, description: 'Organic Milk 1L' }],
        evaluatedBuyerIds: [buyer1._id],
        evaluationEndsAt: new Date(Date.now() + 3600000),
        currentStageIndex: 0,
        stageExecutions: [
          {
            stageIndex: 0,
            firedAt: new Date(Date.now() - 3600000),
            buyerEmails: [buyer1.email],
            lotsOffered: [{ lotId: lot1Id, remainingQty: 200, awardedQty: 0 }],
            status: 'expired'
          }
        ]
      });

      // 1. Fire Stage 1 (stageIndex 1) -> schedules stageIndex 2
      await executeWorkflowStage({ runId: run._id.toString(), stageIndex: 1 });
      expect(agendaScheduleSpy).toHaveBeenCalledTimes(1);
      expect(agendaScheduleSpy.mock.calls[0][1]).toBe('trigger-workflow-stage');
      expect(agendaScheduleSpy.mock.calls[0][2]).toEqual({ runId: run._id, stageIndex: 2 });

      agendaScheduleSpy.mockClear();

      // 2. Fire Stage 2 (stageIndex 2) -> schedules fallback
      await executeWorkflowStage({ runId: run._id.toString(), stageIndex: 2 });
      expect(agendaScheduleSpy).toHaveBeenCalledTimes(1);
      expect(agendaScheduleSpy.mock.calls[0][1]).toBe('execute-workflow-fallback');
      expect(agendaScheduleSpy.mock.calls[0][2]).toEqual({ runId: run._id });

      const finalRun = await AutomationRun.findById(run._id);
      expect(finalRun?.currentStageIndex).toBe(2);
      expect(finalRun?.stageExecutions).toHaveLength(3);
      expect(finalRun?.fallbackJobId).toBeDefined();

      await AutomationRun.findByIdAndDelete(run._id);
    });
  });
});
