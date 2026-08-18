import mongoose, { Schema, Document } from 'mongoose';

export interface IStageExecution {
  stageIndex: number;
  firedAt: Date;
  buyerEmails: string[];
  waitHours?: number;
  waitUnit?: string;
  lotsOffered?: Array<{
    lotId: mongoose.Types.ObjectId | string;
    awardedQty?: number;
    remainingQty?: number;
  }>;
  agendaJobId?: string;
  status: 'pending' | 'dispatched' | 'partially_awarded' | 'awarded' | 'expired';
}

export interface IAutomationRun extends Document {
  automationId: mongoose.Types.ObjectId;
  runType: 'scheduled' | 'manual';
  status: 'dispatched' | 'evaluating' | 'partially_awarded' | 'escalating' | 'awarded' | 'fallback_executed' | 'failed' | 'error';
  currentStageIndex?: number;
  stageExecutions?: IStageExecution[];
  errorReason?: string;
  snapshotInventoryIds: mongoose.Types.ObjectId[];
  evaluatedBuyerIds: mongoose.Types.ObjectId[];
  fallbackJobId?: string;
  dispatchedAt: Date;
  executedAt?: Date;
  buyerEmails?: string[];
  affectedInventoryLots?: Array<{
    lotId: mongoose.Types.ObjectId | string;
    lotNumber?: string;
    sku?: string;
    description?: string;
    cases?: number;
    rsl?: number;
  }>;
  campaignSnapshot?: any;
  evaluationEndsAt: Date;
  resolution?: {
    action: 'auto_award' | 'hold_confirmation' | 'auto_donate' | 'yield_markdown' | 'escalate_review' | 'auto_recycle' | 'landfill_dispatched' | string;
    targetBuyerId?: mongoose.Types.ObjectId;
    winningOfferId?: mongoose.Types.ObjectId;
    donationConfigSummary?: any;
    resolvedAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const AutomationRunSchema: Schema = new Schema({
  automationId: { type: Schema.Types.ObjectId, ref: 'LiquidationAutomation', required: true },
  runType: { type: String, enum: ['scheduled', 'manual'], required: true },
  status: { type: String, enum: ['dispatched', 'evaluating', 'partially_awarded', 'escalating', 'awarded', 'fallback_executed', 'failed', 'error'], default: 'evaluating' },
  currentStageIndex: { type: Number },
  stageExecutions: [Schema.Types.Mixed],
  errorReason: { type: String },
  snapshotInventoryIds: [{ type: Schema.Types.ObjectId, ref: 'InventoryLot' }],

  evaluatedBuyerIds: [Schema.Types.Mixed],
  fallbackJobId: { type: String },
  dispatchedAt: { type: Date, default: Date.now },
  executedAt: { type: Date, default: Date.now },
  buyerEmails: [{ type: String }],
  affectedInventoryLots: [Schema.Types.Mixed],
  campaignSnapshot: { type: Schema.Types.Mixed },
  evaluationEndsAt: { type: Date, required: true },
  resolution: {
    action: { type: String, enum: ['auto_award', 'hold_confirmation', 'auto_donate', 'yield_markdown', 'escalate_review', 'auto_recycle', 'landfill_dispatched'] },
    targetBuyerId: { type: Schema.Types.ObjectId, ref: 'Buyer' },
    winningOfferId: { type: Schema.Types.ObjectId, ref: 'Offer' },
    donationConfigSummary: { type: Schema.Types.Mixed },
    resolvedAt: { type: Date }
  }
}, {
  timestamps: true
});

export default mongoose.model<IAutomationRun>('AutomationRun', AutomationRunSchema);
