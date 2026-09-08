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
import { createAutomationRun, executeWorkflowStage } from '../services/agendaService';
import * as emailService from '../services/emailService';

describe('Issue 01: Private Stage Exclusivity Enforcement & Quick Bid Routing', () => {
  let supplier: any;
  let dc: any;
  let buyer1: any;
  let buyerList1: any;
  let product1: any;
  let lot1: any;
  let sendEmailSpy: jest.SpyInstance | null = null;

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

    supplier = await Supplier.create({
      name: 'Exclusivity Farms Co',
      companyCode: 'EFC1'
    });

    dc = await DistributionCenter.create({
      supplierId: supplier._id,
      name: 'Midwest DC',
      code: 'DC-MW-01',
      address: '123 Main St, Chicago, IL',
      coordinates: { lat: 41.8781, lng: -87.6298 },
      coldStorage: true
    });

    buyer1 = await Buyer.create({
      name: 'Private Wholesaler',
      companyName: 'Private Wholesalers Inc',
      email: 'private_buyer@wholesaler.com',
      isActive: true,
      optInBidding: true
    });

    buyerList1 = await BuyerList.create({
      name: 'Private Tier 1 Wholesalers',
      supplierId: supplier._id,
      buyerIds: [buyer1._id]
    });

    product1 = await ProductMaster.create({
      supplierId: supplier._id,
      sku: 'SKU-PRIV-01',
      description: 'Exclusive Premium Strawberries 1lb',
      category: 'Produce',
      standardPricePerUnit: 20.00
    });

    lot1 = await InventoryLot.create({
      supplierId: supplier._id,
      distributionCenterId: dc._id,
      productId: product1._id,
      lotNumber: 'LOT-PRIV-99',
      expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      quantityCases: 500,
      availableQty: 500,
      costPerCase: 10.00,
      standardSellPrice: 20.00,
      remainingShelfLife: 0.25,
      status: 'active'
    });

    sendEmailSpy = jest.spyOn(emailService, 'sendEmailHelper').mockResolvedValue(true as any);
  });

  afterEach(() => {
    if (sendEmailSpy) {
      sendEmailSpy.mockRestore();
    }
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
    await mongoose.connection.close();
  });

  describe('Seam 1: Private Stage Exclusivity & Public Marketplace Isolation', () => {
    it('does NOT create or activate public MarketplaceListing records when a private stage executes', async () => {
      const automation = await LiquidationAutomation.create({
        supplierId: supplier._id,
        name: 'Private Tier Escalation Workflow',
        templateName: 'smart_bidding_auction',
        isActive: true,
        triggerType: 'schedule',
        stages: [
          {
            stageIndex: 0,
            name: 'Stage 1: Private Wholesalers',
            targetType: 'buyer_list',
            buyerListId: buyerList1._id,
            discountValue: 20,
            waitHours: 24,
            waitUnit: 'hours',
            stageType: 'liquidation'
          }
        ]
      });

      const populatedLot = await InventoryLot.findById(lot1._id).populate('productId');
      const run = await createAutomationRun(automation, [populatedLot], 'manual');

      expect(run).toBeDefined();
      expect(run.status).toBe('evaluating');

      // Verify no published MarketplaceListing was created
      const listings = await MarketplaceListing.find({
        $or: [
          { lotId: lot1._id },
          { supplierId: supplier._id }
        ]
      });
      expect(listings.length).toBe(0);

      // Verify public marketplace listings endpoint returns 0 results
      const res = await request(app).get('/api/v1/marketplace/listings');
      expect(res.status).toBe(200);
      expect(res.body.listings.length).toBe(0);
    });
  });

  describe('Seam 2: Secure Tokenized Quick Bid Generation in Direct Emails', () => {
    it('dispatches emails containing secure, tokenized {{quick_bid_link}} tailored to the run and recipient', async () => {
      const automation = await LiquidationAutomation.create({
        supplierId: supplier._id,
        name: 'Tokenized Workflow Run',
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
            waitHours: 12,
            waitUnit: 'hours',
            stageType: 'liquidation'
          }
        ]
      });

      const populatedLot = await InventoryLot.findById(lot1._id).populate('productId');
      const run = await createAutomationRun(automation, [populatedLot], 'manual');

      expect(sendEmailSpy).toHaveBeenCalled();
      const lastCall = sendEmailSpy!.mock.calls[0];
      const dispatchedTo = lastCall[0];
      const emailHtml = lastCall[2];

      expect(dispatchedTo).toBe(buyer1.email);
      expect(emailHtml).toContain('token=');

      // Extract token from email
      const tokenMatch = emailHtml.match(/token=([a-zA-Z0-9._-]+)/);
      expect(tokenMatch).not.toBeNull();
      const token = tokenMatch![1];

      // Check QuickBidToken document in database
      const tokenDoc = await QuickBidToken.findOne({ token });
      expect(tokenDoc).toBeDefined();
      expect(tokenDoc?.buyerEmail).toBe(buyer1.email);
      expect(tokenDoc?.runId?.toString()).toBe(run._id.toString());
      expect(tokenDoc?.stageIndex).toBe(0);
      expect(tokenDoc?.isUsed).toBe(false);
    });
  });

  describe('Seam 3: Scoped Quick Bid Resolution & Submission Routing', () => {
    it('resolves token info and scopes submitted bids strictly to the originating workflow run and stage', async () => {
      const automation = await LiquidationAutomation.create({
        supplierId: supplier._id,
        name: 'Scoped Bid Workflow',
        templateName: 'smart_bidding_auction',
        isActive: true,
        stages: [
          {
            stageIndex: 0,
            name: 'Stage 1: Private Tier',
            targetType: 'buyer_list',
            buyerListId: buyerList1._id,
            discountValue: 10,
            waitHours: 24,
            stageType: 'liquidation'
          }
        ]
      });

      const populatedLot = await InventoryLot.findById(lot1._id).populate('productId');
      const run = await createAutomationRun(automation, [populatedLot], 'manual');

      const tokenDoc = await QuickBidToken.findOne({ buyerEmail: buyer1.email });
      expect(tokenDoc).toBeDefined();
      const token = tokenDoc!.token;

      // 1. GET /api/bids/quick-bid-info
      const infoRes = await request(app)
        .get('/api/bids/quick-bid-info')
        .query({ token });

      expect(infoRes.status).toBe(200);
      expect(infoRes.body.buyerEmail).toBe(buyer1.email);
      expect(infoRes.body.runId).toBe(run._id.toString());
      expect(infoRes.body.stageIndex).toBe(0);

      // 2. POST /api/bids/quick-submit
      const submitRes = await request(app)
        .post('/api/bids/quick-submit')
        .send({
          token,
          amount: 18.00,
          cases: 200
        });

      expect(submitRes.status).toBe(200);
      expect(submitRes.body.success).toBe(true);
      expect(submitRes.body.bid.runId).toBe(run._id.toString());
      expect(submitRes.body.bid.stageIndex).toBe(0);
      expect(submitRes.body.bid.amount).toBe(18.00);
      expect(submitRes.body.bid.cases).toBe(200);

      // Token should now be marked as used
      const updatedTokenDoc = await QuickBidToken.findOne({ token });
      expect(updatedTokenDoc?.isUsed).toBe(true);

      // Subsequent attempt to submit should fail as already used
      const duplicateRes = await request(app)
        .post('/api/bids/quick-submit')
        .send({
          token,
          amount: 18.00,
          cases: 200
        });
      expect(duplicateRes.status).toBe(400);
    });

    it('rejects quick-submit with 403 when authenticated user email does not match token recipient', async () => {
      const freshTokenDoc = await QuickBidToken.create({
        token: 'test-token-mismatch-check.sig',
        buyerEmail: 'debashishere007@gmail.com',
        listingId: lot1._id.toString(),
        lotId: lot1._id,
        defaultAmount: 15.00,
        expiresAt: new Date(Date.now() + 3600000),
        isUsed: false
      });

      const mismatchUserToken = `mock-firebase-id-token-mock-uid-${Buffer.from('debashisroe1996@gmail.com').toString('base64')}`;

      // Attempt to submit bid while logged in as debashisroe1996@gmail.com
      const res = await request(app)
        .post('/api/bids/quick-submit')
        .set('Authorization', `Bearer ${mismatchUserToken}`)
        .send({
          token: freshTokenDoc.token,
          amount: 16.50,
          cases: 100
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Account mismatch');
      expect(res.body.error).toContain('debashisroe1996@gmail.com');
      expect(res.body.error).toContain('debashishere007@gmail.com');

      // Token should remain unused
      const checkDoc = await QuickBidToken.findOne({ token: freshTokenDoc.token });
      expect(checkDoc?.isUsed).toBe(false);
    });

    it('allows quick-submit when authenticated user is main email and offer was issued to sub-email (+alias)', async () => {
      const subEmailTokenDoc = await QuickBidToken.create({
        token: 'test-token-sub-email-12345',
        buyerEmail: 'debashishere007+wholefoodsmarketregional@gmail.com',
        listingId: lot1._id.toString(),
        lotId: lot1._id,
        defaultAmount: 18.00,
        expiresAt: new Date(Date.now() + 3600000),
        isUsed: false
      });

      // User signed in with main email debashishere007@gmail.com
      const mainUserToken = `mock-firebase-id-token-mock-uid-${Buffer.from('debashishere007@gmail.com').toString('base64')}`;

      const res = await request(app)
        .post('/api/bids/quick-submit')
        .set('Authorization', `Bearer ${mainUserToken}`)
        .send({
          token: subEmailTokenDoc.token,
          amount: 18.00,
          cases: 50
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.bid.amount).toBe(18.00);

      const checkDoc = await QuickBidToken.findOne({ token: subEmailTokenDoc.token });
      expect(checkDoc?.isUsed).toBe(true);
    });

    it('allows quick-submit when authenticated user has a real Firebase JWT token matching token recipient', async () => {
      const userEmail = 'debashisroe1996+atlantacommunityfoodbank@gmail.com';
      const jwtTokenDoc = await QuickBidToken.create({
        token: 'test-token-real-firebase-jwt',
        buyerEmail: userEmail,
        listingId: lot1._id.toString(),
        lotId: lot1._id,
        defaultAmount: 17.50,
        expiresAt: new Date(Date.now() + 3600000),
        isUsed: false
      });

      const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
      const payload = Buffer.from(JSON.stringify({
        iss: 'https://securetoken.google.com/indspoileralert',
        aud: 'indspoileralert',
        user_id: 'firebase-user-atlanta-fb',
        sub: 'firebase-user-atlanta-fb',
        email: userEmail,
        email_verified: true
      })).toString('base64url');
      const realFirebaseJwt = `${header}.${payload}.sigRealMock`;

      const res = await request(app)
        .post('/api/bids/quick-submit')
        .set('Authorization', `Bearer ${realFirebaseJwt}`)
        .send({
          token: jwtTokenDoc.token,
          amount: 17.50,
          cases: 80,
          activeBuyerEmail: userEmail
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.bid.amount).toBe(17.50);

      const updatedTokenDoc = await QuickBidToken.findOne({ token: jwtTokenDoc.token });
      expect(updatedTokenDoc?.isUsed).toBe(true);
    });

    it('generates stage-scoped quick bid tokens and maintains exclusivity in subsequent stage executions', async () => {
      const buyer2 = await Buyer.create({
        name: 'Secondary Liquidator',
        companyName: 'Secondary Liquidators LLC',
        email: 'secondary@liquidator.com',
        isActive: true,
        optInBidding: true
      });

      const buyerList2 = await BuyerList.create({
        name: 'Tier 2 Liquidators',
        supplierId: supplier._id,
        buyerIds: [buyer2._id]
      });

      const automation = await LiquidationAutomation.create({
        supplierId: supplier._id,
        name: 'Multi-Stage Private Workflow',
        templateName: 'smart_bidding_auction',
        isActive: true,
        stages: [
          {
            stageIndex: 0,
            name: 'Stage 1: Primary Tier',
            targetType: 'buyer_list',
            buyerListId: buyerList1._id,
            discountValue: 10,
            waitHours: 24,
            stageType: 'liquidation'
          },
          {
            stageIndex: 1,
            name: 'Stage 2: Secondary Tier',
            targetType: 'buyer_list',
            buyerListId: buyerList2._id,
            discountValue: 25,
            waitHours: 24,
            stageType: 'liquidation'
          }
        ]
      });

      const populatedLot = await InventoryLot.findById(lot1._id).populate('productId');
      const run = await createAutomationRun(automation, [populatedLot], 'manual');

      // Trigger stage 1 execution
      sendEmailSpy!.mockClear();
      await executeWorkflowStage({ runId: run._id.toString(), stageIndex: 1 });

      expect(sendEmailSpy).toHaveBeenCalled();
      const lastCall = sendEmailSpy!.mock.calls[0];
      expect(lastCall[0]).toBe(buyer2.email);
      const emailHtml = lastCall[2];
      expect(emailHtml).toContain('token=');

      const tokenMatch = emailHtml.match(/token=([a-zA-Z0-9._-]+)/);
      expect(tokenMatch).not.toBeNull();
      const token = tokenMatch![1];

      const tokenDoc = await QuickBidToken.findOne({ token });
      expect(tokenDoc).toBeDefined();
      expect(tokenDoc?.buyerEmail).toBe(buyer2.email);
      expect(tokenDoc?.stageIndex).toBe(1);
      expect(tokenDoc?.runId?.toString()).toBe(run._id.toString());

      // Check submit for stage 1
      const submitRes = await request(app)
        .post('/api/bids/quick-submit')
        .send({
          token,
          amount: 15.00,
          cases: 300
        });

      expect(submitRes.status).toBe(200);
      expect(submitRes.body.bid.stageIndex).toBe(1);
      expect(submitRes.body.bid.buyerEmail).toBe(buyer2.email);

      // Verify no public listing was created
      const listings = await MarketplaceListing.find({ lotId: lot1._id });
      expect(listings.length).toBe(0);
    });
  });
});
