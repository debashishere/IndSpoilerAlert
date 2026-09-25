import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import EmailTemplate from '../models/EmailTemplate';
import Supplier from '../models/Supplier';

dotenv.config({ path: path.join(__dirname, '../../.env') });

export const BASELINE_B2B_EMAIL_TEMPLATES = [
  {
    templateId: 'default',
    name: 'Standard Liquidation Offer Sheet',
    category: 'clearance' as const,
    subject: 'Distressed Stock Clearance: {{lot_title}}',
    bodyHtml: `<div style="font-family: sans-serif; padding: 20px; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; background: #ffffff;">
      <h2 style="color: #4f46e5; margin-top: 0;">Clearance Opportunity | {{supplier_name}}</h2>
      <p>Hello <strong>{{buyer_name}}</strong>,</p>
      <p>We have immediate surplus inventory available for liquidation. Please review the itemized offer sheet below:</p>
      <div data-token="inventory_table" style="margin: 16px 0;">{{inventory_table}}</div>
      <br/>
      <p style="text-align: center;">
        <a href="{{quick_bid_link}}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
          Bid Now
        </a>
      </p>
    </div>`,
    availableTokens: ['buyer_name', 'lot_title', 'inventory_table', 'quick_bid_link', 'supplier_name'],
    isDefault: true,
  },
  {
    templateId: 'short-dated-auction',
    name: 'Urgent Short-Dated Surplus Auction Alert',
    category: 'auction' as const,
    subject: '🔥 Urgent Auction Notice: {{lot_title}}',
    bodyHtml: `<div style="font-family: sans-serif; padding: 20px; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #fecaca; border-radius: 8px; background: #fff5f5;">
      <div style="background-color: #dc2626; color: #ffffff; padding: 8px 12px; border-radius: 6px; font-weight: bold; font-size: 14px; text-align: center; margin-bottom: 16px;">
        ⚡ LIMITED TIME LIQUIDATION AUCTION
      </div>
      <p>Hi <strong>{{buyer_name}}</strong>,</p>
      <p>The following short-dated inventory has been scheduled for priority liquidation. Bidding closes soon:</p>
      <div data-token="inventory_table" style="margin: 16px 0;">{{inventory_table}}</div>
      <div style="text-align: center; margin-top: 24px;">
        <a href="{{quick_bid_link}}" style="background-color: #dc2626; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
          Place Auction Bid Now
        </a>
      </div>
    </div>`,
    availableTokens: ['buyer_name', 'lot_title', 'inventory_table', 'quick_bid_link', 'supplier_name'],
    isDefault: true,
  },
  {
    templateId: 'direct-donation-notice',
    name: 'Food Bank Direct Donation Transfer Notice',
    category: 'award' as const,
    subject: 'Surplus Inventory Donation Transfer Offer: {{lot_title}}',
    bodyHtml: `<div style="font-family: sans-serif; padding: 20px; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #bbf7d0; border-radius: 8px; background: #f0fdf4;">
      <h2 style="color: #166534; margin-top: 0;">🌱 Community Surplus Donation | {{supplier_name}}</h2>
      <p>Dear <strong>{{buyer_name}}</strong> partner,</p>
      <p>We are pleased to allocate the following fresh surplus products for zero-cost donation transfer:</p>
      <div data-token="inventory_table" style="margin: 16px 0;">{{inventory_table}}</div>
      <p style="font-size: 13px; color: #15803d; text-align: center; margin-top: 20px; font-weight: 600;">
        Thank you for helping divert quality food from landfill to families in need.
      </p>
    </div>`,
    availableTokens: ['buyer_name', 'lot_title', 'inventory_table', 'quick_bid_link', 'supplier_name'],
    isDefault: true,
  },
  {
    templateId: 'disposal-removal-notice',
    name: 'Scheduled Surplus Inventory Disposal & Removal Authorization',
    category: 'general' as const,
    subject: 'Disposal & Removal Authorization Notice: {{lot_title}}',
    bodyHtml: `<div style="font-family: sans-serif; padding: 20px; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc;">
      <h2 style="color: #475569; margin-top: 0;">🗑️ Scheduled Disposal & Removal Authorization | {{supplier_name}}</h2>
      <p>Dear <strong>{{buyer_name}}</strong> facility operator,</p>
      <p>The following surplus inventory has been authorized for scheduled disposal and bio-waste removal by {{disposal_deadline}}:</p>
      <div data-token="inventory_table" style="margin: 16px 0;">{{inventory_table}}</div>
      <p style="font-size: 12px; color: #64748b; margin-top: 16px;">
        Please arrange collection and certified destruction documentation according to statutory guidelines.
      </p>
    </div>`,
    availableTokens: ['buyer_name', 'lot_title', 'inventory_table', 'quick_bid_link', 'supplier_name', 'disposal_deadline'],
    isDefault: true,
  },
  {
    templateId: 'deal-confirmation-award',
    name: 'B2B Deal Confirmation & Award Notice',
    category: 'award' as const,
    subject: 'Deal Confirmed & Awarded: {{lot_title}}',
    bodyHtml: `<div style="font-family: sans-serif; padding: 20px; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #cbd5e1; border-radius: 8px; background: #ffffff;">
      <h2 style="color: #0f766e; margin-top: 0;">🎉 B2B Award Confirmation | {{supplier_name}}</h2>
      <p>Dear <strong>{{buyer_name}}</strong>,</p>
      <p>Congratulations! Your bid for the following surplus inventory lot has been accepted and awarded:</p>
      <div data-token="inventory_table" style="margin: 16px 0;">{{inventory_table}}</div>
      <p>Please inspect shipping dates and coordinate dock appointment details in the Buyer Portal.</p>
    </div>`,
    availableTokens: ['buyer_name', 'lot_title', 'inventory_table', 'quick_bid_link', 'supplier_name'],
    isDefault: false,
  },
  {
    templateId: 'b2b-bulk-clearance-digest',
    name: 'Weekly B2B Bulk Clearance Digest',
    category: 'clearance' as const,
    subject: 'Weekly Clearance Digest: Available Distressed Lots | {{supplier_name}}',
    bodyHtml: `<div style="font-family: sans-serif; padding: 20px; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; background: #ffffff;">
      <h2 style="color: #1e40af; margin-top: 0;">📦 Weekly B2B Clearance Digest</h2>
      <p>Hi <strong>{{buyer_name}}</strong>,</p>
      <p>Here is your weekly summary of available closeout and discounted surplus lots:</p>
      <div data-token="inventory_table" style="margin: 16px 0;">{{inventory_table}}</div>
      <p style="text-align: center; margin-top: 20px;">
        <a href="{{quick_bid_link}}" style="background-color: #1e40af; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
          View Digest & Bid
        </a>
      </p>
    </div>`,
    availableTokens: ['buyer_name', 'lot_title', 'inventory_table', 'quick_bid_link', 'supplier_name'],
    isDefault: false,
  },
];

