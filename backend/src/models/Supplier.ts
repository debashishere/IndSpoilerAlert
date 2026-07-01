import mongoose, { Schema, Document } from 'mongoose';

export interface ISupplier extends Document {
  name: string;
  companyCode: string;
  preferredDisposition: 'sell' | 'donate' | 'recycle' | 'destroy';
  active: boolean;
  createdAt: Date;
}

const SupplierSchema: Schema = new Schema({
  name: { type: String, required: true },
  companyCode: { type: String, required: true, unique: true },
  preferredDisposition: { type: String, enum: ['sell', 'donate', 'recycle', 'destroy'], default: 'sell' },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<ISupplier>('Supplier', SupplierSchema);
