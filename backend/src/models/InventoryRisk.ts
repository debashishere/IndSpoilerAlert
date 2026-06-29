import mongoose, { Schema, Document } from 'mongoose';

export interface IInventoryRisk extends Document {
  lotId: mongoose.Types.ObjectId;
  riskScore: number;
  daysRemaining: number;
  velocityScore: number;
  riskCategory: 'low' | 'medium' | 'high' | 'critical';
  predictedWaste: number;
  lastEvaluated: Date;
}

const InventoryRiskSchema: Schema = new Schema({
  lotId: { type: Schema.Types.ObjectId, ref: 'InventoryLot', required: true, unique: true },
  riskScore: { type: Number, required: true },
  daysRemaining: { type: Number, required: true },
  velocityScore: { type: Number, required: true },
  riskCategory: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'low' },
  predictedWaste: { type: Number, required: true },
  lastEvaluated: { type: Date, default: Date.now }
});

export default mongoose.model<IInventoryRisk>('InventoryRisk', InventoryRiskSchema);
