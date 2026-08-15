import React, { useState, useEffect, useRef } from 'react';
import { LiveDevicePreview } from './LiveDevicePreview';
import { B2B_TEMPLATE_PRESETS, getB2BPresetById } from '../utils/b2bTemplatePresets';
import {
  Sparkles,
  Bold,
  Italic,
  List,
  Heading2,
  Link,
  Code,
  Save,
  CheckCircle2,
  RefreshCw,
  Tag,
  Layers,
  FileCode,
  LayoutTemplate,
  Plus,
  X,
  Database,
  Box
} from 'lucide-react';

export interface EmailTemplateData {
  _id?: string;
  templateId: string;
  name: string;
  subject: string;
  bodyHtml: string;
  category: 'clearance' | 'auction' | 'award' | 'general';
  availableTokens?: string[];
  isDefault?: boolean;
}

interface TipTapTemplateEditorProps {
  supplierId: string;
  initialTemplate?: EmailTemplateData | null;
  onSave?: (template: EmailTemplateData) => void;
  onChange?: (template: EmailTemplateData) => void;
  apiBaseUrl?: string;
  inventoryLots?: any[];
}

const DEFAULT_TOKENS = [
  'buyer_name',
  'lot_title',
  'inventory_table',
  'quick_bid_link',
  'supplier_name'
];

const DEFAULT_PREVIEW_LOTS = [
  {
    _id: 'sample-lot-880',
    title: 'Surplus Dairy & Beverage Pack Lot #880',
    lotNumber: 'LOT-880',
    items: [
      { sku: 'SKU-9901', name: 'Organic Almond Milk 1L', cases: 240, expiry: '12 Days' },
      { sku: 'SKU-9904', name: 'Greek Yogurt 500g', cases: 150, expiry: '18 Days' }
    ]
  },
  {
    _id: 'sample-lot-912',
    title: 'Short-Dated Bakery & Snack Lot #912',
    lotNumber: 'LOT-912',
    items: [
      { sku: 'SKU-7721', name: 'Artisan Wheat Loaf 400g', cases: 420, expiry: '5 Days' },
      { sku: 'SKU-7725', name: 'Oatmeal Energy Bars (Box of 12)', cases: 310, expiry: '8 Days' },
      { sku: 'SKU-7730', name: 'Gluten-Free Granola 250g', cases: 190, expiry: '14 Days' }
    ]
  }
];

function buildInventoryTableHtml(lot: any) {
  if (!lot) return '';
  const items = lot.items || lot.products || (lot.description ? [{ sku: lot.sku || 'SKU-101', name: lot.description, cases: lot.totalCases || 100, expiry: '14 Days' }] : [
    { sku: 'SKU-9901', name: 'Organic Almond Milk 1L', cases: 240, expiry: '12 Days' },
    { sku: 'SKU-9904', name: 'Greek Yogurt 500g', cases: 150, expiry: '18 Days' }
  ]);

  const rowsHtml = items.map((item: any) => `
    <tr style="border-bottom: 1px solid hsl(var(--border-color));">
      <td style="padding: 8px 12px; font-family: monospace;">${item.sku || 'SKU-001'}</td>
      <td style="padding: 8px 12px; font-weight: 500;">${item.name || item.description || 'Product Item'}</td>
      <td style="padding: 8px 12px; font-weight: bold; text-align: right;">${item.cases || item.quantity || 100}</td>
      <td style="padding: 8px 12px; color: hsl(var(--error)); text-align: center; font-weight: 600;">${item.expiry || (item.daysRemaining ? `${item.daysRemaining} Days` : '14 Days')}</td>
    </tr>
  `).join('');

  return `<table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; text-align: left; border: 1px solid hsl(var(--border-color)); background-color: white;">
    <thead>
      <tr style="background-color: hsl(var(--bg-card-hover)); border-bottom: 2px solid hsl(var(--border-color));">
        <th style="padding: 8px 12px; color: hsl(var(--text-muted));">SKU</th>
        <th style="padding: 8px 12px; color: hsl(var(--text-muted));">Description</th>
        <th style="padding: 8px 12px; color: hsl(var(--text-muted)); text-align: right;">Cases</th>
        <th style="padding: 8px 12px; color: hsl(var(--text-muted)); text-align: center;">Expiry</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>`;
}

