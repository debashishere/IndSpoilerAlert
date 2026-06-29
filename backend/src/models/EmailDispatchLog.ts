import mongoose, { Schema, Document } from 'mongoose';

export interface IEmailDispatchLog extends Document {
  dispatchId: string;
  threadId?: string;
  supplierId?: string;
  buyerEmail?: string;
  buyerId?: string;
  compiledBuyerName?: string;
  status?: string;
  dispatchedAt?: Date;
  listingId?: string;
  firstOpenedAt?: Date;
  lastOpenedAt?: Date;
  openCount: number;
  userAgent?: string;
  ipAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EmailDispatchLogSchema: Schema = new Schema(
  {
    dispatchId: { type: String, required: true, unique: true, index: true },
    threadId: { type: String, index: true },
    supplierId: { type: String, index: true },
    buyerEmail: { type: String, index: true },
    buyerId: { type: String, index: true },
    compiledBuyerName: { type: String },
    status: { type: String, default: 'sent' },
    dispatchedAt: { type: Date, default: Date.now },
    listingId: { type: String, index: true },

    firstOpenedAt: { type: Date },
    lastOpenedAt: { type: Date },
    openCount: { type: Number, default: 0 },
    userAgent: { type: String },
    ipAddress: { type: String }
  },
  { timestamps: true }
);

export default mongoose.models.EmailDispatchLog ||
  mongoose.model<IEmailDispatchLog>('EmailDispatchLog', EmailDispatchLogSchema);
