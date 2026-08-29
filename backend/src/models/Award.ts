import mongoose, { Schema, Document } from 'mongoose';

export interface IAward extends Document {
  listingId?: mongoose.Types.ObjectId;   // Optional — absent for unlisted private-stage awards
  lotId?: mongoose.Types.ObjectId;       // Direct lot scoping for private liquidation awards
  runId?: mongoose.Types.ObjectId;       // AutomationRun scoping for private liquidation awards
  offerId: mongoose.Types.ObjectId;
  buyerId: mongoose.Types.ObjectId;
  awardedQty: number;
  price: number;
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
  emailSent: { type: String },
  poPdfUrl: { type: String },
  approvedDate: { type: Date, default: Date.now }
});

export default mongoose.model<IAward>('Award', AwardSchema);
