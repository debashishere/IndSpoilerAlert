import mongoose, { Schema, Document } from 'mongoose';

export interface IBuyer extends Document {
  companyName: string;
  email: string;
  tier?: string;
  isVerified?: boolean;
  acceptsShortDated: boolean;
  minShelfLife: number; // in days
  categories: string[];
  transportRadius: number; // in miles
  warehouseLocations: { lat: number; lng: number }[];
  excludedAllergens?: string[];
  // Lifecycle & opt-in controls
  isActive: boolean;           // if false, buyer is skipped in ALL workflows
  optInBidding: boolean;       // if false, skip from bidding-stage emails
  optInSales: boolean;         // if false, skip from sales-stage emails
  // Extended contact info
  phone?: string;
  address?: string;
  notes?: string;
  // Deactivation audit trail
  deactivatedAt?: Date;
  deactivatedReason?: string;
}

const BuyerSchema: Schema = new Schema({
  companyName: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  tier: { type: String, default: 'tier1' },
  isVerified: { type: Boolean, default: false },
  acceptsShortDated: { type: Boolean, default: true },
  minShelfLife: { type: Number, default: 7 },
  categories: { type: [String], default: [] },
  transportRadius: { type: Number, default: 100 },
  warehouseLocations: [{
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  }],
  excludedAllergens: { type: [String], default: [] },
  // Lifecycle & opt-in controls
  isActive: { type: Boolean, default: true },
  optInBidding: { type: Boolean, default: true },
  optInSales: { type: Boolean, default: true },
  // Extended contact info
  phone: { type: String },
  address: { type: String },
  notes: { type: String },
  // Deactivation audit trail
  deactivatedAt: { type: Date },
  deactivatedReason: { type: String }
}, { timestamps: true });

export default mongoose.model<IBuyer>('Buyer', BuyerSchema);
