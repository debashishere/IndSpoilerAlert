// frontend/src/components/EmailBuilder/EmailBuilderEngine.tsx
import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { useSelector } from 'react-redux';
import { InventoryTableToken } from './extensions/InventoryTableToken';
import { Figure, Figcaption } from './extensions/Figure';
import { debounce } from '../../utils/debounce';

export interface SurplusLot {
  id?: string;
  _id?: string;
  sku?: string;
  description?: string;
  quantity?: number;
  quantityCases?: number;
  availableQty?: number;
  pricePerCase?: number;
  unitPrice?: number;
  costPerCase?: number;
  productId?: {
    sku?: string;
    description?: string;
  };
}

export interface EmailBuilderEngineProps {
  campaignId?: string;
  initialContent?: string;
  inventoryLots?: SurplusLot[];
  onHtmlChange?: (html: string) => void;
  disabled?: boolean;
}

export const EmailBuilderEngine: React.FC<EmailBuilderEngineProps> = ({
  campaignId: _campaignId,
  initialContent,
  inventoryLots,
  onHtmlChange,
  disabled = false,
}) => {
  const reduxInventory = useSelector((state: any) => state.inventory?.inventoryList || state.inventory?.lots || []);
  const reduxError = useSelector((state: any) => state.inventory?.error || null);

  const lots: SurplusLot[] = useMemo(() => {
    if (inventoryLots && inventoryLots.length > 0) return inventoryLots;
    return reduxInventory;
  }, [inventoryLots, reduxInventory]);

  // ─── Debounced save callback ──────────────────────────────────
  const debouncedSaveRef = useRef(
    debounce((html: string) => {
      onHtmlChange?.(html);
    }, 600)
  );

  useEffect(() => {
    return () => {
      debouncedSaveRef.current.flush?.();
    };
  }, []);

  // ─── Extensions: memoized to prevent re-instantiation ─────────
  const extensions = useMemo(() => {
    const resolveExt = (target: any) => {
      if (!target) return target;
      if (target.default) return target.default;
      return target;
    };

    return [
      resolveExt(StarterKit).configure({
        // Disable heading levels that don't render well in email clients
        heading: { levels: [1, 2, 3] },
      }),
      resolveExt(Image).configure({
        inline: false,
        allowBase64: false, // Explicitly disabled to prevent XSS via data URIs
      }),
      resolveExt(Table).configure({
        resizable: true,
        HTMLAttributes: {
          style: 'width: 100%; border-collapse: collapse;',
        },
      }),
      resolveExt(TableRow),
      resolveExt(TableHeader).configure({
        HTMLAttributes: {
          style: 'background-color: #f1f5f9; font-weight: 600; text-align: left; padding: 8px; border: 1px solid #e2e8f0;',
        },
      }),
      resolveExt(TableCell).configure({
        HTMLAttributes: {
          style: 'padding: 8px; border: 1px solid #e2e8f0;',
        },
      }),
      InventoryTableToken,
      Figure,
      Figcaption,
    ];
  }, []);

  // Default initial content
  const defaultContent = initialContent || `
    <p>Dear {{buyer_name}},</p>
    <p>We have immediate distressed stock available for liquidation. Please review the itemized inventory below:</p>
    <span data-inventory-table-token="true" data-token="inventory_table">📊 Dynamic Inventory Table {{inventory_table}}</span>
    <p style="text-align: center; margin-top: 20px;">
      <a href="{{quick_bid_link}}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Bid Now</a>
    </p>
  `;

  // ─── Editor instance ──────────────────────────────────────────
  const editor = useEditor({
    extensions,
    content: defaultContent,
    editable: !disabled,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[300px]',
        'data-testid': 'tiptap-editable-content',
      },
    },
    onUpdate: ({ editor }) => {
      if (!editor || editor.isDestroyed || !editor.schema) return;
      try {
        const html = editor.getHTML();
        debouncedSaveRef.current(html);
      } catch (err) {
        console.warn('TipTap onUpdate warning:', err);
      }
    },
  });

  // Keep content in sync if initialContent prop changes externally
  useEffect(() => {
    if (!editor || editor.isDestroyed || !editor.schema) return;
    if (initialContent) {
      try {
        const currentHtml = editor.getHTML();
        if (currentHtml !== initialContent) {
          editor.commands.setContent(initialContent);
        }
      } catch (err) {
        console.warn('TipTap setContent error:', err);
      }
    }
  }, [initialContent, editor]);

  // ─── Insert image via URL (with URL validation & XSS protection)
  const addImage = useCallback(() => {
    if (!editor) return;

    const url = window.prompt('Enter Image URL');
    if (!url) return;

    // Validate URL structure
    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        alert('Please enter a valid HTTP or HTTPS image URL');
        return;
      }
    } catch {
      alert('Please enter a valid URL');
      return;
    }

    editor.chain().focus().setImage({ src: url }).run();
  }, [editor]);

  // ─── Insert dynamic inventory table (ProseMirror-native) ──────
  const insertDynamicInventoryTable = useCallback(() => {
    if (!editor || lots.length === 0) return;

    const { schema } = editor;

    // Build header row via schema text nodes
    const headerCells = ['SKU', 'Description', 'Qty (Cases)', 'Price/Case'].map(
      (text) => schema.nodes.tableHeader.create(null, [schema.text(text)])
    );
    const headerRow = schema.nodes.tableRow.create(null, headerCells);

    // Build data rows with auto-escaped text nodes (No raw HTML interpolation)
    const dataRows = lots.map((lot) => {
      const sku = lot.sku || lot.productId?.sku || 'SKU-101';
      const desc = lot.description || lot.productId?.description || 'Product Item';
      const qty = lot.quantity ?? lot.quantityCases ?? lot.availableQty ?? 0;
      const price = lot.pricePerCase ?? lot.unitPrice ?? lot.costPerCase ?? 0;

      const cells = [
        schema.nodes.tableCell.create(null, [schema.text(String(sku))]),
        schema.nodes.tableCell.create(null, [schema.text(String(desc))]),
        schema.nodes.tableCell.create(null, [schema.text(String(qty))]),
        schema.nodes.tableCell.create(null, [schema.text(`$${Number(price).toFixed(2)}`)]),
      ];
      return schema.nodes.tableRow.create(null, cells);
    });

    // Compose table node & insert
    const tableNode = schema.nodes.table.create(null, [headerRow, ...dataRows]);

    editor
      .chain()
      .focus()
      .insertContent(tableNode)
      .run();
  }, [editor, lots]);

  // ─── Insert inventory table token chip ─────────────────────────
  const insertInventoryToken = useCallback(() => {
    if (!editor) return;

    editor
      .chain()
      .focus()
      .insertContent({
        type: 'inventoryTableToken',
        attrs: { token: '{{inventory_table}}' },
      })
      .run();
  }, [editor]);

  // ─── Insert generic text token chip ────────────────────────────
  const insertToken = useCallback(
    (token: string) => {
      if (!editor) return;
      editor.chain().focus().insertContent(token).run();
    },
    [editor]
  );

  // ─── Render: Null Safety Guard ───────────────────────────────
  if (!editor || editor.isDestroyed || !editor.schema) {
    return (
      <div className="email-builder-container border rounded-xl shadow-sm bg-white p-8 text-center text-slate-500">
        <span className="inline-block w-4 h-4 border-2 border-slate-300 border-t-orange-500 rounded-full animate-spin mr-2" />
        Initializing Email Builder Engine...
      </div>
    );
  }

  return (
    <div className="email-builder-container border border-slate-200 rounded-xl shadow-sm bg-white overflow-hidden">
      {/* ── Toolbar ──────────────────────────────────────────── */}
      <div
        data-testid="tiptap-editor-toolbar"
        className="toolbar p-3 border-b border-slate-200 flex flex-wrap gap-2 bg-slate-50/80 items-center"
      >
        {/* Text formatting */}
        <div className="flex gap-1">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            label="Bold"
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            label="Italic"
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive('strike')}
            label="Strike"
          />
        </div>

        <div className="w-px h-6 bg-slate-300 mx-1" />

        {/* Headings & Lists */}
        <div className="flex gap-1">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive('heading', { level: 1 })}
            label="H1"
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive('heading', { level: 2 })}
            label="H2"
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            label="Bullet List"
          />
        </div>

        <div className="w-px h-6 bg-slate-300 mx-1" />

        {/* Media */}
        <button
          onClick={addImage}
          className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          type="button"
          title="Insert Image via URL"
        >
          Insert Image
        </button>

        <div className="w-px h-6 bg-slate-300 mx-1" />

        {/* Dynamic content */}
        <button
          onClick={insertDynamicInventoryTable}
          disabled={lots.length === 0}
          className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-emerald-300 disabled:cursor-not-allowed text-xs font-semibold transition-colors cursor-pointer"
          type="button"
          title={
            lots.length === 0
              ? 'No inventory lots available to render'
              : 'Insert ProseMirror-native rendered inventory table'
          }
        >
          Insert Inventory Table
        </button>

        <button
          onClick={insertInventoryToken}
          className="px-2.5 py-1 bg-indigo-100 text-indigo-800 rounded-lg hover:bg-indigo-200 text-xs font-semibold transition-colors cursor-pointer border border-indigo-200"
          type="button"
          title="Insert {{inventory_table}} token chip for server-side replacement"
        >
          + Table Token
        </button>

        <div className="w-px h-6 bg-slate-300 mx-1" />

        {/* Personalization tokens */}
        <button
          onClick={() => insertToken('{{buyer_name}}')}
          className="px-2 py-1 bg-purple-100 text-purple-800 rounded-lg hover:bg-purple-200 text-xs font-medium transition-colors cursor-pointer"
          type="button"
        >
          + Buyer Name
        </button>
        <button
          onClick={() => insertToken('{{discount_percent}}')}
          className="px-2 py-1 bg-purple-100 text-purple-800 rounded-lg hover:bg-purple-200 text-xs font-medium transition-colors cursor-pointer"
          type="button"
        >
          + Discount %
        </button>
        <button
          onClick={() => insertToken('{{quick_bid_link}}')}
          className="px-2 py-1 bg-purple-100 text-purple-800 rounded-lg hover:bg-purple-200 text-xs font-medium transition-colors cursor-pointer"
          type="button"
        >
          + Quick Bid
        </button>
      </div>

      {/* ── Status bar ───────────────────────────────────────── */}
      {reduxError && (
        <div className="px-4 py-2 border-b border-rose-200 bg-rose-50 text-xs text-rose-700 flex items-center gap-2">
          <span>⚠</span> {reduxError}
        </div>
      )}

      {/* ── Editor canvas ────────────────────────────────────── */}
      <div className="editor-content p-5 min-h-[350px]">
        <EditorContent editor={editor} />
      </div>

      {/* ── Footer info ──────────────────────────────────────── */}
      <div className="px-4 py-2 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 flex justify-between items-center">
        <span>
          {lots.length} lot{lots.length !== 1 ? 's' : ''} available for data insertion
        </span>
        <span>
          {editor.storage.characterCount?.characters?.() ?? editor.getText().length} characters
        </span>
      </div>
    </div>
  );
};

// ─── Sub-component: ToolbarButton ─────────────────────────────
interface ToolbarButtonProps {
  onClick: () => void;
  isActive: boolean;
  label: string;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({ onClick, isActive, label }) => (
  <button
    onClick={onClick}
    className={`
      px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer
      ${isActive ? 'bg-indigo-600 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'}
    `}
    type="button"
  >
    {label}
  </button>
);
