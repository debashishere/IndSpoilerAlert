import React, { useState } from 'react';
import { X, Search, Tag, User, Package, Building2, ExternalLink } from 'lucide-react';

export interface MergeTagItem {
  token: string;
  label: string;
  description?: string;
}

export interface MergeTagCategory {
  name: 'Buyer' | 'Inventory Lot' | 'Supplier/Agent' | 'Action Links' | string;
  icon: React.ElementType;
  tags: MergeTagItem[];
}

export const MERGE_TAG_CATEGORIES: MergeTagCategory[] = [
  {
    name: 'Buyer',
    icon: User,
    tags: [
      { token: '{{buyer.name}}', label: 'Buyer Contact Name', description: 'Primary contact person at buyer org' },
      { token: '{{buyer.company}}', label: 'Buyer Company Name', description: 'Registered business name' },
      { token: '{{buyer.email}}', label: 'Buyer Email Address', description: 'Direct recipient email' },
      { token: '{{buyer.discount_rate}}', label: 'Buyer Preferred Discount %', description: 'Contractual tier discount' }
    ]
  },
  {
    name: 'Inventory Lot',
    icon: Package,
    tags: [
      { token: '{{lot.number}}', label: 'Lot Reference Number', description: 'e.g. LOT-880 or ULVR-912' },
      { token: '{{lot.inventory_table_html}}', label: 'Itemized Inventory Table (HTML)', description: 'Full dynamic HTML SKU list' },
      { token: '{{lot.expiry_date}}', label: 'Lot Expiry Date', description: 'Nearest expiration date' },
      { token: '{{lot.title}}', label: 'Lot Title & Summary', description: 'Human readable lot description' },
      { token: '{{lot.cases_count}}', label: 'Total Cases Count', description: 'Aggregate volume in cases' }
    ]
  },
  {
    name: 'Supplier/Agent',
    icon: Building2,
    tags: [
      { token: '{{supplier.name}}', label: 'Supplier Org Name', description: 'Selling manufacturer or distributor' },
      { token: '{{agent.name}}', label: 'Assigned Sales Agent', description: 'Sales rep account manager' },
      { token: '{{agent.email}}', label: 'Agent Email', description: 'Direct contact email' },
      { token: '{{agent.phone}}', label: 'Agent Direct Phone', description: 'Support phone number' }
    ]
  },
  {
    name: 'Action Links',
    icon: ExternalLink,
    tags: [
      { token: '{{quick_bid_link}}', label: '1-Click Quick Bid Button', description: 'Encrypted 1-click bid URL' },
      { token: '{{accept_deal_link}}', label: 'Instant PO Accept Link', description: 'Direct checkout URL' },
      { token: '{{portal_login_link}}', label: 'Buyer Portal Login', description: 'Portal authentication link' }
    ]
  }
];

export interface TagsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTag: (token: string) => void;
  categories?: MergeTagCategory[];
}

export const TagsDrawer: React.FC<TagsDrawerProps> = ({
  isOpen,
  onClose,
  onSelectTag,
  categories = MERGE_TAG_CATEGORIES
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredCategories = categories
    .map((cat) => {
      const matchingTags = cat.tags.filter(
        (t) =>
          t.token.toLowerCase().includes(normalizedQuery) ||
          t.label.toLowerCase().includes(normalizedQuery) ||
          (t.description && t.description.toLowerCase().includes(normalizedQuery))
      );
      return {
        ...cat,
        tags: matchingTags
      };
    })
    .filter((cat) => cat.tags.length > 0);

  return (
    <aside
      data-testid="tags-drawer-panel"
      className="fixed right-0 top-0 bottom-0 w-80 bg-white border-l border-slate-200 shadow-xl z-50 flex flex-col font-sans overflow-hidden transition-all duration-200"
      style={{
        position: 'fixed',
        right: 0,
        top: 0,
        bottom: 0,
        width: '320px',
        backgroundColor: 'white',
        borderLeft: '1px solid hsl(var(--border-color))',
        boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.08)',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: '1px solid hsl(var(--border-color))',
          backgroundColor: 'hsl(var(--bg-card-hover))'
        }}
      >
        <div className="flex items-center gap-2" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Tag size={16} style={{ color: 'hsl(var(--warning))' }} />
          <span className="font-semibold text-sm text-slate-800" style={{ fontWeight: 600, fontSize: '14px', color: 'hsl(var(--bg-card))' }}>
            &lt; Tags
          </span>
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 border border-orange-200"
            style={{
              fontSize: '10px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '9999px',
              backgroundColor: 'hsl(var(--warning) / 0.1)',
              color: 'hsl(var(--warning))',
              border: '1px solid hsl(var(--warning) / 0.1)'
            }}
          >
            Dynamic Tokens
          </span>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-200/50 transition-colors cursor-pointer"
          style={{
            padding: '4px',
            color: 'hsl(var(--border-color))',
            borderRadius: '6px',
            cursor: 'pointer',
            border: 'none',
            background: 'transparent'
          }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-3 border-b border-slate-200 bg-white" style={{ padding: '12px', borderBottom: '1px solid hsl(var(--border-color))' }}>
        <div className="relative flex items-center" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search
            size={14}
            className="absolute left-3 text-slate-400"
            style={{ position: 'absolute', left: '10px', color: 'hsl(var(--border-color))' }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search merge tags..."
            aria-label="Search merge tags"
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            style={{
              width: '100%',
              paddingLeft: '32px',
              paddingRight: '12px',
              paddingTop: '6px',
              paddingBottom: '6px',
              fontSize: '12px',
              backgroundColor: 'hsl(var(--bg-card-hover))',
              border: '1px solid hsl(var(--border-color))',
              borderRadius: '8px',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* Content Categories & Tags List */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-5"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}
      >
        {filteredCategories.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400" style={{ padding: '32px 0', textAlign: 'center', fontSize: '12px', color: 'hsl(var(--border-color))' }}>
            No merge tags match "{searchQuery}"
          </div>
        ) : (
          filteredCategories.map((category) => {
            const CategoryIcon = category.icon;
            return (
              <div key={category.name} className="space-y-2" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: 'hsl(var(--text-muted))',
                    letterSpacing: '0.05em'
                  }}
                >
                  <CategoryIcon size={13} style={{ color: 'hsl(var(--warning))' }} />
                  <span>{category.name}</span>
                </div>

                <div className="flex flex-wrap gap-2" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {category.tags.map((tag) => (
                    <button
                      key={tag.token}
                      type="button"
                      onClick={() => onSelectTag(tag.token)}
                      title={tag.description || tag.label}
                      className="px-2.5 py-1 text-xs font-mono font-medium text-orange-700 bg-orange-50/80 border border-orange-200 rounded-md hover:bg-orange-100 hover:border-orange-300 transition-all cursor-pointer shadow-xs active:scale-95"
                      style={{
                        padding: '4px 10px',
                        fontSize: '12px',
                        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                        fontWeight: 600,
                        color: 'hsl(var(--warning))',
                        backgroundColor: 'hsl(var(--warning) / 0.1)',
                        border: '1px solid hsl(var(--warning) / 0.1)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {tag.token}
                    </button>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
