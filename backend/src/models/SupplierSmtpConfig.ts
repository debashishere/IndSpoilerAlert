import mongoose, { Schema, Document } from 'mongoose';

export interface ISupplierSmtpConfig extends Document {
  supplierId: string;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  encryptedPass: string;
  senderName: string;
  senderEmail: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SupplierSmtpConfigSchema: Schema = new Schema(
  {
    supplierId: { type: String, required: true, unique: true, index: true },
    host: { type: String, required: true },
    port: { type: Number, default: 587 },
    secure: { type: Boolean, default: false },
    user: { type: String, required: true },
    encryptedPass: { type: String, required: true },
    senderName: { type: String, default: 'Spoiler Alert Operations' },
    senderEmail: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.SupplierSmtpConfig ||
  mongoose.model<ISupplierSmtpConfig>('SupplierSmtpConfig', SupplierSmtpConfigSchema);
