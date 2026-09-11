import mongoose, { Schema, Document } from 'mongoose';

export interface IDistributionCenter extends Document {
  supplierId: string;
  name: string;
  code: string;
  address: string;
  coordinates: { lat: number; lng: number };
  coldStorage: boolean;
  operatingHours?: string;
}

const DistributionCenterSchema: Schema = new Schema({
  supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true },
  name: { type: String, required: true },
  code: { type: String, required: true },
  address: { type: String, required: true },
  coordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  coldStorage: { type: Boolean, default: false },
  operatingHours: { type: String, default: '08:00 AM - 04:30 PM CST' }
});

export default mongoose.model<IDistributionCenter>('DistributionCenter', DistributionCenterSchema);
