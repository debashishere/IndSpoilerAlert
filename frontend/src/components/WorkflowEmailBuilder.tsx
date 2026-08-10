import React, { useState, useEffect } from 'react';
import { ChevronRight, Save, ArrowLeft, ArrowRight, Tag, AlertTriangle, Check } from 'lucide-react';
import { EmailMetadataForm, type TemplateOption } from './EmailMetadataForm';
import { TagsDrawer } from './TagsDrawer';
import { WorkflowTipTapBodyEditor } from './EmailBuilder/WorkflowTipTapBodyEditor';
import { B2B_TEMPLATE_PRESETS, getB2BPresetById } from '../utils/b2bTemplatePresets';

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
      const badgeHtml = `<span data-token="${cleanToken}" class="token-badge-pill" style="display: inline-flex; align-items: center; background-color: #fff7ed; color: #c2410c; border: 1px solid #fed7aa; padding: 2px 8px; border-radius: 9999px; font-weight: 600; font-size: 0.825rem; font-family: monospace;">{{${cleanToken}}}</span>`;
      handleBodyChange(`${bodyHtml} ${badgeHtml}`);
    }
  };

  return (
    <div
      data-testid="workflow-email-builder-container"
      className="bg-white rounded-xl border border-slate-200 shadow-sm text-slate-800 font-sans overflow-hidden relative"
      style={{
        backgroundColor: '#ffffff',
        borderColor: '#e2e8f0',
        color: '#1e293b',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        position: 'relative'
      }}
    >
      {/* Header Navigation Bar */}
      <header
        className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/50"
        style={{
          borderBottom: '1px solid #e2e8f0',
          backgroundColor: '#f8fafc',
          padding: '16px 24px'
        }}
      >
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-sm text-slate-500 font-medium">
          <span style={{ color: '#64748b', fontSize: '13px', fontWeight: 500 }}>Campaigns</span>
          <ChevronRight size={14} style={{ color: '#94a3b8' }} />
          <span style={{ color: '#64748b', fontSize: '13px', fontWeight: 500 }}>Liquidation Workflow</span>
          <ChevronRight size={14} style={{ color: '#94a3b8' }} />
          <span
            style={{
              color: '#f97316',
              fontSize: '13px',
              fontWeight: 700,
              backgroundColor: '#fff7ed',
              padding: '2px 8px',
              borderRadius: '6px',
              border: '1px solid #ffedd5'
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
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-orange-700 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-all cursor-pointer shadow-xs"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              fontSize: '12px',
              fontWeight: 600,
              color: '#c2410c',
              backgroundColor: '#fff7ed',
              border: '1px solid #fed7aa',
              borderRadius: '8px',
              cursor: 'pointer',
              boxShadow: '0 1px 2px 0 rgba(249, 115, 22, 0.05)',
              transition: 'all 0.15s ease'
            }}
          >
            <Tag size={14} style={{ color: '#ea580c' }} />
            <span>&lt; Tags</span>
          </button>

          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm cursor-pointer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              fontSize: '12px',
              fontWeight: 600,
              color: '#475569',
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
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
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-300 rounded-lg hover:bg-slate-200 transition-all cursor-pointer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              fontSize: '12px',
              fontWeight: 600,
              color: '#334155',
              backgroundColor: '#f1f5f9',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.5 : 1,
              transition: 'all 0.15s ease'
            }}
          >
            <Save size={14} style={{ color: '#64748b' }} />
            <span>Save as Draft</span>
          </button>

          <button
            type="button"
            data-testid="next-step-btn"
            onClick={() => onNext?.({ ...metadata, bodyHtml })}
            disabled={disabled}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-all shadow-sm cursor-pointer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              fontSize: '12px',
              fontWeight: 600,
              color: '#ffffff',
              backgroundColor: disabled ? '#94a3b8' : '#f97316',
              border: disabled ? '1px solid #94a3b8' : '1px solid #ea580c',
              borderRadius: '8px',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.5 : 1,
              boxShadow: disabled ? 'none' : '0 1px 2px 0 rgba(249, 115, 22, 0.2)',
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
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
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
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4" style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '24px', maxWidth: '448px' }}>
            <div className="flex items-center gap-3 text-amber-600">
              <AlertTriangle size={24} style={{ color: '#d97706' }} />
              <h3 className="font-bold text-base text-slate-800">Replace Current Email Body?</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
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
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
                style={{ padding: '8px 16px', fontSize: '12px', borderRadius: '8px', backgroundColor: '#f1f5f9', color: '#475569', fontWeight: 600 }}
              >
                Keep Current Edits
              </button>
              <button
                type="button"
                data-testid="confirm-template-change-btn"
                onClick={confirmTemplateChange}
                className="px-4 py-2 text-xs font-semibold text-white bg-orange-600 rounded-lg hover:bg-orange-700"
                style={{ padding: '8px 16px', fontSize: '12px', borderRadius: '8px', backgroundColor: '#ea580c', color: '#ffffff', fontWeight: 600 }}
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
