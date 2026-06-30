import mongoose, { Schema, Document } from 'mongoose';

export interface ILiquidationCycle extends Document {
  supplierId: mongoose.Types.ObjectId;
  name: string;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'closed';
  createdAt: Date;
  updatedAt: Date;
}

const LiquidationCycleSchema: Schema = new Schema({
  supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true },
  name: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { type: String, enum: ['active', 'closed'], default: 'active' }
}, {
  timestamps: true
});

export default mongoose.model<ILiquidationCycle>('LiquidationCycle', LiquidationCycleSchema);
