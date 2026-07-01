import mongoose, { Schema, Document } from 'mongoose';

export interface ISupplierOAuthMailbox extends Document {
  supplierId: string;
  accountId?: string;
  userEmail?: string;
  accessToken?: string;
  refreshToken?: string;
  status: 'connected' | 'missing' | 'expired';
  createdAt: Date;
  updatedAt: Date;
}

const SupplierOAuthMailboxSchema: Schema = new Schema(
  {
    supplierId: { type: String, required: true, unique: true },
    accountId: { type: String },
    userEmail: { type: String },
    accessToken: { type: String },
    refreshToken: { type: String },
    status: { 
      type: String, 
      enum: ['connected', 'missing', 'expired'], 
      default: 'missing' 
    }
  },
  { timestamps: true }
);

export default mongoose.models.SupplierOAuthMailbox || mongoose.model<ISupplierOAuthMailbox>('SupplierOAuthMailbox', SupplierOAuthMailboxSchema);
