import mongoose from 'mongoose';
import Buyer from '../models/Buyer';
import AutomationRun from '../models/AutomationRun';
import LiquidationAutomation from '../models/LiquidationAutomation';
import InventoryLot from '../models/InventoryLot';
import Opportunity from '../models/Opportunity';
import MarketplaceListing from '../models/MarketplaceListing';
import Offer from '../models/Offer';
import DistributionCenter from '../models/DistributionCenter';
import ProductMaster from '../models/ProductMaster';
import { awardBid } from '../services/inventoryService';
import { executeWorkflowStage, agenda } from '../services/agendaService';
import * as emailService from '../services/emailService';

describe('Issue 02: Stage Balance Carry-Forward & Partial Awards Handling', () => {
  let supplierId: mongoose.Types.ObjectId;
  let buyer1: any;
  let buyer2: any;
  let lot1: any;
  let lot2: any;
  let opportunity1: any;
  let listing1: any;
  let offer1: any;
  let automationDoc: any;
  let sendEmailSpy: jest.SpyInstance;
  let agendaScheduleSpy: jest.SpyInstance;
  let agendaCancelSpy: jest.SpyInstance;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ind-spoiler-alert-test';
      await mongoose.connect(uri);
    }
  });

  beforeEach(async () => {
    supplierId = new mongoose.Types.ObjectId();

    sendEmailSpy = jest.spyOn(emailService, 'sendEmailHelper').mockResolvedValue({
      success: true,
      messageId: 'mock-msg-id',
      previewUrl: 'mock-url'
    });

    agendaScheduleSpy = jest.spyOn(agenda, 'schedule').mockImplementation((async (when: any, name: any, data: any) => {
      return {
        attrs: {
          _id: new mongoose.Types.ObjectId(),
          name,
          data,
          nextRunAt: when
        }
      } as any;
    }) as any);

    agendaCancelSpy = jest.spyOn(agenda, 'cancel').mockResolvedValue(1 as any);

    buyer1 = await Buyer.create({
      name: 'Stage 0 Buyer',
      companyName: 'Stage 0 Buyer Co',
      email: `stage0_buyer_${Date.now()}_${Math.random()}@test.com`,
      isActive: true,
      optInBidding: true,
      optInSales: true
    });

    buyer2 = await Buyer.create({
      name: 'Stage 1 Buyer',
      companyName: 'Stage 1 Buyer Co',
      email: `stage1_buyer_${Date.now()}_${Math.random()}@test.com`,
      isActive: true,
      optInBidding: true,
      optInSales: true
    });

    const dc = await DistributionCenter.create({
      supplierId,
      name: 'Main DC',
      code: 'DC-01',
      address: '100 Warehouse Way',
      coordinates: { lat: 40.7128, lng: -74.006 },
      coldStorage: false
    });

    const product = await ProductMaster.create({
      supplierId,
      sku: 'SKU-001',
      name: 'Test Apples',
      category: 'Produce',
      description: 'Organic Honeycrisp Apples',
      shelfLifeDays: 30
    });

    lot1 = await InventoryLot.create({
      lotNumber: `LOT-1-${Date.now()}`,
      supplierId,
      productId: product._id,
      distributionCenterId: dc._id,
      quantityCases: 100,
      availableQty: 100,
      costPerCase: 10,
      standardSellPrice: 15,
      status: 'active',
      expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });

    lot2 = await InventoryLot.create({
      lotNumber: `LOT-2-${Date.now()}`,
      supplierId,
      productId: product._id,
      distributionCenterId: dc._id,
      quantityCases: 150,
      availableQty: 150,
      costPerCase: 10,
      standardSellPrice: 15,
      status: 'active',
      expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });

    opportunity1 = await Opportunity.create({
      lotId: lot1._id,
      opportunityType: 'sell',
      priority: 'medium',
      recommendedAction: 'Sell on marketplace',
      status: 'approved'
    });

    listing1 = await MarketplaceListing.create({
      opportunityId: opportunity1._id,
      lotId: lot1._id,
      supplierId,
      title: 'Listing Lot 1',
      description: 'Listing Description',
      availableQuantity: 100,
      priceFloor: 8,
      price: 12,
      discountPercentage: 20,
      status: 'published'
    });

    offer1 = await Offer.create({
      listingId: listing1._id,
      buyerId: buyer1._id,
      price: 12,
      quantity: 40,
      status: 'pending'
    });

    automationDoc = await LiquidationAutomation.create({
      supplierId,
      name: 'Multi-Stage Liquidation Test',
      templateName: 'Standard Multi-Stage',
      isActive: true,
      stages: [
        {
          stageIndex: 0,
          targetAudience: 'direct',
          customBuyerEmails: [buyer1.email],
          discountValue: 10,
          waitHours: 24,
          waitUnit: 'hours'
        },
        {
          stageIndex: 1,
          targetAudience: 'direct',
          customBuyerEmails: [buyer2.email],
          discountValue: 20,
          waitHours: 48,
          waitUnit: 'hours'
        }
      ]
    });
  });

  afterEach(async () => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('Slice 1: Partial Bid Award & Stage Execution Balance Updates', () => {
    it('updates awardedQty on current stage execution while preserving remaining lot quantity in active evaluation pool', async () => {
      const scheduledNextStageJobId = new mongoose.Types.ObjectId().toString();

      const run = await AutomationRun.create({
        automationId: automationDoc._id,
        runType: 'manual',
        status: 'evaluating',
        evaluationEndsAt: new Date(Date.now() + 24 * 3600000),
        currentStageIndex: 0,
        snapshotInventoryIds: [lot1._id, lot2._id],
        buyerEmails: [buyer1.email],
        stageExecutions: [
          {
            stageIndex: 0,
            firedAt: new Date(),
            buyerEmails: [buyer1.email],
            agendaJobId: scheduledNextStageJobId,
            status: 'dispatched',
            lotsOffered: [
              { lotId: lot1._id, remainingQty: 100, awardedQty: 0 },
              { lotId: lot2._id, remainingQty: 150, awardedQty: 0 }
            ]
          }
        ]
      });

      // Partial award of 40 cases on lot1 (which had 100 cases)
      const result = await awardBid(lot1._id.toString(), offer1._id.toString(), undefined, undefined, 40);

      expect(result).toBeDefined();
      expect(result.availableQty).toBe(60);

      // Verify lot1 remains active with decremented availableQty
      const updatedLot1 = await InventoryLot.findById(lot1._id);
      expect(updatedLot1?.availableQty).toBe(60);
      expect(updatedLot1?.status).toBe('active');

      // Verify run updates
      const updatedRun = await AutomationRun.findById(run._id);
      expect(updatedRun?.status).toBe('partially_awarded');

      const stage0 = updatedRun?.stageExecutions?.[0];
      expect(stage0).toBeDefined();
      expect(stage0?.status).toBe('partially_awarded');

      const lot1Offered = stage0?.lotsOffered?.find((l: any) => l.lotId.toString() === lot1._id.toString());
      expect(lot1Offered?.awardedQty).toBe(40);
      expect(lot1Offered?.remainingQty).toBe(60);

      // Verify lot2 offered is unchanged
      const lot2Offered = stage0?.lotsOffered?.find((l: any) => l.lotId.toString() === lot2._id.toString());
      expect(lot2Offered?.awardedQty).toBe(0);
      expect(lot2Offered?.remainingQty).toBe(150);

      // Agenda job for next stage must remain intact since lots are still active
      expect(agendaCancelSpy).not.toHaveBeenCalled();
    });

    it('updates stage execution correctly when run is in escalating status during later stages', async () => {
      // Setup stage 1 active run
      const scheduledNextStageJobId = new mongoose.Types.ObjectId().toString();

      const run = await AutomationRun.create({
        automationId: automationDoc._id,
        runType: 'manual',
        status: 'escalating',
        evaluationEndsAt: new Date(Date.now() + 24 * 3600000),
        currentStageIndex: 1,
        snapshotInventoryIds: [lot1._id],
        buyerEmails: [buyer2.email],
        stageExecutions: [
          {
            stageIndex: 0,
            firedAt: new Date(Date.now() - 24 * 3600000),
            buyerEmails: [buyer1.email],
            status: 'expired',
            lotsOffered: [
              { lotId: lot1._id, remainingQty: 100, awardedQty: 30 }
            ]
          },
          {
            stageIndex: 1,
            firedAt: new Date(),
            buyerEmails: [buyer2.email],
            agendaJobId: scheduledNextStageJobId,
            status: 'dispatched',
            lotsOffered: [
              { lotId: lot1._id, remainingQty: 70, awardedQty: 0 }
            ]
          }
        ]
      });

      // Award 20 cases in Stage 1
      lot1.availableQty = 70;
      await lot1.save();

      const offer2 = await Offer.create({
        listingId: listing1._id,
        buyerId: buyer2._id,
        price: 11,
        quantity: 20,
        status: 'pending'
      });

      const result = await awardBid(lot1._id.toString(), offer2._id.toString(), undefined, undefined, 20);
      expect(result.availableQty).toBe(50);

      const updatedRun = await AutomationRun.findById(run._id);
      expect(updatedRun?.status).toBe('partially_awarded');

      const stage1 = updatedRun?.stageExecutions?.find((s: any) => s.stageIndex === 1);
      expect(stage1?.status).toBe('partially_awarded');
      const stage1Lot = stage1?.lotsOffered?.find((l: any) => l.lotId.toString() === lot1._id.toString());
      expect(stage1Lot?.awardedQty).toBe(20);
      expect(stage1Lot?.remainingQty).toBe(50);
    });
  });

  describe('Slice 2: Downstream Stage Balance Carry-Forward', () => {
    it('carries forward exact unawarded balance to subsequent stages in lotsOffered and email items', async () => {
      // Lot 1 has 100 cases originally. 40 cases were awarded in Stage 0.
      // Database lot1.availableQty is now 60.
      lot1.availableQty = 60;
      await lot1.save();

      const run = await AutomationRun.create({
        automationId: automationDoc._id,
        runType: 'manual',
        status: 'partially_awarded',
        currentStageIndex: 0,
        snapshotInventoryIds: [lot1._id],
        buyerEmails: [buyer1.email],
        evaluationEndsAt: new Date(Date.now() - 1000), // Stage 0 expired
        stageExecutions: [
          {
            stageIndex: 0,
            firedAt: new Date(Date.now() - 24 * 3600000),
            buyerEmails: [buyer1.email],
            status: 'partially_awarded',
            lotsOffered: [
              { lotId: lot1._id, remainingQty: 100, awardedQty: 40 }
            ]
          }
        ]
      });

      // Stage 1 executes
      await executeWorkflowStage({ runId: run._id.toString(), stageIndex: 1 });

      const updatedRun = await AutomationRun.findById(run._id);
      expect(updatedRun?.currentStageIndex).toBe(1);
      expect(updatedRun?.stageExecutions?.length).toBe(2);

      const stage1Exec = updatedRun?.stageExecutions?.[1];
      expect(stage1Exec).toBeDefined();
      expect(stage1Exec?.stageIndex).toBe(1);
      expect(stage1Exec?.status).toBe('dispatched');

      // lot1 offered in Stage 1 MUST have remainingQty = 60 and awardedQty = 0
      const lot1OfferedStage1 = stage1Exec?.lotsOffered?.find((l: any) => l.lotId.toString() === lot1._id.toString());
      expect(lot1OfferedStage1).toBeDefined();
      expect(lot1OfferedStage1?.remainingQty).toBe(60);
      expect(lot1OfferedStage1?.awardedQty).toBe(0);

      // Verify email dispatch received exact carry-forward quantity (60 cases)
      expect(sendEmailSpy).toHaveBeenCalled();
      const lastCall = sendEmailSpy.mock.calls[sendEmailSpy.mock.calls.length - 1];
      const sentTo = lastCall[0];
      const htmlBody = lastCall[2];

      expect(sentTo).toBe(buyer2.email);
      // HTML body contains total cases and table with 60 cases
      expect(htmlBody).toContain('60');
      expect(htmlBody).not.toContain('100 cases');
    });

    it('filters out lots whose balance has reached 0 when subsequent stages execute', async () => {
      // Lot 1 fully awarded in Stage 0 (availableQty = 0, awardedQty = 100).
      // Lot 2 partially awarded (availableQty = 90, awardedQty = 60 out of 150).
      lot1.availableQty = 0;
      lot1.status = 'sold';
      await lot1.save();

      lot2.availableQty = 90;
      await lot2.save();

      const run = await AutomationRun.create({
        automationId: automationDoc._id,
        runType: 'manual',
        status: 'partially_awarded',
        currentStageIndex: 0,
        snapshotInventoryIds: [lot1._id, lot2._id],
        buyerEmails: [buyer1.email],
        evaluationEndsAt: new Date(Date.now() - 1000),
        stageExecutions: [
          {
            stageIndex: 0,
            firedAt: new Date(Date.now() - 24 * 3600000),
            buyerEmails: [buyer1.email],
            status: 'partially_awarded',
            lotsOffered: [
              { lotId: lot1._id, remainingQty: 100, awardedQty: 100 },
              { lotId: lot2._id, remainingQty: 150, awardedQty: 60 }
            ]
          }
        ]
      });

      await executeWorkflowStage({ runId: run._id.toString(), stageIndex: 1 });

      const updatedRun = await AutomationRun.findById(run._id);
      const stage1Exec = updatedRun?.stageExecutions?.[1];
      expect(stage1Exec).toBeDefined();

      // Only lot2 should be offered in Stage 1 with remainingQty = 90
      expect(stage1Exec?.lotsOffered?.length).toBe(1);
      expect(stage1Exec?.lotsOffered?.[0].lotId.toString()).toBe(lot2._id.toString());
      expect(stage1Exec?.lotsOffered?.[0].remainingQty).toBe(90);
    });
  });

  describe('Slice 3: Full Award Cascade Termination & Multi-Stage Execution', () => {
    it('aborts downstream stages and marks run status as awarded when all cases are awarded cumulatively', async () => {
      const scheduledNextStageJobId = new mongoose.Types.ObjectId().toString();

      // Lot 1 initially had 100 cases. 40 was awarded in Stage 0.
      // Stage 1 is currently active with remaining 60 cases.
      lot1.availableQty = 60;
      await lot1.save();

      const run = await AutomationRun.create({
        automationId: automationDoc._id,
        runType: 'manual',
        status: 'escalating',
        currentStageIndex: 1,
        snapshotInventoryIds: [lot1._id],
        buyerEmails: [buyer2.email],
        evaluationEndsAt: new Date(Date.now() + 24 * 3600000),
        stageExecutions: [
          {
            stageIndex: 0,
            firedAt: new Date(Date.now() - 24 * 3600000),
            buyerEmails: [buyer1.email],
            status: 'partially_awarded',
            lotsOffered: [
              { lotId: lot1._id, remainingQty: 100, awardedQty: 40 }
            ]
          },
          {
            stageIndex: 1,
            firedAt: new Date(),
            buyerEmails: [buyer2.email],
            agendaJobId: scheduledNextStageJobId,
            status: 'dispatched',
            lotsOffered: [
              { lotId: lot1._id, remainingQty: 60, awardedQty: 0 }
            ]
          }
        ]
      });

      // Buyer 2 bids on the remaining 60 cases and is awarded
      const finalOffer = await Offer.create({
        listingId: listing1._id,
        buyerId: buyer2._id,
        price: 10,
        quantity: 60,
        status: 'pending'
      });

      const result = await awardBid(lot1._id.toString(), finalOffer._id.toString(), undefined, undefined, 60);
      expect(result.availableQty).toBe(0);

      const updatedLot1 = await InventoryLot.findById(lot1._id);
      expect(updatedLot1?.availableQty).toBe(0);
      expect(updatedLot1?.status).toBe('sold');

      const updatedRun = await AutomationRun.findById(run._id);
      expect(updatedRun?.status).toBe('awarded');

      const stage1 = updatedRun?.stageExecutions?.find((s: any) => s.stageIndex === 1);
      expect(stage1?.status).toBe('awarded');
      const stage1Lot = stage1?.lotsOffered?.find((l: any) => l.lotId.toString() === lot1._id.toString());
      expect(stage1Lot?.awardedQty).toBe(60);
      expect(stage1Lot?.remainingQty).toBe(0);

      // Verify next-stage job was cancelled
      expect(agendaCancelSpy).toHaveBeenCalledWith({ _id: new mongoose.Types.ObjectId(scheduledNextStageJobId) });
    });

    it('gracefully aborts and does not dispatch emails if executeWorkflowStage is triggered when remaining pool is empty', async () => {
      lot1.availableQty = 0;
      lot1.status = 'sold';
      await lot1.save();

      const run = await AutomationRun.create({
        automationId: automationDoc._id,
        runType: 'manual',
        status: 'partially_awarded',
        currentStageIndex: 0,
        snapshotInventoryIds: [lot1._id],
        buyerEmails: [buyer1.email],
        evaluationEndsAt: new Date(Date.now() - 1000),
        stageExecutions: [
          {
            stageIndex: 0,
            firedAt: new Date(Date.now() - 24 * 3600000),
            buyerEmails: [buyer1.email],
            status: 'awarded',
            lotsOffered: [
              { lotId: lot1._id, remainingQty: 100, awardedQty: 100 }
            ]
          }
        ]
      });

      sendEmailSpy.mockClear();

      await executeWorkflowStage({ runId: run._id.toString(), stageIndex: 1 });

      const updatedRun = await AutomationRun.findById(run._id);
      expect(updatedRun?.status).toBe('awarded');
      // No stage 1 execution added, no emails dispatched
      expect(updatedRun?.stageExecutions?.length).toBe(1);
      expect(sendEmailSpy).not.toHaveBeenCalled();
    });
  });
});
