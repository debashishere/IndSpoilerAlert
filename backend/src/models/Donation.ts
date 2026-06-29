import mongoose, { Schema, Document } from 'mongoose';

export interface IDonation extends Document {
  lotId: mongoose.Types.ObjectId;
  foodBankName: string;
  entityEmail?: string;
  quantity: number;
  taxBenefit: number;
  landfillAvoided: number; // in tons
  co2Saved: number; // in tons
  pickupDate: Date;
  createdAt: Date;
}

const DonationSchema: Schema = new Schema({
  lotId: { type: Schema.Types.ObjectId, ref: 'InventoryLot', required: true },
  foodBankName: { type: String, required: true },
  entityEmail: { type: String },
  quantity: { type: Number, required: true },
  taxBenefit: { type: Number, required: true },
  landfillAvoided: { type: Number, required: true },
  co2Saved: { type: Number, required: true },
  pickupDate: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IDonation>('Donation', DonationSchema);
