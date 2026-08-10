// components/EmailBuilder/EmailBuilderEngine.tsx
import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { fetchSelectedLots, clearInventoryError } from '../../store/inventorySlice';
import { InventoryTableToken } from './extensions/InventoryTableToken';
import { Figure, Figcaption } from './extensions/Figure';
import { debounce } from '../../utils/debounce';

interface EmailBuilderEngineProps {
  campaignId: string;
  onHtmlChange?: (html: string) => void;
}

export const EmailBuilderEngine: React.FC<EmailBuilderEngineProps> = ({
  campaignId,
  onHtmlChange,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { lots, status, error } = useSelector((state: RootState) => state.inventory);

  // ─── Fetch inventory on mount ─────────────────────────────────
  useEffect(() => {
    if (campaignId) {
      dispatch(fetchSelectedLots(campaignId));
    }
    return () => {
      dispatch(clearInventoryError());
    };
  }, [campaignId, dispatch]);

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
  const extensions = useMemo(
    () => [
      StarterKit.configure({
        // Disable heading levels that don't render well in email clients
        heading: { levels: [1, 2, 3] },
      }),
      Image.configure({
        inline: false,
        allowBase64: false, // Prevent XSS via data URIs
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          style: 'width: 100%; border-collapse: collapse;',
        },
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: {
          style: 'background-color: #f3f4f6; font-weight: 600; text-align: left; padding: 8px; border: 1px solid #d1d5db;',
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          style: 'padding: 8px; border: 1px solid #d1d5db;',
        },
      }),
      InventoryTableToken,
      Figure,
      Figcaption,
    ],
    []
  );

  // ─── Editor instance ──────────────────────────────────────────
  const editor = useEditor({
    extensions,
    content: `
      <p>Draft your High-Conversion B2B Offer Sheet here...</p>
      <p></p>
    `,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      debouncedSaveRef.current(html);
    },
  });

  // ─── Insert image via URL ─────────────────────────────────────
  const addImage = useCallback(() => {
    if (!editor) return;

    const url = window.prompt('Enter Image URL');
    if (!url) return;

    // Basic URL validation
    try {
      new URL(url);
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

    // Build header row
    const headerCells = ['SKU', 'Description', 'Qty (Cases)', 'Price/Case'].map(
      (text) =>
        schema.nodes.tableHeader.create(null, [schema.text(text)])
    );
    const headerRow = schema.nodes.tableRow.create(null, headerCells);

    // Build data rows
    const dataRows = lots.map((lot) => {
      const cells = [
        schema.nodes.tableCell.create(null, [schema.text(lot.sku)]),
        schema.nodes.tableCell.create(null, [schema.text(lot.description)]),
        schema.nodes.tableCell.create(null, [schema.text(String(lot.quantity))]),
        schema.nodes.tableCell.create(null, [
          schema.text(`$${lot.pricePerCase.toFixed(2)}`),
        ]),
      ];
      return schema.nodes.tableRow.create(null, cells);
    });

    // Compose table node
    const tableNode = schema.nodes.table.create(null, [headerRow, ...dataRows]);

    // Insert as a block (new paragraph before if needed)
    editor
      .chain()
      .focus()
      .insertContent(tableNode)
      .run();
  }, [editor, lots]);

  // ─── Insert inventory table token ─────────────────────────────
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

  // ─── Insert generic text token ────────────────────────────────
  const insertToken = useCallback(
    (token: string) => {
      if (!editor) return;
      editor.chain().focus().insertContent(token).run();
    },
    [editor]
  );

  // ─── Render ───────────────────────────────────────────────────
  if (!editor) {
    return (
      <div className="email-builder-container border rounded-md shadow-sm bg-white p-8 text-center text-gray-500">
        Initializing editor...
      </div>
    );
  }

  return (
    <div className="email-builder-container border rounded-md shadow-sm bg-white">
      {/* ── Toolbar ──────────────────────────────────────────── */}
      <div className="toolbar p-3 border-b flex flex-wrap gap-2 bg-gray-50 items-center">
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

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Media */}
        <button
          onClick={addImage}
          className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm transition-colors"
          type="button"
        >
          Insert Image
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Dynamic content */}
        <button
          onClick={insertDynamicInventoryTable}
          disabled={lots.length === 0 || status !== 'succeeded'}
          className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed text-sm font-medium transition-colors"
          type="button"
          title={
            status === 'loading'
              ? 'Loading inventory...'
              : lots.length === 0
              ? 'No inventory available'
              : 'Insert rendered inventory table'
          }
        >
          Insert Inventory Table
        </button>

        <button
          onClick={insertInventoryToken}
          className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 text-sm font-medium transition-colors"
          type="button"
          title="Insert {{inventory_table}} token for server-side replacement"
        >
          + Table Token
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Personalization tokens */}
        <button
          onClick={() => insertToken('{{buyer_name}}')}
          className="px-2 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 text-sm transition-colors"
          type="button"
        >
          + Buyer Name
        </button>
        <button
          onClick={() => insertToken('{{discount_percent}}')}
          className="px-2 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 text-sm transition-colors"
          type="button"
        >
          + Discount %
        </button>
      </div>

      {/* ── Status bar ───────────────────────────────────────── */}
      {(status === 'loading' || error) && (
        <div className="px-4 py-2 border-b bg-gray-50">
          {status === 'loading' && (
            <span className="text-sm text-gray-600 flex items-center gap-2">
              <span className="inline-block w-3 h-3 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
              Loading inventory lots...
            </span>
          )}
          {error && (
            <span className="text-sm text-red-600 flex items-center gap-2">
              <span>⚠</span> {error}
            </span>
          )}
        </div>
      )}

      {/* ── Editor canvas ────────────────────────────────────── */}
      <div className="editor-content p-4 min-h-[400px]">
        <EditorContent editor={editor} />
      </div>

      {/* ── Footer info ──────────────────────────────────────── */}
      <div className="px-4 py-2 border-t bg-gray-50 text-xs text-gray-500 flex justify-between">
        <span>
          {lots.length} lot{lots.length !== 1 ? 's' : ''} loaded
        </span>
        <span>
          {editor.storage.characterCount?.characters?.() ?? editor.getText().length} chars
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
      px-2 py-1 rounded text-sm transition-colors
      ${isActive ? 'bg-blue-200 text-blue-900' : 'bg-gray-200 hover:bg-gray-300'}
    `}
    type="button"
  >
    {label}
  </button>
);