export async function seedTemplates(): Promise<{ success: boolean; seededCount: number }> {
  let count = 0;
  const suppliers = await Supplier.find({});

  const targetSupplierIds: Array<mongoose.Types.ObjectId | string> = suppliers.map((s) => s._id);
  if (targetSupplierIds.length === 0) {
    targetSupplierIds.push('default-supplier');
  }

  for (const supplierId of targetSupplierIds) {
    for (const tpl of BASELINE_B2B_EMAIL_TEMPLATES) {
      await EmailTemplate.findOneAndUpdate(
        { supplierId, templateId: tpl.templateId },
        {
          supplierId,
          name: tpl.name,
          templateId: tpl.templateId,
          subject: tpl.subject,
          bodyHtml: tpl.bodyHtml,
          category: tpl.category,
          availableTokens: tpl.availableTokens,
          isDefault: tpl.isDefault,
        },
        { upsert: true, new: true }
      );
      count++;
    }
  }

  return { success: true, seededCount: count };
}

async function run() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ind-spoiler-alert';
    console.log(`Connecting to MongoDB at ${mongoUri}...`);
    await mongoose.connect(mongoUri);

    console.log('Seeding baseline B2B email templates into MongoDB...');
    const result = await seedTemplates();
    console.log(`Successfully seeded ${result.seededCount} baseline email templates.`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Failed to seed email templates:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  run();
}
