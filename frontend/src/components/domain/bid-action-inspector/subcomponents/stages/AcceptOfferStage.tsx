import React from 'react';
import {
  CheckCircle2,
  FileText,
  Send,
  MapPin,
  Clock,
  Package,
  Lock,
  MessageSquare,
  Mail,
  Smartphone,
  ChevronDown,
  ShieldCheck,
  Eye
} from 'lucide-react';
import type { CommunicationChannel } from '../../types/bidActionInspector.types';
import { SETTLEMENT_TOKENS } from '../../constants/bidActionInspectorConstants';
import { WorkflowTipTapBodyEditor } from '../../../../EmailBuilder/WorkflowTipTapBodyEditor';

export interface AcceptOfferStageProps {
  isAccepted: boolean;
  bid: any;
  lot?: any;
  internalStatus: string;
  hasNegotiatedSettledPrice: boolean;
  effectiveAwardedQty: number;
  buyerCompany: string;
  finalPrice?: number;
  unitPrice: number;
  effectiveUnitPrice: number;
  pickupAddress: string;
  setPickupAddress: (addr: string) => void;
  pickupHours: string;
  setPickupHours: (hours: string) => void;
  onResendSettlement?: (bidId: string) => Promise<any> | void;
  isSubmitting: boolean;
  awardedQuantity: number | string;
  setAwardedQuantity: (qty: number | string) => void;
  quantity: number;
  activeChannel: CommunicationChannel;
  setActiveChannel: (channel: CommunicationChannel) => void;
  buyerEmail: string;
  dynamicTokenCount: number;
  acceptanceWordCount: number;
  isCommunicationAccordionOpen: boolean;
  setIsCommunicationAccordionOpen: (open: boolean) => void;
  acceptanceMessage: string;
  setAcceptanceMessage: (msg: string) => void;
  settlementTokenValues: Record<string, string>;
  formattedSettlementTotal: string;
  numAwarded: number;
  isFullClearing: boolean;
  isSubmittingAccept: boolean;
  onOpenPreviewModal: () => void;
  onConfirmAccept: () => void;
}

