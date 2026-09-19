import React from 'react';
import {
  ArrowLeftRight,
  Package,
  Timer,
  Shield,
  MessageSquare,
  Mail,
  Smartphone,
  ChevronDown,
  TrendingUp,
  Eye,
  Send
} from 'lucide-react';
import type { CommunicationChannel } from '../../types/bidActionInspector.types';
import { NEGOTIATION_TOKENS } from '../../constants/bidActionInspectorConstants';
import { DEFAULT_COUNTER_MESSAGE } from '../../constants/bidActionInspectorTemplates';
import { WorkflowTipTapBodyEditor } from '../../../../EmailBuilder/WorkflowTipTapBodyEditor';

export interface NegotiateCounterStageProps {
  messages: any[];
  counterPrice: number | string;
  setCounterPrice: (price: number | string) => void;
  marginUpliftPct: number;
  formattedUplift: string;
  isPriceValid: boolean;
  counterQuantity: number | string;
  setCounterQuantity: (qty: number | string) => void;
  maxCounterVolume: number;
  isQuantityValid: boolean;
  isReserveMet: boolean;
  reserveFloorPrice: number;
  reserveFloorTotal: number;
  counterActiveChannel: CommunicationChannel;
  setCounterActiveChannel: (channel: CommunicationChannel) => void;
  buyerEmail: string;
  counterTokenCount: number;
  counterWordCount: number;
  isCounterCommunicationAccordionOpen: boolean;
  setIsCounterCommunicationAccordionOpen: (open: boolean) => void;
  counterMessage: string;
  setCounterMessage: (msg: string) => void;
  isSubmitting: boolean;
  tokenValues: Record<string, string>;
  counterTotalRecovery: number;
  numCounterQuantity: number;
  quantity: number;
  numCounterPrice: number;
  totalDelta: number;
  totalDeltaPct: number;
  priceDelta: number;
  priceDeltaPct: number;
  isCounterValid: boolean;
  onOpenPreviewModal: () => void;
  onDispatchCounter: () => void;
}

