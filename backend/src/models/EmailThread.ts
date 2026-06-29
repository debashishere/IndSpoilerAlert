import mongoose, { Schema, Document } from 'mongoose';

export interface IEmailMessage {
  messageId: string;
  senderType: 'supplier' | 'buyer' | 'system';
  senderEmail: string;
  body: string;
  sentAt: Date;
  messageIdHeader?: string;
}

export interface IEmailThread extends Document {
  threadId: string;
  supplierId: string;
  buyerEmail: string;
  listingId?: string;
  campaignId?: string;
  subject: string;
  status: 'active' | 'closed' | 'awarded';
  openCount: number;
  firstOpenedAt?: Date;
  lastOpenedAt?: Date;
  messages: IEmailMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const EmailMessageSchema: Schema = new Schema({
  messageId: { type: String, required: true },
  senderType: { type: String, enum: ['supplier', 'buyer', 'system'], default: 'supplier' },
  senderEmail: { type: String, required: true },
  body: { type: String, required: true },
  sentAt: { type: Date, default: Date.now },
  messageIdHeader: { type: String }
});

const EmailThreadSchema: Schema = new Schema(
  {
    threadId: { type: String, required: true, unique: true, index: true },
    supplierId: { type: String, required: true, index: true },
    buyerEmail: { type: String, required: true, index: true },
    listingId: { type: String, index: true },
    campaignId: { type: String },
    subject: { type: String, required: true },
    status: { type: String, enum: ['active', 'closed', 'awarded'], default: 'active' },
    openCount: { type: Number, default: 0 },
    firstOpenedAt: { type: Date },
    lastOpenedAt: { type: Date },
    messages: [EmailMessageSchema]
  },
  { timestamps: true }
);

export default mongoose.models.EmailThread ||
  mongoose.model<IEmailThread>('EmailThread', EmailThreadSchema);
