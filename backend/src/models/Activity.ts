import mongoose, { Schema, Document } from 'mongoose';

export interface IActivity extends Document {
  lotId?: mongoose.Types.ObjectId;
  type: string; // 'email' | 'call' | 'note' | etc.
  subject: string;
  content: string;
  recipient?: string;
  sender?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

const ActivitySchema: Schema = new Schema({
  lotId: { type: Schema.Types.ObjectId, ref: 'InventoryLot' },
  type: { type: String, required: true, default: 'email' },
  subject: { type: String, required: true },
  content: { type: String, required: true },
  recipient: { type: String },
  sender: { type: String },
  timestamp: { type: Date, default: Date.now },
  metadata: { type: Schema.Types.Mixed, default: {} }
});

export default mongoose.model<IActivity>('Activity', ActivitySchema);