export function renderTokenPillHtml(token: string): string {
  if (token === 'inventory_table') {
    return `<div class="dynamic-token-pill" data-token="inventory_table" contenteditable="false" style="display: block; padding: 12px 16px; background-color: hsl(var(--bg-card-hover)); color: hsl(var(--success)); border: 1.5px dashed hsl(var(--success)); border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; margin: 12px 0;">📊 Dynamic Inventory Table (Workflow Data) ℹ️</div>`;
  } else if (token === 'header') {
    return `<div class="dynamic-token-pill" data-token="header" contenteditable="false" style="display: block; padding: 10px 14px; background-color: hsl(var(--bg-card-hover)); color: hsl(var(--primary)); border: 1px dashed hsl(var(--border-color)); border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; margin: 8px 0;">🏷️ Dynamic Header Component ℹ️</div>`;
  } else {
    const label = token === 'buyer_name' ? 'Buyer Account Name'
      : token === 'supplier_name' ? 'Supplier Organization'
      : token === 'lot_title' ? 'Surplus Inventory Lot Title'
      : token === 'quick_bid_link' ? '1-Click Buyer Action Link'
      : token === 'expiry_date' ? 'Expiry Date Component'
      : token === 'discount_percent' ? 'Discount % Component'
      : `${token.replace(/_/g, ' ')} Component`;
    return `<span class="dynamic-token-pill" data-token="${token}" contenteditable="false" style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; background-color: hsl(var(--bg-card-hover)); color: hsl(var(--primary)); border: 1px solid hsl(var(--border-color)); border-radius: 9999px; font-size: 12px; font-weight: 600; cursor: pointer; margin: 0 2px;">${label} ℹ️</span>`;
  }
}

export function hydrateRawTokensInHtml(html: string): string {
  if (!html) return html;
  return html
    .replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (_match, token) => renderTokenPillHtml(token))
    .replace(/\[([a-zA-Z0-9_]+)\]/g, (_match, token) => renderTokenPillHtml(token));
}

