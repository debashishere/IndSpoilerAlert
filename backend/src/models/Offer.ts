import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage {
  sender: 'supplier' | 'buyer' | 'system';
  content: string;
  timestamp: Date;
  proposedPrice?: number;
  proposedQuantity?: number;
}

export interface IOffer extends Document {
  listingId: mongoose.Types.ObjectId;
  buyerId: mongoose.Types.ObjectId;
  quantity: number;
  price: number;
  status: 'pending' | 'countered' | 'rejected' | 'partially_accepted' | 'fully_accepted';
  awardedQty?: number;
  submittedAt: Date;
  messages: IMessage[];
}

const OfferSchema: Schema = new Schema({
  listingId: { type: Schema.Types.ObjectId, ref: 'MarketplaceListing', required: true },
  buyerId: { type: Schema.Types.ObjectId, ref: 'Buyer', required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'countered', 'rejected', 'partially_accepted', 'fully_accepted'], default: 'pending' },
  awardedQty: { type: Number, default: 0 },
  submittedAt: { type: Date, default: Date.now },
  messages: {
    type: [{
      sender: { type: String, enum: ['supplier', 'buyer', 'system'], required: true },
      content: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
      proposedPrice: { type: Number },
      proposedQuantity: { type: Number }
    }],
    default: []
  }
});

export default mongoose.model<IOffer>('Offer', OfferSchema);