export const NegotiateCounterStage: React.FC<NegotiateCounterStageProps> = ({
  messages,
  counterPrice,
  setCounterPrice,
  marginUpliftPct,
  formattedUplift,
  isPriceValid,
  counterQuantity,
  setCounterQuantity,
  maxCounterVolume,
  isQuantityValid,
  isReserveMet,
  reserveFloorPrice,
  reserveFloorTotal,
  counterActiveChannel,
  setCounterActiveChannel,
  buyerEmail,
  counterTokenCount,
  counterWordCount,
  isCounterCommunicationAccordionOpen,
  setIsCounterCommunicationAccordionOpen,
  counterMessage,
  setCounterMessage,
  isSubmitting,
  tokenValues,
  counterTotalRecovery,
  numCounterQuantity,
  quantity,
  numCounterPrice,
  totalDelta,
  totalDeltaPct,
  priceDelta,
  priceDeltaPct,
  isCounterValid,
  onOpenPreviewModal,
  onDispatchCounter
}) => {
  return (
    <div
      data-testid="counter-split-work-surface"
      className="relative flex flex-col gap-6 w-full max-w-[1100px] mx-auto"
    >
      {/* Step 1: Counter-Offer Parameters Card */}
      <div data-testid="counter-left-pane" className="relative w-full flex flex-col gap-4">
        <section
          data-testid="negotiate-parameters-card"
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
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid hsl(var(--border-color))', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706', flexShrink: 0 }}>
                <ArrowLeftRight size={18} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#d97706', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
                    Step 1
                  </span>
                  <h2 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'hsl(var(--text-primary))', margin: 0 }}>
                    Counter-Offer Parameters
                  </h2>
                  <span style={{ fontSize: '0.68rem', fontWeight: 600, backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#b45309', border: '1px solid rgba(245, 158, 11, 0.25)', padding: '2px 6px', borderRadius: '4px' }}>
                    Round {(messages.filter((m: any) => m.sender === 'supplier').length || 0) + 1} Propose
                  </span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', margin: '2px 0 0 0' }}>
                  Adjust counter unit price or tranche volume. Totals recalculate dynamically with margin validation.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 w-full">
            {/* Row 1: Counter Price - Reduced correlated width */}
            <div data-testid="counter-row-price" className="relative w-full">
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '220px', fontSize: '0.78rem', fontWeight: 600, marginBottom: '6px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', backgroundColor: 'hsl(var(--bg-main))', border: '1px solid hsl(var(--border-color))', color: 'hsl(var(--text-muted))' }}>Step 1.1</span>
                  <span>Counter Unit Price ($/cs) <span style={{ color: '#d97706' }}>*</span></span>
                </span>
                <span
                  data-testid="negotiate-uplift-badge"
                  style={{
                    fontSize: '0.68rem',
                    fontFamily: 'monospace',
                    fontWeight: 600,
                    padding: '1px 6px',
                    borderRadius: '4px',
                    backgroundColor: marginUpliftPct >= 0 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: marginUpliftPct >= 0 ? '#b45309' : '#ef4444',
                    border: marginUpliftPct >= 0 ? '1px solid rgba(245, 158, 11, 0.25)' : '1px solid rgba(239, 68, 68, 0.25)'
                  }}
                >
                  {formattedUplift}
                </span>
              </label>
              <div style={{ position: 'relative', maxWidth: '220px', width: '100%', display: 'flex', alignItems: 'center' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--text-muted))', fontFamily: 'monospace', fontSize: '0.9rem' }}>$</span>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  style={{
                    width: '100%',
                    height: '44px',
                    paddingLeft: '28px',
                    paddingRight: '12px',
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
                  value={counterPrice}
                  onChange={(e) => setCounterPrice(e.target.value)}
                  placeholder="Enter counter price"
                />
              </div>
              {counterPrice !== '' && !isPriceValid && (
                <div style={{ color: '#ef4444', fontSize: '0.72rem', marginTop: '4px' }}>
                  Counter price must be greater than zero
                </div>
              )}
            </div>

            {/* Row 2: Counter Volume - Reduced correlated width */}
            <div data-testid="counter-row-quantity" className="relative w-full">
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '220px', fontSize: '0.78rem', fontWeight: 600, marginBottom: '6px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', backgroundColor: 'hsl(var(--bg-main))', border: '1px solid hsl(var(--border-color))', color: 'hsl(var(--text-muted))' }}>Step 1.2</span>
                  <span>Counter Volume (cases)</span>
                </span>
                <span style={{ fontSize: '0.68rem', fontFamily: 'monospace', padding: '1px 6px', borderRadius: '4px', backgroundColor: 'hsl(var(--bg-main))', border: '1px solid hsl(var(--border-color))', color: 'hsl(var(--text-muted))' }}>
                  {maxCounterVolume} Max
                </span>
              </label>
              <div style={{ position: 'relative', maxWidth: '220px', width: '100%', display: 'flex', alignItems: 'center' }}>
                <Package size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--text-muted))', pointerEvents: 'none' }} />
                <input
                  type="number"
                  min="1"
                  max={maxCounterVolume}
                  className="form-input"
                  style={{
                    width: '100%',
                    height: '44px',
                    paddingLeft: '38px',
                    paddingRight: '12px',
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
                  value={counterQuantity}
                  onChange={(e) => setCounterQuantity(e.target.value)}
                  placeholder="Enter counter quantity"
                />
              </div>
              {counterQuantity !== '' && !isQuantityValid && (
                <div style={{ color: '#ef4444', fontSize: '0.72rem', marginTop: '4px' }}>
                  Counter quantity must be greater than zero
                </div>
              )}
            </div>

            {/* Row 3: Holding Window - Compact width */}
            <div data-testid="counter-row-window" className="relative w-full">
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '240px', fontSize: '0.78rem', fontWeight: 600, marginBottom: '6px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', backgroundColor: 'hsl(var(--bg-main))', border: '1px solid hsl(var(--border-color))', color: 'hsl(var(--text-muted))' }}>Step 1.3</span>
                  <span>Counter Holding Window</span>
                </span>
                <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: '4px', backgroundColor: 'hsl(var(--bg-main))', border: '1px solid hsl(var(--border-color))', color: 'hsl(var(--text-muted))' }}>
                  Auto-expires
                </span>
              </label>
              <div style={{ position: 'relative', maxWidth: '240px', width: '100%', display: 'flex', alignItems: 'center' }}>
                <Timer size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--text-muted))', pointerEvents: 'none' }} />
                <input
                  type="text"
                  disabled
                  value="48 Hours"
                  className="form-input"
                  style={{
                    width: '100%',
                    height: '44px',
                    paddingLeft: '38px',
                    paddingRight: '12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    backgroundColor: 'hsl(var(--bg-main) / 60%)',
                    cursor: 'not-allowed',
                    color: 'hsl(var(--text-secondary))',
                    fontSize: '0.875rem'
                  }}
                />
              </div>
            </div>

            {/* Row 4: Reserve Floor - Medium correlated width */}
            <div data-testid="counter-row-floor" className="relative w-full">
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '380px', fontSize: '0.78rem', fontWeight: 600, marginBottom: '6px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', backgroundColor: 'hsl(var(--bg-main))', border: '1px solid hsl(var(--border-color))', color: 'hsl(var(--text-muted))' }}>Step 1.4</span>
                  <span>Liquidation Reserve Floor</span>
                </span>
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  padding: '1px 6px',
                  borderRadius: '4px',
                  backgroundColor: isReserveMet ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  color: isReserveMet ? '#059669' : '#ef4444',
                  border: isReserveMet ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(239, 68, 68, 0.25)'
                }}>
                  {isReserveMet ? 'Met' : 'Below Floor'}
                </span>
              </label>
              <div style={{ position: 'relative', maxWidth: '380px', width: '100%', display: 'flex', alignItems: 'center' }}>
                <Shield size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--text-muted))', pointerEvents: 'none' }} />
                <input
                  type="text"
                  disabled
                  value={`$${reserveFloorPrice.toFixed(2)} /case ($${reserveFloorTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Floor)`}
                  className="form-input"
                  style={{
                    width: '100%',
                    height: '44px',
                    paddingLeft: '38px',
                    paddingRight: '12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    backgroundColor: 'hsl(var(--bg-main) / 60%)',
                    cursor: 'not-allowed',
                    color: 'hsl(var(--text-secondary))',
                    fontFamily: 'monospace',
                    fontWeight: 600,
                    fontSize: '0.875rem'
                  }}
                />
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Step 2: Multi-Channel Communication Card & TipTap Builder */}
      <div data-testid="counter-right-pane" className="relative w-full flex flex-col gap-4">
        <section
          data-testid="counter-communication-card"
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
          <div data-testid="negotiate-communication-card" style={{ width: '100%' }}>
            <div
              style={{
                backgroundColor: 'hsl(var(--bg-main) / 70%)',
                padding: '12px 16px',
                borderBottom: isCounterCommunicationAccordionOpen ? '1px solid hsl(var(--border-color))' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                cursor: 'pointer',
                userSelect: 'none'
              }}
              onClick={() => setIsCounterCommunicationAccordionOpen(!isCounterCommunicationAccordionOpen)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
                  <MessageSquare size={18} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#d97706', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
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
                        data-active={counterActiveChannel === 'email'}
                        onClick={() => setCounterActiveChannel('email')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          border: counterActiveChannel === 'email' ? '1px solid #d97706' : '1px solid transparent',
                          backgroundColor: counterActiveChannel === 'email' ? '#d97706' : 'transparent',
                          color: counterActiveChannel === 'email' ? '#ffffff' : 'hsl(var(--text-muted))',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <Mail size={12} /> Email
                      </button>
                      <button
                        type="button"
                        aria-label="In-App"
                        data-active={counterActiveChannel === 'in-app'}
                        onClick={() => setCounterActiveChannel('in-app')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          border: counterActiveChannel === 'in-app' ? '1px solid #d97706' : '1px solid transparent',
                          backgroundColor: counterActiveChannel === 'in-app' ? '#d97706' : 'transparent',
                          color: counterActiveChannel === 'in-app' ? '#ffffff' : 'hsl(var(--text-muted))',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <MessageSquare size={12} /> In-App
                      </button>
                      <button
                        type="button"
                        aria-label="SMS"
                        data-active={counterActiveChannel === 'sms'}
                        onClick={() => setCounterActiveChannel('sms')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          border: counterActiveChannel === 'sms' ? '1px solid #d97706' : '1px solid transparent',
                          backgroundColor: counterActiveChannel === 'sms' ? '#d97706' : 'transparent',
                          color: counterActiveChannel === 'sms' ? '#ffffff' : 'hsl(var(--text-muted))',
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
                  <span style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#b45309', border: '1px solid rgba(245, 158, 11, 0.25)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                    {counterTokenCount} Dynamic Tokens
                  </span>
                  <span style={{ backgroundColor: 'hsl(var(--bg-main))', color: 'hsl(var(--text-muted))', border: '1px solid hsl(var(--border-color))', padding: '2px 8px', borderRadius: '4px' }}>
                    {counterWordCount} Words
                  </span>
                </div>
                <button
                  type="button"
                  aria-label="Toggle negotiate communication accordion"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsCounterCommunicationAccordionOpen(!isCounterCommunicationAccordionOpen);
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
                      transform: isCounterCommunicationAccordionOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                      transition: 'transform 0.2s ease'
                    }}
                  />
                </button>
              </div>
            </div>

            {/* Accordion Body */}
            <div
              data-testid="negotiate-communication-body"
              style={{
                display: isCounterCommunicationAccordionOpen ? 'flex' : 'none',
                flexDirection: 'column',
                padding: '16px',
                gap: '12px'
              }}
            >
              {counterActiveChannel !== 'email' && (
                <div style={{ padding: '8px 12px', backgroundColor: 'rgba(245, 158, 11, 0.08)', borderRadius: '6px', border: '1px solid rgba(245, 158, 11, 0.2)', fontSize: '0.75rem', color: '#b45309' }}>
                  {counterActiveChannel === 'in-app'
                    ? 'In-App Channel Active: Message payload will synchronize into buyer dashboard notifications upon counter dispatch.'
                    : 'SMS Channel Active: Message summary and counter action links will dispatch via SMS gateway.'}
                </div>
              )}
              <WorkflowTipTapBodyEditor
                contentHtml={counterMessage || DEFAULT_COUNTER_MESSAGE}
                onChange={(html) => setCounterMessage(html)}
                disabled={isSubmitting}
                availableTokens={NEGOTIATION_TOKENS}
                tokenValues={tokenValues}
              />
              <div style={{ display: 'none' }}>
                <textarea
                  aria-label="Direct Message / Terms to Buyer Raw Input"
                  placeholder="Explain your counter-offer parameters or logistics conditions..."
                  value={counterMessage}
                  onChange={(e) => setCounterMessage(e.target.value)}
                />
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Step 3: Counter Summary Dispatch Bar */}
      <div
        data-testid="counter-summary-bar"
        className="relative sticky bottom-0 z-20 backdrop-blur w-full"
      >
        <div
          data-testid="negotiate-summary-bar"
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
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706', flexShrink: 0 }}>
              <TrendingUp size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#d97706', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
                  Step 3
                </span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'hsl(var(--text-primary))' }}>
                  Counter Total Value:
                </span>
                <span
                  data-testid="counter-total-value"
                  style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'monospace', color: '#d97706' }}
                >
                  ${counterTotalRecovery.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>
                  ({numCounterQuantity || quantity} cs × ${numCounterPrice.toFixed(2)})
                </span>
              </div>
              <div
                data-testid="counter-delta-indicators"
                style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}
              >
                <span style={{ fontWeight: 600, color: totalDelta >= 0 ? '#059669' : '#dc2626', fontFamily: 'monospace' }}>
                  {totalDelta >= 0 ? '+' : '-'}${Math.abs(totalDelta).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} vs Buyer Bid
                </span>
                <span>•</span>
                <span>Gross Recovery Target</span>
                <span>•</span>
                <span style={{ fontWeight: 600, color: priceDelta >= 0 ? '#059669' : '#dc2626', fontFamily: 'monospace' }}>
                  Unit: {priceDelta >= 0 ? '+' : '-'}${Math.abs(priceDelta).toFixed(2)}/cs ({priceDelta >= 0 ? '+' : ''}{priceDeltaPct.toFixed(1)}%)
                </span>
                <span>•</span>
                <span style={{ fontWeight: 600, color: totalDelta >= 0 ? '#059669' : '#dc2626', fontFamily: 'monospace' }}>
                  Gross: {totalDelta >= 0 ? '+' : '-'}${Math.abs(totalDelta).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({totalDelta >= 0 ? '+' : ''}{totalDeltaPct.toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              aria-label="Preview Outbound Counter Email"
              data-testid="footer-preview-counter-btn"
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
              aria-label="Dispatch Counter-Offer"
              className="btn btn-primary"
              onClick={onDispatchCounter}
              disabled={isSubmitting || !isCounterValid}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.85rem',
                padding: '8px 20px',
                fontWeight: 600,
                backgroundColor: '#d97706',
                borderColor: '#d97706',
                color: '#ffffff'
              }}
            >
              <Send size={16} />
              <span>Dispatch Counter-Offer</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
