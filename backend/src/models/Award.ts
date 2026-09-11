import mongoose, { Schema, Document } from 'mongoose';

export interface IExecutionAudit {
  signerName: string;
  signerTitle: string;
  signatureType: 'draw' | 'type';
  signatureData: string;
  signedAt: Date;
  ipAddress?: string;
  userAgent?: string;
  verificationHash?: string;
}

export interface IAward extends Document {
  listingId?: mongoose.Types.ObjectId;   // Optional — absent for unlisted private-stage awards
  lotId?: mongoose.Types.ObjectId;       // Direct lot scoping for private liquidation awards
  runId?: mongoose.Types.ObjectId;       // AutomationRun scoping for private liquidation awards
  offerId: mongoose.Types.ObjectId;
  buyerId: mongoose.Types.ObjectId;
  awardedQty: number;
  price: number;
  totalAmount?: number;
  dealToken?: string;
  pickupLocation?: string;
  pickupHours?: string;
  paymentStatus?: 'pending' | 'confirmed';
  signatureStatus?: 'pending' | 'executed';
  executionAudit?: IExecutionAudit;
  emailSent?: string;
  poPdfUrl?: string;
  approvedDate: Date;
}

const AwardSchema: Schema = new Schema({
  listingId: { type: Schema.Types.ObjectId, ref: 'MarketplaceListing', required: false },
  lotId: { type: Schema.Types.ObjectId, ref: 'InventoryLot' },
  runId: { type: Schema.Types.ObjectId, ref: 'AutomationRun' },
  offerId: { type: Schema.Types.ObjectId, ref: 'Offer', required: true },
  buyerId: { type: Schema.Types.ObjectId, ref: 'Buyer', required: true },
  awardedQty: { type: Number, required: true },
  price: { type: Number, required: true },
  totalAmount: { type: Number },
  dealToken: { type: String },
  pickupLocation: { type: String },
  pickupHours: { type: String },
  paymentStatus: { type: String, enum: ['pending', 'confirmed'], default: 'pending' },
  signatureStatus: { type: String, enum: ['pending', 'executed'], default: 'pending' },
  executionAudit: {
    signerName: { type: String },
    signerTitle: { type: String },
    signatureType: { type: String, enum: ['draw', 'type'] },
    signatureData: { type: String },
    signedAt: { type: Date },
    ipAddress: { type: String },
    userAgent: { type: String },
    verificationHash: { type: String }
  },
  emailSent: { type: String },
  poPdfUrl: { type: String },
  approvedDate: { type: Date, default: Date.now }
});

AwardSchema.index({ offerId: 1 }, { unique: true });

export default mongoose.model<IAward>('Award', AwardSchema);

