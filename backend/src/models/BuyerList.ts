import mongoose, { Schema, Document } from 'mongoose';

export interface IBuyerList extends Document {
  name: string;
  type: 'primary' | 'secondary' | 'custom';
  buyerIds: mongoose.Types.ObjectId[];
  supplierId?: mongoose.Types.ObjectId;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BuyerListSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ['primary', 'secondary', 'custom'],
      default: 'custom',
      required: true,
    },
    buyerIds: [{ type: Schema.Types.ObjectId, ref: 'Buyer' }],
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier' },
    description: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model<IBuyerList>('BuyerList', BuyerListSchema);
