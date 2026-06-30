import mongoose, { Schema, Document } from 'mongoose';

export interface IOpportunity extends Document {
  lotId: mongoose.Types.ObjectId;
  opportunityType: 'sell' | 'donate' | 'recycle' | 'destroy';
  priority: 'low' | 'medium' | 'high';
  recommendedAction: string;
  status: 'draft' | 'approved' | 'completed';
  createdAt: Date;
}

const OpportunitySchema: Schema = new Schema({
  lotId: { type: Schema.Types.ObjectId, ref: 'InventoryLot', required: true, unique: true },
  opportunityType: { type: String, enum: ['sell', 'donate', 'recycle', 'destroy'], default: 'sell' },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  recommendedAction: { type: String, required: true },
  status: { type: String, enum: ['draft', 'approved', 'completed'], default: 'draft' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IOpportunity>('Opportunity', OpportunitySchema);