export function TipTapTemplateEditor({
  supplierId,
  initialTemplate,
  onSave,
  onChange,
  apiBaseUrl = '/api',
  inventoryLots = []
}: TipTapTemplateEditorProps) {
  const [templateId, setTemplateId] = useState(initialTemplate?.templateId || 'default');
  const [name, setName] = useState(initialTemplate?.name || 'Custom Liquidation Campaign Template');
  const [subject, setSubject] = useState(initialTemplate?.subject || 'Distressed Stock Clearance: {{lot_title}}');
  const [category, setCategory] = useState<'clearance' | 'auction' | 'award' | 'general'>(initialTemplate?.category || 'clearance');
  const [bodyHtml, setBodyHtml] = useState<string>(() => {
    const raw = initialTemplate?.bodyHtml ||
      `<p>Dear {{buyer_name}},</p><p>We have immediate distressed stock available for liquidation. Please review the itemized inventory below:</p>{{inventory_table}}<p style="text-align: center; margin-top: 20px;"><a href="{{quick_bid_link}}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Bid Now</a></p>`;
    return hydrateRawTokensInHtml(raw);
  });

  const [deviceView, _setDeviceView] = useState<'desktop' | 'mobile'>('desktop');
  const [activeModeTab, setActiveModeTab] = useState<'authoring' | 'preview'>('authoring');
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [pendingTemplateId, setPendingTemplateId] = useState<string | null>(null);
  const [showOverwriteModal, setShowOverwriteModal] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  const applyPresetTemplate = (presetId: string) => {
    const preset = getB2BPresetById(presetId) || B2B_TEMPLATE_PRESETS.find(p => p.templateId === presetId);
    if (preset) {
      setTemplateId(preset.templateId);
      setName(preset.name);
      setSubject(preset.subject);
      setCategory(preset.category);
      setBodyHtml(hydrateRawTokensInHtml(preset.bodyHtml));
      if (preset.availableTokens && preset.availableTokens.length > 0) {
        setAvailableTokens(preset.availableTokens);
      }
    } else if (presetId === 'short-dated-flash-sale') {
      setTemplateId('short-dated-flash-sale');
      setName('Short-Dated Flash Sale');
      setSubject('⚡ Flash Sale: Short-Dated {{lot_title}} Available Now');
      setBodyHtml(hydrateRawTokensInHtml(`<h2 style="color: #dc2626;">Time-Sensitive Clearance Opportunity</h2><p>Dear {{buyer_name}},</p><p>We have loaded a high-priority short-dated inventory lot: <strong>{{lot_title}}</strong>.</p>{{inventory_table}}<p style="text-align: center; margin: 20px 0;"><a href="{{quick_bid_link}}" style="background-color: #dc2626; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Review & Place Instant Bid</a></p><p style="font-size: 12px; color: #64748b;">Dispatched by {{supplier_name}}</p>`));
    }
    setPendingTemplateId(null);
    setShowOverwriteModal(false);
  };

  const handleTemplatePickerChange = (newId: string) => {
    const cleanBodyText = bodyHtml ? bodyHtml.replace(/<[^>]*>/g, '').trim() : '';
    const hasContent = cleanBodyText.length > 0 && bodyHtml !== '<p></p>' && bodyHtml !== '<p></p>\n';

    if (hasContent) {
      setPendingTemplateId(newId);
      setShowOverwriteModal(true);
    } else {
      applyPresetTemplate(newId);
    }
  };

  const confirmOverwrite = () => {
    if (pendingTemplateId) {
      applyPresetTemplate(pendingTemplateId);
    }
  };

  const cancelOverwrite = () => {
    setPendingTemplateId(null);
    setShowOverwriteModal(false);
  };

  const [availableTokens, setAvailableTokens] = useState<string[]>(
    initialTemplate?.availableTokens && initialTemplate.availableTokens.length > 0
      ? initialTemplate.availableTokens
      : DEFAULT_TOKENS
  );
  const [newTokenInput, setNewTokenInput] = useState('');

  const availableLots = (inventoryLots && inventoryLots.length > 0) ? inventoryLots : DEFAULT_PREVIEW_LOTS;
  const [selectedLotId, setSelectedLotId] = useState<string>(availableLots[0]?._id || availableLots[0]?.id || 'sample-lot-880');

  const [sampleData, setSampleData] = useState<Record<string, string>>({
    buyer_name: 'FreshMart Wholesale',
    supplier_name: 'Unilever Supply Operations',
    lot_title: availableLots[0]?.title || availableLots[0]?.name || 'Surplus Dairy & Beverage Pack Lot #880',
    inventory_table: buildInventoryTableHtml(availableLots[0]),
    quick_bid_link: 'https://indspoileralert.com/bid?token=demo-token-123'
  });

  useEffect(() => {
    const currentLot = availableLots.find((l: any) => (l._id || l.id) === selectedLotId) || availableLots[0];
    if (currentLot) {
      const lotTitle = currentLot.title || currentLot.name || currentLot.lotNumber || 'Surplus Inventory Lot';
      const tableHtml = buildInventoryTableHtml(currentLot);
      setSampleData((prev) => ({
        ...prev,
        lot_title: lotTitle,
        inventory_table: tableHtml
      }));
    }
  }, [selectedLotId, availableLots]);

  useEffect(() => {
    if (initialTemplate) {
      setTemplateId(initialTemplate.templateId || 'default');
      setName(initialTemplate.name || 'Custom Liquidation Campaign Template');
      setSubject(initialTemplate.subject || '');
      setCategory(initialTemplate.category || 'clearance');
      setBodyHtml(hydrateRawTokensInHtml(initialTemplate.bodyHtml || ''));
      if (initialTemplate.availableTokens && initialTemplate.availableTokens.length > 0) {
        setAvailableTokens(initialTemplate.availableTokens);
      }
    }
  }, [initialTemplate]);

  useEffect(() => {
    if (onChange) {
      onChange({
        _id: initialTemplate?._id,
        templateId,
        name,
        subject,
        bodyHtml,
        category,
        availableTokens
      });
    }
  }, [templateId, name, subject, bodyHtml, category, availableTokens, onChange, initialTemplate?._id]);

  const handleAddToken = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    let cleanToken = newTokenInput.trim();
    cleanToken = cleanToken.replace(/^\{\{+/, '').replace(/\}\}+$/, '').trim();
    cleanToken = cleanToken.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');

    if (cleanToken && !availableTokens.includes(cleanToken)) {
      setAvailableTokens((prev) => [...prev, cleanToken]);
      setNewTokenInput('');
    }
  };

  const [activeTokenInfoModal, setActiveTokenInfoModal] = useState<{
    token: string;
    label: string;
    description: string;
    fields: string[];
    sampleValue: string;
  } | null>(null);

  const getFriendlyTokenInfo = (token: string) => {
    switch (token) {
      case 'inventory_table':
        return {
          token: 'inventory_table',
          label: 'Dynamic Inventory Data Table',
          description: 'Automatically compiles an itemized inventory table of distressed lots matched by the workflow stage filters at run time.',
          fields: ['SKU Code', 'Product Description', 'Quantity (Cases)', 'Remaining Shelf Life (RSL %)', 'Expiry Date', 'Target Markdown Price'],
          sampleValue: 'Itemized HTML Table with matched SKU records'
        };
      case 'header':
        return {
          token: 'header',
          label: 'Dynamic Campaign Header Component',
          description: 'Renders supplier campaign branding, clearance badge, and workflow headline.',
          fields: ['Supplier Company Name', 'Campaign Category', 'Liquidation Urgency Tag'],
          sampleValue: 'Clearance Opportunity | Unilever Supply Operations'
        };
      case 'buyer_name':
        return {
          token: 'buyer_name',
          label: 'Buyer Account Name',
          description: 'Injects the recipient retail buyer company name dynamically for personalized outreach.',
          fields: ['Buyer Account Name'],
          sampleValue: 'Grocery Outlet Closeout Sourcing'
        };
      case 'supplier_name':
        return {
          token: 'supplier_name',
          label: 'Supplier Organization',
          description: 'Injects the supplier organization name in headers and legal footers.',
          fields: ['Supplier Organization Name'],
          sampleValue: 'Unilever Supply Operations'
        };
      case 'lot_title':
        return {
          token: 'lot_title',
          label: 'Surplus Inventory Lot Title',
          description: 'Injects the surplus lot title or lot reference number in subject and intro text.',
          fields: ['Lot Title / Lot Number'],
          sampleValue: 'Surplus Dairy & Beverage Pack Lot #ULVR-880'
        };
      case 'quick_bid_link':
        return {
          token: 'quick_bid_link',
          label: '1-Click Buyer Action Link',
          description: 'Generates an encrypted 1-click action button for instant buyer bidding or PO awarding.',
          fields: ['Encrypted JWT Action URL'],
          sampleValue: 'https://indspoileralert.com/bid?token=secure-bidding-jwt'
        };
      default:
        return {
          token,
          label: `${token.replace(/_/g, ' ')} Component`,
          description: 'Dynamic variable component populated automatically by the workflow execution engine.',
          fields: [token],
          sampleValue: `Dynamic ${token} workflow data`
        };
    }
  };

  const handleRemoveToken = (tokenToRemove: string) => {
    setAvailableTokens((prev) => prev.filter((t) => t !== tokenToRemove));
  };

  const insertToken = (token: string) => {
    let pillHtml = '';
    if (token === 'inventory_table') {
      pillHtml = `<div class="dynamic-token-pill" data-token="inventory_table" contenteditable="false" style="display: block; padding: 12px 16px; background-color: hsl(var(--bg-card-hover)); color: hsl(var(--success)); border: 1.5px dashed hsl(var(--success)); border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; margin: 12px 0;">📊 Dynamic Inventory Table (Workflow Data) ℹ️</div>`;
    } else if (token === 'header') {
      pillHtml = `<div class="dynamic-token-pill" data-token="header" contenteditable="false" style="display: block; padding: 10px 14px; background-color: hsl(var(--bg-card-hover)); color: hsl(var(--primary)); border: 1px dashed hsl(var(--border-color)); border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; margin: 8px 0;">🏷️ Dynamic Header Component ℹ️</div>`;
    } else {
      const info = getFriendlyTokenInfo(token);
      pillHtml = `<span class="dynamic-token-pill" data-token="${token}" contenteditable="false" style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; background-color: hsl(var(--bg-card-hover)); color: hsl(var(--primary)); border: 1px solid hsl(var(--border-color)); border-radius: 9999px; font-size: 12px; font-weight: 600; cursor: pointer; margin: 0 2px;">${info.label} ℹ️</span>`;
    }
    setBodyHtml((prev) => `${prev} ${pillHtml}`);
  };

  const handleEditorInput = (e: React.FormEvent<HTMLDivElement>) => {
    setBodyHtml(e.currentTarget.innerHTML);
  };

  useEffect(() => {
    const editorEl = editorRef.current;
    if (!editorEl) return;

    const handleNativeClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const pillElement = target.closest('[data-token]') as HTMLElement | null;
      if (pillElement) {
        const token = pillElement.getAttribute('data-token');
        if (token) {
          setActiveTokenInfoModal(getFriendlyTokenInfo(token));
        }
      }
    };

    editorEl.addEventListener('click', handleNativeClick);
    return () => {
      editorEl.removeEventListener('click', handleNativeClick);
    };
  }, []);

  const applyFormatting = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setBodyHtml(editorRef.current.innerHTML);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSavedSuccess(false);
    try {
      const isUpdate = Boolean(initialTemplate?._id || (initialTemplate?.templateId && initialTemplate.templateId !== 'default'));
      const url = isUpdate
        ? `${apiBaseUrl}/email-templates/${initialTemplate?._id || initialTemplate?.templateId}`
        : `${apiBaseUrl}/email-templates`;

      const method = isUpdate ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId,
          name,
          templateId,
          subject,
          bodyHtml,
          category,
          availableTokens
        })
      });

      const data = await res.json();
      if (data.success || res.ok) {
        setSavedSuccess(true);
        if (onSave) {
          onSave(data.template || {
            _id: initialTemplate?._id,
            templateId,
            name,
            subject,
            bodyHtml,
            category,
            availableTokens
          });
        }
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save template:', err);
    } finally {
      setSaving(false);
    }
  };

  const loadStarterPreset = () => {
    setTemplateId('clearance-starter-v1');
    setName('Clearance Offer Starter Template');
    setSubject('Flash Offer: {{supplier_name}} Distressed Inventory');
    setBodyHtml(
      hydrateRawTokensInHtml(
        `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;"><h2 style="color: #2563eb; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">Surplus Inventory Clearance</h2><p>Dear <strong>{{buyer_name}}</strong>,</p><p>We have uploaded a short-dated lot <strong>{{lot_title}}</strong> available for immediate auction bidding.</p>{{inventory_table}}<p style="text-align: center; margin: 24px 0;"><a href="{{quick_bid_link}}" style="background-color: #16a34a; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Click Here to Bid</a></p><p style="font-size: 12px; color: #64748b;">Sent via IndSpoilerAlert Email Hub | {{supplier_name}}</p></div>`
      )
    );
    setAvailableTokens(DEFAULT_TOKENS);
  };

  // Compile sample preview data for Live Preview
  const getCompiledPreview = () => {
    let compiledSubject = subject
      .replace(/\{\{lot_title\}\}/g, 'Surplus Dairy & Beverage Pack Lot #880')
      .replace(/\{\{buyer_name\}\}/g, 'FreshMart Wholesale')
      .replace(/\{\{supplier_name\}\}/g, 'Unilever Supply Operations');

    let compiledBody = bodyHtml
      .replace(/\{\{buyer_name\}\}/g, 'FreshMart Wholesale')
      .replace(/\{\{supplier_name\}\}/g, 'Unilever Supply Operations')
      .replace(/\{\{lot_title\}\}/g, 'Surplus Dairy & Beverage Pack Lot #880')
      .replace(
        /\{\{inventory_table\}\}/g,
        `<table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; text-align: left; border: 1px solid hsl(var(--border-color));">
          <thead>
            <tr style="background-color: hsl(var(--bg-card-hover)); border-bottom: 2px solid hsl(var(--border-color));">
              <th style="padding: 8px 12px;">SKU</th>
              <th style="padding: 8px 12px;">Description</th>
              <th style="padding: 8px 12px;">Cases</th>
              <th style="padding: 8px 12px;">Expiry</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid hsl(var(--border-color));">
              <td style="padding: 8px 12px;">SKU-9901</td>
              <td style="padding: 8px 12px;">Organic Almond Milk 1L</td>
              <td style="padding: 8px 12px; font-weight: bold;">240</td>
              <td style="padding: 8px 12px; color: hsl(var(--error));">12 Days</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px;">SKU-9904</td>
              <td style="padding: 8px 12px;">Greek Yogurt 500g</td>
              <td style="padding: 8px 12px; font-weight: bold;">150</td>
              <td style="padding: 8px 12px; color: hsl(var(--warning));">18 Days</td>
            </tr>
          </tbody>
        </table>`
      )
      .replace(/\{\{quick_bid_link\}\}/g, 'https://indspoileralert.com/bid?token=demo-token-123');

    return { compiledSubject, compiledBody };
  };

  getCompiledPreview();

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-600 dark:text-indigo-400">
            <LayoutTemplate className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              TipTap WYSIWYG Email Template Editor
              <span className="px-2.5 py-0.5 text-xs bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 rounded-full font-mono">
                {templateId}
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Author bulletproof HTML email templates with 1-click token insertion and live device preview.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            data-testid="template-picker-select"
            value={templateId}
            onChange={(e) => handleTemplatePickerChange(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="b2b-inventory-offer-sheet">B2B Inventory Offer Sheet</option>
            <option value="short-dated-flash-sale">Short-Dated Flash Sale</option>
            <option value="bulk-clearance-announcement">Bulk Clearance Announcement</option>
            <option value="blank-slate">Blank Slate</option>
          </select>

          <button
            type="button"
            onClick={loadStarterPreset}
            className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400" /> Load Starter Clearance Preset
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary-dark))] text-white rounded-xl text-xs font-bold shadow-lg shadow-[hsl(var(--primary))]/30 flex items-center gap-2 transition-all cursor-pointer"
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Saving...
              </>
            ) : savedSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-300" /> Saved!
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Save Template
              </>
            )}
          </button>
        </div>
      </div>

      {showOverwriteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Replace editor content with selected template?</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Selecting a new preset will replace your existing editor body text and subject line with the preset defaults. Any unsaved edits in the editor canvas will be overwritten.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                data-testid="cancel-overwrite-template-button"
                onClick={cancelOverwrite}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                data-testid="confirm-overwrite-template-button"
                onClick={confirmOverwrite}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all"
              >
                Confirm & Overwrite
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mode Toggles */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
        <button
          type="button"
          data-testid="tab-authoring-mode"
          onClick={() => setActiveModeTab('authoring')}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeModeTab === 'authoring'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Authoring Mode
        </button>
        <button
          type="button"
          data-testid="tab-preview-mode"
          onClick={() => setActiveModeTab('preview')}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeModeTab === 'preview'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Live Email Preview
        </button>
      </div>

      {activeModeTab === 'preview' ? (
        <div data-testid="full-width-live-preview" className="p-6 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl">
          <LiveDevicePreview
            subject={subject}
            bodyHtml={bodyHtml}
            initialDeviceView={deviceView}
            context={{
              ...sampleData,
              lot_title: sampleData.lot_title || name || 'Surplus Inventory Lot #880'
            }}
          />
        </div>
      ) : (
        /* Main Grid: Editor Settings & Body */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form & WYSIWYG Editor (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-5 bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4 shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-400 mb-1 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Template Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Template Name"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-400 mb-1 flex items-center gap-1">
                  <FileCode className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> templateId Ref
                </label>
                <input
                  type="text"
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                  placeholder="templateId"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-400 mb-1 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="clearance">Clearance</option>
                  <option value="auction">Auction</option>
                  <option value="award">Award Notice</option>
                  <option value="general">General Broadcast</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-400 mb-1">
                Subject Line (Supports Handlebars Tokens)
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject line"
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Dynamic Token Palette & Data Configuration */}
          <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-500/20 rounded-2xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Dynamic Variable Token Chips (Click to Insert)
              </span>
              <span className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                {availableTokens.length} token{availableTokens.length !== 1 ? 's' : ''} configured
              </span>
            </div>

            {/* Input Box to Configure Tokens */}
            <form onSubmit={handleAddToken} className="flex items-center gap-2">
              <input
                type="text"
                value={newTokenInput}
                onChange={(e) => setNewTokenInput(e.target.value)}
                placeholder="Add custom variable token (e.g. discount_percent)..."
                data-testid="add-token-input"
                className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
              />
              <button
                type="submit"
                disabled={!newTokenInput.trim()}
                data-testid="add-token-button"
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> Add Token
              </button>
            </form>

            {/* Token Chips Palette */}
            <div className="flex flex-wrap gap-2 pt-1">
              {availableTokens.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-1">
                  No dynamic variable tokens configured. Enter a token name above to add one.
                </p>
              ) : (
                availableTokens.map((token) => {
                  const info = getFriendlyTokenInfo(token);
                  return (
                    <div
                      key={token}
                      className="inline-flex items-center bg-indigo-50 dark:bg-indigo-600/20 border border-indigo-200 dark:border-indigo-500/40 rounded-xl text-xs font-semibold overflow-hidden transition-all hover:border-indigo-400"
                    >
                      <button
                        type="button"
                        onClick={() => insertToken(token)}
                        title={`Click to insert ${info.label}`}
                        className="px-3 py-1.5 text-indigo-700 dark:text-indigo-200 hover:bg-indigo-100 dark:hover:bg-indigo-600/30 hover:text-indigo-900 dark:hover:text-white transition-colors flex items-center gap-1.5"
                      >
                        <Plus className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                        <span>{info.label}</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveTokenInfoModal(info);
                        }}
                        title="View Dynamic Workflow Data Schema"
                        className="px-2 py-1.5 text-indigo-600 dark:text-indigo-300 hover:text-indigo-900 dark:hover:text-indigo-100 hover:bg-indigo-100 dark:hover:bg-indigo-500/30 border-l border-indigo-200 dark:border-indigo-500/30 transition-colors"
                      >
                        ℹ️
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveToken(token);
                        }}
                        title={`Remove ${token}`}
                        aria-label={`Remove token ${token}`}
                        data-testid={`remove-token-${token}`}
                        className="px-1.5 py-1.5 text-indigo-500 dark:text-indigo-400/60 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 border-l border-indigo-200 dark:border-indigo-500/30 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Variable Sample Data / System Data Mapping */}
            <div className="pt-3 border-t border-indigo-200 dark:border-indigo-500/20 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  Dynamic Variable Data Sources & Sample Preview Mapping
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                  Live Preview Controls
                </span>
              </div>

              <div className="p-3.5 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  <strong className="text-slate-800 dark:text-slate-200">How dynamic data works:</strong> System tokens (<code className="text-indigo-700 dark:text-indigo-300">inventory_table</code>, <code className="text-indigo-700 dark:text-indigo-300">lot_title</code>) are automatically populated from real <strong>Inventory Lots</strong> attached during campaign dispatch. Configure sample preview values below to test live rendering:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {availableTokens.map((token) => {
                    const isSystemToken = ['inventory_table', 'lot_title', 'buyer_name', 'quick_bid_link', 'supplier_name'].includes(token);

                    if (token === 'inventory_table') {
                      return (
                        <div key={token} className="p-3 bg-slate-50 dark:bg-slate-950/90 border border-indigo-200 dark:border-indigo-500/40 rounded-xl space-y-2 sm:col-span-2">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <label className="text-[11px] font-mono font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                              <Box className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                              &#123;&#123;inventory_table&#125;&#125; & &#123;&#123;lot_title&#125;&#125; Data Source Picker
                            </label>
                            <span className="px-2.5 py-0.5 text-[10px] font-mono bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 rounded-full font-bold">
                              ⚡ Live Rendered Table Preview
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400">
                            Select an Inventory Lot from your catalog to visually preview how its real items, SKUs, and case counts render inside the template:
                          </p>
                          <div className="flex items-center gap-2 pt-0.5">
                            <select
                              value={selectedLotId}
                              onChange={(e) => setSelectedLotId(e.target.value)}
                              data-testid="inventory-lot-picker"
                              className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 font-sans font-semibold"
                            >
                              {availableLots.map((lot: any) => (
                                <option key={lot._id || lot.id} value={lot._id || lot.id}>
                                  📦 {lot.title || lot.name || lot.lotNumber || 'Inventory Lot'} ({(lot.items || lot.products || []).length || 2} SKUs)
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={token} className="p-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-mono font-bold text-indigo-700 dark:text-indigo-300">
                            &#123;&#123;{token}&#125;&#125;
                          </label>
                          {isSystemToken && (
                            <span className="text-[9px] text-slate-500 dark:text-slate-400 bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">
                              System Data
                            </span>
                          )}
                        </div>
                        <input
                          type="text"
                          value={sampleData[token] !== undefined ? sampleData[token] : ''}
                          onChange={(e) =>
                            setSampleData((prev) => ({ ...prev, [token]: e.target.value }))
                          }
                          placeholder={
                            token === 'lot_title'
                              ? 'e.g. Surplus Dairy Lot #880'
                              : token === 'buyer_name'
                              ? 'e.g. FreshMart Wholesale'
                              : token === 'supplier_name'
                              ? 'e.g. Unilever Supply Ops'
                              : `Sample value for ${token}...`
                          }
                          data-testid={`sample-data-input-${token}`}
                          className="w-full px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* TipTap Editor Toolbar & Content */}
          <div className="bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            {/* Toolbar */}
            <div
              data-testid="tiptap-editor-toolbar"
              className="flex items-center gap-1.5 p-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex-wrap"
            >
              <button
                type="button"
                onClick={() => applyFormatting('bold')}
                className="p-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold"
                title="Bold"
              >
                <Bold className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => applyFormatting('italic')}
                className="p-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold"
                title="Italic"
              >
                <Italic className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => applyFormatting('formatBlock', '<h2>')}
                className="p-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold"
                title="Header 2"
              >
                <Heading2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => applyFormatting('insertUnorderedList')}
                className="p-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold"
                title="Bullet List"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  const url = prompt('Enter link URL:');
                  if (url) applyFormatting('createLink', url);
                }}
                className="p-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold"
                title="Insert Link"
              >
                <Link className="w-4 h-4" />
              </button>
              <button
                type="button"
                data-testid={showCodeEditor ? 'toggle-visual-editor' : 'toggle-code-editor'}
                onClick={() => setShowCodeEditor(!showCodeEditor)}
                className="p-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                title={showCodeEditor ? 'Switch to Visual Editor' : 'Switch to Raw HTML Code Mode'}
              >
                <Code className="w-4 h-4" />
              </button>

              <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

              {/* Quick Insertion Controls */}
              <button
                type="button"
                onClick={() => insertToken('header')}
                className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                title="Insert Dynamic Header Component"
              >
                <span>🏷️</span> Insert Dynamic Header
              </button>

              <button
                type="button"
                onClick={() => insertToken('inventory_table')}
                className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                title="Insert Dynamic Inventory Table Component"
              >
                <span>📊</span> Insert Dynamic Inventory Table
              </button>

              <button
                type="button"
                onClick={() => setActiveTokenInfoModal(getFriendlyTokenInfo('inventory_table'))}
                className="p-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                title="Dynamic Token Info"
                aria-label="Toolbar Dynamic Token Info"
                data-testid="toolbar-token-info-button"
              >
                ℹ️
              </button>
            </div>

            {/* Editable Content */}
            {showCodeEditor ? (
              <textarea
                data-testid="raw-html-editor-textarea"
                value={bodyHtml}
                onChange={(e) => setBodyHtml(e.target.value)}
                className="w-full p-5 min-h-[280px] max-h-[420px] font-mono text-xs text-slate-100 bg-slate-900 focus:outline-none custom-scrollbar border-0"
              />
            ) : (
              <div
                ref={editorRef}
                data-testid="tiptap-editable-content"
                contentEditable
                onInput={handleEditorInput}
                dangerouslySetInnerHTML={{ __html: bodyHtml }}
                className="p-5 min-h-[280px] max-h-[420px] overflow-y-auto text-sm text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950 font-sans focus:outline-none custom-scrollbar"
              />
            )}
          </div>
        </div>

        {/* Right Column: Live Device Viewport Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <LiveDevicePreview
            subject={subject}
            bodyHtml={bodyHtml}
            initialDeviceView={deviceView}
            context={{
              ...sampleData,
              lot_title: sampleData.lot_title || name || 'Surplus Inventory Lot #880'
            }}
          />
        </div>
      </div>
      )}

      {/* Dynamic Token Info Modal */}
      {activeTokenInfoModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">ℹ️</span>
                <div>
                  <h4 data-testid="active-token-info-title" className="text-sm font-bold text-slate-900 dark:text-white">{activeTokenInfoModal.label}</h4>
                  <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400">data-token="{activeTokenInfoModal.token}"</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTokenInfoModal(null)}
                data-testid="close-token-info-modal"
                className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
              {activeTokenInfoModal.description}
            </p>

            <div className="space-y-2">
              <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">Dynamically Injected Fields:</span>
              <div className="flex flex-wrap gap-1.5">
                {activeTokenInfoModal.fields.map((f) => (
                  <span key={f} className="px-2.5 py-1 text-[11px] bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/20 rounded-lg font-medium">
                    ✓ {f}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-1 pt-2 border-t border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Sample Runtime Output:</span>
              <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl text-xs text-slate-800 dark:text-slate-300 font-mono border border-slate-200 dark:border-slate-800/80">
                {activeTokenInfoModal.sampleValue}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  insertToken(activeTokenInfoModal.token);
                  setActiveTokenInfoModal(null);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md"
              >
                + Insert Into Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
