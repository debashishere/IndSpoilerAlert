import { useState } from 'react';
import { Monitor, Smartphone, Eye, CheckCircle } from 'lucide-react';

export interface LiveDevicePreviewProps {
  subject: string;
  bodyHtml: string;
  context?: {
    buyer_name?: string;
    supplier_name?: string;
    lot_title?: string;
    quick_bid_link?: string;
    inventory_table?: string;
    [key: string]: any;
  };
  initialDeviceView?: 'desktop' | 'mobile';
  className?: string;
}

export function compileClientPreview(
  subject: string,
  bodyHtml: string,
  context: Record<string, any> = {}
) {
  const mergedContext: Record<string, any> = {
    buyer_name: 'FreshMart Wholesale',
    supplier_name: 'Unilever Supply Operations',
    lot_title: 'Surplus Dairy & Beverage Pack Lot #880',
    quick_bid_link: 'https://indspoileralert.com/bid?token=demo-token-123',
    ...context
  };

  if (!mergedContext.inventory_table) {
    mergedContext.inventory_table =
      `<table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; text-align: left; border: 1px solid hsl(var(--border-color)); background-color: white;">
        <thead>
          <tr style="background-color: hsl(var(--bg-card-hover)); border-bottom: 2px solid hsl(var(--border-color));">
            <th style="padding: 8px 12px; color: hsl(var(--text-muted));">SKU</th>
            <th style="padding: 8px 12px; color: hsl(var(--text-muted));">Description</th>
            <th style="padding: 8px 12px; color: hsl(var(--text-muted)); text-align: right;">Cases</th>
            <th style="padding: 8px 12px; color: hsl(var(--text-muted)); text-align: center;">Expiry</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom: 1px solid hsl(var(--border-color));">
            <td style="padding: 8px 12px;">SKU-9901</td>
            <td style="padding: 8px 12px; font-weight: 500;">Organic Almond Milk 1L</td>
            <td style="padding: 8px 12px; font-weight: bold; text-align: right;">240</td>
            <td style="padding: 8px 12px; color: hsl(var(--error)); text-align: center; font-weight: 600;">12 Days</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px;">SKU-9904</td>
            <td style="padding: 8px 12px; font-weight: 500;">Greek Yogurt 500g</td>
            <td style="padding: 8px 12px; font-weight: bold; text-align: right;">150</td>
            <td style="padding: 8px 12px; color: hsl(var(--warning)); text-align: center; font-weight: 600;">18 Days</td>
          </tr>
        </tbody>
      </table>`;
  }

  let compiledSubject = subject || '';
  let compiledBody = bodyHtml || '';

  // Replace data-token HTML pill components (e.g. <div data-token="inventory_table"...>...</div>)
  compiledBody = compiledBody.replace(
    /<(?:span|div|button|a)[^>]*data-token=["']([^"']+)["'][^>]*>[\s\S]*?<\/(?:span|div|button|a)>/gi,
    (match, tokenName) => {
      if (mergedContext[tokenName] !== undefined && mergedContext[tokenName] !== null) {
        return String(mergedContext[tokenName]);
      }
      return match;
    }
  );

  // Replace each configured context variable
  Object.keys(mergedContext).forEach((key) => {
    const val = mergedContext[key];
    if (val !== undefined && val !== null) {
      const regex = new RegExp(`\\{\\{\\{?${key}\\}?\\}\\}`, 'g');
      compiledSubject = compiledSubject.replace(regex, String(val));
      compiledBody = compiledBody.replace(regex, String(val));
    }
  });

  // Replaces remaining unmatched tokens {{token}} with fallback [token]
  compiledSubject = compiledSubject.replace(/\{\{\{?([a-zA-Z0-9_]+)\}?\}\}/g, (_, key) => `[${key}]`);
  compiledBody = compiledBody.replace(/\{\{\{?([a-zA-Z0-9_]+)\}?\}\}/g, (_, key) => `[${key}]`);

  return { compiledSubject, compiledBody };
}

export function LiveDevicePreview({
  subject,
  bodyHtml,
  context = {},
  initialDeviceView = 'desktop',
  className = ''
}: LiveDevicePreviewProps) {
  const [deviceView, setDeviceView] = useState<'desktop' | 'mobile'>(initialDeviceView);

  const { compiledSubject, compiledBody } = compileClientPreview(subject, bodyHtml, context);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Viewport Mode Controls */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
          <span className="text-xs font-bold text-slate-900 dark:text-slate-200">Live Device Viewport Preview</span>
          <span className="px-2 py-0.5 text-[10px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> Juice Inlined
          </span>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <button
            type="button"
            data-testid="device-toggle-desktop"
            onClick={() => setDeviceView('desktop')}
            className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
              deviceView === 'desktop'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" /> Desktop View
          </button>

          <button
            type="button"
            data-testid="device-toggle-mobile"
            onClick={() => setDeviceView('mobile')}
            className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
              deviceView === 'mobile'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" /> Mobile View
          </button>
        </div>
      </div>

      {/* Frame Container */}
      <div
        data-testid="live-device-preview"
        className={`mx-auto bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl transition-all duration-300 overflow-hidden ${
          deviceView === 'mobile' ? 'max-w-[375px] border-4 border-slate-300 dark:border-slate-800' : 'max-w-[600px] max-w-full'
        }`}
      >
        {/* Mobile Device Bar Header */}
        {deviceView === 'mobile' && (
          <div className="bg-slate-100 dark:bg-slate-900 px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 font-mono">
            <span>9:41 AM</span>
            <div className="w-16 h-3 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto" />
            <span>100% 🔋</span>
          </div>
        )}

        {/* Email Mailbox Header */}
        <div className="p-4 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
            <p>
              <strong className="text-slate-900 dark:text-slate-200">From:</strong> {context.supplier_name || 'Unilever Operations'} &lt;eveline94@ethereal.email&gt;
            </p>
            <span className="text-[10px] bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-700 dark:text-slate-400">100% Client Rendering</span>
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            <strong className="text-slate-900 dark:text-slate-200">To:</strong> {context.buyer_name || 'FreshMart Wholesale'} &lt;eveline94@ethereal.email&gt;
          </p>
          <p className="text-indigo-600 dark:text-indigo-400 font-bold font-mono pt-0.5">
            <strong className="text-slate-900 dark:text-slate-200">Subject:</strong> {compiledSubject}
          </p>
        </div>

        {/* Compiled Email Body Canvas */}
        <div
          data-testid="compiled-email-content"
          className="p-6 bg-white text-slate-900 min-h-[320px] text-sm overflow-x-auto font-sans leading-relaxed"
          dangerouslySetInnerHTML={{ __html: compiledBody }}
        />
      </div>
    </div>
  );
}
