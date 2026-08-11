import React, { useState } from 'react';
import { ChevronRight, Save, ArrowLeft, ArrowRight, Tag, AlertTriangle } from 'lucide-react';
import { EmailMetadataForm, type TemplateOption } from './EmailMetadataForm';
import { TagsDrawer } from './TagsDrawer';
import { WorkflowTipTapBodyEditor } from './EmailBuilder/WorkflowTipTapBodyEditor';
import { getB2BPresetById } from '../utils/b2bTemplatePresets';

export interface WorkflowEmailMetadata {
  template: string;
  fromEmail: string;
  subject: string;
  signature: string;
  bodyHtml?: string;
}

export interface WorkflowEmailBuilderProps {
  onBack?: () => void;
  onSaveDraft?: (data?: WorkflowEmailMetadata) => void;
  onNext?: (data?: WorkflowEmailMetadata) => void;
  disabled?: boolean;
  initialMetadata?: Partial<WorkflowEmailMetadata>;
  onMetadataChange?: (metadata: WorkflowEmailMetadata) => void;
  children?: React.ReactNode;
}

const TEMPLATE_OPTIONS: TemplateOption[] = [
  { id: 'b2b-inventory-offer-sheet', name: 'Distressed Stock Clearance' },
  { id: 'short-dated-flash-sale', name: 'Short-Dated Flash Sale' },
  { id: 'bulk-clearance-announcement', name: 'Bulk Clearance Announcement' },
  { id: 'blank-slate', name: 'Blank Template (Custom HTML)' }
];

