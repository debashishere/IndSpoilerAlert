import Handlebars from 'handlebars';
const juice = require('juice');

export interface InventoryItemContext {
  sku?: string;
  description?: string;
  cases?: number | string;
  expiryDays?: number | string;
  unitPrice?: number | string;
  discount?: string;
}

export interface EmailCompilationContext {
  buyer_name?: string;
  supplier_name?: string;
  lot_title?: string;
  quick_bid_link?: string;
  inventory_table?: string | InventoryItemContext[];
  inventoryItems?: InventoryItemContext[];
  [key: string]: any;
}

/**
 * Generate clean HTML table for inventory items with inline styling for Outlook & Gmail
 */
export function generateSampleInventoryTable(items?: InventoryItemContext[]): string {
  const defaultItems: InventoryItemContext[] = [
    { sku: 'SKU-9901', description: 'Organic Almond Milk 1L', cases: 240, expiryDays: 12 },
    { sku: 'SKU-9904', description: 'Greek Yogurt 500g', cases: 150, expiryDays: 18 },
    { sku: 'SKU-9908', description: 'Oat Milk Barista Edition 1L', cases: 180, expiryDays: 22 }
  ];

  const itemList = items && items.length > 0 ? items : defaultItems;

  const rows = itemList
    .map(
      (item) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 10px 14px; font-family: sans-serif; font-size: 13px; color: #1e293b; border: 1px solid #e2e8f0;">${item.sku || 'SKU-000'}</td>
        <td style="padding: 10px 14px; font-family: sans-serif; font-size: 13px; color: #1e293b; border: 1px solid #e2e8f0; font-weight: 500;">${item.description || 'Surplus Item'}</td>
        <td style="padding: 10px 14px; font-family: sans-serif; font-size: 13px; color: #0f172a; font-weight: bold; border: 1px solid #e2e8f0; text-align: right;">${item.cases || 0}</td>
        <td style="padding: 10px 14px; font-family: sans-serif; font-size: 13px; color: #dc2626; font-weight: 600; border: 1px solid #e2e8f0; text-align: center;">${item.expiryDays ? `${item.expiryDays} Days` : 'N/A'}</td>
      </tr>`
    )
    .join('');

  return `
    <table style="width: 100%; max-width: 600px; border-collapse: collapse; margin: 16px 0; font-family: sans-serif; border: 1px solid #cbd5e1; background-color: #ffffff;">
      <thead>
        <tr style="background-color: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
          <th style="padding: 10px 14px; text-align: left; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; border: 1px solid #cbd5e1;">SKU</th>
          <th style="padding: 10px 14px; text-align: left; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; border: 1px solid #cbd5e1;">Description</th>
          <th style="padding: 10px 14px; text-align: right; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; border: 1px solid #cbd5e1;">Cases</th>
          <th style="padding: 10px 14px; text-align: center; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; border: 1px solid #cbd5e1;">Shelf Life</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
}

// Register Handlebars helper for unescaped HTML table rendering
Handlebars.registerHelper('inventory_table', function (this: any) {
  const tableVal = this?.inventory_table || this?.inventoryItems;
  if (tableVal instanceof Handlebars.SafeString || (tableVal && typeof tableVal === 'object' && 'string' in tableVal)) {
    return tableVal;
  }
  if (typeof tableVal === 'string') {
    return new Handlebars.SafeString(tableVal);
  }
  if (Array.isArray(tableVal)) {
    return new Handlebars.SafeString(generateSampleInventoryTable(tableVal));
  }
  return new Handlebars.SafeString(generateSampleInventoryTable());
});

// Register Handlebars helper for unescaped URL links
Handlebars.registerHelper('quick_bid_link', function (this: any) {
  const link = this?.quick_bid_link || 'https://indspoileralert.com/bid?token=sample-quick-bid-token';
  return new Handlebars.SafeString(link);
});

/**
 * Pre-processes context defaults for missing token values
 */
function normalizeContext(context: EmailCompilationContext = {}): EmailCompilationContext {
  const normalized: EmailCompilationContext = { ...context };

  if (!normalized.buyer_name) {
    if (normalized.buyer && typeof normalized.buyer === 'object') {
      normalized.buyer_name = normalized.buyer.companyName || normalized.buyer.name || 'Valued Buyer';
    } else {
      normalized.buyer_name = 'Valued Buyer';
    }
  }

  if (!normalized.supplier_name) {
    normalized.supplier_name = 'IndSpoiler Alert Operations';
  }
  if (!normalized.lot_title) {
    normalized.lot_title = 'Surplus Liquidation Lot';
  }
  if (!normalized.quick_bid_link) {
    normalized.quick_bid_link = 'https://indspoileralert.com/bid?token=sample-quick-bid-token';
  }

  if (!normalized.header) {
    normalized.header = new Handlebars.SafeString(
      `<div style="background-color: #4f46e5; color: #ffffff; padding: 14px 20px; border-radius: 8px; font-family: sans-serif; text-align: center; margin-bottom: 16px;">` +
      `<h2 style="margin: 0; font-size: 18px; font-weight: bold; color: #ffffff;">Clearance Opportunity | ${normalized.supplier_name || 'IndSpoiler Alert Operations'}</h2>` +
      `</div>`
    ) as any;
  } else if (typeof normalized.header === 'string') {
    normalized.header = new Handlebars.SafeString(normalized.header) as any;
  }

  if (typeof normalized.quick_bid_link === 'string') {
    normalized.quick_bid_link = new Handlebars.SafeString(normalized.quick_bid_link) as any;
  }

  if (typeof normalized.inventory_table === 'string') {
    normalized.inventory_table = new Handlebars.SafeString(normalized.inventory_table) as any;
  } else if (Array.isArray(normalized.inventory_table)) {
    normalized.inventory_table = new Handlebars.SafeString(generateSampleInventoryTable(normalized.inventory_table)) as any;
  } else if (!normalized.inventory_table) {
    normalized.inventory_table = new Handlebars.SafeString(generateSampleInventoryTable()) as any;
  }

  return normalized;
}

/**
 * Compile subject line with Handlebars token interpolation
 */
export function compileSubject(subjectTemplate: string = '', context: EmailCompilationContext = {}): string {
  if (!subjectTemplate) return '';
  const normCtx = normalizeContext(context);
  const template = Handlebars.compile(subjectTemplate);
  return template(normCtx);
}

/**
 * Compile raw HTML template string with Handlebars token substitution and Juice CSS inlining
 */
export function compileTemplate(
  htmlTemplate: string = '',
  context: EmailCompilationContext = {},
  options: { inlineCss?: boolean } = { inlineCss: true }
): string {
  if (!htmlTemplate) return '';

  // Transform data-token UI pill elements into Handlebars placeholders (e.g. data-token="inventory_table" -> {{{inventory_table}}})
  let preprocessedHtml = htmlTemplate.replace(
    /<(?:span|div|button|a)[^>]*data-token=["']([^"']+)["'][^>]*>[\s\S]*?<\/(?:span|div|button|a)>/gi,
    (match, tokenName) => {
      if (tokenName === 'inventory_table' || tokenName === 'header') {
        return `{{{${tokenName}}}}`;
      }
      return `{{${tokenName}}}`;
    }
  );

  const normCtx = normalizeContext(context);
  const compiledTpl = Handlebars.compile(preprocessedHtml);
  const rawCompiledHtml = compiledTpl(normCtx);

  if (options.inlineCss === false) {
    return rawCompiledHtml;
  }

  // Apply Juice CSS Inlining for Outlook/Gmail rendering compatibility
  const inlinedHtml = juice(rawCompiledHtml, {
    applyAttributesTableElements: true,
    applyWidthAttributes: true,
    preserveImportant: true,
    preserveMediaQueries: true
  });

  return inlinedHtml;
}
