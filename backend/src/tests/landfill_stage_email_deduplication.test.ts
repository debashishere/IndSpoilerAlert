import mongoose from 'mongoose';
import { createAutomationRun, executeWorkflowStage, agenda } from '../services/agendaService';
import { resolveStageBuyers } from '../services/stageResolver';
import * as emailService from '../services/emailService';
import Buyer from '../models/Buyer';
import BuyerList from '../models/BuyerList';
import AutomationRun from '../models/AutomationRun';
import LiquidationAutomation from '../models/LiquidationAutomation';
import InventoryLot from '../models/InventoryLot';
import ProductMaster from '../models/ProductMaster';

describe('Landfill Stage Email Deduplication and Idempotency Guard', () => {
  let supplierId: mongoose.Types.ObjectId;
  let buyer1: any;
  let buyer2: any;
  let lot1: any;
  let sendEmailHelperSpy: jest.SpyInstance;
  let agendaScheduleSpy: jest.SpyInstance;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ind-spoiler-alert-test';
      await mongoose.connect(uri);
    }
  });

  afterAll(async () => {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  });

  beforeEach(async () => {
    supplierId = new mongoose.Types.ObjectId();

    sendEmailHelperSpy = jest.spyOn(emailService, 'sendEmailHelper').mockResolvedValue({
      success: true,
      messageId: `mock-${Date.now()}`
    });

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

    buyer1 = await Buyer.create({
      name: 'EcoRecycle Landfill Services',
      companyName: 'EcoRecycle Landfill Services',
      email: `ecolandfill_${Date.now()}@ecorecycle.com`,
      isActive: true,
      optInSales: true,
      optInBidding: true
    });

    buyer2 = await Buyer.create({
      name: 'BioWaste Disposal Ops',
      companyName: 'BioWaste Disposal Ops',
      email: `biowaste_${Date.now()}@biowaste.com`,
      isActive: true,
      optInSales: true,
      optInBidding: true
    });

    const product = await ProductMaster.create({
      supplierId,
      sku: `SKU-LANDFILL-${Date.now()}`,
      description: 'Expired Organic Produce',
      category: 'Produce',
      costPerCase: 10
    });

    lot1 = await InventoryLot.create({
      supplierId,
      distributionCenterId: new mongoose.Types.ObjectId(),
      productId: product._id,
      lotNumber: `LOT-LF-${Date.now()}`,
      availableQty: 50,
      quantityCases: 50,
      palletCount: 2,
      costPerCase: 10,
      standardSellPrice: 15,
      expirationDate: new Date(Date.now() + 14 * 24 * 3600 * 1000),
      remainingShelfLife: 0.05,
      status: 'active'
    });
  });

  afterEach(async () => {
    sendEmailHelperSpy.mockRestore();
    agendaScheduleSpy.mockRestore();
    if (buyer1?._id) await Buyer.findByIdAndDelete(buyer1._id);
    if (buyer2?._id) await Buyer.findByIdAndDelete(buyer2._id);
    if (lot1?._id) await InventoryLot.findByIdAndDelete(lot1._id);
  });

  it('resolveStageBuyers deduplicates identical buyer emails even with mixed case or trailing whitespace', async () => {
    const stage = {
      stageIndex: 0,
      type: 'landfill',
      buyerMode: 'custom',
      customBuyers: [
        { name: 'Eco Landfill', email: buyer1.email },
        { name: 'Eco Landfill Duplicate', email: ` ${buyer1.email.toUpperCase()} ` },
        { name: 'BioWaste', email: buyer2.email }
      ]
    };

    const resolved = await resolveStageBuyers(stage, { supplierId });
    expect(resolved.buyerEmails).toHaveLength(2);
    expect(resolved.buyerEmails).toContain(buyer1.email.toLowerCase());
    expect(resolved.buyerEmails).toContain(buyer2.email.toLowerCase());
  });

  it('createAutomationRun terminates single-stage landfill workflows as fallback_executed without scheduling fallback jobs', async () => {
    const automation = await LiquidationAutomation.create({
      supplierId,
      name: `Single Landfill Workflow ${Date.now()}`,
      templateName: 'disposal-removal-notice',
      templateKey: 'disposal-removal-notice',
      status: 'active',
      isActive: true,
      stages: [
        {
          stageIndex: 0,
          name: 'Landfill Disposal Stage',
          type: 'landfill',
          buyerMode: 'custom',
          customBuyers: [{ id: buyer1._id.toString(), name: buyer1.name, email: buyer1.email }],
          disposalDeadline: '2026-09-01',
          waitHours: 24
        }
      ]
    });

    const run = await createAutomationRun(automation, [lot1], 'manual');

    // Email dispatched exactly once for buyer1
    expect(sendEmailHelperSpy).toHaveBeenCalledTimes(1);
    expect(sendEmailHelperSpy.mock.calls[0][0]).toBe(buyer1.email.toLowerCase());

    // Single-stage landfill terminates immediately as fallback_executed
    expect(run.status).toBe('fallback_executed');
    expect(run.resolution?.action).toBe('landfill_dispatched');

    // No fallback job scheduled
    expect(agendaScheduleSpy).not.toHaveBeenCalled();

    await LiquidationAutomation.findByIdAndDelete(automation._id);
    await AutomationRun.findByIdAndDelete(run._id);
  });

  it('executeWorkflowStage is idempotent and does not send duplicate emails if invoked twice for the same stageIndex', async () => {
    const automation = await LiquidationAutomation.create({
      supplierId,
      name: `Multi-Stage Landfill Workflow ${Date.now()}`,
      templateName: 'default',
      templateKey: 'default',
      status: 'active',
      isActive: true,
      stages: [
        {
          stageIndex: 0,
          name: 'Liquidation Stage',
          type: 'liquidation',
          buyerMode: 'custom',
          customBuyers: [{ id: buyer1._id.toString(), name: buyer1.name, email: buyer1.email }],
          waitHours: 12
        },
        {
          stageIndex: 1,
          name: 'Final Landfill Stage',
          type: 'landfill',
          buyerMode: 'custom',
          customBuyers: [{ id: buyer2._id.toString(), name: buyer2.name, email: buyer2.email }],
          disposalDeadline: '2026-09-01',
          waitHours: 24
        }
      ]
    });

    const run = await createAutomationRun(automation, [lot1], 'manual');
    expect(sendEmailHelperSpy).toHaveBeenCalledTimes(1);
    expect(sendEmailHelperSpy.mock.calls[0][0]).toBe(buyer1.email.toLowerCase());

    sendEmailHelperSpy.mockClear();

    // Execute Stage 1 (Landfill) for the first time
    await executeWorkflowStage({ runId: run._id.toString(), stageIndex: 1 });
    expect(sendEmailHelperSpy).toHaveBeenCalledTimes(1);
    expect(sendEmailHelperSpy.mock.calls[0][0]).toBe(buyer2.email.toLowerCase());

    const runAfterFirst = await AutomationRun.findById(run._id);
    expect(runAfterFirst?.stageExecutions).toHaveLength(2);

    sendEmailHelperSpy.mockClear();

    // Re-execute Stage 1 (duplicate trigger attempt)
    await executeWorkflowStage({ runId: run._id.toString(), stageIndex: 1 });

    // Should NOT send duplicate email
    expect(sendEmailHelperSpy).not.toHaveBeenCalled();

    const runAfterSecond = await AutomationRun.findById(run._id);
    expect(runAfterSecond?.stageExecutions).toHaveLength(2);

    await LiquidationAutomation.findByIdAndDelete(automation._id);
    await AutomationRun.findByIdAndDelete(run._id);
  });
});
