import mongoose from 'mongoose';
import Buyer from '../models/Buyer';
import BuyerList from '../models/BuyerList';
import LiquidationAutomation from '../models/LiquidationAutomation';
import InventoryLot from '../models/InventoryLot';
import EmailDispatchLog from '../models/EmailDispatchLog';
import { createAutomationRun } from '../services/agendaService';
import * as emailService from '../services/emailService';

describe('Workflow Stage Buyer List Isolation & Resolution', () => {
  let supplierId: mongoose.Types.ObjectId;
  let buyer1: any;
  let buyer2: any;
  let dummyAutoRegBuyer: any;
  let buyerList1: any;
  let buyerList2: any;
  let lot: any;
  let sendEmailHelperSpy: jest.SpyInstance;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ind-spoiler-alert-test';
      await mongoose.connect(uri);
    }
  });

  afterAll(async () => {
    if (buyer1?._id) await Buyer.findByIdAndDelete(buyer1._id);
    if (buyer2?._id) await Buyer.findByIdAndDelete(buyer2._id);
    if (dummyAutoRegBuyer?._id) await Buyer.findByIdAndDelete(dummyAutoRegBuyer._id);
    if (buyerList1?._id) await BuyerList.findByIdAndDelete(buyerList1._id);
    if (buyerList2?._id) await BuyerList.findByIdAndDelete(buyerList2._id);
    if (lot?._id) await InventoryLot.findByIdAndDelete(lot._id);
    if (supplierId) await EmailDispatchLog.deleteMany({ supplierId: supplierId.toString() });
  });

  beforeEach(async () => {
    supplierId = new mongoose.Types.ObjectId();

    // 1. Create real target buyers
    buyer1 = await Buyer.create({
      name: 'Alpha Buyer',
      companyName: 'Alpha Retail Corp',
      email: `alpha_${Date.now()}@alpha.com`,
      isActive: true,
      optInBidding: true,
      optInSales: true
    });

    buyer2 = await Buyer.create({
      name: 'Beta Buyer',
      companyName: 'Beta Wholesalers',
      email: `beta_${Date.now()}@beta.com`,
      isActive: true,
      optInBidding: true,
      optInSales: true
    });

    // 2. Ensure test buyer autoreg@buyercompany.com exists
    dummyAutoRegBuyer = await Buyer.findOne({ email: 'autoreg@buyercompany.com' });
    if (!dummyAutoRegBuyer) {
      dummyAutoRegBuyer = await Buyer.create({
        name: 'AutoReg Test Buyer',
        companyName: 'Buyer Company Dummy',
        email: 'autoreg@buyercompany.com',
        isActive: true,
        optInBidding: true,
        optInSales: true
      });
    }

    // 3. Create two BuyerLists with 1 buyer in each
    buyerList1 = await BuyerList.create({
      name: 'Primary Tier 1 List',
      type: 'primary',
      supplierId,
      buyerIds: [buyer1._id]
    });

    buyerList2 = await BuyerList.create({
      name: 'Secondary Clearance List',
      type: 'secondary',
      supplierId,
      buyerIds: [buyer2._id]
    });

    lot = {
      _id: new mongoose.Types.ObjectId(),
      supplierId,
      description: 'Surplus Milk Lot',
      status: 'active',
      availableQty: 100,
      quantityCases: 100,
      costPerCase: 10,
      remainingShelfLife: 0.1
    };

    sendEmailHelperSpy = jest.spyOn(emailService, 'sendEmailHelper').mockResolvedValue({
      messageId: 'mock-msg-id',
      success: true
    } as any);
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    if (buyer1?._id) await Buyer.findByIdAndDelete(buyer1._id);
    if (buyer2?._id) await Buyer.findByIdAndDelete(buyer2._id);
    if (buyerList1?._id) await BuyerList.findByIdAndDelete(buyerList1._id);
    if (buyerList2?._id) await BuyerList.findByIdAndDelete(buyerList2._id);
    if (lot?._id) await InventoryLot.findByIdAndDelete(lot._id);
    if (supplierId) await EmailDispatchLog.deleteMany({ supplierId: supplierId.toString() });
  });

  it('should ONLY dispatch emails to buyers in configured stage BuyerLists and NOT spray all DB buyers (e.g. autoreg@buyercompany.com)', async () => {
    const automation = {
      _id: new mongoose.Types.ObjectId(),
      supplierId,
      name: 'Multi-Stage Clearance Workflow',
      templateName: 'custom_stage_gate',
      stages: [
        {
          stageIndex: 1,
          name: 'Stage 1: Primary Target',
          buyerMode: 'list',
          buyerListId: buyerList1._id.toString()
        },
        {
          stageIndex: 2,
          name: 'Stage 2: Secondary Target',
          buyerMode: 'list',
          buyerListId: buyerList2._id.toString()
        }
      ]
    };

    const run = await createAutomationRun(automation, [lot], 'manual');

    expect(run).toBeDefined();
    expect(run?.status).toBe('evaluating');
    expect(run?.buyerEmails).toHaveLength(2);
    expect(run?.buyerEmails).toContain(buyer1.email.toLowerCase());
    expect(run?.buyerEmails).toContain(buyer2.email.toLowerCase());
    expect(run?.buyerEmails).not.toContain('autoreg@buyercompany.com');

    // Verify spy calls
    const dispatchedEmails = sendEmailHelperSpy.mock.calls.map(c => c[0]);
    expect(dispatchedEmails).toContain(buyer1.email.toLowerCase());
    expect(dispatchedEmails).toContain(buyer2.email.toLowerCase());
    expect(dispatchedEmails).not.toContain('autoreg@buyercompany.com');

    // Verify EmailDispatchLog
    const logs = await EmailDispatchLog.find({ supplierId: supplierId.toString() });
    expect(logs.length).toBe(2);
    expect(logs.some(l => l.buyerEmail === 'autoreg@buyercompany.com')).toBe(false);
    expect(logs.some(l => l.buyerEmail === buyer1.email.toLowerCase() && l.compiledBuyerName === 'Alpha Retail Corp')).toBe(true);
  });

  it('should resolve buyerList by type (primary/secondary) if buyerListId is sent as type string', async () => {
    const automation = {
      _id: new mongoose.Types.ObjectId(),
      supplierId,
      name: 'Type-Based Workflow',
      templateName: 'custom_stage_gate',
      stages: [
        {
          stageIndex: 1,
          name: 'Stage 1: Preferred',
          buyerMode: 'list',
          buyerListId: 'primary'
        }
      ]
    };

    const run = await createAutomationRun(automation, [lot], 'manual');

    expect(run?.status).toBe('evaluating');
    expect(run?.buyerEmails).toEqual([buyer1.email.toLowerCase()]);
    expect(run?.buyerEmails).not.toContain('autoreg@buyercompany.com');
  });

  it('should fail with 0 target buyers if configured BuyerList is empty and NOT fall back to DB buyers', async () => {
    const emptyList = await BuyerList.create({
      name: 'Empty List',
      type: 'custom',
      supplierId,
      buyerIds: []
    });

    const automation = {
      _id: new mongoose.Types.ObjectId(),
      supplierId,
      name: 'Empty List Campaign',
      templateName: 'custom_stage_gate',
      stages: [
        {
          stageIndex: 1,
          name: 'Stage 1: Empty',
          buyerMode: 'list',
          buyerListId: emptyList._id.toString()
        }
      ]
    };

    const run = await createAutomationRun(automation, [lot], 'manual');

    expect(run?.status).toBe('error');
    expect(run?.errorReason).toContain('0 target buyers');
    expect(run?.buyerEmails).toHaveLength(0);
    expect(sendEmailHelperSpy).not.toHaveBeenCalled();

    await BuyerList.findByIdAndDelete(emptyList._id);
  });
});
