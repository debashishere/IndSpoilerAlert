import React from 'react';
import {
  XCircle,
  AlertTriangle,
  MessageSquare,
  Mail,
  Smartphone,
  ChevronDown,
  RotateCcw,
  Eye
} from 'lucide-react';
import type { CommunicationChannel } from '../../types/bidActionInspector.types';
import { DECLINE_TOKENS, DECLINE_REASONS } from '../../constants/bidActionInspectorConstants';
import { WorkflowTipTapBodyEditor } from '../../../../EmailBuilder/WorkflowTipTapBodyEditor';

export interface DeclineOfferStageProps {
  selectedDeclineReason: string;
  setSelectedDeclineReason: (reason: string) => void;
  declineRationale: string;
  setDeclineRationale: (rationale: string) => void;
  autoRelist: boolean;
  setAutoRelist: (relist: boolean) => void;
  declineActiveChannel: CommunicationChannel;
  setDeclineActiveChannel: (channel: CommunicationChannel) => void;
  buyerEmail: string;
  declineTokenCount: number;
  declineWordCount: number;
  isDeclineCommunicationAccordionOpen: boolean;
  setIsDeclineCommunicationAccordionOpen: (open: boolean) => void;
  declineMessage: string;
  setDeclineMessage: (msg: string) => void;
  isSubmitting: boolean;
  declineTokenValues: Record<string, string>;
  quantity: number;
  onClose: () => void;
  isSubmittingDecline: boolean;
  onOpenPreviewModal: () => void;
  onConfirmDecline: () => void;
}

