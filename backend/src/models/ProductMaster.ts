import mongoose, { Schema, Document } from 'mongoose';

export interface IProductMaster extends Document {
  supplierId: string;
  sku: string;
  gtin?: string;
  brand?: string;
  category: string;
  subCategory?: string;
  description: string;
  shelfLifeDays: number;
  allergens?: string[];
}

const ProductMasterSchema: Schema = new Schema({
  supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true },
  sku: { type: String, required: true },
  gtin: { type: String },
  brand: { type: String },
  category: { type: String, required: true },
  subCategory: { type: String },
  description: { type: String, required: true },
  shelfLifeDays: { type: Number, required: true, default: 30 },
  allergens: { type: [String], default: [] }
});

ProductMasterSchema.index({ supplierId: 1, sku: 1 }, { unique: true });

export default mongoose.model<IProductMaster>('ProductMaster', ProductMasterSchema);
