import mongoose, { Schema, Document } from 'mongoose';

export interface IEmailTemplate extends Document {
  supplierId: mongoose.Types.ObjectId | string;
  name: string;
  templateId: string;
  subject: string;
  bodyHtml: string;
  bodyText?: string;
  category: 'clearance' | 'auction' | 'award' | 'general';
  availableTokens: string[];
  isDefault?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const EmailTemplateSchema: Schema = new Schema(
  {
    supplierId: { type: Schema.Types.Mixed, required: true },
    name: { type: String, required: true },
    templateId: { type: String, required: true, default: 'default' },
    subject: { type: String, required: true },
    bodyHtml: { type: String, required: true },
    bodyText: { type: String },
    category: { type: String, enum: ['clearance', 'auction', 'award', 'general'], default: 'clearance' },
    availableTokens: {
      type: [String],
      default: ['buyer_name', 'lot_title', 'inventory_table', 'quick_bid_link', 'supplier_name']
    },
    isDefault: { type: Boolean, default: false }
  },
  { timestamps: true }
);

EmailTemplateSchema.index({ supplierId: 1, templateId: 1 }, { unique: true });

export default mongoose.models.EmailTemplate || mongoose.model<IEmailTemplate>('EmailTemplate', EmailTemplateSchema);
