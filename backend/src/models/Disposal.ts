import mongoose, { Schema, Document } from 'mongoose';

export interface IDisposal extends Document {
  lotId: mongoose.Types.ObjectId;
  method: 'recycle' | 'destroy';
  facility: string;
  landfillFee: number;
  recyclingFee: number;
  completedDate: Date;
  createdAt: Date;
}

const DisposalSchema: Schema = new Schema({
  lotId: { type: Schema.Types.ObjectId, ref: 'InventoryLot', required: true },
  method: { type: String, enum: ['recycle', 'destroy'], required: true },
  facility: { type: String, required: true },
  landfillFee: { type: Number, required: true },
  recyclingFee: { type: Number, required: true },
  completedDate: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IDisposal>('Disposal', DisposalSchema);
