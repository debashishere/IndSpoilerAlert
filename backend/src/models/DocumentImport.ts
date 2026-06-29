import mongoose, { Schema, Document } from 'mongoose';

export interface IDocumentImport extends Document {
  supplierId?: string;
  fileName: string;
  checksum?: string;
  status: 'queued' | 'parsing' | 'uploaded' | 'parsed' | 'imported' | 'error';
  recordsParsed?: number;
  importErrors?: string[];
  rawGrid?: string[][];
  suggestedMapping?: Record<string, string>;
  s3Bucket?: string;
  s3Key?: string;
  createdAt: Date;
}

const DocumentImportSchema: Schema = new Schema({
  supplierId: { type: String, required: false },
  fileName: { type: String, required: true },
  checksum: { type: String, required: false },
  status: { type: String, enum: ['queued', 'parsing', 'uploaded', 'parsed', 'imported', 'error'], required: true },
  recordsParsed: { type: Number, default: 0 },
  importErrors: { type: [String], default: [] },
  rawGrid: { type: [[String]], default: [] },
  suggestedMapping: { type: Map, of: String, default: {} },
  s3Bucket: { type: String, required: false },
  s3Key: { type: String, required: false },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IDocumentImport>('DocumentImport', DocumentImportSchema);

