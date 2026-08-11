import React from 'react';
import { Mail, LayoutTemplate, PenLine, FileSignature } from 'lucide-react';

export interface TemplateOption {
  id: string;
  name: string;
}

export interface SignatureOption {
  id: string;
  name: string;
}

export interface EmailMetadataFormProps {
  template?: string;
  fromEmail?: string;
  subject?: string;
  signature?: string;
  templates?: TemplateOption[];
  fromEmailOptions?: string[];
  signatures?: SignatureOption[];
  onChange?: (field: 'template' | 'fromEmail' | 'subject' | 'signature', value: string) => void;
  onSubjectFocus?: () => void;
  onSubjectBlur?: () => void;
}

const DEFAULT_TEMPLATES: TemplateOption[] = [
  { id: 'distressed-stock-v1', name: 'Distressed Stock Clearance' },
  { id: 'auction-notice-v1', name: 'Liquidation Auction Notice' },
  { id: 'direct-award-v1', name: 'Direct PO Award Notification' },
  { id: 'general-clearance-v1', name: 'General Clearance Outreach' }
];

const DEFAULT_FROM_EMAILS: string[] = [
  'sales@spoiler-alert.com',
  'clearance@spoiler-alert.com',
  'deals@spoiler-alert.com',
  'auctions@spoiler-alert.com'
];

const DEFAULT_SIGNATURES: SignatureOption[] = [
  { id: 'default-sales-sig', name: 'Default Sales Operations Team' },
  { id: 'executive-sig', name: 'Executive Director Signature' },
  { id: 'account-mgr-sig', name: 'Dedicated Account Manager' },
  { id: 'none', name: 'No Signature (Plain Text)' }
];

export const EmailMetadataForm: React.FC<EmailMetadataFormProps> = ({
  template = 'distressed-stock-v1',
  fromEmail = 'sales@spoiler-alert.com',
  subject = '',
  signature = 'default-sales-sig',
  templates = DEFAULT_TEMPLATES,
  fromEmailOptions = DEFAULT_FROM_EMAILS,
  signatures = DEFAULT_SIGNATURES,
  onChange,
  onSubjectFocus,
  onSubjectBlur
}) => {
  return (
    <div
      data-testid="email-metadata-form"
      className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 shadow-xs mb-6 text-slate-800 font-sans"
      style={{
        backgroundColor: 'var(--surface-elevated, #f8fafc)',
        padding: '20px',
        borderRadius: '12px',
        border: '1px solid var(--border, #e2e8f0)',
        marginBottom: '24px',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      }}
    >
      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px'
        }}
      >
        {/* Template Selection Field */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="email-metadata-template"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-700"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--text-secondary, #334155)',
              marginBottom: '4px'
            }}
          >
            <LayoutTemplate size={14} style={{ color: '#f97316' }} />
            <span>Template</span>
          </label>
          <select
            id="email-metadata-template"
            aria-label="Template"
            value={template}
            onChange={(e) => onChange?.('template', e.target.value)}
            className="w-full px-3 py-2 text-xs font-medium text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all cursor-pointer"
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--text-on-surface, #1e293b)',
              backgroundColor: 'var(--surface-card, #ffffff)',
              border: '1px solid var(--border, #cbd5e1)',
              borderRadius: '8px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            {templates.map((tpl) => (
              <option key={tpl.id} value={tpl.id}>
                {tpl.name}
              </option>
            ))}
          </select>
        </div>

        {/* From Email Field */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="email-metadata-from"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-700"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--text-secondary, #334155)',
              marginBottom: '4px'
            }}
          >
            <Mail size={14} style={{ color: '#f97316' }} />
            <span>From Email</span>
            <span style={{ color: '#ef4444', fontWeight: 700 }}>*</span>
          </label>
          <select
            id="email-metadata-from"
            aria-label="From Email"
            value={fromEmail}
            onChange={(e) => onChange?.('fromEmail', e.target.value)}
            className="w-full px-3 py-2 text-xs font-medium text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all cursor-pointer"
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--text-on-surface, #1e293b)',
              backgroundColor: 'var(--surface-card, #ffffff)',
              border: '1px solid var(--border, #cbd5e1)',
              borderRadius: '8px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            {fromEmailOptions.map((email) => (
              <option key={email} value={email}>
                {email}
              </option>
            ))}
          </select>
        </div>

        {/* Subject Line Field */}
        <div className="flex flex-col gap-1.5 md:col-span-2">
          <label
            htmlFor="email-metadata-subject"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-700"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--text-secondary, #334155)',
              marginBottom: '4px'
            }}
          >
            <PenLine size={14} style={{ color: '#f97316' }} />
            <span>Subject</span>
            <span style={{ color: '#ef4444', fontWeight: 700 }}>*</span>
          </label>
          <input
            id="email-metadata-subject"
            aria-label="Subject"
            type="text"
            value={subject}
            onChange={(e) => onChange?.('subject', e.target.value)}
            onFocus={onSubjectFocus}
            onBlur={onSubjectBlur}
            placeholder="e.g. Clearance Opportunity: {{lot.number}} - {{buyer.name}}"
            className="w-full px-3 py-2 text-xs font-medium text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--text-on-surface, #1e293b)',
              backgroundColor: 'var(--surface-card, #ffffff)',
              border: '1px solid var(--border, #cbd5e1)',
              borderRadius: '8px',
              outline: 'none'
            }}
          />
        </div>

        {/* Signature Selection Field */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="email-metadata-signature"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-700"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--text-secondary, #334155)',
              marginBottom: '4px'
            }}
          >
            <FileSignature size={14} style={{ color: '#f97316' }} />
            <span>Signature</span>
          </label>
          <select
            id="email-metadata-signature"
            aria-label="Signature"
            value={signature}
            onChange={(e) => onChange?.('signature', e.target.value)}
            className="w-full px-3 py-2 text-xs font-medium text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all cursor-pointer"
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--text-on-surface, #1e293b)',
              backgroundColor: 'var(--surface-card, #ffffff)',
              border: '1px solid var(--border, #cbd5e1)',
              borderRadius: '8px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            {signatures.map((sig) => (
              <option key={sig.id} value={sig.id}>
                {sig.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
