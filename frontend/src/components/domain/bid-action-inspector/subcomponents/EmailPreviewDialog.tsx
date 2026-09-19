import React from 'react';
import { Eye, X } from 'lucide-react';
import type { InspectorMode } from '../types/bidActionInspector.types';

export interface EmailPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  buyerEmail: string;
  activeMode: InspectorMode;
  productTitle: string;
  hydratedEmailContent: string;
}

export const EmailPreviewDialog: React.FC<EmailPreviewDialogProps> = ({
  isOpen,
  onClose,
  buyerEmail,
  activeMode,
  productTitle,
  hydratedEmailContent
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Email Preview Dialog"
      data-testid="email-preview-dialog"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1100,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div
        style={{
          backgroundColor: 'hsl(var(--bg-card))',
          color: 'hsl(var(--text-primary))',
          borderRadius: '16px',
          border: '1px solid hsl(var(--border-color))',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}
      >
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid hsl(var(--border-color))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'hsl(var(--bg-main))'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Eye size={18} style={{ color: 'hsl(var(--primary))' }} />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>
              Outbound Email Preview
            </h3>
          </div>
          <button
            type="button"
            aria-label="Close Email Preview"
            data-testid="close-email-preview-btn"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'hsl(var(--text-muted))',
              padding: '4px'
            }}
          >
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: '20px', overflowY: 'auto' }}>
          <div
            data-testid="email-preview-metadata"
            style={{
              padding: '10px 14px',
              backgroundColor: 'hsl(var(--bg-main))',
              borderRadius: '8px',
              border: '1px solid hsl(var(--border-color))',
              marginBottom: '14px',
              fontSize: '0.8rem'
            }}
          >
            <div data-testid="email-preview-recipient"><strong>To:</strong> {buyerEmail}</div>
            <div data-testid="email-preview-subject" style={{ marginTop: '4px' }}>
              <strong>Subject:</strong> {
                activeMode === 'accept'
                  ? `Offer Awarded & Deal Settlement: ${productTitle}`
                  : activeMode === 'counter'
                    ? `Counter-Offer Proposal: ${productTitle}`
                    : `Offer Declined: ${productTitle}`
              }
            </div>
          </div>
          <div
            data-testid="email-preview-body"
            style={{
              padding: '16px',
              backgroundColor: '#ffffff',
              color: '#1e293b',
              borderRadius: '8px',
              border: '1px solid hsl(var(--border-color))',
              fontSize: '0.88rem',
              lineHeight: 1.5
            }}
            dangerouslySetInnerHTML={{ __html: hydratedEmailContent }}
          />
        </div>
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid hsl(var(--border-color))',
            display: 'flex',
            justifyContent: 'flex-end',
            backgroundColor: 'hsl(var(--bg-main))'
          }}
        >
          <button
            type="button"
            data-testid="done-email-preview-btn"
            onClick={onClose}
            className="btn btn-primary"
            style={{ fontSize: '0.85rem', padding: '6px 16px' }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
