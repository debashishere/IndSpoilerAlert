import mongoose, { Schema, Document } from 'mongoose';

export interface IDockAppointment extends Document {
  shipmentId?: mongoose.Types.ObjectId;
  pickupWindowStart: Date;
  pickupWindowEnd: Date;
  carrierName: string;
  carrierDotNumber?: string;
  dockDoor?: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  slaMet?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DockAppointmentSchema: Schema = new Schema(
  {
    shipmentId: { type: Schema.Types.ObjectId, ref: 'Shipment' },
    pickupWindowStart: { type: Date, required: true },
    pickupWindowEnd: { type: Date, required: true },
    carrierName: { type: String, required: true },
    carrierDotNumber: { type: String },
    dockDoor: { type: String, default: 'Door 1' },
    status: {
      type: String,
      enum: ['scheduled', 'confirmed', 'completed', 'cancelled'],
      default: 'confirmed',
    },
    notes: { type: String },
    slaMet: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<IDockAppointment>('DockAppointment', DockAppointmentSchema);