export const AcceptOfferStage: React.FC<AcceptOfferStageProps> = ({
  isAccepted,
  bid,
  lot,
  internalStatus,
  hasNegotiatedSettledPrice,
  effectiveAwardedQty,
  buyerCompany,
  finalPrice,
  unitPrice,
  effectiveUnitPrice,
  pickupAddress,
  setPickupAddress,
  pickupHours,
  setPickupHours,
  onResendSettlement,
  isSubmitting,
  awardedQuantity,
  setAwardedQuantity,
  quantity,
  activeChannel,
  setActiveChannel,
  buyerEmail,
  dynamicTokenCount,
  acceptanceWordCount,
  isCommunicationAccordionOpen,
  setIsCommunicationAccordionOpen,
  acceptanceMessage,
  setAcceptanceMessage,
  settlementTokenValues,
  formattedSettlementTotal,
  numAwarded,
  isFullClearing,
  isSubmittingAccept,
  onOpenPreviewModal,
  onConfirmAccept
}) => {
  if (isAccepted) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div data-testid="settlement-active-banner" style={{ padding: '20px', backgroundColor: 'rgba(16, 185, 129, 0.08)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h4 style={{ margin: 0, color: 'hsl(var(--success))', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.05rem' }}>
              <CheckCircle2 size={20} /> Offer Accepted & Deal Settlement Active
            </h4>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, padding: '3px 8px', borderRadius: '6px', backgroundColor: 'rgba(16, 185, 129, 0.2)', color: 'hsl(var(--success))', textTransform: 'capitalize' }}>
              {internalStatus || bid?.status}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'hsl(var(--text-secondary))', lineHeight: 1.5 }}>
            {hasNegotiatedSettledPrice && finalPrice !== undefined ? (
              <>
                This offer has been awarded for <strong>{effectiveAwardedQty} cases</strong> to <strong>{buyerCompany}</strong> at <strong>${finalPrice.toFixed(2)}/case</strong> (negotiated from initial bid of <strong>${unitPrice.toFixed(2)}/case</strong>). Total settlement value: <strong>${(effectiveAwardedQty * finalPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>.
              </>
            ) : (
              <>
                This offer has been awarded for <strong>{effectiveAwardedQty} cases</strong> to <strong>{buyerCompany}</strong> at <strong>${unitPrice.toFixed(2)}/case</strong>. Total settlement value: <strong>${(effectiveAwardedQty * unitPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>.
              </>
            )}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginTop: '16px' }}>
            <div style={{ padding: '12px', backgroundColor: 'hsl(var(--bg-card))', borderRadius: '8px', border: '1px solid hsl(var(--border-color))' }}>
              <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>Distribution Center Depot</div>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', marginTop: '4px' }}>{pickupAddress || 'Supplier Warehouse'}</div>
            </div>
            <div style={{ padding: '12px', backgroundColor: 'hsl(var(--bg-card))', borderRadius: '8px', border: '1px solid hsl(var(--border-color))' }}>
              <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>Dock Operating Hours</div>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', marginTop: '4px' }}>{pickupHours}</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
          <a
            href={`/deal/${bid?.dealId || bid?._id}${bid?.dealToken ? `?token=${encodeURIComponent(bid.dealToken)}` : ''}`}
            target="_blank"
            rel="noopener noreferrer"
            role="link"
            className="btn btn-outline"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              fontSize: '0.85rem',
              fontWeight: 600,
              textDecoration: 'none',
              borderColor: 'hsl(var(--border-color))'
            }}
          >
            <FileText size={16} /> View Deal Settlement Portal
          </a>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onResendSettlement?.(bid?._id)}
            disabled={isSubmitting}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontWeight: 600, fontSize: '0.85rem' }}
          >
            <Send size={16} /> Resend Settlement Communications
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="accept-work-surface"
      className="relative flex flex-col gap-6 w-full max-w-[1100px] mx-auto"
    >
      {/* Step 1: Logistics & Allocation Parameters Card */}
      <div
        data-testid="accept-left-pane"
        className="relative w-full flex flex-col gap-4"
      >
        <section
          data-testid="accept-logistics-card"
          style={{
            position: 'relative',
            padding: '16px 18px',
            backgroundColor: 'hsl(var(--bg-card))',
            borderRadius: '12px',
            border: '1px solid hsl(var(--border-color))',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid hsl(var(--border-color))' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                <CheckCircle2 size={18} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                    Step 1
                  </span>
                  <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'hsl(var(--text-primary))' }}>
                    Logistics & Allocation
                  </h4>
                  <span style={{ fontSize: '0.68rem', fontWeight: 600, padding: '1px 6px', borderRadius: '4px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                    Ready for Settlement
                  </span>
                </div>
                <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>
                  Review DC warehouse depot address, dock operating hours, and verify full lot award before confirming.
                </p>
              </div>
            </div>
          </div>

          {/* Row 1: DC Pickup Address - Correlated generous width for long addresses */}
          <div data-testid="logistics-row-address" className="relative w-full">
            <label htmlFor="pickup-address-input" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: '680px', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', backgroundColor: 'hsl(var(--bg-main))', border: '1px solid hsl(var(--border-color))', color: 'hsl(var(--text-muted))' }}>Step 1.1</span>
                <span>DC Pickup Address</span> <span style={{ color: '#ef4444' }}>*</span>
              </span>
              <span style={{ fontSize: '0.68rem', fontFamily: 'monospace', padding: '1px 6px', borderRadius: '4px', backgroundColor: 'hsl(var(--bg-main))', border: '1px solid hsl(var(--border-color))', color: 'hsl(var(--text-muted))' }}>
                FOB Origin
              </span>
            </label>
            <div style={{ position: 'relative', maxWidth: '680px', width: '100%' }}>
              <MapPin size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#3b82f6', pointerEvents: 'none' }} />
              <input
                id="pickup-address-input"
                aria-label="DC Pickup Address"
                type="text"
                className="form-input"
                value={pickupAddress}
                onChange={(e) => setPickupAddress(e.target.value)}
                placeholder="e.g. 450 Logistics Blvd, Denver, CO 80202"
                style={{
                  width: '100%',
                  height: '44px',
                  paddingLeft: '38px',
                  paddingRight: '14px',
                  borderRadius: '8px',
                  border: '1px solid rgba(148, 163, 184, 0.25)',
                  backgroundColor: 'hsl(var(--bg-card))',
                  color: 'hsl(var(--text-primary))',
                  fontSize: '0.875rem',
                  outline: 'none',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
                  transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
                }}
              />
            </div>
          </div>

          {/* Row 2: Dock Operating Hours - Medium correlated width */}
          <div data-testid="logistics-row-hours" className="relative w-full">
            <label htmlFor="pickup-hours-input" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: '380px', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', backgroundColor: 'hsl(var(--bg-main))', border: '1px solid hsl(var(--border-color))', color: 'hsl(var(--text-muted))' }}>Step 1.2</span>
                <span>Dock Operating Hours</span> <span style={{ color: '#ef4444' }}>*</span>
              </span>
              <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: '4px', backgroundColor: 'hsl(var(--bg-main))', border: '1px solid hsl(var(--border-color))', color: 'hsl(var(--text-muted))' }}>
                Appointment Req.
              </span>
            </label>
            <div style={{ position: 'relative', maxWidth: '380px', width: '100%' }}>
              <Clock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--text-muted))', pointerEvents: 'none' }} />
              <input
                id="pickup-hours-input"
                aria-label="Dock Operating Hours"
                type="text"
                className="form-input"
                value={pickupHours}
                onChange={(e) => setPickupHours(e.target.value)}
                placeholder="e.g. 08:00 AM - 04:30 PM CST"
                style={{
                  width: '100%',
                  height: '44px',
                  paddingLeft: '38px',
                  paddingRight: '14px',
                  borderRadius: '8px',
                  border: '1px solid rgba(148, 163, 184, 0.25)',
                  backgroundColor: 'hsl(var(--bg-card))',
                  color: 'hsl(var(--text-primary))',
                  fontSize: '0.875rem',
                  outline: 'none',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
                  transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
                }}
              />
            </div>
          </div>

          {/* Row 3: Awarded Quantity - Reduced correlated width for numeric entry */}
          <div data-testid="logistics-row-quantity" className="relative w-full">
            <label htmlFor="awarded-quantity-input" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: '220px', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', backgroundColor: 'hsl(var(--bg-main))', border: '1px solid hsl(var(--border-color))', color: 'hsl(var(--text-muted))' }}>Step 1.3</span>
                <span>Awarded Qty (cases)</span>
              </span>
              <span style={{ fontSize: '0.68rem', fontFamily: 'monospace', padding: '1px 6px', borderRadius: '4px', backgroundColor: 'hsl(var(--bg-main))', border: '1px solid hsl(var(--border-color))', color: 'hsl(var(--text-muted))' }}>
                {lot?.availableQty || quantity} Max
              </span>
            </label>
            <div style={{ position: 'relative', maxWidth: '220px', width: '100%' }}>
              <Package size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--text-muted))', pointerEvents: 'none' }} />
              <input
                id="awarded-quantity-input"
                aria-label="Awarded Quantity"
                type="number"
                className="form-input"
                value={awardedQuantity}
                onChange={(e) => setAwardedQuantity(e.target.value)}
                placeholder="Cases to award"
                min={1}
                max={lot?.availableQty || quantity}
                style={{
                  width: '100%',
                  height: '44px',
                  paddingLeft: '38px',
                  paddingRight: '14px',
                  borderRadius: '8px',
                  border: '1px solid rgba(148, 163, 184, 0.25)',
                  backgroundColor: 'hsl(var(--bg-card))',
                  color: 'hsl(var(--text-primary))',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  outline: 'none',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
                  transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
                }}
              />
            </div>
          </div>

          {/* Row 4: Settled Unit Price - Reduced correlated width for compact pricing */}
          <div data-testid="logistics-row-price" className="relative w-full">
            <label htmlFor="agreed-price-input" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: '220px', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', backgroundColor: 'hsl(var(--bg-main))', border: '1px solid hsl(var(--border-color))', color: 'hsl(var(--text-muted))' }}>Step 1.4</span>
                <span>Agreed Price ($/cs)</span>
              </span>
              <span style={{ fontSize: '0.68rem', fontFamily: 'monospace', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                Settled
              </span>
            </label>
            <div style={{ position: 'relative', maxWidth: '220px', width: '100%' }}>
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--text-muted))', pointerEvents: 'none' }} />
              <input
                id="agreed-price-input"
                aria-label="Agreed Price"
                type="text"
                className="form-input"
                value={`$${effectiveUnitPrice.toFixed(2)}`}
                disabled
                style={{
                  width: '100%',
                  height: '44px',
                  paddingLeft: '38px',
                  paddingRight: '48px',
                  cursor: 'not-allowed',
                  borderRadius: '8px',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  backgroundColor: 'hsl(var(--bg-main) / 60%)',
                  color: '#10b981',
                  fontWeight: 700,
                  fontSize: '0.875rem'
                }}
              />
              <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.72rem', fontFamily: 'monospace', color: 'hsl(var(--text-muted))', fontWeight: 600 }}>
                USD
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* Step 2: Communication Card with TipTap Editor */}
      <div
        data-testid="accept-right-pane"
        className="relative w-full flex flex-col gap-4"
      >
        <section
          data-testid="accept-communication-card"
          id="accept-email-builder-section"
          className="relative w-full"
          style={{
            position: 'relative',
            backgroundColor: 'hsl(var(--bg-card))',
            border: '1px solid hsl(var(--border-color))',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}
        >
          {/* Accordion Header */}
          <div
            style={{
              backgroundColor: 'hsl(var(--bg-main) / 60%)',
              padding: '12px 18px',
              borderBottom: isCommunicationAccordionOpen ? '1px solid hsl(var(--border-color))' : 'none',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              cursor: 'pointer',
              userSelect: 'none'
            }}
            onClick={() => setIsCommunicationAccordionOpen(!isCommunicationAccordionOpen)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                <MessageSquare size={18} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#2563eb', border: '1px solid rgba(59, 130, 246, 0.25)' }}>
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
                      data-active={activeChannel === 'email'}
                      onClick={() => setActiveChannel('email')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        border: activeChannel === 'email' ? '1px solid #2563eb' : '1px solid transparent',
                        backgroundColor: activeChannel === 'email' ? '#2563eb' : 'transparent',
                        color: activeChannel === 'email' ? '#ffffff' : 'hsl(var(--text-muted))',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Mail size={12} /> Email
                    </button>
                    <button
                      type="button"
                      aria-label="In-App"
                      data-active={activeChannel === 'in-app'}
                      onClick={() => setActiveChannel('in-app')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        border: activeChannel === 'in-app' ? '1px solid #2563eb' : '1px solid transparent',
                        backgroundColor: activeChannel === 'in-app' ? '#2563eb' : 'transparent',
                        color: activeChannel === 'in-app' ? '#ffffff' : 'hsl(var(--text-muted))',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <MessageSquare size={12} /> In-App
                    </button>
                    <button
                      type="button"
                      aria-label="SMS"
                      data-active={activeChannel === 'sms'}
                      onClick={() => setActiveChannel('sms')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        border: activeChannel === 'sms' ? '1px solid #2563eb' : '1px solid transparent',
                        backgroundColor: activeChannel === 'sms' ? '#2563eb' : 'transparent',
                        color: activeChannel === 'sms' ? '#ffffff' : 'hsl(var(--text-muted))',
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
                <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#047857', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                  {dynamicTokenCount} Dynamic Tokens
                </span>
                <span style={{ backgroundColor: 'hsl(var(--bg-main))', color: 'hsl(var(--text-muted))', border: '1px solid hsl(var(--border-color))', padding: '2px 8px', borderRadius: '4px' }}>
                  {acceptanceWordCount} Words
                </span>
              </div>
              <button
                type="button"
                aria-label="Toggle communication accordion"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCommunicationAccordionOpen(!isCommunicationAccordionOpen);
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
                    transform: isCommunicationAccordionOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                    transition: 'transform 0.2s ease'
                  }}
                />
              </button>
            </div>
          </div>

          {/* Accordion Body */}
          <div
            data-testid="accept-communication-body"
            style={{
              display: isCommunicationAccordionOpen ? 'flex' : 'none',
              flexDirection: 'column',
              padding: '16px',
              gap: '12px'
            }}
          >
            {activeChannel !== 'email' && (
              <div style={{ padding: '8px 12px', backgroundColor: 'rgba(59, 130, 246, 0.08)', borderRadius: '6px', border: '1px solid rgba(59, 130, 246, 0.2)', fontSize: '0.75rem', color: '#2563eb' }}>
                {activeChannel === 'in-app'
                  ? 'In-App Channel Active: Message payload will synchronize into buyer dashboard notifications upon settlement dispatch.'
                  : 'SMS Channel Active: Message summary and settlement action link will dispatch via SMS gateway.'}
              </div>
            )}
            <WorkflowTipTapBodyEditor
              contentHtml={acceptanceMessage}
              onChange={(html) => setAcceptanceMessage(html)}
              disabled={isSubmitting}
              availableTokens={SETTLEMENT_TOKENS}
              tokenValues={settlementTokenValues}
            />
          </div>
        </section>
      </div>

      {/* Step 3: Settlement Summary Bar */}
      <div
        data-testid="accept-execution-bar"
        className="relative sticky bottom-0 z-20 backdrop-blur w-full"
      >
        <div
          data-testid="accept-settlement-footer"
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
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                  Step 3
                </span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'hsl(var(--text-primary))' }}>
                  Total Settlement Value:
                </span>
                <span
                  data-testid="total-settlement-value"
                  style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'monospace', color: '#10b981' }}
                >
                  {formattedSettlementTotal}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>
                  ({numAwarded} cs × ${effectiveUnitPrice.toFixed(2)})
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 600, color: isFullClearing ? '#10b981' : '#f59e0b', fontFamily: 'monospace' }}>
                  {isFullClearing ? 'Full Clearing' : `Partial Clearing (${numAwarded} / ${lot?.availableQty || quantity} cs)`}
                </span>
                <span>•</span>
                <span>FOB Origin {pickupAddress ? pickupAddress.split(',')[0] : 'Facility'}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              aria-label="Preview Outbound Settlement Email"
              data-testid="footer-preview-accept-btn"
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
              aria-label="Confirm Offer (Confirm & Initiate Settlement)"
              className="btn btn-primary"
              onClick={onConfirmAccept}
              disabled={isSubmitting || isSubmittingAccept || !pickupAddress || numAwarded <= 0}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.85rem',
                padding: '8px 20px',
                fontWeight: 600,
                backgroundColor: '#059669',
                borderColor: '#059669',
                color: '#ffffff'
              }}
            >
              <CheckCircle2 size={16} />
              <span>Confirm Offer</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
