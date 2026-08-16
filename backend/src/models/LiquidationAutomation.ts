import mongoose, { Schema, Document } from 'mongoose';

export interface IStageConfig {
  stageIndex?: number;
  name?: string;
  stageType?: 'liquidation' | 'donation' | 'landfill' | string;
  disposalDeadline?: string;
  allocatedLotIds?: string[];
  buyerMode?: string;
  buyerListId?: string;
  buyerListName?: string;
  buyerSegment?: string;
  customBuyers?: any[];
  discountType?: 'yield' | 'fixed' | 'floor' | string;
  discountValue?: number;
  waitHours?: number;
  waitUnit?: string;
  emailTemplateId?: string;
  emailSubject?: string;
  emailBodyHtml?: string;
  [key: string]: any;
}

export interface ILiquidationAutomation extends Document {
  supplierId: mongoose.Types.ObjectId;
  liquidationCycleId?: mongoose.Types.ObjectId;
  name?: string;
  templateName: string;
  templateKey?: string;
  inventoryFilters: Record<string, any>;
  targetBuyerSelection?: string;
  schedule: {
    type: 'immediate' | 'cron' | 'once' | string;
    cronExpression?: string;
    triggerAt?: Date;
    timezone?: string;
    timeOfDay?: string;
    daysOfWeek?: number[];
  };
  emailTemplate?: {
    subject?: string;
    body?: string;
    targetBuyers?: 'matched_only' | 'all_buyers' | 'custom_list' | string;
    customBuyerIds?: mongoose.Types.ObjectId[];
    blocks?: any[];
    customIntro?: string;
  };
  rules?: {
    evaluationWindowHours?: number;
    onSuccess?: 'auto_award' | 'hold_confirmation' | string;
    onFallback?: 'auto_donate' | 'yield_markdown_retry' | 'escalate_review' | 'auto_recycle' | string;
    minimumBidFloorPrice?: number;
    minimumYieldRecoveryPercent?: number;
    minimumMatchScore?: number;
  };
  stages?: Array<IStageConfig | Record<string, any>>;
  donationConfig?: {
    enabled?: boolean;
    maxCases?: number;
    diversionStrategy?: 'percentage_split' | 'priority_cascade' | string;
    donatingEntities?: Array<{
      id?: string;
      name: string;
      email?: string;
      maxCases?: number;
      allocationPercent?: number;
      priorityRank?: number;
    }>;
  };
  isActive: boolean;
  nextRunAt?: Date;
  stats: {
    totalRuns: number;
    totalAwarded: number;
    totalDonated: number;
  };
  status?: 'draft' | 'active' | 'stopped' | 'completed' | string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LiquidationAutomationSchema: Schema = new Schema({
  supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true },
  liquidationCycleId: { type: Schema.Types.ObjectId, ref: 'LiquidationCycle' },
  name: { type: String },
  templateName: { 
    type: String, 
    required: true 
  },
  templateKey: { type: String },
  inventoryFilters: { type: Schema.Types.Mixed, default: {} },
  targetBuyerSelection: { type: String, default: 'all_matched' },
  schedule: {
    type: { type: String, default: 'immediate' },
    cronExpression: { type: String },
    triggerAt: { type: Date },
    timezone: { type: String },
    timeOfDay: { type: String },
    daysOfWeek: { type: [Number] }
  },
  emailTemplate: {
    subject: { type: String },
    body: { type: String },
    targetBuyers: { type: String },
    customBuyerIds: { type: [Schema.Types.ObjectId], ref: 'Buyer' },
    blocks: { type: Schema.Types.Mixed },
    customIntro: { type: String }
  },
  rules: {
    evaluationWindowHours: { type: Number },
    onSuccess: { type: String },
    onFallback: { type: String },
    minimumBidFloorPrice: { type: Number },
    minimumYieldRecoveryPercent: { type: Number },
    minimumMatchScore: { type: Number }
  },
  stages: {
    type: [Schema.Types.Mixed],
    default: undefined
  },
  donationConfig: {
    type: Schema.Types.Mixed,
    default: undefined
  },
  isActive: { type: Boolean, default: true },
  nextRunAt: { type: Date },
  stats: {
    totalRuns: { type: Number, default: 0 },
    totalAwarded: { type: Number, default: 0 },
    totalDonated: { type: Number, default: 0 }
  },
  status: { type: String, default: 'draft' },
  createdBy: { type: String, default: 'Debashis Roy (Sales Mgr)' }
}, {
  timestamps: true
});

LiquidationAutomationSchema.index({ supplierId: 1, name: 1 }, { unique: true, sparse: true });

export default mongoose.model<ILiquidationAutomation>('LiquidationAutomation', LiquidationAutomationSchema);


