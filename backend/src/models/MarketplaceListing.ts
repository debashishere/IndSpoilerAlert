import mongoose, { Schema, Document } from 'mongoose';

export interface IMarketplaceListing extends Document {
  opportunityId?: mongoose.Types.ObjectId;
  lotId?: mongoose.Types.ObjectId;
  sellerId: mongoose.Types.ObjectId;
  supplierId?: mongoose.Types.ObjectId;
  publicTitle?: string;
  category?: string;
  remainingShelfLife?: number;
  availableQuantity?: number;
  publicPrice?: number;
  coaVerified?: boolean;
  sanitized?: boolean;
  allowBidding: boolean;
  startingPrice: number;
  minimumPrice: number;
  status: 'active' | 'closed' | 'published' | 'unlisted';
  warehouseRegion?: string;
  discountTier?: string;
  allergens?: string[];
  certifications?: string[];
  imageUrl?: string;
  description?: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

const MarketplaceListingSchema: Schema = new Schema({
  opportunityId: { type: Schema.Types.ObjectId, ref: 'Opportunity' },
  lotId: { type: Schema.Types.ObjectId, ref: 'InventoryLot' },
  sellerId: { type: Schema.Types.ObjectId, ref: 'Supplier' },
  supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier' },
  publicTitle: { type: String },
  category: { type: String, default: 'General Surplus' },
  remainingShelfLife: { type: Number },
  availableQuantity: { type: Number },
  publicPrice: { type: Number },
  coaVerified: { type: Boolean, default: false },
  sanitized: { type: Boolean, default: true },
  allowBidding: { type: Boolean, default: true },
  startingPrice: { type: Number, default: 0 },
  minimumPrice: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'closed', 'published', 'unlisted'], default: 'published' },
  warehouseRegion: { type: String, default: 'Midwest' },
  discountTier: { type: String, default: 'moderate' },
  allergens: [{ type: String }],
  certifications: [{ type: String }],
  imageUrl: { type: String },
  description: { type: String },
  expiresAt: { type: Date },
}, {
  timestamps: true
});

export default mongoose.model<IMarketplaceListing>('MarketplaceListing', MarketplaceListingSchema);
