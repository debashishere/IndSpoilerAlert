// frontend/src/components/EmailBuilder/WorkflowTipTapBodyEditor.tsx
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useEditor, EditorContent, Extension, Mark, Node, mergeAttributes } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Image } from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Link as LinkIcon,
  ImageIcon,
  Code,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Palette,
  Highlighter,
  ChevronDown,
  Tag,
  Upload,
  X,
  Check,
  Quote,
  Type
} from 'lucide-react';

// ─── Custom Font Style Extension ──────────────────────────────────
export const TextStyle = Mark.create({
  name: 'textStyle',
  addAttributes() {
    return {
      fontFamily: {
        default: null,
        parseHTML: (element) => element.style.fontFamily || null,
        renderHTML: (attributes) => {
          if (!attributes.fontFamily) return {};
          return { style: `font-family: ${attributes.fontFamily}` };
        },
      },
      fontSize: {
        default: null,
        parseHTML: (element) => element.style.fontSize || null,
        renderHTML: (attributes) => {
          if (!attributes.fontSize) return {};
          return { style: `font-size: ${attributes.fontSize}` };
        },
      },
      color: {
        default: null,
        parseHTML: (element) => element.style.color || null,
        renderHTML: (attributes) => {
          if (!attributes.color) return {};
          return { style: `color: ${attributes.color}` };
        },
      },
      backgroundColor: {
        default: null,
        parseHTML: (element) => element.style.backgroundColor || null,
        renderHTML: (attributes) => {
          if (!attributes.backgroundColor) return {};
          return { style: `background-color: ${attributes.backgroundColor}` };
        },
      },
    };
  },
  parseHTML() {
    return [{ tag: 'span[style]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes), 0];
  },
});

// ─── Custom Alignment Extension ───────────────────────────────────
export const TextAlign = Extension.create({
  name: 'textAlign',
  addGlobalAttributes() {
    return [
      {
        types: ['heading', 'paragraph', 'blockquote'],
        attributes: {
          textAlign: {
            default: 'left',
            parseHTML: (element) => element.style.textAlign || 'left',
            renderHTML: (attributes) => {
              if (!attributes.textAlign || attributes.textAlign === 'left') return {};
              return { style: `text-align: ${attributes.textAlign}` };
            },
          },
        },
      },
    ];
  },
});

// ─── Custom Token Badge Node Extension ────────────────────────────
export const TokenBadgeNode = Node.create({
  name: 'tokenBadge',
  group: 'inline',
  inline: true,
  selectable: true,
  atom: true,

  addAttributes() {
    return {
      token: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-token') || '',
        renderHTML: (attributes) => ({
          'data-token': attributes.token,
          class: 'token-badge-pill',
          style:
            'display: inline-flex; align-items: center; gap: 4px; background-color: #fff7ed; color: #c2410c; border: 1px solid #fed7aa; padding: 2px 8px; border-radius: 9999px; font-weight: 600; font-size: 0.825rem; font-family: monospace; user-select: all; cursor: pointer;',
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-token]' }];
  },

  renderHTML({ HTMLAttributes, node }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes),
      `{{${node.attrs.token || 'token'}}}`
    ];
  },
});

// ─── Custom Link Mark ──────────────────────────────────────────────
export const LinkMark = Mark.create({
  name: 'linkMark',
  addAttributes() {
    return {
      href: {
        default: null,
        parseHTML: (element) => element.getAttribute('href'),
        renderHTML: (attributes) => ({ href: attributes.href, target: '_blank', rel: 'noopener noreferrer' }),
      },
    };
  },
  parseHTML() {
    return [{ tag: 'a[href]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['a', mergeAttributes(HTMLAttributes, { style: 'color: #2563eb; text-decoration: underline;' }), 0];
  },
});

export interface WorkflowTipTapBodyEditorProps {
  contentHtml?: string;
  onChange?: (html: string) => void;
  onSelectTag?: (token: string) => void;
  disabled?: boolean;
  availableTokens?: string[];
}

const DEFAULT_AVAILABLE_TOKENS = [
  'buyer_name',
  'lot_title',
  'inventory_table',
  'quick_bid_link',
  'supplier_name',
  'expiry_date',
  'total_cases',
  'discount_pct'
];

const FONT_FAMILIES = [
  { name: 'Verdana', value: 'Verdana, sans-serif' },
  { name: 'Inter', value: "'Inter', sans-serif" },
  { name: 'Arial', value: 'Arial, sans-serif' },
  { name: 'Georgia', value: 'Georgia, serif' },
  { name: 'Monospace', value: 'monospace' },
  { name: 'Trebuchet MS', value: "'Trebuchet MS', sans-serif" }
];

const FONT_SIZES = ['9pt', '10pt', '11pt', '12pt', '14pt', '16pt', '18pt', '24pt', '36pt'];

export const WorkflowTipTapBodyEditor: React.FC<WorkflowTipTapBodyEditorProps> = ({
  contentHtml = '',
  onChange,
  onSelectTag,
  disabled = false,
  availableTokens = DEFAULT_AVAILABLE_TOKENS
}) => {
  const [selectedFont, setSelectedFont] = useState('Verdana');
  const [selectedSize, setSelectedSize] = useState('11pt');
  const [selectedFormat, setSelectedFormat] = useState('Paragraph');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [textColor, setTextColor] = useState('#1e293b');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [showTokenDropdown, setShowTokenDropdown] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      ((Image as any)?.configure ? Image : (Image as any)?.default || Image).configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          style: 'max-width: 100%; height: auto; border-radius: 8px; margin: 12px 0;',
        },
      }),
      ((Table as any)?.configure ? Table : (Table as any)?.default || Table).configure({
        resizable: true,
        HTMLAttributes: {
          style: 'width: 100%; border-collapse: collapse; margin: 16px 0; border: 1px solid #cbd5e1;',
        },
      }),
      (TableRow as any)?.default || TableRow,
      ((TableHeader as any)?.configure ? TableHeader : (TableHeader as any)?.default || TableHeader).configure({
        HTMLAttributes: {
          style: 'background-color: #f1f5f9; font-weight: 600; text-align: left; padding: 8px 12px; border: 1px solid #cbd5e1;',
        },
      }),
      ((TableCell as any)?.configure ? TableCell : (TableCell as any)?.default || TableCell).configure({
        HTMLAttributes: {
          style: 'padding: 8px 12px; border: 1px solid #e2e8f0;',
        },
      }),
      TextStyle,
      TextAlign,
      TokenBadgeNode,
      LinkMark,
    ],
    content: contentHtml || `<p style="font-family: Verdana, sans-serif; font-size: 11pt;">Dear {{buyer_name}},</p><p style="font-family: Verdana, sans-serif; font-size: 11pt;">We have an urgent inventory offer available for review. Please see details below:</p>`,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange?.(html);
    },
  });

  // Sync content if controlled contentHtml changes externally
  useEffect(() => {
    if (editor && contentHtml !== undefined && editor.getHTML() !== contentHtml) {
      editor.commands.setContent(contentHtml, false);
    }
  }, [contentHtml, editor]);

  // Handle Token Insertion
  const handleInsertToken = useCallback(
    (token: string) => {
      if (!editor) return;
      editor.chain().focus().insertContent({ type: 'tokenBadge', attrs: { token } }).run();
      onSelectTag?.(`{{${token}}}`);
      setShowTokenDropdown(false);
    },
    [editor, onSelectTag]
  );

  // Handle Local File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64Url = reader.result as string;
      editor.chain().focus().setImage({ src: base64Url, alt: file.name }).run();
      setShowImageModal(false);
      setImageUrl('');
    };
    reader.readAsDataURL(file);
  };

  // Handle Drag & Drop Images into Editor
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (!editor) return;
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
    if (files.length > 0) {
      e.preventDefault();
      const reader = new FileReader();
      reader.onload = () => {
        const base64Url = reader.result as string;
        editor.chain().focus().setImage({ src: base64Url, alt: files[0].name }).run();
      };
      reader.readAsDataURL(files[0]);
    }
  };

  if (!editor) {
    return <div className="p-4 text-slate-400 text-sm">Initializing TipTap Body Editor...</div>;
  }

  return (
    <div
      data-testid="workflow-tiptap-editor"
      className="border border-slate-300 rounded-lg overflow-hidden bg-white shadow-xs"
      style={{ border: '1px solid #cbd5e1', borderRadius: '8px', backgroundColor: '#ffffff' }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      {/* ─── Top Toolbar (Matching Screenshot Layout) ───────────────────── */}
      <div
        className="flex flex-wrap items-center gap-1.5 px-3 py-2 border-b border-slate-200 bg-slate-50 text-slate-700 text-xs font-sans select-none"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 12px',
          borderBottom: '1px solid #e2e8f0',
          backgroundColor: '#f8fafc',
          color: '#334155'
        }}
      >
        {/* Font Family Selector */}
        <select
          data-testid="font-family-select"
          value={selectedFont}
          onChange={(e) => {
            const fontName = e.target.value;
            const fontObj = FONT_FAMILIES.find((f) => f.name === fontName);
            setSelectedFont(fontName);
            if (fontObj) {
              editor.chain().focus().setMark('textStyle', { fontFamily: fontObj.value }).run();
            }
          }}
          className="px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-700 font-medium cursor-pointer"
          style={{ padding: '4px 8px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '12px' }}
        >
          {FONT_FAMILIES.map((font) => (
            <option key={font.name} value={font.name}>
              {font.name}
            </option>
          ))}
        </select>

        {/* Font Size Selector */}
        <select
          data-testid="font-size-select"
          value={selectedSize}
          onChange={(e) => {
            const size = e.target.value;
            setSelectedSize(size);
            editor.chain().focus().setMark('textStyle', { fontSize: size }).run();
          }}
          className="px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-700 font-medium cursor-pointer"
          style={{ padding: '4px 8px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '12px' }}
        >
          {FONT_SIZES.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>

        <div className="h-4 w-px bg-slate-300 mx-1" style={{ height: '16px', width: '1px', backgroundColor: '#cbd5e1' }} />

        {/* Tags / Tokens Dropdown */}
        <div className="relative inline-block text-left">
          <button
            type="button"
            data-testid="editor-tokens-button"
            onClick={() => setShowTokenDropdown((prev) => !prev)}
            className="flex items-center gap-1 px-2.5 py-1 bg-orange-50 border border-orange-200 text-orange-800 rounded text-xs font-semibold hover:bg-orange-100 cursor-pointer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              backgroundColor: '#fff7ed',
              border: '1px solid #fed7aa',
              color: '#c2410c',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Tag size={13} style={{ color: '#ea580c' }} />
            <span>Tags</span>
            <ChevronDown size={12} />
          </button>

          {showTokenDropdown && (
            <div
              className="absolute left-0 mt-1 w-48 bg-white border border-slate-200 rounded-md shadow-lg z-50 py-1"
              style={{
                position: 'absolute',
                left: 0,
                marginTop: '4px',
                width: '192px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                zIndex: 50
              }}
            >
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Insert Token
              </div>
              {availableTokens.map((token) => (
                <button
                  key={token}
                  type="button"
                  onClick={() => handleInsertToken(token)}
                  className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-orange-50 hover:text-orange-700 flex items-center justify-between"
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '6px 12px',
                    fontSize: '12px',
                    color: '#334155',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}
                >
                  <span className="font-mono text-slate-600">&#123;&#123;{token}&#125;&#125;</span>
                  <PlusIcon size={12} style={{ color: '#f97316' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Named Styles / Formats Dropdown */}
        <select
          data-testid="formats-select"
          value={selectedFormat}
          onChange={(e) => {
            const fmt = e.target.value;
            setSelectedFormat(fmt);
            if (fmt === 'Heading 1') editor.chain().focus().toggleHeading({ level: 1 }).run();
            else if (fmt === 'Heading 2') editor.chain().focus().toggleHeading({ level: 2 }).run();
            else if (fmt === 'Heading 3') editor.chain().focus().toggleHeading({ level: 3 }).run();
            else if (fmt === 'Blockquote') editor.chain().focus().toggleBlockquote().run();
            else if (fmt === 'Code') editor.chain().focus().toggleCodeBlock().run();
            else editor.chain().focus().setParagraph().run();
          }}
          className="px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-700 font-medium cursor-pointer"
          style={{ padding: '4px 8px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '12px' }}
        >
          <option value="Paragraph">Paragraph</option>
          <option value="Heading 1">Heading 1</option>
          <option value="Heading 2">Heading 2</option>
          <option value="Heading 3">Heading 3</option>
          <option value="Blockquote">Blockquote</option>
          <option value="Code">Code Block</option>
        </select>

        <div className="h-4 w-px bg-slate-300 mx-1" style={{ height: '16px', width: '1px', backgroundColor: '#cbd5e1' }} />

        {/* Basic Text Formatting */}
        <button
          type="button"
          data-testid="btn-bold"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded hover:bg-slate-200 ${editor.isActive('bold') ? 'bg-slate-200 text-orange-600 font-bold' : ''}`}
          title="Bold"
          style={{ padding: '6px', borderRadius: '4px', cursor: 'pointer' }}
        >
          <Bold size={14} />
        </button>

        <button
          type="button"
          data-testid="btn-italic"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded hover:bg-slate-200 ${editor.isActive('italic') ? 'bg-slate-200 text-orange-600' : ''}`}
          title="Italic"
          style={{ padding: '6px', borderRadius: '4px', cursor: 'pointer' }}
        >
          <Italic size={14} />
        </button>

        {/* Lists */}
        <button
          type="button"
          data-testid="btn-bullet-list"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded hover:bg-slate-200 ${editor.isActive('bulletList') ? 'bg-slate-200 text-orange-600' : ''}`}
          title="Bulleted List"
          style={{ padding: '6px', borderRadius: '4px', cursor: 'pointer' }}
        >
          <List size={14} />
        </button>

        <button
          type="button"
          data-testid="btn-ordered-list"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded hover:bg-slate-200 ${editor.isActive('orderedList') ? 'bg-slate-200 text-orange-600' : ''}`}
          title="Numbered List"
          style={{ padding: '6px', borderRadius: '4px', cursor: 'pointer' }}
        >
          <ListOrdered size={14} />
        </button>

        <div className="h-4 w-px bg-slate-300 mx-1" style={{ height: '16px', width: '1px', backgroundColor: '#cbd5e1' }} />

        {/* Alignments */}
        <button
          type="button"
          data-testid="btn-align-left"
          onClick={() => editor.chain().focus().setNode('paragraph', { textAlign: 'left' }).run()}
          className="p-1.5 rounded hover:bg-slate-200"
          title="Align Left"
          style={{ padding: '6px', borderRadius: '4px', cursor: 'pointer' }}
        >
          <AlignLeft size={14} />
        </button>

        <button
          type="button"
          data-testid="btn-align-center"
          onClick={() => editor.chain().focus().setNode('paragraph', { textAlign: 'center' }).run()}
          className="p-1.5 rounded hover:bg-slate-200"
          title="Align Center"
          style={{ padding: '6px', borderRadius: '4px', cursor: 'pointer' }}
        >
          <AlignCenter size={14} />
        </button>

        <button
          type="button"
          data-testid="btn-align-right"
          onClick={() => editor.chain().focus().setNode('paragraph', { textAlign: 'right' }).run()}
          className="p-1.5 rounded hover:bg-slate-200"
          title="Align Right"
          style={{ padding: '6px', borderRadius: '4px', cursor: 'pointer' }}
        >
          <AlignRight size={14} />
        </button>

        <button
          type="button"
          data-testid="btn-align-justify"
          onClick={() => editor.chain().focus().setNode('paragraph', { textAlign: 'justify' }).run()}
          className="p-1.5 rounded hover:bg-slate-200"
          title="Justify"
          style={{ padding: '6px', borderRadius: '4px', cursor: 'pointer' }}
        >
          <AlignJustify size={14} />
        </button>

        <div className="h-4 w-px bg-slate-300 mx-1" style={{ height: '16px', width: '1px', backgroundColor: '#cbd5e1' }} />

        {/* Link Option */}
        <button
          type="button"
          data-testid="btn-link"
          onClick={() => {
            const previousUrl = editor.getAttributes('linkMark').href || '';
            setLinkUrl(previousUrl);
            setShowLinkModal(true);
          }}
          className={`p-1.5 rounded hover:bg-slate-200 ${editor.isActive('linkMark') ? 'bg-slate-200 text-orange-600' : ''}`}
          title="Insert Link"
          style={{ padding: '6px', borderRadius: '4px', cursor: 'pointer' }}
        >
          <LinkIcon size={14} />
        </button>

        {/* Image Option */}
        <button
          type="button"
          data-testid="btn-image"
          onClick={() => setShowImageModal(true)}
          className="p-1.5 rounded hover:bg-slate-200"
          title="Insert Image"
          style={{ padding: '6px', borderRadius: '4px', cursor: 'pointer' }}
        >
          <ImageIcon size={14} />
        </button>

        <div className="h-4 w-px bg-slate-300 mx-1" style={{ height: '16px', width: '1px', backgroundColor: '#cbd5e1' }} />

        {/* Text Color Picker */}
        <div className="flex items-center gap-1" title="Text Color" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <Palette size={14} style={{ color: '#475569' }} />
          <input
            type="color"
            data-testid="text-color-picker"
            value={textColor}
            onChange={(e) => {
              const col = e.target.value;
              setTextColor(col);
              editor.chain().focus().setMark('textStyle', { color: col }).run();
            }}
            className="w-5 h-5 rounded border border-slate-300 cursor-pointer"
            style={{ width: '20px', height: '20px', padding: 0, border: '1px solid #cbd5e1', cursor: 'pointer' }}
          />
        </div>

        {/* Background Color Picker */}
        <div className="flex items-center gap-1" title="Background Color" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <Highlighter size={14} style={{ color: '#475569' }} />
          <input
            type="color"
            data-testid="bg-color-picker"
            value={bgColor}
            onChange={(e) => {
              const col = e.target.value;
              setBgColor(col);
              editor.chain().focus().setMark('textStyle', { backgroundColor: col }).run();
            }}
            className="w-5 h-5 rounded border border-slate-300 cursor-pointer"
            style={{ width: '20px', height: '20px', padding: 0, border: '1px solid #cbd5e1', cursor: 'pointer' }}
          />
        </div>
      </div>

      {/* ─── TipTap Canvas ─────────────────────────────────────────────── */}
      <div className="p-4 min-h-[320px] max-h-[600px] overflow-y-auto font-sans text-slate-900" style={{ padding: '16px', minHeight: '320px', color: '#0f172a' }}>
        <EditorContent editor={editor} className="prose max-w-none focus:outline-none min-h-[280px] text-slate-900" style={{ color: '#0f172a' }} />
      </div>

      {/* Hidden File Input for Image Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
        style={{ display: 'none' }}
      />

      {/* ─── Link Modal ────────────────────────────────────────────────── */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div className="bg-white rounded-xl border border-slate-200 p-5 w-96 shadow-2xl space-y-4" style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '20px', width: '384px' }}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                <LinkIcon size={16} style={{ color: '#f97316' }} />
                Insert Hyperlink
              </h4>
              <button type="button" onClick={() => setShowLinkModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Target URL</label>
              <input
                type="url"
                data-testid="link-url-input"
                placeholder="https://example.com/bid"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-sans outline-none focus:border-orange-500"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '12px' }}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 font-semibold"
                style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '6px', backgroundColor: '#f1f5f9', color: '#475569' }}
              >
                Cancel
              </button>
              <button
                type="button"
                data-testid="apply-link-btn"
                onClick={() => {
                  if (linkUrl) {
                    editor.chain().focus().setMark('linkMark', { href: linkUrl }).run();
                  } else {
                    editor.chain().focus().unsetMark('linkMark').run();
                  }
                  setShowLinkModal(false);
                }}
                className="px-3 py-1.5 text-xs text-white bg-orange-500 rounded-lg hover:bg-orange-600 font-semibold"
                style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '6px', backgroundColor: '#f97316', color: '#ffffff' }}
              >
                Apply Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Image Modal ───────────────────────────────────────────────── */}
      {showImageModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div className="bg-white rounded-xl border border-slate-200 p-5 w-96 shadow-2xl space-y-4" style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '20px', width: '384px' }}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                <ImageIcon size={16} style={{ color: '#f97316' }} />
                Insert Image
              </h4>
              <button type="button" onClick={() => setShowImageModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Image URL</label>
              <input
                type="url"
                data-testid="image-url-input"
                placeholder="https://example.com/banner.png"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-sans outline-none focus:border-orange-500"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '12px' }}
              />
            </div>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-2 text-[10px] text-slate-400 uppercase font-bold">Or Upload File</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <button
              type="button"
              data-testid="upload-local-file-btn"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-orange-300 bg-orange-50/50 hover:bg-orange-50 text-orange-700 rounded-lg text-xs font-semibold cursor-pointer transition-all"
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px',
                border: '2px dashed #fdba74',
                backgroundColor: '#fff7ed',
                color: '#c2410c',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Upload size={14} />
              <span>Choose Image File (or Drag & Drop)</span>
            </button>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowImageModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 font-semibold"
                style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '6px', backgroundColor: '#f1f5f9', color: '#475569' }}
              >
                Cancel
              </button>
              <button
                type="button"
                data-testid="apply-image-btn"
                onClick={() => {
                  if (imageUrl) {
                    editor.chain().focus().setImage({ src: imageUrl, alt: imageAlt || 'Inserted Image' }).run();
                    setShowImageModal(false);
                    setImageUrl('');
                  }
                }}
                className="px-3 py-1.5 text-xs text-white bg-orange-500 rounded-lg hover:bg-orange-600 font-semibold"
                style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '6px', backgroundColor: '#f97316', color: '#ffffff' }}
              >
                Insert Image URL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper Icon Component for Dropdown
function PlusIcon({ size, style }: { size: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={style}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
