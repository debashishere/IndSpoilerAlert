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
import { agenda, checkBidAgainstActiveWorkflows } from '../services/agendaService';
import * as emailService from '../services/emailService';

describe('Issue 05: Partial Award + Next-Stage Job Cancellation in awardBid()', () => {
  let supplierId: mongoose.Types.ObjectId;
  let buyer: any;
  let lot1: any;
  let lot2: any;
  let opportunity1: any;
  let listing1: any;
  let offer1: any;
  let automationDoc: any;
  let sendEmailSpy: jest.SpyInstance;
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

    agendaCancelSpy = jest.spyOn(agenda, 'cancel').mockResolvedValue(1 as any);

    buyer = await Buyer.create({
      name: 'Test Buyer',
      companyName: 'Test Buyer Co',
      email: `buyer_${Date.now()}_${Math.random()}@test.com`,
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
      name: 'Test Item',
      category: 'Perishable',
      description: 'Test Item',
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
      supplierId,
      title: 'Listing Lot 1',
      description: 'Listing Description',
      availableQuantity: 100,
      priceFloor: 8,
      status: 'published'
    });

    offer1 = await Offer.create({
      listingId: listing1._id,
      buyerId: buyer._id,
      quantity: 100,
      price: 9,
      status: 'pending'
    });

    automationDoc = await LiquidationAutomation.create({
      name: 'Multi-Stage Automation',
      templateName: 'Standard Multi-Stage',
      supplierId,
      triggerType: 'rsl_threshold',
      rslThresholdDays: 30,
      stages: [
        { stageIndex: 0, buyerListId: new mongoose.Types.ObjectId(), stageType: 'marketplace', timeLimitHours: 24 },
        { stageIndex: 1, buyerListId: new mongoose.Types.ObjectId(), stageType: 'marketplace', timeLimitHours: 48 }
      ],
      rules: {
        minimumBidFloorPrice: 8,
        onSuccess: 'auto_award'
      },
      stats: { totalRuns: 0, totalAwarded: 0 }
    });
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await AutomationRun.deleteMany({});
    await LiquidationAutomation.deleteMany({});
    await InventoryLot.deleteMany({});
    await Opportunity.deleteMany({});
    await MarketplaceListing.deleteMany({});
    await Offer.deleteMany({});
    await Buyer.deleteMany({});
    await DistributionCenter.deleteMany({});
    await ProductMaster.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('Slice 1: Partial Award in awardBid()', () => {
    it('updates lotsOffered on active stageExecution, sets run.status = "partially_awarded", and leaves next-stage job intact when unsold lots remain', async () => {
      const mockAgendaJobId = new mongoose.Types.ObjectId().toString();

      const run = await AutomationRun.create({
        automationId: automationDoc._id,
        runType: 'scheduled',
        status: 'evaluating',
        currentStageIndex: 0,
        snapshotInventoryIds: [lot1._id, lot2._id],
        evaluatedBuyerIds: [buyer._id],
        dispatchedAt: new Date(),
        evaluationEndsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        stageExecutions: [
          {
            stageIndex: 0,
            firedAt: new Date(),
            buyerEmails: [buyer.email],
            agendaJobId: mockAgendaJobId,
            status: 'dispatched',
            lotsOffered: [
              { lotId: lot1._id, remainingQty: 100, awardedQty: 0 },
              { lotId: lot2._id, remainingQty: 150, awardedQty: 0 }
            ]
          }
        ]
      });

      // Award lot1 fully (100 units), leaving lot2 (150 units) unsold
      const result = await awardBid(lot1._id.toString(), offer1._id.toString(), 'Congrats on winning Lot 1!', 'Lot 1 Awarded', 100);

      expect(result).toBeDefined();
      expect(result.offer.status).toBe('fully_accepted');

      const updatedRun = await AutomationRun.findById(run._id);
      expect(updatedRun).toBeDefined();
      expect(updatedRun!.status).toBe('partially_awarded');

      const stage0 = updatedRun!.stageExecutions?.[0];
      expect(stage0).toBeDefined();
      expect(stage0!.status).toBe('partially_awarded');

      const lot1Offered = stage0!.lotsOffered?.find((l: any) => l.lotId.toString() === lot1._id.toString());
      expect(lot1Offered).toBeDefined();
      expect(lot1Offered!.awardedQty).toBe(100);
      expect(lot1Offered!.remainingQty).toBe(0);

      const lot2Offered = stage0!.lotsOffered?.find((l: any) => l.lotId.toString() === lot2._id.toString());
      expect(lot2Offered).toBeDefined();
      expect(lot2Offered!.remainingQty).toBe(150);

      // Verify next-stage job was NOT cancelled
      expect(agendaCancelSpy).not.toHaveBeenCalled();
    });
  });

  describe('Slice 2: Full Award in awardBid() & Job Cancellation', () => {
    it('sets run.status = "awarded", stage status = "awarded", cancels scheduled agendaJobId, and updates automation stats when all lots are awarded', async () => {
      const mockAgendaJobId = new mongoose.Types.ObjectId().toString();

      const run = await AutomationRun.create({
        automationId: automationDoc._id,
        runType: 'scheduled',
        status: 'evaluating',
        currentStageIndex: 0,
        snapshotInventoryIds: [lot1._id], // Only lot1 in this workflow
        evaluatedBuyerIds: [buyer._id],
        dispatchedAt: new Date(),
        evaluationEndsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        stageExecutions: [
          {
            stageIndex: 0,
            firedAt: new Date(),
            buyerEmails: [buyer.email],
            agendaJobId: mockAgendaJobId,
            status: 'dispatched',
            lotsOffered: [
              { lotId: lot1._id, remainingQty: 100, awardedQty: 0 }
            ]
          }
        ]
      });

      const result = await awardBid(lot1._id.toString(), offer1._id.toString(), 'Congrats on winning!', 'Lot 1 Awarded', 100);

      expect(result).toBeDefined();
      expect(result.offer.status).toBe('fully_accepted');

      const updatedRun = await AutomationRun.findById(run._id);
      expect(updatedRun).toBeDefined();
      expect(updatedRun!.status).toBe('awarded');

      const stage0 = updatedRun!.stageExecutions?.[0];
      expect(stage0).toBeDefined();
      expect(stage0!.status).toBe('awarded');

      const lot1Offered = stage0!.lotsOffered?.find((l: any) => l.lotId.toString() === lot1._id.toString());
      expect(lot1Offered).toBeDefined();
      expect(lot1Offered!.awardedQty).toBe(100);
      expect(lot1Offered!.remainingQty).toBe(0);

      // Verify next-stage Agenda job was cancelled
      expect(agendaCancelSpy).toHaveBeenCalledWith({
        _id: new mongoose.Types.ObjectId(mockAgendaJobId)
      });

      // Verify resolution was recorded
      expect(updatedRun!.resolution).toBeDefined();
      expect(updatedRun!.resolution?.action).toBe('auto_award');
      expect(updatedRun!.resolution?.winningOfferId?.toString()).toBe(offer1._id.toString());
      expect(updatedRun!.resolution?.targetBuyerId?.toString()).toBe(buyer._id.toString());

      // Verify automation stats incremented
      const updatedAutomation = await LiquidationAutomation.findById(automationDoc._id);
      expect(updatedAutomation?.stats?.totalAwarded).toBe(1);
    });
  });

  describe('Slice 3: Auto-award Path via checkBidAgainstActiveWorkflows()', () => {
    it('triggers auto-award on floor price match, correctly setting partially_awarded when other lots remain', async () => {
      const mockAgendaJobId = new mongoose.Types.ObjectId().toString();

      const run = await AutomationRun.create({
        automationId: automationDoc._id,
        runType: 'scheduled',
        status: 'evaluating',
        currentStageIndex: 0,
        snapshotInventoryIds: [lot1._id, lot2._id],
        evaluatedBuyerIds: [buyer._id],
        dispatchedAt: new Date(),
        evaluationEndsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        stageExecutions: [
          {
            stageIndex: 0,
            firedAt: new Date(),
            buyerEmails: [buyer.email],
            agendaJobId: mockAgendaJobId,
            status: 'dispatched',
            lotsOffered: [
              { lotId: lot1._id, remainingQty: 100, awardedQty: 0 },
              { lotId: lot2._id, remainingQty: 150, awardedQty: 0 }
            ]
          }
        ]
      });

      // Offer meets floor price ($9 >= $8 floor price)
      await checkBidAgainstActiveWorkflows(lot1, offer1, listing1);

      const updatedRun = await AutomationRun.findById(run._id);
      expect(updatedRun).toBeDefined();
      expect(updatedRun!.status).toBe('partially_awarded');

      const stage0 = updatedRun!.stageExecutions?.[0];
      expect(stage0).toBeDefined();
      expect(stage0!.status).toBe('partially_awarded');

      const lot1Offered = stage0!.lotsOffered?.find((l: any) => l.lotId.toString() === lot1._id.toString());
      expect(lot1Offered).toBeDefined();
      expect(lot1Offered!.awardedQty).toBe(100);
      expect(lot1Offered!.remainingQty).toBe(0);

      // Verify next-stage job was NOT cancelled
      expect(agendaCancelSpy).not.toHaveBeenCalled();
    });

    it('triggers auto-award on floor price match, setting awarded and cancelling agendaJobId when all lots are awarded', async () => {
      const mockAgendaJobId = new mongoose.Types.ObjectId().toString();

      const run = await AutomationRun.create({
        automationId: automationDoc._id,
        runType: 'scheduled',
        status: 'evaluating',
        currentStageIndex: 0,
        snapshotInventoryIds: [lot1._id],
        evaluatedBuyerIds: [buyer._id],
        dispatchedAt: new Date(),
        evaluationEndsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        stageExecutions: [
          {
            stageIndex: 0,
            firedAt: new Date(),
            buyerEmails: [buyer.email],
            agendaJobId: mockAgendaJobId,
            status: 'dispatched',
            lotsOffered: [
              { lotId: lot1._id, remainingQty: 100, awardedQty: 0 }
            ]
          }
        ]
      });

      // Offer meets floor price ($9 >= $8 floor price)
      await checkBidAgainstActiveWorkflows(lot1, offer1, listing1);

      const updatedRun = await AutomationRun.findById(run._id);
      expect(updatedRun).toBeDefined();
      expect(updatedRun!.status).toBe('awarded');

      const stage0 = updatedRun!.stageExecutions?.[0];
      expect(stage0).toBeDefined();
      expect(stage0!.status).toBe('awarded');

      // Verify next-stage Agenda job was cancelled
      expect(agendaCancelSpy).toHaveBeenCalledWith({
        _id: new mongoose.Types.ObjectId(mockAgendaJobId)
      });
    });
  });
});


