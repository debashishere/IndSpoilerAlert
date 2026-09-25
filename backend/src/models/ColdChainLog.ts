import mongoose, { Schema, Document } from 'mongoose';

export interface IFSMA204Audit {
  verified: boolean;
  auditTimestamp?: Date;
  traceabilityCode?: string;
  inspectorName?: string;
}

export interface IColdChainLog extends Document {
  shipmentId?: mongoose.Types.ObjectId;
  lotId?: mongoose.Types.ObjectId;
  temperature: number;
  unit: string;
  recordedBy?: string;
  complianceStatus: 'compliant' | 'warning' | 'breach';
  fsma204Audit: IFSMA204Audit;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ColdChainLogSchema: Schema = new Schema(
  {
    shipmentId: { type: Schema.Types.ObjectId, ref: 'Shipment' },
    lotId: { type: Schema.Types.ObjectId, ref: 'InventoryLot' },
    temperature: { type: Number, required: true },
    unit: { type: String, default: '°F' },
    recordedBy: { type: String, default: 'System Logger' },
    complianceStatus: {
      type: String,
      enum: ['compliant', 'warning', 'breach'],
      default: 'compliant',
    },
    fsma204Audit: {
      verified: { type: Boolean, default: true },
      auditTimestamp: { type: Date, default: Date.now },
      traceabilityCode: { type: String, default: () => `KDE-FSMA-${Date.now().toString(36).toUpperCase()}` },
      inspectorName: { type: String },
    },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model<IColdChainLog>('ColdChainLog', ColdChainLogSchema);
