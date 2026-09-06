import request from 'supertest';
import mongoose from 'mongoose';
import app from '../index';
import Supplier from '../models/Supplier';
import Buyer from '../models/Buyer';
import BuyerList from '../models/BuyerList';
import ProductMaster from '../models/ProductMaster';
import InventoryLot from '../models/InventoryLot';
import DistributionCenter from '../models/DistributionCenter';
import MarketplaceListing from '../models/MarketplaceListing';
import LiquidationAutomation from '../models/LiquidationAutomation';
import AutomationRun from '../models/AutomationRun';
import QuickBidToken from '../models/QuickBidToken';
import Opportunity from '../models/Opportunity';
import Offer from '../models/Offer';
import ComplianceDocument from '../models/ComplianceDocument';
import { awardBid } from '../services/inventoryService';
import { createAutomationRun, executeWorkflowStage, executeWorkflowFallback, agenda } from '../services/agendaService';
import * as emailService from '../services/emailService';

describe('Issue 05: End-to-End Test Suite & Policy Verification', () => {
  let supplier: any;
  let dc: any;
  let buyer1: any;
  let buyer2: any;
  let buyerList1: any;
  let product1: any;
  let lot1: any;
  let lot2: any;
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
    await Supplier.deleteMany({});
    await DistributionCenter.deleteMany({});
    await Buyer.deleteMany({});
    await BuyerList.deleteMany({});
    await ProductMaster.deleteMany({});
    await InventoryLot.deleteMany({});
    await MarketplaceListing.deleteMany({});
    await LiquidationAutomation.deleteMany({});
    await AutomationRun.deleteMany({});
    await QuickBidToken.deleteMany({});
    await Opportunity.deleteMany({});
    await Offer.deleteMany({});
    await ComplianceDocument.deleteMany({});

    sendEmailSpy = jest.spyOn(emailService, 'sendEmailHelper').mockResolvedValue({
      success: true,
      messageId: 'mock-e2e-msg',
      previewUrl: 'mock-preview-url'
    } as any);

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

    supplier = await Supplier.create({
      name: 'E2E Exclusivity Supplier',
      companyCode: 'E2E01'
    });

    dc = await DistributionCenter.create({
      supplierId: supplier._id,
      name: 'Central Logistics Hub',
      code: 'DC-E2E-01',
      address: '500 Commerce Way, Chicago, IL',
      coordinates: { lat: 41.8781, lng: -87.6298 },
      coldStorage: true
    });

    buyer1 = await Buyer.create({
      name: 'E2E Wholesaler 1',
      companyName: 'Wholesale Tier 1 Corp',
      email: 'wholesaler1@e2etest.com',
      isActive: true,
      optInBidding: true
    });

    buyer2 = await Buyer.create({
      name: 'E2E Liquidator 2',
      companyName: 'Liquidators Tier 2 LLC',
      email: 'liquidator2@e2etest.com',
      isActive: true,
      optInBidding: true
    });

    buyerList1 = await BuyerList.create({
      name: 'Private Wholesalers Tier',
      supplierId: supplier._id,
      buyerIds: [buyer1._id]
    });

    product1 = await ProductMaster.create({
      supplierId: supplier._id,
      sku: 'SKU-E2E-001',
      description: 'E2E Premium Organic Blueberries',
      category: 'Produce',
      standardPricePerUnit: 25.00
    });

    lot1 = await InventoryLot.create({
      supplierId: supplier._id,
      distributionCenterId: dc._id,
      productId: product1._id,
      lotNumber: 'LOT-E2E-101',
      expirationDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      quantityCases: 400,
      availableQty: 400,
      costPerCase: 12.00,
      standardSellPrice: 25.00,
      remainingShelfLife: 0.30,
      status: 'active'
    });

    lot2 = await InventoryLot.create({
      supplierId: supplier._id,
      distributionCenterId: dc._id,
      productId: product1._id,
      lotNumber: 'LOT-E2E-102',
      expirationDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
      quantityCases: 250,
      availableQty: 250,
      costPerCase: 12.00,
      standardSellPrice: 25.00,
      remainingShelfLife: 0.35,
      status: 'active'
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await Supplier.deleteMany({});
    await DistributionCenter.deleteMany({});
    await Buyer.deleteMany({});
    await BuyerList.deleteMany({});
    await ProductMaster.deleteMany({});
    await InventoryLot.deleteMany({});
    await MarketplaceListing.deleteMany({});
    await LiquidationAutomation.deleteMany({});
    await AutomationRun.deleteMany({});
    await QuickBidToken.deleteMany({});
    await Opportunity.deleteMany({});
    await Offer.deleteMany({});
    await ComplianceDocument.deleteMany({});
    await mongoose.connection.close();
  });

  describe('Slice 1: Private Stage Buyer Resolution & Public Marketplace Isolation', () => {
    it('creates 0 MarketplaceListing records during private stage executions and keeps public marketplace search empty', async () => {
      const automation = await LiquidationAutomation.create({
        supplierId: supplier._id,
        name: 'Private Wholesaler Workflow',
        templateName: 'smart_bidding_auction',
        isActive: true,
        triggerType: 'schedule',
        stages: [
          {
            stageIndex: 0,
            name: 'Stage 1: Private Wholesalers',
            targetType: 'buyer_list',
            buyerListId: buyerList1._id,
            discountValue: 15,
            waitHours: 24,
            waitUnit: 'hours',
            stageType: 'liquidation'
          },
          {
            stageIndex: 1,
            name: 'Stage 2: Custom Liquidators',
            targetType: 'custom_buyers',
            customBuyerEmails: [buyer2.email],
            discountValue: 30,
            waitHours: 24,
            waitUnit: 'hours',
            stageType: 'liquidation'
          }
        ]
      });

      const populatedLot1 = await InventoryLot.findById(lot1._id).populate('productId');
      const populatedLot2 = await InventoryLot.findById(lot2._id).populate('productId');

      // Step 1: Create Automation Run for private stage
      const run = await createAutomationRun(automation, [populatedLot1, populatedLot2], 'manual');

      expect(run).toBeDefined();
      expect(run.status).toBe('evaluating');
      expect(run.currentStageIndex).toBe(0);

      // Verify zero MarketplaceListings exist
      const listingsStage0 = await MarketplaceListing.find({});
      expect(listingsStage0.length).toBe(0);

      // Verify GET /api/v1/marketplace/listings endpoint returns 0 results
      const resStage0 = await request(app).get('/api/v1/marketplace/listings');
      expect(resStage0.status).toBe(200);
      expect(resStage0.body.listings.length).toBe(0);

      // Step 2: Advance to Stage 2 (Custom Liquidators)
      await executeWorkflowStage({ runId: run._id.toString(), stageIndex: 1 });

      const updatedRun = await AutomationRun.findById(run._id);
      expect(updatedRun?.currentStageIndex).toBe(1);

      // Verify still zero MarketplaceListings exist
      const listingsStage1 = await MarketplaceListing.find({});
      expect(listingsStage1.length).toBe(0);

      const resStage1 = await request(app).get('/api/v1/marketplace/listings');
      expect(resStage1.status).toBe(200);
      expect(resStage1.body.listings.length).toBe(0);
    });
  });

  describe('Slice 2: Partial Quantity Award & Downstream Lot Balance Carry-Forward', () => {
    it('accurately updates stage balance on partial award, carries forward balance to Stage 1, and terminates cleanly when 100% awarded', async () => {
      const scheduledJobId = new mongoose.Types.ObjectId().toString();

      const automation = await LiquidationAutomation.create({
        supplierId: supplier._id,
        name: 'Multi-Stage Partial Award Workflow',
        templateName: 'smart_bidding_auction',
        isActive: true,
        stages: [
          {
            stageIndex: 0,
            name: 'Stage 1: Wholesalers',
            targetType: 'buyer_list',
            buyerListId: buyerList1._id,
            discountValue: 10,
            waitHours: 24,
            stageType: 'liquidation'
          },
          {
            stageIndex: 1,
            name: 'Stage 2: Secondary Liquidators',
            targetType: 'custom_buyers',
            customBuyerEmails: [buyer2.email],
            discountValue: 25,
            waitHours: 48,
            stageType: 'liquidation'
          }
        ]
      });

      // Run starts with lot1 (400 cases) and lot2 (250 cases)
      const run = await AutomationRun.create({
        automationId: automation._id,
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
            agendaJobId: scheduledJobId,
            status: 'dispatched',
            lotsOffered: [
              { lotId: lot1._id, remainingQty: 400, awardedQty: 0 },
              { lotId: lot2._id, remainingQty: 250, awardedQty: 0 }
            ]
          }
        ]
      });

      // Create opportunity & marketplace listing & offer for bidding award
      const opp1 = await Opportunity.create({
        lotId: lot1._id,
        opportunityType: 'sell',
        priority: 'medium',
        recommendedAction: 'Sell',
        status: 'approved'
      });

      const listing1 = await MarketplaceListing.create({
        opportunityId: opp1._id,
        lotId: lot1._id,
        supplierId: supplier._id,
        title: 'Listing Lot 1',
        description: 'Listing Lot 1',
        availableQuantity: 400,
        priceFloor: 15,
        price: 22,
        status: 'published'
      });

      const offer1 = await Offer.create({
        listingId: listing1._id,
        buyerId: buyer1._id,
        price: 22,
        quantity: 150,
        status: 'pending'
      });

      // 1. Partial award of 150 cases out of 400 on Lot 1
      const awardResult = await awardBid(lot1._id.toString(), offer1._id.toString(), undefined, undefined, 150);
      expect(awardResult.availableQty).toBe(250);

      // Verify lot1 document in database
      const dbLot1 = await InventoryLot.findById(lot1._id);
      expect(dbLot1?.availableQty).toBe(250);
      expect(dbLot1?.status).toBe('active');

      // Verify AutomationRun state
      const runAfterPartial = await AutomationRun.findById(run._id);
      expect(runAfterPartial?.status).toBe('partially_awarded');
      const stage0Exec = runAfterPartial?.stageExecutions?.[0];
      expect(stage0Exec?.status).toBe('partially_awarded');
      const lot1OfferedStage0 = stage0Exec?.lotsOffered?.find((l: any) => l.lotId.toString() === lot1._id.toString());
      expect(lot1OfferedStage0?.awardedQty).toBe(150);
      expect(lot1OfferedStage0?.remainingQty).toBe(250);

      // 2. Stage 0 expires, execute Stage 1
      sendEmailSpy.mockClear();
      await executeWorkflowStage({ runId: run._id.toString(), stageIndex: 1 });

      const runAfterStage1 = await AutomationRun.findById(run._id);
      expect(runAfterStage1?.currentStageIndex).toBe(1);
      expect(runAfterStage1?.stageExecutions?.length).toBe(2);

      const stage1Exec = runAfterStage1?.stageExecutions?.[1];
      expect(stage1Exec?.stageIndex).toBe(1);
      expect(stage1Exec?.status).toBe('dispatched');

      // lot1 offered in Stage 1 must have remainingQty = 250, awardedQty = 0
      const lot1OfferedStage1 = stage1Exec?.lotsOffered?.find((l: any) => l.lotId.toString() === lot1._id.toString());
      expect(lot1OfferedStage1?.remainingQty).toBe(250);
      expect(lot1OfferedStage1?.awardedQty).toBe(0);

      // lot2 offered in Stage 1 must have remainingQty = 250, awardedQty = 0
      const lot2OfferedStage1 = stage1Exec?.lotsOffered?.find((l: any) => l.lotId.toString() === lot2._id.toString());
      expect(lot2OfferedStage1?.remainingQty).toBe(250);
      expect(lot2OfferedStage1?.awardedQty).toBe(0);

      // 3. Award remaining 250 cases on lot1 and 250 cases on lot2
      const offerLot1Final = await Offer.create({
        listingId: listing1._id,
        buyerId: buyer2._id,
        price: 20,
        quantity: 250,
        status: 'pending'
      });

      await awardBid(lot1._id.toString(), offerLot1Final._id.toString(), undefined, undefined, 250);

      const opp2 = await Opportunity.create({
        lotId: lot2._id,
        opportunityType: 'sell',
        priority: 'medium',
        recommendedAction: 'Sell',
        status: 'approved'
      });

      const listing2 = await MarketplaceListing.create({
        opportunityId: opp2._id,
        lotId: lot2._id,
        supplierId: supplier._id,
        title: 'Listing Lot 2',
        description: 'Listing Lot 2',
        availableQuantity: 250,
        priceFloor: 15,
        price: 20,
        status: 'published'
      });

      const offerLot2Final = await Offer.create({
        listingId: listing2._id,
        buyerId: buyer2._id,
        price: 20,
        quantity: 250,
        status: 'pending'
      });

      await awardBid(lot2._id.toString(), offerLot2Final._id.toString(), undefined, undefined, 250);

      // Verify both lots are now sold
      const soldLot1 = await InventoryLot.findById(lot1._id);
      const soldLot2 = await InventoryLot.findById(lot2._id);
      expect(soldLot1?.availableQty).toBe(0);
      expect(soldLot1?.status).toBe('sold');
      expect(soldLot2?.availableQty).toBe(0);
      expect(soldLot2?.status).toBe('sold');

      // Verify run status transitioned to 'awarded'
      const finalRun = await AutomationRun.findById(run._id);
      expect(finalRun?.status).toBe('awarded');
    });
  });

  describe('Slice 3: Compliance Hold Gate & Marketplace Broadcast Fallback', () => {
    it('publishes compliant lots to marketplace while gating unverified FDA lots under compliance_hold during marketplace fallback', async () => {
      // Lot 1 is FDA-regulated and lacks verified COA
      const doc1 = await ComplianceDocument.create({
        lotId: lot1._id,
        docType: 'COA',
        s3Url: 'https://example.com/coa1.pdf',
        verified: false
      });
      lot1.fdaRegulated = true;
      lot1.complianceDocs = [doc1._id];
      await lot1.save();

      // Lot 2 is non-FDA regulated (compliant for marketplace listing)
      lot2.fdaRegulated = false;
      lot2.complianceDocs = [];
      await lot2.save();

      const automation = await LiquidationAutomation.create({
        supplierId: supplier._id,
        name: 'Marketplace Fallback Workflow',
        templateName: 'smart_bidding_auction',
        isActive: true,
        rules: {
          onFallback: 'marketplace_broadcast'
        },
        stages: [
          {
            stageIndex: 0,
            name: 'Stage 1: Private Tier',
            targetType: 'buyer_list',
            buyerListId: buyerList1._id,
            discountValue: 10,
            waitHours: 12,
            stageType: 'liquidation'
          }
        ]
      });

      const populatedLot1 = await InventoryLot.findById(lot1._id).populate('productId');
      const populatedLot2 = await InventoryLot.findById(lot2._id).populate('productId');

      const run = await createAutomationRun(automation, [populatedLot1, populatedLot2], 'manual');
      expect(run.status).toBe('evaluating');

      // Execute marketplace fallback
      await executeWorkflowFallback({ runId: run._id.toString() });

      const updatedRun = await AutomationRun.findById(run._id);
      expect(updatedRun?.status).toBe('fallback_executed');
      expect(updatedRun?.resolution?.action).toBe('marketplace_broadcast');

      // Verify compliant Lot 2 published to marketplace
      const lot2Listing = await MarketplaceListing.findOne({ lotId: lot2._id });
      expect(lot2Listing).toBeDefined();
      expect(lot2Listing?.status).toBe('published');
      expect(lot2Listing?.availableQuantity).toBe(250);

      // Verify unverified Lot 1 was NOT published to marketplace
      const lot1Listing = await MarketplaceListing.findOne({ lotId: lot1._id });
      expect(lot1Listing).toBeNull();

      // Verify resolution details on AutomationRun
      const listingIds = (updatedRun?.resolution as any)?.listingIds?.map((id: any) => id.toString());
      const complianceHoldLots = (updatedRun?.resolution as any)?.complianceHoldLotIds?.map((id: any) => id.toString());

      expect(listingIds).toContain(lot2Listing?._id.toString());
      expect(complianceHoldLots).toContain(lot1._id.toString());
    });
  });
});
