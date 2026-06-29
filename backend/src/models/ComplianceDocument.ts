import mongoose, { Schema, Document } from 'mongoose';

export interface IComplianceDocument extends Document {
  lotId: mongoose.Types.ObjectId;
  docType: 'COA' | 'BATCH_RECORD' | 'FSMA_ATTESTATION' | 'ORGANIC_CERT';
  s3Url: string;
  verified: boolean;
  createdAt: Date;
}

const ComplianceDocumentSchema: Schema = new Schema({
  lotId: { type: Schema.Types.ObjectId, ref: 'InventoryLot', required: true },
  docType: { 
    type: String, 
    enum: ['COA', 'BATCH_RECORD', 'FSMA_ATTESTATION', 'ORGANIC_CERT'], 
    required: true 
  },
  s3Url: { type: String, required: true },
  verified: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IComplianceDocument>('ComplianceDocument', ComplianceDocumentSchema);
