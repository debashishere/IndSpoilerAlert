// utils/emailHtmlTransformer.ts
/**
 * Email HTML Transformer
 * ──────────────────────
 * Converts Tiptap-generated HTML into email-client-safe HTML.
 *
 * Problem:
 *   Tiptap outputs modern semantic HTML (<figure>, <figcaption>, CSS classes).
 *   Email clients (especially Outlook) require table-based layouts and inline styles.
 *
 * Solution:
 *   This transformer flattens problematic nodes, inlines critical styles,
 *   and ensures tables have legacy attributes for maximum compatibility.
 */

interface TransformOptions {
  /** Replace {{inventory_table}} with actual rendered table HTML */
  inventoryTableHtml?: string;
  /** Base width for the email body */
  width?: number;
}

export function transformEmailHtml(
  rawHtml: string,
  options: TransformOptions = {}
): string {
  const { inventoryTableHtml, width = 600 } = options;

  let html = rawHtml;

  // ─── 1. Replace inventory token with rendered table ───────────
  if (inventoryTableHtml) {
    html = html.replace(
      /<span[^>]*data-inventory-table-token[^>]*>\{\{inventory_table\}\}<\/span>/g,
      inventoryTableHtml
    );
    // Also handle plain text tokens (fallback)
    html = html.replace(/\{\{inventory_table\}\}/g, inventoryTableHtml);
  }

  // ─── 2. Flatten <figure> → <div> + <p> for Outlook ────────────
  html = html.replace(
    /<figure\b([^>]*)>([\s\S]*?)<\/figure>/gi,
    (_match, attrs, content) => {
      const style = extractStyle(attrs) || 'margin: 16px 0;';
      return `<div style="${style} margin: 16px 0; text-align: center;">${content}</div>`;
    }
  );

  html = html.replace(
    /<figcaption\b([^>]*)>([\s\S]*?)<\/figcaption>/gi,
    (_match, _attrs, content) => {
      return `<p style="margin: 8px 0 0; font-size: 14px; color: #6b7280; text-align: center;">${content}</p>`;
    }
  );

  // ─── 3. Ensure tables are email-safe ──────────────────────────
  html = html.replace(
    /<table\b([^>]*)>/gi,
    (_match, attrs) => {
      const existingStyle = extractStyle(attrs) || '';
      const mergedStyle = mergeStyles(existingStyle, 'width: 100%; border-collapse: collapse;');
      return `<table ${attrs} cellpadding="0" cellspacing="0" border="0" style="${mergedStyle}" width="100%">`;
    }
  );

  html = html.replace(
    /<th\b([^>]*)>/gi,
    (_match, attrs) => {
      const existingStyle = extractStyle(attrs) || '';
      const mergedStyle = mergeStyles(
        existingStyle,
        'padding: 10px; border: 1px solid #d1d5db; background-color: #f3f4f6; font-weight: 600; text-align: left;'
      );
      return `<th style="${mergedStyle}">`;
    }
  );

  html = html.replace(
    /<td\b([^>]*)>/gi,
    (_match, attrs) => {
      const existingStyle = extractStyle(attrs) || '';
      const mergedStyle = mergeStyles(
        existingStyle,
        'padding: 10px; border: 1px solid #d1d5db;'
      );
      return `<td style="${mergedStyle}">`;
    }
  );

  // ─── 4. Inline heading styles ─────────────────────────────────
  const headingStyles: Record<string, string> = {
    h1: 'font-size: 24px; font-weight: 700; margin: 16px 0; color: #111827;',
    h2: 'font-size: 20px; font-weight: 600; margin: 14px 0; color: #1f2937;',
    h3: 'font-size: 18px; font-weight: 600; margin: 12px 0; color: #374151;',
  };

  Object.entries(headingStyles).forEach(([tag, style]) => {
    const regex = new RegExp(`<${tag}\b([^>]*)>`, 'gi');
    html = html.replace(regex, (_match, attrs) => {
      const existing = extractStyle(attrs) || '';
      return `<${tag} style="${mergeStyles(existing, style)}">`;
    });
  });

  // ─── 5. Wrap in email-safe container ──────────────────────────
  html = `
    <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
    <html xmlns="http://www.w3.org/1999/xhtml">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Inventory Offer</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f3f4f6;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td align="center" style="padding: 20px 0;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="${width}" style="max-width: ${width}px; width: 100%; background-color: #ffffff;">
              <tr>
                <td style="padding: 24px; font-family: Arial, Helvetica, sans-serif; font-size: 16px; line-height: 1.5; color: #374151;">
                  ${html}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `.trim();

  return html;
}

// ─── Helpers ────────────────────────────────────────────────────

function extractStyle(attrs: string): string | null {
  const match = attrs.match(/style=["']([^"']+)["']/i);
  return match ? match[1] : null;
}

function mergeStyles(existing: string, additional: string): string {
  const existingMap = parseStyle(existing);
  const additionalMap = parseStyle(additional);
  const merged = { ...additionalMap, ...existingMap }; // existing wins conflicts
  return Object.entries(merged)
    .map(([k, v]) => `${k}: ${v}`)
    .join('; ');
}

function parseStyle(styleStr: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!styleStr) return result;

  styleStr.split(';').forEach((decl) => {
    const [prop, val] = decl.split(':');
    if (prop && val) {
      result[prop.trim()] = val.trim();
    }
  });

  return result;
}