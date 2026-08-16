import mongoose from 'mongoose';
import { createAutomationRun } from '../services/agendaService';
import * as emailService from '../services/emailService';
import SupplierOAuthMailbox from '../models/SupplierOAuthMailbox';

describe('Issue 0091 — Slice 2.4: Backend Granular Per-Stage Inventory Allocation Dispatch', () => {
  let supplierId: mongoose.Types.ObjectId;
  let lot1: any;
  let lot2: any;
  let sendEmailHelperSpy: jest.SpyInstance;

  beforeEach(async () => {
    supplierId = new mongoose.Types.ObjectId();

    lot1 = {
      _id: new mongoose.Types.ObjectId(),
      supplierId,
      sku: 'SKU-MILK-101',
      description: 'Organic Milk 1 Gallon',
      status: 'active',
      availableQty: 400,
      quantityCases: 400,
      costPerCase: 12.5,
      remainingShelfLife: 0.12
    };

    lot2 = {
      _id: new mongoose.Types.ObjectId(),
      supplierId,
      sku: 'SKU-YOGURT-102',
      description: 'Greek Yogurt 32oz',
      status: 'active',
      availableQty: 250,
      quantityCases: 250,
      costPerCase: 8.0,
      remainingShelfLife: 0.08
    };

    jest.spyOn(SupplierOAuthMailbox, 'findOne').mockResolvedValue(null as any);

    sendEmailHelperSpy = jest.spyOn(emailService, 'sendEmailHelper').mockResolvedValue({
      messageId: 'mock-msg-id',
      success: true
    } as any);
  });

  afterEach(async () => {
    jest.restoreAllMocks();
  });

  it('filters stage inventory items to only allocatedLotIds when specified', async () => {
    const automation = {
      _id: new mongoose.Types.ObjectId(),
      supplierId,
      name: 'Granular Lot Allocation Workflow',
      templateName: 'custom_stage_gate',
      stages: [
        {
          stageIndex: 1,
          name: 'Stage 1: Milk Allocation Only',
          stageType: 'liquidation',
          buyerMode: 'custom',
          customBuyers: [
            {
              id: 'b-1',
              name: 'Partner Alpha',
              email: 'alpha@partner.com'
            }
          ],
          allocatedLotIds: [lot1._id.toString()]
        }
      ]
    };

    const run = await createAutomationRun(automation, [lot1, lot2], 'manual');

    expect(run).toBeDefined();
    expect(sendEmailHelperSpy).toHaveBeenCalled();

    const emailCalls = sendEmailHelperSpy.mock.calls;
    const firstEmailHtml = emailCalls[0][2] as string;

    // Should include allocated lot1
    expect(firstEmailHtml).toContain('Organic Milk 1 Gallon');
    // Should NOT include unallocated lot2
    expect(firstEmailHtml).not.toContain('Greek Yogurt 32oz');
  });

  it('includes all matched lots when allocatedLotIds is not specified', async () => {
    const automation = {
      _id: new mongoose.Types.ObjectId(),
      supplierId,
      name: 'All Lots Allocation Workflow',
      templateName: 'custom_stage_gate',
      stages: [
        {
          stageIndex: 1,
          name: 'Stage 1: All Lots',
          stageType: 'liquidation',
          buyerMode: 'custom',
          customBuyers: [
            {
              id: 'b-1',
              name: 'Partner Alpha',
              email: 'alpha@partner.com'
            }
          ]
        }
      ]
    };

    const run = await createAutomationRun(automation, [lot1, lot2], 'manual');

    expect(run).toBeDefined();
    expect(sendEmailHelperSpy).toHaveBeenCalled();

    const emailCalls = sendEmailHelperSpy.mock.calls;
    const firstEmailHtml = emailCalls[0][2] as string;

    // Should include both lots
    expect(firstEmailHtml).toContain('Organic Milk 1 Gallon');
    expect(firstEmailHtml).toContain('Greek Yogurt 32oz');
  });
});
