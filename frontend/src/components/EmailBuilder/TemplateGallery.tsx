import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2, Pencil, Layers } from 'lucide-react';
import { getEmailTemplates, deleteEmailTemplate } from '../../services/networkService';
import type { EmailTemplate } from '../../services/networkService';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface TemplateGalleryProps {
  supplierId: string;
  /** Called when the user clicks Edit on a card. Wired in ticket 03. */
  onEdit?: (template: EmailTemplate) => void;
  /** Called when the user clicks + New Template. Wired in ticket 03. */
  onNew?: () => void;
  /**
   * Pre-seeded template list from the editor after a successful save.
   * When provided the initial fetch is skipped and this list is used directly.
   */
  initialTemplates?: EmailTemplate[];
}

// ---------------------------------------------------------------------------
// Category badge colours
// ---------------------------------------------------------------------------
const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  Clearance: { bg: 'hsl(25 90% 92%)', text: 'hsl(25 80% 35%)' },
  Auction:   { bg: 'hsl(220 80% 92%)', text: 'hsl(220 70% 35%)' },
  Award:     { bg: 'hsl(130 60% 90%)', text: 'hsl(130 50% 30%)' },
  General:   { bg: 'hsl(var(--surface-alt, 240 5% 90%))', text: 'hsl(var(--text-muted))' },
};

function categoryStyle(category: string) {
  return CATEGORY_COLORS[category] ?? CATEGORY_COLORS.General;
}

function formatDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function LoadingSpinner() {
  return (
    <div
      role="status"
      aria-label="Loading templates"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: '12px',
        color: 'hsl(var(--text-muted))',
        padding: '60px 24px',
      }}
    >
      <div
        style={{
          width: '36px',
          height: '36px',
          border: '3px solid hsl(var(--border))',
          borderTopColor: 'hsl(var(--primary))',
          borderRadius: '50%',
          animation: 'tg-spin 0.7s linear infinite',
        }}
      />
      <span style={{ fontSize: '0.85rem' }}>Loading templates…</span>
      <style>{`@keyframes tg-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function EmptyState({ onNew }: { onNew?: () => void }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: '16px',
        color: 'hsl(var(--text-muted))',
        padding: '60px 24px',
        textAlign: 'center',
      }}
    >
      <Layers size={48} style={{ opacity: 0.3 }} />
      <h3
        style={{
          margin: 0,
          fontSize: '1.15rem',
          fontWeight: 600,
          color: 'hsl(var(--text-primary))',
        }}
      >
        No templates yet
      </h3>
      <p style={{ margin: 0, maxWidth: '340px', lineHeight: 1.6, fontSize: '0.875rem' }}>
        Create reusable email templates to speed up your outreach.
      </p>
      <button
        onClick={onNew}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '10px 20px',
          background: 'hsl(var(--primary))',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: 600,
          fontSize: '0.875rem',
        }}
      >
        <Plus size={15} />
        Create your first template
      </button>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      role="alert"
      style={{
        margin: '24px',
        padding: '14px 18px',
        borderRadius: '8px',
        background: 'hsl(0 80% 96%)',
        border: '1px solid hsl(0 60% 85%)',
        color: 'hsl(0 60% 35%)',
        fontSize: '0.875rem',
      }}
    >
      {message}
    </div>
  );
}

interface TemplateCardProps {
  template: EmailTemplate;
  onEdit?: (t: EmailTemplate) => void;
  onDelete: (id: string) => void;
}

function TemplateCard({ template, onEdit, onDelete }: TemplateCardProps) {
  const cat = categoryStyle(template.category);
  return (
    <div
      style={{
        background: 'hsl(var(--surface))',
        border: '1px solid hsl(var(--border))',
        borderRadius: '10px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        transition: 'box-shadow 0.15s',
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
        <span
          style={{
            fontWeight: 600,
            fontSize: '0.9rem',
            color: 'hsl(var(--text-primary))',
            lineHeight: 1.35,
            flex: 1,
          }}
        >
          {template.name}
        </span>
        <span
          style={{
            padding: '2px 8px',
            borderRadius: '20px',
            fontSize: '0.72rem',
            fontWeight: 600,
            background: cat.bg,
            color: cat.text,
            whiteSpace: 'nowrap',
          }}
        >
          {template.category}
        </span>
      </div>

      {/* Subject preview */}
      <p
        style={{
          margin: 0,
          fontSize: '0.8rem',
          color: 'hsl(var(--text-muted))',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {template.subject}
      </p>

      {/* Footer row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 'auto',
          paddingTop: '4px',
          borderTop: '1px solid hsl(var(--border))',
        }}
      >
        <span style={{ fontSize: '0.72rem', color: 'hsl(var(--text-muted))' }}>
          Updated {formatDate(template.updatedAt)}
        </span>

        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            aria-label={`Edit ${template.name}`}
            onClick={() => onEdit?.(template)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '5px 10px',
              fontSize: '0.75rem',
              fontWeight: 500,
              background: 'none',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px',
              cursor: 'pointer',
              color: 'hsl(var(--text-secondary))',
            }}
          >
            <Pencil size={12} />
            Edit
          </button>
          <button
            aria-label={`Delete ${template.name}`}
            onClick={() => onDelete(template._id)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '5px 10px',
              fontSize: '0.75rem',
              fontWeight: 500,
              background: 'none',
              border: '1px solid hsl(0 60% 85%)',
              borderRadius: '6px',
              cursor: 'pointer',
              color: 'hsl(0 55% 45%)',
            }}
          >
            <Trash2 size={12} />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export const TemplateGallery: React.FC<TemplateGalleryProps> = ({
  supplierId,
  onEdit,
  onNew,
  initialTemplates,
}) => {
  const [templates, setTemplates] = useState<EmailTemplate[]>(initialTemplates ?? []);
  const [loading, setLoading] = useState(!initialTemplates);
  const [error, setError] = useState<string | null>(null);

  // Fetch on mount / supplierId change — skip if a pre-seeded list was given
  useEffect(() => {
    if (initialTemplates) return; // already have data from the editor save
    let cancelled = false;
    setLoading(true);
    setError(null);

    getEmailTemplates(supplierId)
      .then((data) => {
        if (!cancelled) {
          setTemplates(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('Failed to load templates. Please try again.');
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [supplierId, initialTemplates]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteEmailTemplate(id);
      setTemplates((prev) => prev.filter((t) => t._id !== id));
    } catch {
      // Soft fail — keep the card; a toast/alert can be added later
    }
  }, []);

  return (
    <div
      className="template-gallery"
      style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}
    >
      {/* Gallery header */}
      <div
        className="template-gallery-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 20px',
          borderBottom: '1px solid hsl(var(--border))',
          flexShrink: 0,
        }}
      >
        <h2
          style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'hsl(var(--text-primary))' }}
        >
          Template Gallery
        </h2>
        <button
          onClick={onNew}
          aria-label="+ New Template"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            background: 'hsl(var(--primary))',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.825rem',
          }}
        >
          <Plus size={14} />
          + New Template
        </button>
      </div>

      {/* Content area */}
      <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
        {loading && <LoadingSpinner />}

        {!loading && error && <ErrorBanner message={error} />}

        {!loading && !error && templates.length === 0 && (
          <EmptyState onNew={onNew} />
        )}

        {!loading && !error && templates.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '16px',
            }}
          >
            {templates.map((tpl) => (
              <TemplateCard
                key={tpl._id}
                template={tpl}
                onEdit={onEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
