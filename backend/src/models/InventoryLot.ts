import mongoose, { Schema, Document } from 'mongoose';

export interface IInventoryLot extends Document {
  supplierId: string;
  distributionCenterId: string;
  productId: string;
  liquidationCycleId?: string;
  lotNumber: string;
  productionDate?: Date;
  expirationDate: Date;
  remainingShelfLife: number; // remaining ratio (0 to 1)
  quantityCases: number;
  availableQty: number;
  costPerCase: number;
  standardSellPrice: number;
  status: 'pending' | 'active' | 'sold' | 'expired' | 'donated' | 'recycled';
  comment?: string;
  latestSalesDate?: Date;
  attributes?: Map<string, any>;
  rawAttributes?: Map<string, any>;
  fdaRegulated?: boolean;
  complianceDocs?: mongoose.Types.ObjectId[];
  temperatureMin?: number;
  temperatureMax?: number;
  createdAt: Date;
  updatedAt?: Date;
}

const InventoryLotSchema: Schema = new Schema({
  supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true },
  distributionCenterId: { type: Schema.Types.ObjectId, ref: 'DistributionCenter', required: true },
  productId: { type: Schema.Types.ObjectId, ref: 'ProductMaster', required: true },
  liquidationCycleId: { type: Schema.Types.ObjectId, ref: 'LiquidationCycle' },
  lotNumber: { type: String, required: true },
  productionDate: { type: Date },
  expirationDate: { type: Date, required: true },
  remainingShelfLife: { type: Number, default: 1 },
  quantityCases: { type: Number, required: true },
  availableQty: { type: Number, required: true },
  costPerCase: { type: Number, required: true },
  standardSellPrice: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'active', 'sold', 'expired', 'donated', 'recycled'],
    default: 'pending'
  },
  comment: { type: String, default: '' },
  latestSalesDate: { type: Date },
  attributes: { type: Map, of: Schema.Types.Mixed, default: {} },
  rawAttributes: { type: Map, of: Schema.Types.Mixed, default: {} },

  fdaRegulated: { type: Boolean, default: false },
  complianceDocs: [{ type: Schema.Types.ObjectId, ref: 'ComplianceDocument' }],
  temperatureMin: { type: Number },
  temperatureMax: { type: Number }
}, {
  timestamps: true
});


export default mongoose.model<IInventoryLot>('InventoryLot', InventoryLotSchema);
