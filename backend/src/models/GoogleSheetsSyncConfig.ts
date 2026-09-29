import mongoose, { Schema, Document } from 'mongoose';

export interface ISyncMetrics {
  totalRows: number;
  inserted: number;
  updated: number;
  depleted: number;
  errors: string[];
}

export interface IGoogleSheetsSyncConfig extends Document {
  supplierId: mongoose.Types.ObjectId;
  spreadsheetId: string;
  sheetName: string;
  ingressKey: string;
  syncStatus: 'idle' | 'syncing' | 'error' | 'success';
  lastSyncedAt?: Date;
  lastSyncMetrics: ISyncMetrics;
  supplierTemplateId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const GoogleSheetsSyncConfigSchema: Schema = new Schema(
  {
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true, index: true },
    spreadsheetId: { type: String, required: true },
    sheetName: { type: String, required: true, default: 'Sheet1' },
    ingressKey: { type: String, required: true, unique: true, index: true },
    syncStatus: {
      type: String,
      enum: ['idle', 'syncing', 'error', 'success'],
      default: 'idle'
    },
    lastSyncedAt: { type: Date },
    lastSyncMetrics: {
      totalRows: { type: Number, default: 0 },
      inserted: { type: Number, default: 0 },
      updated: { type: Number, default: 0 },
      depleted: { type: Number, default: 0 },
      errors: { type: [String], default: [] }
    },
    supplierTemplateId: { type: Schema.Types.ObjectId, ref: 'SupplierTemplate' }
  },
  {
    timestamps: true
  }
);

export default mongoose.model<IGoogleSheetsSyncConfig>('GoogleSheetsSyncConfig', GoogleSheetsSyncConfigSchema);
