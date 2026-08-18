import mongoose from 'mongoose';
import AutomationRun, { IAutomationRun, IStageExecution } from '../models/AutomationRun';

describe('Issue 01: Expand AutomationRun Schema', () => {
  it('should support new status enum values: partially_awarded and escalating', async () => {
    const run1 = new AutomationRun({
      automationId: new mongoose.Types.ObjectId(),
      runType: 'manual',
      status: 'partially_awarded',
      evaluationEndsAt: new Date()
    });

    const error1 = run1.validateSync();
    expect(error1).toBeUndefined();

    const run2 = new AutomationRun({
      automationId: new mongoose.Types.ObjectId(),
      runType: 'scheduled',
      status: 'escalating',
      evaluationEndsAt: new Date()
    });

    const error2 = run2.validateSync();
    expect(error2).toBeUndefined();
  });

  it('should reject invalid status values', () => {
    const invalidRun = new AutomationRun({
      automationId: new mongoose.Types.ObjectId(),
      runType: 'manual',
      status: 'invalid_status_value',
      evaluationEndsAt: new Date()
    });

    const error = invalidRun.validateSync();
    expect(error).toBeDefined();
    expect(error?.errors['status']).toBeDefined();
  });

  it('should support stageExecutions and currentStageIndex fields', () => {
    const stageExecution: IStageExecution = {
      stageIndex: 0,
      firedAt: new Date(),
      buyerEmails: ['buyer1@example.com', 'buyer2@example.com'],
      lotsOffered: [
        {
          lotId: new mongoose.Types.ObjectId().toString(),
          awardedQty: 50,
          remainingQty: 100
        }
      ],
      agendaJobId: 'job-stage-2-12345',
      status: 'dispatched'
    };

    const run = new AutomationRun({
      automationId: new mongoose.Types.ObjectId(),
      runType: 'scheduled',
      status: 'evaluating',
      currentStageIndex: 0,
      stageExecutions: [stageExecution],
      evaluationEndsAt: new Date()
    });

    const error = run.validateSync();
    expect(error).toBeUndefined();
    expect(run.currentStageIndex).toBe(0);
    expect(run.stageExecutions).toHaveLength(1);
    expect(run.stageExecutions?.[0].status).toBe('dispatched');
    expect(run.stageExecutions?.[0].lotsOffered?.[0].remainingQty).toBe(100);
  });

  it('should maintain backward compatibility when stageExecutions and currentStageIndex are omitted', () => {
    const legacyRun = new AutomationRun({
      automationId: new mongoose.Types.ObjectId(),
      runType: 'manual',
      evaluationEndsAt: new Date(),
      fallbackJobId: 'fallback-job-999'
    });

    const error = legacyRun.validateSync();
    expect(error).toBeUndefined();
    expect(legacyRun.status).toBe('evaluating');
    expect(legacyRun.fallbackJobId).toBe('fallback-job-999');
    expect(legacyRun.currentStageIndex).toBeUndefined();
  });
});
