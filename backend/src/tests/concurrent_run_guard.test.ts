import request from 'supertest';
import mongoose from 'mongoose';
import app from '../index';
import AutomationRun from '../models/AutomationRun';
import LiquidationAutomation from '../models/LiquidationAutomation';
import { createAutomationRun, agenda } from '../services/agendaService';
import * as emailService from '../services/emailService';

describe('Issue 06: Concurrent Run Guard', () => {
  let supplierId: mongoose.Types.ObjectId;
  let automationId: mongoose.Types.ObjectId;
  let sendEmailHelperSpy: jest.SpyInstance;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ind-spoiler-alert-test';
      await mongoose.connect(uri);
    }
  });

  beforeEach(async () => {
    supplierId = new mongoose.Types.ObjectId();
    automationId = new mongoose.Types.ObjectId();
    sendEmailHelperSpy = jest.spyOn(emailService, 'sendEmailHelper').mockResolvedValue({
      messageId: 'mock-id',
      success: true
    } as any);
    await AutomationRun.deleteMany({});
  });

  afterEach(async () => {
    sendEmailHelperSpy.mockRestore();
    await AutomationRun.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  describe('Seam 1: Core Service createAutomationRun() Active Run Guard', () => {
    const activeStatuses = ['evaluating', 'partially_awarded', 'escalating'];
    const terminalStatuses = ['awarded', 'fallback_executed', 'failed', 'error'];

    test.each(activeStatuses)(
      'rejects and throws when an existing run has active status "%s"',
      async (status) => {
        // Arrange: Create existing active run for automationId
        await AutomationRun.create({
          automationId,
          supplierId,
          status,
          runType: 'manual',
          evaluationEndsAt: new Date(Date.now() + 3600000),
          affectedInventoryLots: [],
          evaluatedBuyerIds: [],
          buyerOffers: []
        });

        const automation = {
          _id: automationId,
          supplierId,
          name: 'Test Workflow',
          stages: [
            {
              stageIndex: 0,
              type: 'direct_sale',
              customBuyers: [{ email: 'buyer@example.com', name: 'Test Buyer' }],
              waitHours: 24
            }
          ]
        };

        // Act & Assert
        await expect(createAutomationRun(automation, [], 'manual')).rejects.toThrow(
          'A run is already in progress for this workflow'
        );
      }
    );

    test.each(terminalStatuses)(
      'allows creating a new run when existing run has terminal status "%s"',
      async (status) => {
        // Arrange: Create existing terminal run for automationId
        await AutomationRun.create({
          automationId,
          supplierId,
          status,
          runType: 'manual',
          evaluationEndsAt: new Date(Date.now() - 3600000),
          affectedInventoryLots: [],
          evaluatedBuyerIds: [],
          buyerOffers: []
        });

        const automation = {
          _id: automationId,
          supplierId,
          name: 'Test Workflow',
          stages: [
            {
              stageIndex: 0,
              type: 'direct_sale',
              customBuyers: [{ email: 'buyer@example.com', name: 'Test Buyer' }],
              waitHours: 24
            }
          ]
        };

        // Act
        const run = await createAutomationRun(automation, [], 'manual');

        // Assert
        expect(run).toBeDefined();
        expect(run._id).toBeDefined();
        expect(run.status).toBe('evaluating');
      }
    );

    test('allows creating a new run when an active run exists for a different automationId', async () => {
      const differentAutomationId = new mongoose.Types.ObjectId();

      await AutomationRun.create({
        automationId: differentAutomationId,
        supplierId,
        status: 'evaluating',
        runType: 'manual',
        evaluationEndsAt: new Date(Date.now() + 3600000),
        affectedInventoryLots: [],
        evaluatedBuyerIds: [],
        buyerOffers: []
      });

      const automation = {
        _id: automationId,
        supplierId,
        name: 'Test Workflow',
        stages: [
          {
            stageIndex: 0,
            type: 'direct_sale',
            customBuyers: [{ email: 'buyer@example.com', name: 'Test Buyer' }],
            waitHours: 24
          }
        ]
      };

      const run = await createAutomationRun(automation, [], 'manual');
      expect(run).toBeDefined();
      expect(run.automationId.toString()).toBe(automationId.toString());
      expect(run.status).toBe('evaluating');
    });
  });

  describe('Seam 2: HTTP API POST /api/liquidation-automations/:id/trigger', () => {
    test('returns 409 Conflict when an active run is already in progress', async () => {
      // Create automation workflow in DB
      const automation = await LiquidationAutomation.create({
        supplierId,
        templateName: 'direct_sale',
        name: 'Concurrent Test Workflow',
        stages: [
          {
            stageIndex: 0,
            type: 'direct_sale',
            customBuyers: [{ email: 'buyer@example.com', name: 'Test Buyer' }],
            waitHours: 24
          }
        ]
      });

      // Create an existing active run for this automation
      await AutomationRun.create({
        automationId: automation._id,
        supplierId,
        status: 'evaluating',
        runType: 'manual',
        evaluationEndsAt: new Date(Date.now() + 3600000),
        affectedInventoryLots: [],
        evaluatedBuyerIds: [],
        buyerOffers: []
      });

      // Act
      const res = await request(app)
        .post(`/api/liquidation-automations/${automation._id}/trigger`)
        .send({});

      // Assert
      expect(res.status).toBe(409);
      expect(res.body.error).toBe('A run is already in progress for this workflow');

      // Cleanup
      await LiquidationAutomation.findByIdAndDelete(automation._id);
    });

    test('returns 201 Created when no active runs exist', async () => {
      const automation = await LiquidationAutomation.create({
        supplierId,
        templateName: 'direct_sale',
        name: 'Non-concurrent Test Workflow',
        stages: [
          {
            stageIndex: 0,
            type: 'direct_sale',
            customBuyers: [{ email: 'buyer@example.com', name: 'Test Buyer' }],
            waitHours: 24
          }
        ]
      });

      const res = await request(app)
        .post(`/api/liquidation-automations/${automation._id}/trigger`)
        .send({});

      expect(res.status).toBe(201);
      expect(res.body._id).toBeDefined();
      expect(res.body.status).toBe('evaluating');

      // Cleanup
      await LiquidationAutomation.findByIdAndDelete(automation._id);
    });
  });

  describe('Seam 3: Scheduled Agenda Job trigger-liquidation-workflow', () => {
    let warnSpy: jest.SpyInstance;
    let errorSpy: jest.SpyInstance;

    beforeEach(() => {
      warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      warnSpy.mockRestore();
      errorSpy.mockRestore();
    });

    test('logs a warning and skips execution without crashing when an active run exists', async () => {
      const nextRunDate = new Date(Date.now() + 86400000);
      const automation = await LiquidationAutomation.create({
        supplierId,
        templateName: 'direct_sale',
        name: 'Scheduled Active Guard Workflow',
        isActive: true,
        stages: [
          {
            stageIndex: 0,
            type: 'direct_sale',
            customBuyers: [{ email: 'buyer@example.com', name: 'Test Buyer' }],
            waitHours: 24
          }
        ]
      });

      // Create an existing active run
      const activeRun = await AutomationRun.create({
        automationId: automation._id,
        supplierId,
        status: 'evaluating',
        runType: 'scheduled',
        evaluationEndsAt: new Date(Date.now() + 3600000),
        affectedInventoryLots: [],
        evaluatedBuyerIds: [],
        buyerOffers: []
      });

      const mockJob = {
        attrs: {
          data: { automationId: automation._id.toString() },
          nextRunAt: nextRunDate
        }
      };

      const handler = (agenda as any)._definitions['trigger-liquidation-workflow'].fn;
      await expect(handler(mockJob)).resolves.not.toThrow();

      // Verify a warning was logged and error was NOT logged
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining(`Skipping workflow ${automation._id}`)
      );
      expect(errorSpy).not.toHaveBeenCalled();

      // Verify no duplicate run was created
      const runCount = await AutomationRun.countDocuments({ automationId: automation._id });
      expect(runCount).toBe(1);

      // Verify nextRunAt was updated on the automation
      const updatedAutomation = await LiquidationAutomation.findById(automation._id);
      expect(updatedAutomation?.nextRunAt).toEqual(nextRunDate);

      // Cleanup
      await LiquidationAutomation.findByIdAndDelete(automation._id);
    });
  });
});
