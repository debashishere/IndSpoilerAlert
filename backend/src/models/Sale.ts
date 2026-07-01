import mongoose, { Schema, Document } from 'mongoose';

export interface ISale extends Document {
  supplierId: mongoose.Types.ObjectId;
  buyerId?: mongoose.Types.ObjectId;
  lotId?: mongoose.Types.ObjectId;
  liquidationCycleId?: mongoose.Types.ObjectId;
  lotNumber: string;
  sku: string;
  description: string;
  quantityCases: number;
  pricePerCase: number;
  totalValue: number;
  saleDate: Date;
  status: 'scheduled' | 'confirmed' | 'in_transit' | 'delivered';
  buyerEmail?: string;
  invoiceNumber?: string;
  brand?: string;
  warehouse?: string;
  revenue?: number;
  reconciliationWarning?: string;
  metadata?: Record<string, string>;
  createdAt: Date;
  updatedAt?: Date;
}

const SaleSchema: Schema = new Schema({
  supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true },
  buyerId: { type: Schema.Types.ObjectId, ref: 'Buyer' },
  lotId: { type: Schema.Types.ObjectId, ref: 'InventoryLot' },
  liquidationCycleId: { type: Schema.Types.ObjectId, ref: 'LiquidationCycle' },
  lotNumber: { type: String, required: true },
  sku: { type: String, required: true },
  description: { type: String, required: true },
  quantityCases: { type: Number, required: true },
  pricePerCase: { type: Number, required: true },
  totalValue: { type: Number, required: true },
  saleDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['scheduled', 'confirmed', 'in_transit', 'delivered'], default: 'scheduled' },
  buyerEmail: { type: String },
  invoiceNumber: { type: String },
  brand: { type: String },
  warehouse: { type: String },
  revenue: { type: Number },
  reconciliationWarning: { type: String },
  metadata: { type: Schema.Types.Map, of: String }
}, {
  timestamps: true
});

SaleSchema.index(
  { supplierId: 1, invoiceNumber: 1, sku: 1 },
  { unique: true, partialFilterExpression: { invoiceNumber: { $exists: true, $ne: '' } } }
);

export default mongoose.model<ISale>('Sale', SaleSchema);