export const DeclineOfferStage: React.FC<DeclineOfferStageProps> = ({
  selectedDeclineReason,
  setSelectedDeclineReason,
  declineRationale,
  setDeclineRationale,
  autoRelist,
  setAutoRelist,
  declineActiveChannel,
  setDeclineActiveChannel,
  buyerEmail,
  declineTokenCount,
  declineWordCount,
  isDeclineCommunicationAccordionOpen,
  setIsDeclineCommunicationAccordionOpen,
  declineMessage,
  setDeclineMessage,
  isSubmitting,
  declineTokenValues,
  quantity,
  onClose,
  isSubmittingDecline,
  onOpenPreviewModal,
  onConfirmDecline
}) => {
  return (
    <div
      data-testid="decline-split-work-surface"
      className="relative flex flex-col gap-6 w-full max-w-[1100px] mx-auto"
    >
      {/* Step 1: Rejection Specification Card */}
      <div
        data-testid="decline-left-pane"
        className="relative w-full flex flex-col gap-4"
      >
        <section
          data-testid="decline-specification-card"
          style={{
            position: 'relative',
            backgroundColor: 'hsl(var(--bg-card))',
            border: '1px solid hsl(var(--border-color))',
            borderRadius: '12px',
            padding: '16px 20px',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
          className="relative w-full"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid hsl(var(--border-color))', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', flexShrink: 0 }}>
                <XCircle size={18} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
                    Step 1
                  </span>
                  <h2 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'hsl(var(--text-primary))', margin: 0 }}>
                    Rejection Specification
                  </h2>
                  <span style={{ fontSize: '0.68rem', fontWeight: 600, backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', border: '1px solid rgba(239, 68, 68, 0.25)', padding: '2px 6px', borderRadius: '4px' }}>
                    Mandatory Justification
                  </span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', margin: '2px 0 0 0' }}>
                  Select structured reason code, provide audit memo notes, and configure inventory return.
                </p>
              </div>
            </div>
          </div>

          <div
            style={{
              position: 'relative',
              padding: '12px',
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              borderRadius: '8px',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              display: 'flex',
              gap: '10px',
              alignItems: 'flex-start'
            }}
          >
            <AlertTriangle size={18} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: 600, color: '#ef4444', fontSize: '0.82rem' }}>
                Decline Workflow Guardrails
              </div>
              <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-secondary))', marginTop: '2px', lineHeight: 1.4 }}>
                Declining this offer marks its lifecycle status as <strong>rejected</strong>, logs the structured justification into the lot CRM timeline, and notifies the buyer. A decline reason is required.
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 w-full">
            {/* Row 1: Mandatory Reason - Correlated medium width */}
            <div data-testid="decline-row-reason" className="relative w-full">
              <label
                htmlFor="decline-reason-select"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', maxWidth: '460px', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}
              >
                <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', backgroundColor: 'hsl(var(--bg-main))', border: '1px solid hsl(var(--border-color))', color: 'hsl(var(--text-muted))' }}>
                  Step 1.1
                </span>
                <span>Decline Reason <span style={{ color: '#ef4444' }}>*</span> (Mandatory)</span>
              </label>
              <div style={{ position: 'relative', maxWidth: '460px', width: '100%' }}>
                <select
                  id="decline-reason-select"
                  aria-label="Decline Reason"
                  className="form-input"
                  value={selectedDeclineReason}
                  onChange={(e) => setSelectedDeclineReason(e.target.value)}
                  style={{
                    width: '100%',
                    height: '44px',
                    padding: '0 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(148, 163, 184, 0.25)',
                    backgroundColor: 'hsl(var(--bg-card))',
                    color: 'hsl(var(--text-primary))',
                    fontSize: '0.85rem',
                    outline: 'none',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
                    transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
                  }}
                >
                  <option value="">Select mandatory decline reason...</option>
                  {DECLINE_REASONS.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 2: Internal Audit Memo / Notes - Correlated generous width for text memo */}
            <div data-testid="decline-row-memo" className="relative w-full">
              <label
                htmlFor="decline-rationale-notes"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', maxWidth: '680px', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}
              >
                <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', backgroundColor: 'hsl(var(--bg-main))', border: '1px solid hsl(var(--border-color))', color: 'hsl(var(--text-muted))' }}>
                  Step 1.2
                </span>
                <span>Decline Rationale & Supplier Notes</span>
              </label>
              <div style={{ position: 'relative', maxWidth: '680px', width: '100%' }}>
                <textarea
                  id="decline-rationale-notes"
                  className="form-input"
                  rows={3}
                  value={declineRationale}
                  onChange={(e) => setDeclineRationale(e.target.value)}
                  placeholder="Add specific rationale or notes for the buyer and lot audit trail..."
                  style={{
                    width: '100%',
                    minHeight: '88px',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(148, 163, 184, 0.25)',
                    backgroundColor: 'hsl(var(--bg-card))',
                    color: 'hsl(var(--text-primary))',
                    fontSize: '0.85rem',
                    resize: 'vertical',
                    outline: 'none',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
                    transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
                  }}
                />
              </div>
            </div>

            {/* Row 3: Auto-Relist Inventory Control */}
            <div
              data-testid="decline-row-relist"
              className="relative w-full"
              style={{
                position: 'relative',
                padding: '12px',
                backgroundColor: 'hsl(var(--bg-main))',
                borderRadius: '8px',
                border: '1px solid rgba(148, 163, 184, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', backgroundColor: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border-color))', color: 'hsl(var(--text-muted))' }}>
                    Step 1.3
                  </span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'hsl(var(--text-primary))' }}>
                    Auto-Relist Inventory
                  </span>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'hsl(var(--text-muted))', marginTop: '2px' }}>
                  Return cases to open surplus pool upon rejection
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '8px' }}>
                <input
                  type="checkbox"
                  data-testid="auto-relist-toggle"
                  aria-label="Auto-Relist Inventory"
                  checked={autoRelist}
                  onChange={(e) => setAutoRelist(e.target.checked)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#10b981' }}
                />
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: autoRelist ? '#10b981' : 'hsl(var(--text-muted))' }}>
                  {autoRelist ? 'Enabled' : 'Disabled'}
                </span>
              </label>
            </div>
          </div>
        </section>
      </div>

      {/* Step 2: Communication Card & TipTap Decline Email Builder */}
      <div
        data-testid="decline-right-pane"
        className="relative w-full flex flex-col gap-4"
      >
        <section
          data-testid="decline-communication-card"
          style={{
            position: 'relative',
            backgroundColor: 'hsl(var(--bg-card))',
            border: '1px solid hsl(var(--border-color))',
            borderRadius: '12px',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
            overflow: 'hidden'
          }}
          className="relative w-full"
        >
          <div
            style={{
              backgroundColor: 'hsl(var(--bg-main) / 70%)',
              padding: '12px 16px',
              borderBottom: isDeclineCommunicationAccordionOpen ? '1px solid hsl(var(--border-color))' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              cursor: 'pointer',
              userSelect: 'none'
            }}
            onClick={() => setIsDeclineCommunicationAccordionOpen(!isDeclineCommunicationAccordionOpen)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                <MessageSquare size={18} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
                    Step 2
                  </span>
                  <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'hsl(var(--text-primary))' }}>
                    Communication
                  </h4>
                  {/* Channel Selector Pills */}
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '2px',
                      backgroundColor: 'hsl(var(--bg-card))',
                      border: '1px solid hsl(var(--border-color))',
                      borderRadius: '8px',
                      padding: '2px'
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      aria-label="Email"
                      data-active={declineActiveChannel === 'email'}
                      onClick={() => setDeclineActiveChannel('email')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        border: declineActiveChannel === 'email' ? '1px solid #ef4444' : '1px solid transparent',
                        backgroundColor: declineActiveChannel === 'email' ? '#ef4444' : 'transparent',
                        color: declineActiveChannel === 'email' ? '#ffffff' : 'hsl(var(--text-muted))',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Mail size={12} /> Email
                    </button>
                    <button
                      type="button"
                      aria-label="In-App"
                      data-active={declineActiveChannel === 'in-app'}
                      onClick={() => setDeclineActiveChannel('in-app')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        border: declineActiveChannel === 'in-app' ? '1px solid #ef4444' : '1px solid transparent',
                        backgroundColor: declineActiveChannel === 'in-app' ? '#ef4444' : 'transparent',
                        color: declineActiveChannel === 'in-app' ? '#ffffff' : 'hsl(var(--text-muted))',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <MessageSquare size={12} /> In-App
                    </button>
                    <button
                      type="button"
                      aria-label="SMS"
                      data-active={declineActiveChannel === 'sms'}
                      onClick={() => setDeclineActiveChannel('sms')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        border: declineActiveChannel === 'sms' ? '1px solid #ef4444' : '1px solid transparent',
                        backgroundColor: declineActiveChannel === 'sms' ? '#ef4444' : 'transparent',
                        color: declineActiveChannel === 'sms' ? '#ffffff' : 'hsl(var(--text-muted))',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Smartphone size={12} /> SMS
                    </button>
                  </div>
                </div>
                <span style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontFamily: 'sans-serif' }}>Recipient:</span>
                  <span style={{ fontWeight: 600, color: 'hsl(var(--text-secondary))' }}>{buyerEmail}</span>
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', fontFamily: 'monospace' }}>
                <span style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', border: '1px solid rgba(239, 68, 68, 0.25)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                  {declineTokenCount} Dynamic Tokens
                </span>
                <span style={{ backgroundColor: 'hsl(var(--bg-main))', color: 'hsl(var(--text-muted))', border: '1px solid hsl(var(--border-color))', padding: '2px 8px', borderRadius: '4px' }}>
                  {declineWordCount} Words
                </span>
              </div>
              <button
                type="button"
                aria-label="Toggle decline communication accordion"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDeclineCommunicationAccordionOpen(!isDeclineCommunicationAccordionOpen);
                }}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  backgroundColor: 'hsl(var(--bg-card))',
                  border: '1px solid hsl(var(--border-color))',
                  color: 'hsl(var(--text-muted))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <ChevronDown
                  size={16}
                  style={{
                    transform: isDeclineCommunicationAccordionOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                    transition: 'transform 0.2s ease'
                  }}
                />
              </button>
            </div>
          </div>

          {/* Accordion Body */}
          <div
            data-testid="decline-communication-body"
            style={{
              display: isDeclineCommunicationAccordionOpen ? 'flex' : 'none',
              flexDirection: 'column',
              padding: '16px',
              gap: '12px'
            }}
          >
            {declineActiveChannel !== 'email' && (
              <div style={{ padding: '8px 12px', backgroundColor: 'rgba(239, 68, 68, 0.08)', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: '0.75rem', color: '#dc2626' }}>
                {declineActiveChannel === 'in-app'
                  ? 'In-App Channel Active: Message payload will synchronize into buyer dashboard notifications upon decline notice dispatch.'
                  : 'SMS Channel Active: Message summary and decline notice will dispatch via SMS gateway.'}
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                Decline Notice Email Template (TipTap)
              </label>
              <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>
                Dynamic Merge Tokens Enabled
              </span>
            </div>

            <WorkflowTipTapBodyEditor
              contentHtml={declineMessage}
              onChange={(html) => setDeclineMessage(html)}
              disabled={isSubmitting}
              availableTokens={DECLINE_TOKENS}
              tokenValues={declineTokenValues}
            />

            <div style={{ display: 'none' }}>
              <textarea
                aria-label="Decline Notice Email Raw Input"
                placeholder="Decline notice content..."
                value={declineMessage}
                onChange={(e) => setDeclineMessage(e.target.value)}
              />
            </div>
          </div>
        </section>
      </div>

      {/* Step 3: Decline Action Footer Bar */}
      <div
        data-testid="decline-action-footer"
        className="relative sticky bottom-0 z-20 backdrop-blur w-full"
        style={{
          position: 'relative',
          backgroundColor: 'hsl(var(--bg-main))',
          border: '1px solid hsl(var(--border-color))',
          borderRadius: '12px',
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', flexShrink: 0 }}>
            <RotateCcw size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
                Step 3
              </span>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'hsl(var(--text-primary))' }}>
                Escrow Deposit Release Notice:
              </span>
              <span style={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: 600 }}>
                Buyer deposit hold released immediately upon rejection
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 600, color: autoRelist ? '#10b981' : '#f59e0b' }}>
                {autoRelist ? `Auto-Relist Active: ${quantity} cases returning to open surplus pool` : `Inventory Retained: ${quantity} cases held unallocated (not auto-relisted)`}
              </span>
              <span>•</span>
              <span>No settlement escrow captured</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isSubmitting || isSubmittingDecline}
          >
            Cancel
          </button>

          <button
            type="button"
            aria-label="Preview Outbound Decline Email"
            data-testid="footer-preview-decline-btn"
            className="btn btn-outline"
            onClick={onOpenPreviewModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.8rem',
              padding: '8px 14px',
              borderColor: 'hsl(var(--border-color))'
            }}
          >
            <Eye size={15} />
            <span>Preview Email</span>
          </button>

          <button
            type="button"
            aria-label="Confirm Decline & Send Notice"
            className="btn"
            onClick={onConfirmDecline}
            disabled={!selectedDeclineReason || isSubmitting || isSubmittingDecline}
            style={{
              backgroundColor: '#ef4444',
              color: '#ffffff',
              border: 'none',
              padding: '8px 20px',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: !selectedDeclineReason || isSubmitting || isSubmittingDecline ? 'not-allowed' : 'pointer',
              opacity: !selectedDeclineReason || isSubmitting || isSubmittingDecline ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.85rem'
            }}
          >
            <XCircle size={16} />
            <span>{isSubmitting || isSubmittingDecline ? 'Declining...' : 'Confirm Decline & Send Notice'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
