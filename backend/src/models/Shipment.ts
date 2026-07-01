import mongoose, { Schema, Document } from 'mongoose';

export interface ITemperatureLog {
  timestamp: Date;
  temperature: number;
}

export interface IShipment extends Document {
  awardId: mongoose.Types.ObjectId;
  carrier: string;
  pickupLocation: string;
  deliveryLocation: string;
  status: 'scheduled' | 'confirmed' | 'in_transit' | 'delivered';
  temperature?: string;
  bolNumber?: string;
  bolPdfUrl?: string;
  carrierName?: string;
  carrierDotNumber?: string;
  pickupWindowStart?: Date;
  pickupWindowEnd?: Date;
  temperatureLogs?: ITemperatureLog[];
  createdAt: Date;
}

const ShipmentSchema: Schema = new Schema({
  awardId: { type: Schema.Types.ObjectId, ref: 'Award', required: true },
  carrier: { type: String, required: true },
  pickupLocation: { type: String, required: true },
  deliveryLocation: { type: String, required: true },
  status: { type: String, enum: ['scheduled', 'confirmed', 'in_transit', 'delivered'], default: 'scheduled' },
  temperature: { type: String },
  bolNumber: { type: String },
  bolPdfUrl: { type: String },
  carrierName: { type: String },
  carrierDotNumber: { type: String },
  pickupWindowStart: { type: Date },
  pickupWindowEnd: { type: Date },
  temperatureLogs: [{
    timestamp: { type: Date, default: Date.now },
    temperature: { type: Number, required: true }
  }],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IShipment>('Shipment', ShipmentSchema);
