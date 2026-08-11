import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Mail,
  LayoutTemplate,
  PenLine,
  Edit3,
  Eye,
  Save,
  ChevronUp,
  ChevronDown,
  Sliders,
  Info,
  Users,
  Clock,
  Sparkles,
} from 'lucide-react';
import { WorkflowTipTapBodyEditor } from '../../EmailBuilder/WorkflowTipTapBodyEditor';
import { LiveDevicePreview } from '../../LiveDevicePreview';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StageEmailData {
  emailSubject: string;
  emailBodyHtml: string;
  emailTemplateId: string;
}

export interface StageEmailModalProps {
  /** Controls visibility */
  open: boolean;
  /** 1-based stage number displayed in the modal header */
  stageIndex: number;
  /** Values pre-seeded from the stage's current state */
  initialData: StageEmailData;
  /** Called with the saved data when the user clicks "Save Email Config" */
  onSave: (data: StageEmailData) => void;
  /** Called when the modal should close without saving (Cancel, Escape, ×) */
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function StageEmailModal({
  open,
  stageIndex,
  initialData,
  onSave,
  onClose,
}: StageEmailModalProps) {
  // ── local draft state (not committed to parent until Save) ──
  const [subject,    setSubject]    = useState(initialData.emailSubject);
  const [bodyHtml,   setBodyHtml]   = useState(initialData.emailBodyHtml);
  const [templateId, setTemplateId] = useState(initialData.emailTemplateId || 'default');

  // ── section minimise states ──
  const [isBodyMinimised,    setIsBodyMinimised]    = useState(false);
  const [isPreviewMinimised, setIsPreviewMinimised] = useState(false);

  // ── dynamic token config modal state ──
  const [showDynamicTokenPanel, setShowDynamicTokenPanel] = useState(false);
  const [tokenContext, setTokenContext] = useState({
    buyer_name: 'Apex Foods Corp',
    supplier_name: 'SpoilerAlert Wholesale',
    lot_title: 'Organic Grade-A Produce Batch',
    current_stage_discount: '25% OFF',
    expiry_hours: '24 Hours',
    quick_bid_link: 'https://bid.spoileralert.com/deal-884',
  });

  // Reset draft whenever the modal is opened with new initial data
  useEffect(() => {
    if (open) {
      setSubject(initialData.emailSubject);
      setBodyHtml(initialData.emailBodyHtml);
      setTemplateId(initialData.emailTemplateId || 'default');
    }
  }, [open, initialData.emailSubject, initialData.emailBodyHtml, initialData.emailTemplateId]);

  // Lock document body scroll when modal is open
  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  // Escape key closes without saving
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, handleKeyDown]);

  if (!open) return null;

  const handleSave = () => {
    onSave({ emailSubject: subject, emailBodyHtml: bodyHtml, emailTemplateId: templateId });
  };

  // ── shared style tokens ──
  const inpSt: React.CSSProperties = {
    width: '100%',
    padding: '9px 12px',
    borderRadius: '8px',
    border: '1px solid rgba(33, 150, 243, 0.35)',
    background: '#FFFFFF',
    color: '#0F172A',
    fontSize: '13px',
    outline: 'none',
    boxSizing: 'border-box',
    boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.03)',
  };

  const dropSt: React.CSSProperties = {
    ...inpSt,
    cursor: 'pointer',
  };

  const sectionSt: React.CSSProperties = {
    background: '#FFFFFF',
    border: '1px solid rgba(33, 150, 243, 0.28)',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 4px 16px rgba(13, 71, 161, 0.06)',
  };

  const sectionHeadSt: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '14px',
  };

  const minimiseBtnSt: React.CSSProperties = {
    background: 'rgba(33, 150, 243, 0.08)',
    border: '1px solid rgba(33, 150, 243, 0.3)',
    borderRadius: '6px',
    padding: '4px 10px',
    fontSize: '11px',
    fontWeight: 600,
    cursor: 'pointer',
    color: '#1565C0',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    transition: 'all 0.15s ease',
  };

  const sectionLabelSt: React.CSSProperties = {
    fontSize: '13px',
    fontWeight: 700,
    color: '#0D47A1',
  };

  const fieldLabelSt: React.CSSProperties = {
    fontSize: '11px',
    fontWeight: 700,
    color: '#475569',
    display: 'block',
    marginBottom: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  };

  return (
    /* ── Backdrop with Translucent White Blur & Radiant Soft Ice-Blue Ambient Tint ── */
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Stage ${stageIndex} — Email Configuration`}
      style={{
        position: 'fixed',
        inset: 0,
        background: `
          radial-gradient(ellipse at 12% 18%, rgba(227, 242, 253, 0.75) 0%, transparent 50%),
          radial-gradient(ellipse at 88% 22%, rgba(144, 202, 249, 0.65) 0%, transparent 52%),
          radial-gradient(ellipse at 50% 50%, rgba(33, 150, 243, 0.22) 0%, transparent 70%),
          radial-gradient(ellipse at 20% 82%, rgba(13, 71, 161, 0.08) 0%, transparent 50%),
          rgba(255, 255, 255, 0.75)
        `,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        overflow: 'hidden',
      }}
      /* clicking the backdrop itself closes the modal */
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* ── Modal shell with Rich Blue Theme ── */}
      <div
        style={{
          width: '100%',
          maxWidth: '920px',
          background: '#F4F8FC',
          border: '2px solid #2196F3',
          borderRadius: '16px',
          boxShadow: '0 24px 60px rgba(13, 71, 161, 0.25), 0 0 35px rgba(33, 150, 243, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 'calc(100vh - 48px)',
          overflow: 'hidden',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Radiant Blue Top Accent Bar */}
        <div
          style={{
            height: '5px',
            width: '100%',
            background: 'linear-gradient(90deg, #E3F2FD 0%, #90CAF9 25%, #2196F3 65%, #0D47A1 100%)',
          }}
        />

        {/* ── Blue Theme Header ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            background: 'linear-gradient(135deg, #0D47A1 0%, #1565C0 50%, #1E88E5 100%)',
            borderBottom: '1px solid rgba(33, 150, 243, 0.3)',
            color: '#FFFFFF',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.35)',
              }}
            >
              <Mail size={18} color="#FFFFFF" />
            </div>
            <div>
              <h2
                style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  margin: 0,
                  letterSpacing: '-0.01em',
                }}
              >
                Stage {stageIndex} — Email Configuration
              </h2>
              <span style={{ fontSize: '11px', color: '#E3F2FD', fontWeight: 500 }}>
                Workflow Campaign Builder Email Stage Setup
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                border: '1px solid rgba(255, 255, 255, 0.35)',
                borderRadius: '8px',
                padding: '7px 14px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                color: '#FFFFFF',
                transition: 'all 0.15s ease',
              }}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              aria-label="Save Email Config"
              title="Save Email Config"
              style={{
                background: 'linear-gradient(135deg, #2196F3 0%, #0D47A1 100%)',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                borderRadius: '8px',
                padding: '7px 18px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 16px rgba(13, 71, 161, 0.4)',
              }}
            >
              <Save size={14} />
              <span>Save Email Config</span>
            </button>

            <button
              type="button"
              aria-label="Close modal"
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                border: '1px solid rgba(255, 255, 255, 0.35)',
                borderRadius: '8px',
                padding: '6px 8px',
                cursor: 'pointer',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── Scrollable Body inside modal shell ── */}
        <div
          style={{
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            overflowY: 'auto',
            maxHeight: 'calc(100vh - 120px)',
          }}
        >

          {/* ── Section 1: Template ── */}
          <div style={sectionSt}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <LayoutTemplate size={16} color="#1E88E5" />
              <span style={sectionLabelSt}>Email Template</span>
            </div>

            <label
              htmlFor="stage-email-modal-template-select"
              style={fieldLabelSt}
            >
              Select Email Template
            </label>
            <select
              id="stage-email-modal-template-select"
              data-testid="stage-modal-template-select"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              style={{ ...dropSt, maxWidth: '480px' }}
            >
              <option value="default">Standard Liquidation Offer Sheet</option>
              <option value="short-dated-auction">Urgent Short-Dated Surplus Alert</option>
              <option value="direct-donation-notice">Food Bank Direct Transfer Notice</option>
            </select>
          </div>

          {/* ── Section 2: Subject ── */}
          <div style={sectionSt}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <PenLine size={16} color="#1E88E5" />
              <span style={sectionLabelSt}>Email Subject</span>
            </div>

            <label
              htmlFor="stage-email-modal-subject"
              style={fieldLabelSt}
            >
              Subject Line
            </label>
            <input
              id="stage-email-modal-subject"
              type="text"
              data-testid="stage-modal-subject-input"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter stage-specific email subject..."
              style={inpSt}
            />
          </div>

          {/* ── Section 3: TipTap body editor with expanded size & working Token Config button ── */}
          <div style={sectionSt}>
            <div style={{ ...sectionHeadSt, marginBottom: isBodyMinimised ? 0 : '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit3 size={16} color="#1E88E5" />
                <span style={sectionLabelSt}>Edit Email Body</span>
              </div>
              <button
                type="button"
                data-testid="minimise-body-btn"
                aria-label={isBodyMinimised ? "Expand Edit Email Body" : "Minimise Edit Email Body"}
                title={isBodyMinimised ? "Expand Edit Email Body" : "Minimise Edit Email Body"}
                onClick={() => setIsBodyMinimised(!isBodyMinimised)}
                style={minimiseBtnSt}
              >
                {isBodyMinimised ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                <span>{isBodyMinimised ? 'Expand' : 'Minimise'}</span>
              </button>
            </div>

            {!isBodyMinimised && (
              <div
                style={{
                  background: '#FFFFFF',
                  borderRadius: '8px',
                  padding: '6px',
                  border: '1px solid rgba(33, 150, 243, 0.3)',
                  minHeight: '340px',
                }}
              >
                <WorkflowTipTapBodyEditor
                  contentHtml={bodyHtml}
                  onChange={(html) => setBodyHtml(html)}
                  onOpenDynamicTokenConfig={() => setShowDynamicTokenPanel(true)}
                  disabled={false}
                />
              </div>
            )}
          </div>

          {/* ── Section 4: Live Preview ── */}
          <div style={sectionSt}>
            <div style={{ ...sectionHeadSt, marginBottom: isPreviewMinimised ? 0 : '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Eye size={16} color="#1E88E5" />
                <span style={sectionLabelSt}>Preview</span>
              </div>
              <button
                type="button"
                data-testid="minimise-preview-btn"
                aria-label={isPreviewMinimised ? "Expand Preview" : "Minimise Preview"}
                title={isPreviewMinimised ? "Expand Preview" : "Minimise Preview"}
                onClick={() => setIsPreviewMinimised(!isPreviewMinimised)}
                style={minimiseBtnSt}
              >
                {isPreviewMinimised ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                <span>{isPreviewMinimised ? 'Expand' : 'Minimise'}</span>
              </button>
            </div>

            {!isPreviewMinimised && (
              <LiveDevicePreview
                subject={subject || 'Email Preview'}
                bodyHtml={bodyHtml}
                context={tokenContext}
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Dynamic Token Config Overlay Modal ── */}
      {showDynamicTokenPanel && (
        <div
          data-testid="dynamic-token-config-modal"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(255, 255, 255, 0.75)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            zIndex: 10050,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setShowDynamicTokenPanel(false)}
        >
          <div
            style={{
              background: '#FFFFFF',
              border: '2px solid #2196F3',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '680px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 50px rgba(13, 71, 161, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 24px',
                background: 'linear-gradient(135deg, #0D47A1 0%, #1565C0 100%)',
                color: '#FFFFFF',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sliders size={18} color="#FFFFFF" />
                <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: '#FFFFFF' }}>
                  Dynamic Token Config
                </h3>
              </div>
              <button
                type="button"
                aria-label="Close Dynamic Token Config"
                onClick={() => setShowDynamicTokenPanel(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '6px',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  padding: '4px 6px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div
              style={{
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <p style={{ fontSize: '12px', color: '#475569', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Info size={14} color="#1E88E5" /> Inspect resolved dynamic template tokens or enter temporary custom override values for testing preview outputs.
              </p>

              {/* Context Token Cards */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: '10px',
                  padding: '12px',
                  background: '#F0F7FF',
                  borderRadius: '10px',
                  border: '1px solid rgba(33, 150, 243, 0.25)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderRight: '1px solid rgba(33, 150, 243, 0.2)', paddingRight: '8px' }}>
                  <Users size={16} color="#1E88E5" />
                  <div>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748B' }}>Buyer</div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '110px' }} title={tokenContext.buyer_name}>
                      {tokenContext.buyer_name}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderRight: '1px solid rgba(33, 150, 243, 0.2)', paddingRight: '8px' }}>
                  <LayoutTemplate size={16} color="#1E88E5" />
                  <div>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748B' }}>Supplier</div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '110px' }} title={tokenContext.supplier_name}>
                      {tokenContext.supplier_name}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderRight: '1px solid rgba(33, 150, 243, 0.2)', paddingRight: '8px' }}>
                  <Sparkles size={16} color="#1E88E5" />
                  <div>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748B' }}>Lot Title</div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '110px' }} title={tokenContext.lot_title}>
                      {tokenContext.lot_title}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={16} color="#1E88E5" />
                  <div>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748B' }}>Deadline</div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: '#0F172A' }}>
                      {tokenContext.expiry_hours}
                    </div>
                  </div>
                </div>
              </div>

              {/* Input Overrides */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <div>
                  <label style={fieldLabelSt}>Target Buyer Name</label>
                  <input
                    type="text"
                    value={tokenContext.buyer_name}
                    onChange={(e) => setTokenContext((prev) => ({ ...prev, buyer_name: e.target.value }))}
                    style={inpSt}
                  />
                </div>

                <div>
                  <label style={fieldLabelSt}>Supplier Org</label>
                  <input
                    type="text"
                    value={tokenContext.supplier_name}
                    onChange={(e) => setTokenContext((prev) => ({ ...prev, supplier_name: e.target.value }))}
                    style={inpSt}
                  />
                </div>

                <div>
                  <label style={fieldLabelSt}>Lot Title</label>
                  <input
                    type="text"
                    value={tokenContext.lot_title}
                    onChange={(e) => setTokenContext((prev) => ({ ...prev, lot_title: e.target.value }))}
                    style={inpSt}
                  />
                </div>

                <div>
                  <label style={fieldLabelSt}>Stage Discount</label>
                  <input
                    type="text"
                    value={tokenContext.current_stage_discount}
                    onChange={(e) => setTokenContext((prev) => ({ ...prev, current_stage_discount: e.target.value }))}
                    style={inpSt}
                  />
                </div>

                <div>
                  <label style={fieldLabelSt}>Response Deadline</label>
                  <input
                    type="text"
                    value={tokenContext.expiry_hours}
                    onChange={(e) => setTokenContext((prev) => ({ ...prev, expiry_hours: e.target.value }))}
                    style={inpSt}
                  />
                </div>

                <div>
                  <label style={fieldLabelSt}>Quick Bid Link</label>
                  <input
                    type="text"
                    value={tokenContext.quick_bid_link}
                    onChange={(e) => setTokenContext((prev) => ({ ...prev, quick_bid_link: e.target.value }))}
                    style={inpSt}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingTop: '12px', borderTop: '1px solid rgba(33, 150, 243, 0.2)' }}>
                <button
                  type="button"
                  onClick={() => setShowDynamicTokenPanel(false)}
                  style={{
                    background: 'linear-gradient(135deg, #2196F3 0%, #0D47A1 100%)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 18px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(33, 150, 243, 0.4)',
                  }}
                >
                  Apply & Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
