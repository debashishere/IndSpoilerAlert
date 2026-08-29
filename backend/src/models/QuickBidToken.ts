import mongoose, { Schema, Document } from 'mongoose';

export interface IQuickBidToken extends Document {
  token: string;
  buyerEmail: string;
  listingId: string;
  runId?: mongoose.Types.ObjectId | string;
  stageIndex?: number;
  lotId?: mongoose.Types.ObjectId | string;
  supplierId?: mongoose.Types.ObjectId | string;
  defaultAmount: number;
  expiresAt: Date;
  isUsed: boolean;
  usedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const QuickBidTokenSchema: Schema = new Schema(
  {
    token: { type: String, required: true, unique: true, index: true },
    buyerEmail: { type: String, required: true },
    listingId: { type: String, required: true },
    runId: { type: Schema.Types.ObjectId, ref: 'AutomationRun' },
    stageIndex: { type: Number },
    lotId: { type: Schema.Types.ObjectId, ref: 'InventoryLot' },
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier' },
    defaultAmount: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
    isUsed: { type: Boolean, default: false },
    usedAt: { type: Date }
  },
  { timestamps: true }
);

export default mongoose.models.QuickBidToken ||
  mongoose.model<IQuickBidToken>('QuickBidToken', QuickBidTokenSchema);
