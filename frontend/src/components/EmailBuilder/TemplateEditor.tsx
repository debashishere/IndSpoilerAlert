import React, { useState, useCallback, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import {
  createEmailTemplate,
  updateEmailTemplate,
  getEmailTemplates,
} from '../../services/networkService';
import type { EmailTemplate, EmailTemplateCategory, CreateEmailTemplatePayload } from '../../services/networkService';
import { WorkflowTipTapBodyEditor } from './WorkflowTipTapBodyEditor';
import { LiveDevicePreview } from '../LiveDevicePreview';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface TemplateEditorProps {
  supplierId: string;
  /** Template to edit. Undefined → new template mode. */
  template?: EmailTemplate;
  onBack: () => void;
  /** Called after a successful save so the gallery can refresh its list. */
  onSaved: (templates: EmailTemplate[]) => void;
}

type TemplateFormState = {
  name: string;
  category: EmailTemplateCategory;
  subject: string;
  fromEmail: string;
  signature: string;
};

const CATEGORY_OPTIONS: EmailTemplateCategory[] = ['Clearance', 'Auction', 'Award', 'General'];

const DEFAULT_BODY_HTML = `<p style="font-family: Verdana, sans-serif; font-size: 11pt;">Dear {{buyer_name}},</p><p style="font-family: Verdana, sans-serif; font-size: 11pt;">We have an urgent inventory offer available for review. Please see details below:</p>`;

// ---------------------------------------------------------------------------
// TemplateEditor
// ---------------------------------------------------------------------------
export const TemplateEditor: React.FC<TemplateEditorProps> = ({
  supplierId,
  template,
  onBack,
  onSaved,
}) => {
  const isNew = !template;

  const [form, setForm] = useState<TemplateFormState>({
    name: template?.name ?? '',
    category: template?.category ?? 'General',
    subject: template?.subject ?? '',
    fromEmail: '',
    signature: '',
  });

  // Body HTML lives in separate state, initialised from template.body if editing
  const [bodyHtml, setBodyHtml] = useState<string>(
    template?.body ?? DEFAULT_BODY_HTML
  );

  const [errors, setErrors] = useState<{ name?: string; subject?: string }>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showDiscard, setShowDiscard] = useState(false);

  // Active mode tab: 'authoring' | 'preview'
  const [activeModeTab, setActiveModeTab] = useState<'authoring' | 'preview'>('authoring');

  // Track dirtiness: any change to form fields or body marks it dirty
  const isDirty = useRef(false);

  const handleChange = useCallback(
    (field: keyof TemplateFormState) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        isDirty.current = true;
        setForm((prev) => ({ ...prev, [field]: e.target.value }));
        // Clear the error for that field on change
        if (field === 'name' || field === 'subject') {
          setErrors((prev) => ({ ...prev, [field]: undefined }));
        }
      },
    []
  );

  const handleBodyChange = useCallback((html: string) => {
    isDirty.current = true;
    setBodyHtml(html);
  }, []);

  const validate = () => {
    const errs: { name?: string; subject?: string } = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.subject.trim()) errs.subject = 'Subject is required';
    return errs;
  };

  const handleSave = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      const payload: CreateEmailTemplatePayload = {
        name: form.name.trim(),
        subject: form.subject.trim(),
        category: form.category,
        bodyHtml,
        supplierId,
        fromEmail: form.fromEmail || undefined,
        signature: form.signature || undefined,
      };

      if (isNew) {
        await createEmailTemplate(payload);
      } else {
        await updateEmailTemplate(template!._id, payload);
      }

      // Re-fetch the gallery list and return
      const refreshed = await getEmailTemplates(supplierId);
      onSaved(refreshed);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Save failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleBackClick = () => {
    if (isDirty.current) {
      setShowDiscard(true);
    } else {
      onBack();
    }
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.8rem',
    fontWeight: 600,
    color: 'hsl(var(--text-secondary))',
    marginBottom: '4px',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 10px',
    borderRadius: '7px',
    border: '1px solid hsl(var(--border))',
    background: 'hsl(var(--surface))',
    color: 'hsl(var(--text-primary))',
    fontSize: '0.875rem',
    boxSizing: 'border-box',
  };

  const errorStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    color: 'hsl(0 60% 45%)',
    marginTop: '3px',
  };

  return (
    <div
      className="template-editor"
      style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}
    >
      {/* ── Header ── */}
      <div
        className="template-editor-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 20px',
          borderBottom: '1px solid hsl(var(--border))',
          flexShrink: 0,
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            aria-label="Back"
            onClick={handleBackClick}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 10px',
              background: 'none',
              border: '1px solid hsl(var(--border))',
              borderRadius: '7px',
              cursor: 'pointer',
              color: 'hsl(var(--text-secondary))',
              fontSize: '0.8rem',
              fontWeight: 500,
            }}
          >
            <ArrowLeft size={14} />
            Back
          </button>
          <h2
            style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'hsl(var(--text-primary))' }}
          >
            {isNew ? 'New Template' : 'Edit Template'}
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {saveError && (
            <span style={{ fontSize: '0.8rem', color: 'hsl(0 60% 45%)' }}>{saveError}</span>
          )}
          <button
            aria-label="Discard draft"
            onClick={handleBackClick}
            style={{
              padding: '7px 16px',
              background: 'none',
              border: '1px solid hsl(var(--border))',
              borderRadius: '7px',
              cursor: 'pointer',
              color: 'hsl(var(--text-secondary))',
              fontSize: '0.825rem',
              fontWeight: 500,
            }}
          >
            Discard
          </button>
          <button
            aria-label="Save"
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '7px 20px',
              background: saving ? 'hsl(var(--primary) / 0.6)' : 'hsl(var(--primary))',
              color: '#fff',
              border: 'none',
              borderRadius: '7px',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: '0.825rem',
              fontWeight: 600,
            }}
          >
            {saving ? 'Saving…' : 'Save Template'}
          </button>
        </div>
      </div>

      {/* ── Mode Toggles: Authoring Mode vs Live Email Preview ── */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          padding: '8px 20px',
          borderBottom: '1px solid hsl(var(--border))',
          background: 'hsl(var(--surface))',
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          data-testid="tab-authoring-mode"
          onClick={() => setActiveModeTab('authoring')}
          style={{
            padding: '6px 14px',
            borderRadius: '6px',
            border: 'none',
            borderBottom: activeModeTab === 'authoring' ? '2px solid hsl(var(--primary))' : '2px solid transparent',
            background: 'none',
            fontWeight: activeModeTab === 'authoring' ? 600 : 400,
            fontSize: '0.85rem',
            color: activeModeTab === 'authoring' ? 'hsl(var(--primary))' : 'hsl(var(--text-muted))',
            cursor: 'pointer',
          }}
        >
          Authoring Mode
        </button>
        <button
          type="button"
          data-testid="tab-preview-mode"
          onClick={() => setActiveModeTab('preview')}
          style={{
            padding: '6px 14px',
            borderRadius: '6px',
            border: 'none',
            borderBottom: activeModeTab === 'preview' ? '2px solid hsl(var(--primary))' : '2px solid transparent',
            background: 'none',
            fontWeight: activeModeTab === 'preview' ? 600 : 400,
            fontSize: '0.85rem',
            color: activeModeTab === 'preview' ? 'hsl(var(--primary))' : 'hsl(var(--text-muted))',
            cursor: 'pointer',
          }}
        >
          Live Email Preview
        </button>
      </div>

      {activeModeTab === 'preview' ? (
        <div data-testid="full-width-live-preview" style={{ flex: 1, overflow: 'auto', padding: '24px 28px' }}>
          <LiveDevicePreview
            subject={form.subject}
            bodyHtml={bodyHtml}
            context={{
              buyer_name: 'FreshMart Wholesale',
              supplier_name: 'Unilever Supply Operations',
              lot_title: form.name || 'Surplus Dairy & Beverage Pack Lot #880',
            }}
          />
        </div>
      ) : (
        /* ── Scrollable content area: Metadata + Body Editor ── */
        <div style={{ flex: 1, overflow: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* ── Metadata form ── */}
          <div>
            <h3 style={{ margin: '0 0 14px', fontSize: '0.875rem', fontWeight: 700, color: 'hsl(var(--text-secondary))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Template Details
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                maxWidth: '860px',
              }}
            >
              {/* Name */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="te-name" style={labelStyle}>
                  Template Name <span style={{ color: 'hsl(0 60% 45%)' }}>*</span>
                </label>
                <input
                  id="te-name"
                  aria-label="Template Name"
                  type="text"
                  value={form.name}
                  onChange={handleChange('name')}
                  placeholder="e.g. Clearance Blast"
                  style={{
                    ...inputStyle,
                    borderColor: errors.name ? 'hsl(0 60% 60%)' : undefined,
                  }}
                />
                {errors.name && <p role="alert" style={errorStyle}>{errors.name}</p>}
              </div>

              {/* Category */}
              <div>
                <label htmlFor="te-category" style={labelStyle}>
                  Category
                </label>
                <select
                  id="te-category"
                  aria-label="Category"
                  value={form.category}
                  onChange={handleChange('category')}
                  style={inputStyle}
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Subject */}
              <div>
                <label htmlFor="te-subject" style={labelStyle}>
                  Subject <span style={{ color: 'hsl(0 60% 45%)' }}>*</span>
                </label>
                <input
                  id="te-subject"
                  aria-label="Subject"
                  type="text"
                  value={form.subject}
                  onChange={handleChange('subject')}
                  placeholder="Email subject line"
                  style={{
                    ...inputStyle,
                    borderColor: errors.subject ? 'hsl(0 60% 60%)' : undefined,
                  }}
                />
                {errors.subject && <p role="alert" style={errorStyle}>{errors.subject}</p>}
              </div>

              {/* From Email */}
              <div>
                <label htmlFor="te-from-email" style={labelStyle}>
                  From Email
                </label>
                <input
                  id="te-from-email"
                  aria-label="From Email"
                  type="email"
                  value={form.fromEmail}
                  onChange={handleChange('fromEmail')}
                  placeholder="sender@example.com"
                  style={inputStyle}
                />
              </div>

              {/* Signature */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="te-signature" style={labelStyle}>
                  Signature
                </label>
                <input
                  id="te-signature"
                  aria-label="Signature"
                  type="text"
                  value={form.signature}
                  onChange={handleChange('signature')}
                  placeholder="Sign-off text"
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          {/* ── Email Body Editor ── */}
          <div style={{ maxWidth: '860px', width: '100%' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: '0.875rem', fontWeight: 700, color: 'hsl(var(--text-secondary))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Email Body
            </h3>
            <WorkflowTipTapBodyEditor
              contentHtml={bodyHtml}
              onChange={handleBodyChange}
              availableTokens={['buyer_name', 'lot_title', 'inventory_table', 'quick_bid_link', 'supplier_name']}
            />
          </div>

        </div>
      )}

      {/* ── Discard confirmation dialog ── */}
      {showDiscard && (
        <div
          role="dialog"
          aria-label="Discard changes"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: 'hsl(var(--surface))',
              borderRadius: '12px',
              padding: '28px 32px',
              maxWidth: '380px',
              width: '100%',
              boxShadow: '0 16px 48px rgba(0,0,0,0.18)',
            }}
          >
            <h3 style={{ margin: '0 0 10px', fontSize: '1rem', fontWeight: 700 }}>
              Discard changes?
            </h3>
            <p style={{ margin: '0 0 22px', fontSize: '0.875rem', color: 'hsl(var(--text-muted))' }}>
              Your unsaved changes will be lost. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                aria-label="Keep editing"
                onClick={() => setShowDiscard(false)}
                style={{
                  padding: '7px 16px',
                  background: 'none',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '7px',
                  cursor: 'pointer',
                  fontWeight: 500,
                  fontSize: '0.85rem',
                }}
              >
                Keep editing
              </button>
              <button
                aria-label="Discard"
                onClick={() => {
                  setShowDiscard(false);
                  onBack();
                }}
                style={{
                  padding: '7px 16px',
                  background: 'hsl(0 65% 50%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '7px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                }}
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