export const WorkflowEmailBuilder: React.FC<WorkflowEmailBuilderProps> = ({
  onBack,
  onSaveDraft,
  onNext,
  disabled = false,
  initialMetadata,
  onMetadataChange,
  children
}) => {
  const [metadata, setMetadata] = useState<WorkflowEmailMetadata>({
    template: initialMetadata?.template || 'b2b-inventory-offer-sheet',
    fromEmail: initialMetadata?.fromEmail || 'sales@spoiler-alert.com',
    subject: initialMetadata?.subject || 'Flash Sale: Distressed Dairy & Beverage Stock',
    signature: initialMetadata?.signature || 'default-sales-sig',
    bodyHtml: initialMetadata?.bodyHtml || getB2BPresetById('b2b-inventory-offer-sheet')?.bodyHtml || '<p>Dear {{buyer_name}},</p>'
  });

  const [bodyHtml, setBodyHtml] = useState<string>(
    initialMetadata?.bodyHtml || getB2BPresetById('b2b-inventory-offer-sheet')?.bodyHtml || '<p>Dear {{buyer_name}},</p>'
  );

  const [isTagsDrawerOpen, setIsTagsDrawerOpen] = useState(false);
  const [activeField, setActiveField] = useState<'subject' | 'body' | null>('body');

  // Confirmation Modal state for overwriting template
  const [pendingTemplateId, setPendingTemplateId] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [hasUnsavedEdits, setHasUnsavedEdits] = useState(false);

  const handleMetadataFieldChange = (field: 'template' | 'fromEmail' | 'subject' | 'signature', value: string) => {
    if (field === 'template') {
      // Check if user has unsaved edits in bodyHtml
      const currentPreset = getB2BPresetById(metadata.template);
      const isModified = currentPreset ? bodyHtml !== currentPreset.bodyHtml : true;

      if (isModified && hasUnsavedEdits) {
        setPendingTemplateId(value);
        setShowConfirmModal(true);
        return;
      } else {
        loadTemplateContent(value);
        return;
      }
    }

    const updated = { ...metadata, [field]: value };
    setMetadata(updated);
    onMetadataChange?.({ ...updated, bodyHtml });
  };

  const loadTemplateContent = (templateId: string) => {
    const preset = getB2BPresetById(templateId);
    const newHtml = preset ? preset.bodyHtml : '<p>Dear {{buyer_name}},</p>';
    const newSubject = preset ? preset.subject : metadata.subject;

    const updated = {
      ...metadata,
      template: templateId,
      subject: newSubject,
      bodyHtml: newHtml
    };
    setMetadata(updated);
    setBodyHtml(newHtml);
    setHasUnsavedEdits(false);
    onMetadataChange?.(updated);
  };

  const confirmTemplateChange = () => {
    if (pendingTemplateId) {
      loadTemplateContent(pendingTemplateId);
      setPendingTemplateId(null);
    }
    setShowConfirmModal(false);
  };

  const handleBodyChange = (html: string) => {
    setBodyHtml(html);
    setHasUnsavedEdits(true);
    const updated = { ...metadata, bodyHtml: html };
    setMetadata(updated);
    onMetadataChange?.(updated);
  };

  const handleSelectTag = (token: string) => {
    if (activeField === 'subject') {
      const updatedSubject = metadata.subject ? `${metadata.subject} ${token}` : token;
      handleMetadataFieldChange('subject', updatedSubject);
    } else {
      // Clean token name without braces for badge node insertion
      const cleanToken = token.replace(/[\{\}]/g, '');
      const badgeHtml = `<span data-token="${cleanToken}" class="token-badge-pill" style="display: inline-flex; align-items: center; background-color: hsl(var(--primary) / 0.1); color: hsl(var(--primary)); border: 1px solid hsl(var(--primary) / 0.1); padding: 2px 8px; border-radius: 9999px; font-weight: 600; font-size: 0.825rem; font-family: monospace;">{{${cleanToken}}}</span>`;
      handleBodyChange(`${bodyHtml} ${badgeHtml}`);
    }
  };

  return (
    <div
      data-testid="workflow-email-builder-container"
      className="bg-white rounded-xl border border-slate-200 shadow-sm text-[hsl(var(--text-secondary))] font-sans overflow-hidden relative" style={{ borderColor: 'hsl(var(--border-color))' }}
      style={{
        backgroundColor: 'var(--surface-card, white)',
        borderColor: 'var(--border, hsl(var(--border-color)))',
        color: 'var(--text-on-surface, hsl(var(--text-primary)))',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        position: 'relative'
      }}
    >
      {/* Header Navigation Bar */}
      <header
        className="flex items-center justify-between px-6 py-4 border-b bg-[hsl(var(--bg-card-hover))]" style={{ borderColor: 'hsl(var(--border-color))' }}
        style={{
          borderBottom: '1px solid var(--border, hsl(var(--border-color)))',
          backgroundColor: 'var(--surface-elevated, hsl(var(--bg-card-hover)))',
          padding: '16px 24px'
        }}
      >
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-sm font-medium" style={{ color: 'hsl(var(--text-muted))' }}>
          <span style={{ color: 'var(--text-muted, hsl(var(--text-muted)))', fontSize: '13px', fontWeight: 500 }}>Campaigns</span>
          <ChevronRight size={14} style={{ color: 'hsl(var(--border-color))' }} />
          <span style={{ color: 'var(--text-muted, hsl(var(--text-muted)))', fontSize: '13px', fontWeight: 500 }}>Liquidation Workflow</span>
          <ChevronRight size={14} style={{ color: 'hsl(var(--border-color))' }} />
          <span
            style={{
              color: 'hsl(var(--primary))',
              fontSize: '13px',
              fontWeight: 700,
              backgroundColor: 'hsl(var(--primary) / 0.1)',
              padding: '2px 8px',
              borderRadius: '6px',
              border: '1px solid hsl(var(--primary) / 0.1)'
            }}
          >
            Email Template Body
          </span>
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-3" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Tags Drawer Toggle Button */}
          <button
            type="button"
            data-testid="tags-drawer-toggle"
            onClick={() => setIsTagsDrawerOpen((prev) => !prev)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border rounded-lg bg-[hsl(var(--warning)_/_0.1)] transition-all cursor-pointer shadow-xs" style={{ color: 'hsl(var(--warning))', backgroundColor: 'hsl(var(--warning) / 0.1)', borderColor: 'hsl(var(--warning) / 0.3)' }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              fontSize: '12px',
              fontWeight: 600,
              color: 'hsl(var(--primary))',
              backgroundColor: 'hsl(var(--primary) / 0.1)',
              border: '1px solid hsl(var(--primary) / 0.1)',
              borderRadius: '8px',
              cursor: 'pointer',
              boxShadow: '0 1px 2px 0 hsl(var(--primary) / 0.05)',
              transition: 'all 0.15s ease'
            }}
          >
            <Tag size={14} style={{ color: 'hsl(var(--primary))' }} />
            <span>&lt; Tags</span>
          </button>

          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-white border rounded-lg text-[hsl(var(--text-primary))] transition-all shadow-sm cursor-pointer" style={{ color: 'hsl(var(--text-secondary))', borderColor: 'hsl(var(--border-color))' }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--text-secondary, hsl(var(--text-muted)))',
              backgroundColor: 'var(--surface-card, white)',
              border: '1px solid var(--border, hsl(var(--border-color)))',
              borderRadius: '8px',
              cursor: 'pointer',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
              transition: 'all 0.15s ease'
            }}
          >
            <ArrowLeft size={14} />
            <span>Back</span>
          </button>

          <button
            type="button"
            data-testid="save-draft-btn"
            onClick={() => onSaveDraft?.({ ...metadata, bodyHtml })}
            disabled={disabled}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-[hsl(var(--bg-card-hover))] border rounded-lg transition-all cursor-pointer" style={{ color: 'hsl(var(--text-secondary))', borderColor: 'hsl(var(--border-color))' }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--text-secondary, hsl(var(--text-primary)))',
              backgroundColor: 'var(--surface-elevated, hsl(var(--bg-card-hover)))',
              border: '1px solid var(--border, hsl(var(--border-color)))',
              borderRadius: '8px',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.5 : 1,
              transition: 'all 0.15s ease'
            }}
          >
            <Save size={14} style={{ color: 'hsl(var(--text-muted))' }} />
            <span>Save as Draft</span>
          </button>

          <button
            type="button"
            data-testid="next-step-btn"
            onClick={() => onNext?.({ ...metadata, bodyHtml })}
            disabled={disabled}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white rounded-lg bg-[hsl(var(--warning))] transition-all shadow-sm cursor-pointer" style={{ backgroundColor: 'hsl(var(--warning) / 0.1)' }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              fontSize: '12px',
              fontWeight: 600,
              color: 'white',
              backgroundColor: disabled ? 'hsl(var(--border-color))' : 'hsl(var(--primary))',
              border: disabled ? '1px solid hsl(var(--border-color))' : '1px solid hsl(var(--primary))',
              borderRadius: '8px',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.5 : 1,
              boxShadow: disabled ? 'none' : '0 1px 2px 0 hsl(var(--primary) / 0.2)',
              transition: 'all 0.15s ease'
            }}
          >
            <span>Next</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </header>

      {/* Main Studio Body Container */}
      <main className="p-6 space-y-4" style={{ padding: '24px' }}>
        {/* Email Metadata Form Header */}
        <EmailMetadataForm
          template={metadata.template}
          templates={TEMPLATE_OPTIONS}
          fromEmail={metadata.fromEmail}
          subject={metadata.subject}
          signature={metadata.signature}
          onChange={handleMetadataFieldChange}
          onSubjectFocus={() => setActiveField('subject')}
        />

        {/* TipTap Text Editor for Email Body */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700" style={{ color: 'hsl(var(--text-secondary))' }}>
            Email Body (Rich Text TipTap Editor)
          </label>

          <WorkflowTipTapBodyEditor
            contentHtml={bodyHtml}
            onChange={handleBodyChange}
            onSelectTag={handleSelectTag}
            disabled={disabled}
          />
        </div>

        {children}
      </main>

      {/* Dynamic Slide-out Tags Drawer */}
      <TagsDrawer
        isOpen={isTagsDrawerOpen}
        onClose={() => setIsTagsDrawerOpen(false)}
        onSelectTag={handleSelectTag}
      />

      {/* Template Replacement Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-[hsl(var(--bg-card)_/_0.8)] backdrop-blur-xs flex items-center justify-center z-50 p-4" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div className="bg-white rounded-xl border p-6 max-w-md w-full shadow-2xl space-y-4" style={{ borderColor: 'hsl(var(--border-color))' }} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', maxWidth: '448px' }}>
            <div className="flex items-center gap-3" style={{ color: 'hsl(var(--warning))' }}>
              <AlertTriangle size={24} style={{ color: 'hsl(var(--warning))' }} />
              <h3 className="font-bold text-base text-[hsl(var(--text-secondary))]">Replace Current Email Body?</h3>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: 'hsl(var(--text-secondary))' }}>
              Loading a new template will replace your existing body content and unsaved edits. Are you sure you want to load the new template?
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                data-testid="cancel-template-change-btn"
                onClick={() => {
                  setShowConfirmModal(false);
                  setPendingTemplateId(null);
                }}
                className="px-4 py-2 text-xs font-semibold bg-[hsl(var(--bg-card-hover))] rounded-lg" style={{ color: 'hsl(var(--text-secondary))' }}
                style={{ padding: '8px 16px', fontSize: '12px', borderRadius: '8px', backgroundColor: 'hsl(var(--bg-card-hover))', color: 'hsl(var(--text-muted))', fontWeight: 600 }}
              >
                Keep Current Edits
              </button>
              <button
                type="button"
                data-testid="confirm-template-change-btn"
                onClick={confirmTemplateChange}
                className="px-4 py-2 text-xs font-semibold text-white rounded-lg bg-[hsl(var(--warning))]" style={{ backgroundColor: 'hsl(var(--warning))' }}
                style={{ padding: '8px 16px', fontSize: '12px', borderRadius: '8px', backgroundColor: 'hsl(var(--primary))', color: 'white', fontWeight: 600 }}
              >
                Yes, Load Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
