import mongoose, { Schema, Document } from 'mongoose';
import { ISyncMetrics } from './GoogleSheetsSyncConfig';

export interface IZapDeliveryLog {
  timestamp: Date;
  httpStatus: number;
  latencyMs: number;
  samplePayload?: any;
  message?: string;
  status: 'success' | 'error';
}

export interface IConnectedZap {
  zapId: string;
  zapName: string;
  triggerEvent?: string;
  status: 'active' | 'paused' | 'error' | 'archived';
  lotCount?: number;
  lastSyncedAt?: Date;
  lastSyncMetrics: ISyncMetrics;
  supplierTemplateId?: mongoose.Types.ObjectId;
}

export interface IZapierSyncConfig extends Document {
  supplierId: mongoose.Types.ObjectId;
  ingressKey: string;
  connectedZaps: IConnectedZap[];
  deliveryLogs: IZapDeliveryLog[];
  createdAt: Date;
  updatedAt: Date;
}

const ZapDeliveryLogSchema: Schema = new Schema(
  {
    timestamp: { type: Date, default: Date.now },
    httpStatus: { type: Number, required: true },
    latencyMs: { type: Number, default: 0 },
    samplePayload: { type: Schema.Types.Mixed },
    message: { type: String },
    status: { type: String, enum: ['success', 'error'], required: true }
  },
  { _id: false }
);

const ConnectedZapSchema: Schema = new Schema(
  {
    zapId: { type: String, required: true },
    zapName: { type: String, required: true, default: 'Zapier Feed' },
    triggerEvent: { type: String, default: 'new_inventory_lot' },
    status: {
      type: String,
      enum: ['active', 'paused', 'error', 'archived'],
      default: 'active'
    },
    lotCount: { type: Number, default: 0 },
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
  { _id: false }
);

const ZapierSyncConfigSchema: Schema = new Schema(
  {
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true, index: true },
    ingressKey: { type: String, required: true, unique: true, index: true },
    connectedZaps: { type: [ConnectedZapSchema], default: [] },
    deliveryLogs: { type: [ZapDeliveryLogSchema], default: [] }
  },
  {
    timestamps: true
  }
);

export default mongoose.model<IZapierSyncConfig>('ZapierSyncConfig', ZapierSyncConfigSchema);
