import mongoose, { Schema, Document } from 'mongoose';

export interface IPricingRecommendation extends Document {
  lotId: mongoose.Types.ObjectId;
  recommendedDiscount: number;
  recommendedPrice: number;
  expectedSellThrough: number;
  expectedRevenue: number;
  elasticity: number;
  createdAt: Date;
}

const PricingRecommendationSchema: Schema = new Schema({
  lotId: { type: Schema.Types.ObjectId, ref: 'InventoryLot', required: true, unique: true },
  recommendedDiscount: { type: Number, required: true },
  recommendedPrice: { type: Number, required: true },
  expectedSellThrough: { type: Number, required: true },
  expectedRevenue: { type: Number, required: true },
  elasticity: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IPricingRecommendation>('PricingRecommendation', PricingRecommendationSchema);
