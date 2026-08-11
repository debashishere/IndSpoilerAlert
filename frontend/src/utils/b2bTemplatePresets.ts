// frontend/src/utils/b2bTemplatePresets.ts
export interface B2BTemplatePreset {
  templateId: string;
  name: string;
  category: 'clearance' | 'auction' | 'award' | 'general';
  subject: string;
  bodyHtml: string;
  availableTokens: string[];
  isDefault?: boolean;
}

export const DEFAULT_B2B_TOKENS = [
  'buyer_name',
  'lot_title',
  'inventory_table',
  'quick_bid_link',
  'supplier_name'
];

export const B2B_TEMPLATE_PRESETS: B2BTemplatePreset[] = [
  {
    templateId: 'b2b-inventory-offer-sheet',
    name: 'B2B Inventory Offer Sheet',
    category: 'clearance',
    subject: 'Distressed Stock Clearance: {{lot_title}}',
    bodyHtml: `<p>Dear {{buyer_name}},</p><p>We have immediate distressed stock available for liquidation. Please review the itemized inventory below:</p>{{inventory_table}}<p style="text-align: center; margin-top: 20px;"><a href="{{quick_bid_link}}" style="background-color: #2196f3; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Submit 1-Click Bid</a></p><p style="font-size: 12px; color: #5d7a9e; margin-top: 16px;">Sent via IndSpoilerAlert Email Hub | {{supplier_name}}</p>`,
    availableTokens: DEFAULT_B2B_TOKENS,
    isDefault: true
  },
  {
    templateId: 'short-dated-flash-sale',
    name: 'Short-Dated Flash Sale',
    category: 'auction',
    subject: '⚡ Flash Sale: Short-Dated {{lot_title}} Available Now',
    bodyHtml: `<h2 style="color: #0d47a1;">Time-Sensitive Clearance Opportunity</h2><p>Dear {{buyer_name}},</p><p>We have loaded a high-priority short-dated inventory lot: <strong>{{lot_title}}</strong>.</p>{{inventory_table}}<p style="text-align: center; margin: 20px 0;"><a href="{{quick_bid_link}}" style="background-color: #0d47a1; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Review & Place Instant Bid</a></p><p style="font-size: 12px; color: #5d7a9e;">Dispatched by {{supplier_name}}</p>`,
    availableTokens: DEFAULT_B2B_TOKENS
  },
  {
    templateId: 'bulk-clearance-announcement',
    name: 'Bulk Clearance Announcement',
    category: 'clearance',
    subject: 'Bulk Inventory Liquidation Notice: {{lot_title}}',
    bodyHtml: `<h2>Bulk Stock Liquidation Notice</h2><p>Attention {{buyer_name}} Purchasing Team,</p><p>The following bulk surplus lot <strong>{{lot_title}}</strong> is open for purchase inquiries and immediate tender:</p>{{inventory_table}}<p style="text-align: center; margin-top: 24px;"><a href="{{quick_bid_link}}" style="background-color: #2196f3; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Submit Purchase Order</a></p><p style="font-size: 12px; color: #5d7a9e;">Supplier Contact: {{supplier_name}}</p>`,
    availableTokens: DEFAULT_B2B_TOKENS
  },
  {
    templateId: 'blank-slate',
    name: 'Blank Slate',
    category: 'general',
    subject: 'Custom Announcement: {{lot_title}}',
    bodyHtml: '<p></p>',
    availableTokens: DEFAULT_B2B_TOKENS
  }
];

export function getAllB2BPresets(): B2BTemplatePreset[] {
  return B2B_TEMPLATE_PRESETS;
}

export function getB2BPresetById(templateId: string): B2BTemplatePreset | undefined {
  return B2B_TEMPLATE_PRESETS.find((preset) => preset.templateId === templateId);
}
