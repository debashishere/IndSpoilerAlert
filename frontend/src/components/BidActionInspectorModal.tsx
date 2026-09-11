import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  RefreshCw, 
  XCircle, 
  RotateCcw, 
  Building2, 
  Mail, 
  DollarSign, 
  Package, 
  Calendar, 
  AlertTriangle,
  Clock,
  FileText,
  Send
} from 'lucide-react';
import { WorkflowTipTapBodyEditor } from './EmailBuilder/WorkflowTipTapBodyEditor';

export const NEGOTIATION_TOKENS = [
  'buyer_name',
  'product_name',
  'counter_price',
  'counter_quantity',
  'original_price'
];

export const DEFAULT_COUNTER_MESSAGE = '<p>Dear <span data-token="buyer_name">{{buyer_name}}</span>,</p><p>We propose a counter-offer for <span data-token="product_name">{{product_name}}</span> at <span data-token="counter_price">{{counter_price}}</span> for <span data-token="counter_quantity">{{counter_quantity}}</span> cases (original offer: <span data-token="original_price">{{original_price}}</span>).</p>';

export const SETTLEMENT_TOKENS = [
  'buyer_name',
  'product_name',
  'sku',
  'awarded_quantity',
  'price_per_case',
  'total_amount',
  'pickup_location',
  'pickup_hours',
  'payment_link',
  'deal_document_link'
];

export const DEFAULT_ACCEPTANCE_MESSAGE = '<p>Dear <span data-token="buyer_name">{{buyer_name}}</span>,</p><p>We are pleased to accept your offer for <span data-token="awarded_quantity">{{awarded_quantity}}</span> of <span data-token="product_name">{{product_name}}</span> (SKU: <span data-token="sku">{{sku}}</span>) at <span data-token="price_per_case">{{price_per_case}}</span>. Total settlement amount: <span data-token="total_amount">{{total_amount}}</span>.</p><p><strong>Pickup Location:</strong> <span data-token="pickup_location">{{pickup_location}}</span><br/><strong>Dock Operating Hours:</strong> <span data-token="pickup_hours">{{pickup_hours}}</span></p><p>Please review and execute the deal agreement: <a href="{{deal_document_link}}"><span data-token="deal_document_link">{{deal_document_link}}</span></a></p><p>Complete transaction payment: <a href="{{payment_link}}"><span data-token="payment_link">{{payment_link}}</span></a></p>';

export interface BidActionInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  bid: any;
  lot?: any;
  onDecline?: (payload: { reason: string; rationale: string }) => Promise<void> | void;
  onReset?: () => Promise<void> | void;
  onAccept?: (payload?: {
    awardedQuantity: number;
    pickupAddress: string;
    pickupHours: string;
    templateHtml: string;
  }) => Promise<any> | void;
  onCounter?: (counterData: { price: number; quantity: number; message: string }) => Promise<any> | void;
  onResendSettlement?: (bidId: string) => Promise<any> | void;
  isSubmitting?: boolean;
}

export const DECLINE_REASONS = [
  'Price below minimum recovery floor',
  'Inventory committed elsewhere',
  'Logistics/pickup constraint',
  'Custom rationale'
];

export const BidActionInspectorModal: React.FC<BidActionInspectorModalProps> = ({
  isOpen,
  onClose,
  bid,
  lot,
  onDecline,
  onReset,
  onAccept,
  onCounter,
  onResendSettlement,
  isSubmitting = false
}) => {
  const [activeMode, setActiveMode] = useState<'accept' | 'counter' | 'decline'>('accept');
  const [selectedDeclineReason, setSelectedDeclineReason] = useState('');
  const [declineRationale, setDeclineRationale] = useState('');

  // Counter mode state
  const [counterPrice, setCounterPrice] = useState<number | string>(bid?.price || bid?.bidPricePerCase || '');
  const [counterQuantity, setCounterQuantity] = useState<number | string>(bid?.quantity || bid?.quantityCases || '');
  const [counterMessage, setCounterMessage] = useState('');
  const [internalStatus, setInternalStatus] = useState<string>(bid?.status || 'pending');
  const [internalMessages, setInternalMessages] = useState<any[]>(bid?.messages || []);
  const [inSituToast, setInSituToast] = useState<{ message: string; type: 'success' | 'warning' } | string | null>(null);

  // Accept mode state
  const [awardedQuantity, setAwardedQuantity] = useState<number | string>(bid?.awardedQty || bid?.quantity || bid?.quantityCases || '');
  const [pickupAddress, setPickupAddress] = useState<string>('');
  const [pickupHours, setPickupHours] = useState<string>('08:00 AM - 04:30 PM CST');
  const [acceptanceMessage, setAcceptanceMessage] = useState<string>(DEFAULT_ACCEPTANCE_MESSAGE);
  const [isSubmittingAccept, setIsSubmittingAccept] = useState<boolean>(false);

  React.useEffect(() => {
    if (bid?.status) setInternalStatus(bid.status);
    if (bid?.messages) setInternalMessages(bid.messages);
    if (bid?.price || bid?.bidPricePerCase) setCounterPrice(bid.price || bid.bidPricePerCase);
    if (bid?.quantity || bid?.quantityCases) setCounterQuantity(bid.quantity || bid.quantityCases);
    if (bid?.awardedQty) {
      setAwardedQuantity(bid.awardedQty);
    } else if (bid?.quantity || bid?.quantityCases) {
      setAwardedQuantity(bid.quantity || bid.quantityCases);
    }

    if (lot) {
      const dcAddress = (typeof lot.distributionCenterId === 'object' && lot.distributionCenterId?.address)
        ? lot.distributionCenterId.address
        : lot.distributionCenter?.address || lot.warehouse || 'Supplier Warehouse Depot';
      if (dcAddress) setPickupAddress(dcAddress);

      const dcHours = (typeof lot.distributionCenterId === 'object' && lot.distributionCenterId?.operatingHours)
        ? lot.distributionCenterId.operatingHours
        : lot.distributionCenter?.operatingHours || '08:00 AM - 04:30 PM CST';
      if (dcHours) setPickupHours(dcHours);
    }
  }, [bid, lot]);

  if (!isOpen || !bid) return null;

  const unitPrice = bid.price ?? bid.bidPricePerCase ?? 0;
  const quantity = bid.quantity ?? bid.quantityCases ?? 0;
  const totalRecovery = unitPrice * quantity;
  const buyerCompany = bid.buyerId?.companyName || 'Verified Buyer';
  const buyerEmail = bid.buyerId?.email || 'N/A';
  const rawStatus = (internalStatus || bid.status || 'pending').toLowerCase();

  const isRejected = rawStatus === 'rejected' || rawStatus === 'declined';
  const isAccepted = rawStatus === 'fully_accepted' || rawStatus === 'partially_accepted' || rawStatus === 'awarded';
  const isCountered = rawStatus === 'countered';

  const messages = Array.isArray(internalMessages)
    ? [...internalMessages].sort((a: any, b: any) => new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime())
    : [];


  const lotNumber = lot?.lotNumber || 'N/A';
  const productTitle = lot?.productId?.description || lot?.productId?.brand || lot?.productId?.sku || 'Inventory Lot';

  // Counter validation & delta calculations
  const numCounterPrice = Number(counterPrice);
  const numCounterQuantity = Number(counterQuantity);

  const isPriceValid = counterPrice !== '' && !isNaN(numCounterPrice) && numCounterPrice > 0;
  const isQuantityValid = counterQuantity !== '' && !isNaN(numCounterQuantity) && numCounterQuantity > 0;
  const isCounterValid = isPriceValid && isQuantityValid;

  const priceDelta = isPriceValid ? numCounterPrice - unitPrice : 0;
  const priceDeltaPct = unitPrice > 0 && isPriceValid ? (priceDelta / unitPrice) * 100 : 0;

  const counterTotalRecovery = isCounterValid ? numCounterPrice * numCounterQuantity : 0;
  const totalDelta = isCounterValid ? counterTotalRecovery - totalRecovery : 0;
  const totalDeltaPct = totalRecovery > 0 && isCounterValid ? (totalDelta / totalRecovery) * 100 : 0;

  const tokenValues: Record<string, string> = {
    buyer_name: buyerCompany ? `[${buyerCompany}]` : '{{buyer_name}}',
    product_name: productTitle ? `[${productTitle}]` : '{{product_name}}',
    counter_price: isPriceValid ? `[$${numCounterPrice.toFixed(2)}/cs]` : '{{counter_price}}',
    counter_quantity: isQuantityValid ? `[${numCounterQuantity} cases]` : '{{counter_quantity}}',
    original_price: unitPrice > 0 ? `[$${unitPrice.toFixed(2)}/cs]` : '{{original_price}}'
  };

  const numAwarded = Number(awardedQuantity) || quantity;
  const settlementTotal = numAwarded * unitPrice;
  const formattedSettlementTotal = `$${settlementTotal.toFixed(2)}`;

  const settlementTokenValues: Record<string, string> = {
    buyer_name: buyerCompany ? `[${buyerCompany}]` : '{{buyer_name}}',
    product_name: productTitle ? `[${productTitle}]` : '{{product_name}}',
    sku: lot?.productId?.sku ? `[${lot.productId.sku}]` : '{{sku}}',
    awarded_quantity: `[${numAwarded} cases]`,
    price_per_case: `[$${unitPrice.toFixed(2)}/case]`,
    total_amount: `[${formattedSettlementTotal}]`,
    pickup_location: pickupAddress ? `[${pickupAddress}]` : '{{pickup_location}}',
    pickup_hours: pickupHours ? `[${pickupHours}]` : '{{pickup_hours}}',
    payment_link: `[/deal/${bid._id}#payment]`,
    deal_document_link: `[/deal/${bid._id}]`
  };

  const handleConfirmAccept = async () => {
    if (!onAccept || isSubmittingAccept || isSubmitting) return;
    setIsSubmittingAccept(true);
    try {
      const res: any = await onAccept({
        awardedQuantity: numAwarded,
        pickupAddress,
        pickupHours,
        templateHtml: acceptanceMessage || DEFAULT_ACCEPTANCE_MESSAGE
      });

      const newStatus = numAwarded < quantity ? 'partially_accepted' : 'fully_accepted';
      setInternalStatus(res?.status || newStatus);

      if (res?.emailDispatch?.dispatched === false && res?.emailDispatch?.warning) {
        setInSituToast({
          message: `Offer accepted! Note: email dispatch warning: ${res.emailDispatch.warning}`,
          type: 'warning'
        });
      } else {
        setInSituToast({
          message: `Offer successfully accepted! Settlement email dispatched to ${buyerEmail}.`,
          type: 'success'
        });
      }
    } catch (err: any) {
      setInSituToast({
        message: err?.message || 'Failed to accept offer.',
        type: 'warning'
      });
    } finally {
      setIsSubmittingAccept(false);
    }
  };

  const handleConfirmDecline = async () => {
    if (!selectedDeclineReason) return;
    if (onDecline) {
      await onDecline({
        reason: selectedDeclineReason,
        rationale: declineRationale
      });
    }
  };

  const handleResetToPending = async () => {
    if (onReset) {
      await onReset();
    }
  };

  const handleDispatchCounter = async () => {
    if (!isCounterValid || isSubmitting) return;
    const payload = {
      price: numCounterPrice,
      quantity: numCounterQuantity,
      message: counterMessage
    };
    let result: any;
    if (onCounter) {
      result = await onCounter(payload);
    }
    const newProposal = {
      sender: 'supplier',
      content: counterMessage || `Supplier counter-offer: $${numCounterPrice.toFixed(2)}/cs for ${numCounterQuantity} cases.`,
      proposedPrice: numCounterPrice,
      proposedQuantity: numCounterQuantity,
      timestamp: new Date().toISOString()
    };
    setInternalMessages((prev) => [...prev, newProposal]);
    setInternalStatus('countered');
    setCounterMessage('');

    if (result?.emailDispatch && !result.emailDispatch.dispatched) {
      const warningDetail = result.emailDispatch.warning || 'Mail transport disconnected';
      setInSituToast({
        message: `Counter-offer recorded, but email dispatch warning: ${warningDetail}`,
        type: 'warning'
      });
    } else {
      setInSituToast({
        message: `Counter-offer successfully dispatched ($${numCounterPrice.toFixed(2)}/cs for ${numCounterQuantity} cases). Status updated to Countered.`,
        type: 'success'
      });
    }
    setTimeout(() => {
      setInSituToast(null);
    }, 4500);
  };


  const renderNegotiationHistoryThread = () => (
    <div 
      className="negotiation-history-thread"
      style={{
        marginBottom: activeMode === 'counter' ? '0' : '24px',
        padding: '16px',
        borderRadius: '10px',
        backgroundColor: 'hsl(var(--bg-main) / 50%)',
        border: '1px solid hsl(var(--border-color))',
        flex: activeMode === 'counter' ? 1 : undefined,
        overflowY: activeMode === 'counter' ? 'auto' : undefined,
        maxHeight: activeMode === 'counter' ? '400px' : undefined
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={16} /> Negotiation History Thread
        </h3>
        <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>
          {messages.length} update{messages.length === 1 ? '' : 's'}
        </span>
      </div>

      {messages.length === 0 ? (
        <div style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))', fontStyle: 'italic' }}>
          No negotiation messages recorded yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {messages.map((msg: any, idx: number) => {
            const isBuyer = msg.sender === 'buyer';
            const isSupplier = msg.sender === 'supplier';
            const isSystem = msg.sender === 'system';
            const roleLabel = isBuyer ? 'Buyer Initial Bid' : isSupplier ? 'Supplier Counter' : 'System Notice';

            return (
              <div
                key={idx}
                style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  backgroundColor: isSystem 
                    ? 'hsl(var(--bg-card) / 60%)' 
                    : isSupplier 
                      ? 'rgba(59, 130, 246, 0.08)' 
                      : 'rgba(16, 185, 129, 0.08)',
                  border: `1px solid ${
                    isSystem 
                      ? 'hsl(var(--border-color))' 
                      : isSupplier 
                        ? 'rgba(59, 130, 246, 0.3)' 
                        : 'rgba(16, 185, 129, 0.3)'
                  }`,
                  fontSize: '0.85rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span 
                      style={{
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.03em',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: isSystem ? 'hsl(var(--border-color))' : isSupplier ? 'rgba(59, 130, 246, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                        color: isSystem ? 'hsl(var(--text-muted))' : isSupplier ? 'hsl(var(--primary))' : 'hsl(var(--success))'
                      }}
                    >
                      {roleLabel}
                    </span>

                    {(msg.proposedPrice !== undefined || msg.proposedQuantity !== undefined) && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
                        {msg.proposedPrice !== undefined && (
                          <span style={{ color: 'hsl(var(--success))' }}>${Number(msg.proposedPrice).toFixed(2)}/cs</span>
                        )}
                        {msg.proposedPrice !== undefined && msg.proposedQuantity !== undefined && <span>•</span>}
                        {msg.proposedQuantity !== undefined && (
                          <span>{msg.proposedQuantity} cases</span>
                        )}
                      </div>
                    )}
                  </div>

                  <span style={{ fontSize: '0.72rem', color: 'hsl(var(--text-muted))' }}>
                    {msg.timestamp ? new Date(msg.timestamp).toLocaleString() : ''}
                  </span>
                </div>

                <div 
                  style={{ color: 'hsl(var(--text-primary))', lineHeight: 1.4 }}
                  dangerouslySetInnerHTML={{ __html: msg.content }}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div 
      className="modal-overlay" 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        zIndex: 1050,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px'
      }}
    >
      <div 
        className="modal-container"
        style={{
          backgroundColor: 'hsl(var(--bg-card))',
          color: 'hsl(var(--text-primary))',
          borderRadius: '16px',
          border: '1px solid hsl(var(--border-color))',
          width: '100%',
          maxWidth: '1000px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div 
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid hsl(var(--border-color))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'hsl(var(--bg-main))'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                Bid Action Inspector
              </h2>
              <span 
                data-testid="modal-status-badge"
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  padding: '3px 8px',
                  borderRadius: '6px',
                  backgroundColor: isRejected 
                    ? 'rgba(239, 68, 68, 0.15)' 
                    : isAccepted 
                      ? 'rgba(16, 185, 129, 0.15)' 
                      : isCountered
                        ? 'rgba(59, 130, 246, 0.15)'
                        : 'rgba(245, 158, 11, 0.15)',
                  color: isRejected 
                    ? '#ef4444' 
                    : isAccepted 
                      ? '#10b981' 
                      : isCountered
                        ? '#3b82f6'
                        : '#f59e0b',
                  border: `1px solid ${
                    isRejected 
                      ? 'rgba(239, 68, 68, 0.3)' 
                      : isAccepted 
                        ? 'rgba(16, 185, 129, 0.3)' 
                        : isCountered
                          ? 'rgba(59, 130, 246, 0.3)'
                          : 'rgba(245, 158, 11, 0.3)'
                  }`,
                  textTransform: 'capitalize'
                }}
              >
                {internalStatus || bid.status || 'pending'}
              </span>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))', marginTop: '4px' }}>
              Lot #{lotNumber} — <span style={{ color: 'hsl(var(--text-secondary))', fontWeight: 500 }}>{productTitle}</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Adaptive Lifecycle Action: Reset to Pending for re-actioning */}
            {rawStatus !== 'pending' && (
              <button 
                type="button"
                className="btn btn-outline"
                onClick={handleResetToPending}
                disabled={isSubmitting}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.8rem',
                  padding: '6px 12px',
                  borderColor: 'hsl(var(--border-color))'
                }}
              >
                <RotateCcw size={14} />
                Reset Bid to Pending
              </button>
            )}

            <button 
              type="button"
              aria-label="Close Inspector"
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'hsl(var(--text-muted))',
                padding: '4px'
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* In-situ notification toast banner */}
        {inSituToast && (
          <div
            role="status"
            style={{
              padding: '10px 24px',
              backgroundColor: (typeof inSituToast === 'object' && inSituToast.type === 'warning') ? '#d97706' : '#10b981',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 600,
              fontSize: '0.85rem'
            }}
          >
            {(typeof inSituToast === 'object' && inSituToast.type === 'warning') ? (
              <AlertTriangle size={16} data-testid="in-situ-warning-icon" />
            ) : (
              <CheckCircle2 size={16} data-testid="in-situ-success-icon" />
            )}
            <span>{typeof inSituToast === 'string' ? inSituToast : inSituToast.message}</span>
          </div>
        )}

        {/* Commercial Overview Cards */}
        <div 
          style={{
            padding: '16px 24px',
            backgroundColor: 'hsl(var(--bg-main) / 50%)',
            borderBottom: '1px solid hsl(var(--border-color))',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px'
          }}
        >
          <div style={{ padding: '10px 14px', backgroundColor: 'hsl(var(--bg-card))', borderRadius: '8px', border: '1px solid hsl(var(--border-color))' }}>
            <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Building2 size={14} /> Buyer Organization
            </div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', marginTop: '4px' }}>{buyerCompany}</div>
            <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
              <Mail size={12} /> {buyerEmail}
            </div>
          </div>

          <div style={{ padding: '10px 14px', backgroundColor: 'hsl(var(--bg-card))', borderRadius: '8px', border: '1px solid hsl(var(--border-color))' }}>
            <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <DollarSign size={14} /> Unit Offer
            </div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'hsl(var(--success))', marginTop: '4px' }}>
              ${unitPrice.toFixed(2)} <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', fontWeight: 400 }}>/case</span>
            </div>
          </div>

          <div style={{ padding: '10px 14px', backgroundColor: 'hsl(var(--bg-card))', borderRadius: '8px', border: '1px solid hsl(var(--border-color))' }}>
            <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Package size={14} /> Volume Requested
            </div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', marginTop: '4px' }}>
              {quantity} <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', fontWeight: 400 }}>cases</span>
            </div>
          </div>

          <div style={{ padding: '10px 14px', backgroundColor: 'hsl(var(--bg-card))', borderRadius: '8px', border: '1px solid hsl(var(--border-color))' }}>
            <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <DollarSign size={14} /> Gross Recovery
            </div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'hsl(var(--text-primary))', marginTop: '4px' }}>
              ${totalRecovery.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* Mode Navigation Tabs */}
        <div 
          style={{
            display: 'flex',
            borderBottom: '1px solid hsl(var(--border-color))',
            padding: '0 24px',
            backgroundColor: 'hsl(var(--bg-card))',
            gap: '8px'
          }}
        >
          <button
            type="button"
            onClick={() => setActiveMode('accept')}
            style={{
              padding: '12px 18px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              borderBottom: activeMode === 'accept' ? '2px solid hsl(var(--success))' : '2px solid transparent',
              color: activeMode === 'accept' ? 'hsl(var(--success))' : 'hsl(var(--text-secondary))'
            }}
          >
            <CheckCircle2 size={16} /> [✓ Accept Offer]
          </button>

          <button
            type="button"
            onClick={() => {
              if (isAccepted) return;
              setActiveMode('counter');
              if (!counterMessage || counterMessage.trim() === '') {
                setCounterMessage(DEFAULT_COUNTER_MESSAGE);
              }
            }}
            disabled={isAccepted}
            title={isAccepted ? 'Cannot counter an accepted offer.' : undefined}
            style={{
              padding: '12px 18px',
              border: 'none',
              background: 'none',
              cursor: isAccepted ? 'not-allowed' : 'pointer',
              opacity: isAccepted ? 0.5 : 1,
              fontWeight: 600,
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              borderBottom: activeMode === 'counter' ? '2px solid hsl(var(--primary))' : '2px solid transparent',
              color: activeMode === 'counter' ? 'hsl(var(--primary))' : 'hsl(var(--text-secondary))'
            }}
          >
            <RefreshCw size={16} /> [⇄ Re-negotiate / Counter]
          </button>

          <button
            type="button"
            onClick={() => {
              if (isAccepted) return;
              setActiveMode('decline');
            }}
            disabled={isAccepted}
            title={isAccepted ? 'Cannot decline an accepted offer.' : undefined}
            style={{
              padding: '12px 18px',
              border: 'none',
              background: 'none',
              cursor: isAccepted ? 'not-allowed' : 'pointer',
              opacity: isAccepted ? 0.5 : 1,
              fontWeight: 600,
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              borderBottom: activeMode === 'decline' ? '2px solid #ef4444' : '2px solid transparent',
              color: activeMode === 'decline' ? '#ef4444' : 'hsl(var(--text-secondary))'
            }}
          >
            <XCircle size={16} /> [✕ Decline Offer]
          </button>
        </div>

        {/* Tab Content Body */}
        <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
          {/* If not counter mode, render negotiation history thread here */}
          {activeMode !== 'counter' && renderNegotiationHistoryThread()}

          {/* Mode: Accept Offer */}
          {activeMode === 'accept' && isAccepted && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ padding: '20px', backgroundColor: 'rgba(16, 185, 129, 0.08)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <h4 style={{ margin: 0, color: 'hsl(var(--success))', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.05rem' }}>
                    <CheckCircle2 size={20} /> Offer Accepted & Deal Settlement Active
                  </h4>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, padding: '3px 8px', borderRadius: '6px', backgroundColor: 'rgba(16, 185, 129, 0.2)', color: 'hsl(var(--success))', textTransform: 'capitalize' }}>
                    {internalStatus || bid.status}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'hsl(var(--text-secondary))', lineHeight: 1.5 }}>
                  This offer has been awarded for <strong>{bid.awardedQty || numAwarded} cases</strong> to <strong>{buyerCompany}</strong> at <strong>${unitPrice.toFixed(2)}/case</strong>. Total settlement value: <strong>${((bid.awardedQty || numAwarded) * unitPrice).toFixed(2)}</strong>.
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
                  href={`/deal/${bid.dealId || bid._id}${bid.dealToken ? `?token=${encodeURIComponent(bid.dealToken)}` : ''}`}
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
                  onClick={() => onResendSettlement?.(bid._id)}
                  disabled={isSubmitting}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontWeight: 600, fontSize: '0.85rem' }}
                >
                  <Send size={16} /> Resend Settlement Communications
                </button>
              </div>
            </div>
          )}

          {activeMode === 'accept' && !isAccepted && (
            <div 
              data-testid="accept-work-surface"
              style={{ 
                display: 'flex', 
                gap: '24px',
                alignItems: 'flex-start'
              }}
            >
              {/* Left Column (~38%) */}
              <div 
                data-testid="accept-left-pane"
                style={{ 
                  flex: '0 0 38%', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '16px',
                  minWidth: '320px'
                }}
              >
                <div style={{ padding: '12px 14px', backgroundColor: 'rgba(16, 185, 129, 0.08)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                  <h4 style={{ margin: '0 0 4px', color: 'hsl(var(--success))', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}>
                    <CheckCircle2 size={16} /> Acceptance & Logistics Configuration
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'hsl(var(--text-secondary))', lineHeight: 1.4 }}>
                    Review DC warehouse depot address, dock operating hours, and confirm full or partial allocation before dispatching the settlement memo.
                  </p>
                </div>

                <div>
                  <label htmlFor="pickup-address-input" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                    DC Pickup Address <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    id="pickup-address-input"
                    aria-label="DC Pickup Address"
                    type="text"
                    className="form-input"
                    value={pickupAddress}
                    onChange={(e) => setPickupAddress(e.target.value)}
                    placeholder="e.g. 450 Logistics Blvd, Denver, CO 80202"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label htmlFor="pickup-hours-input" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                    Dock Operating Hours <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    id="pickup-hours-input"
                    aria-label="Dock Operating Hours"
                    type="text"
                    className="form-input"
                    value={pickupHours}
                    onChange={(e) => setPickupHours(e.target.value)}
                    placeholder="e.g. 08:00 AM - 04:30 PM CST"
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label htmlFor="awarded-quantity-input" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                      Awarded Quantity (cases)
                    </label>
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
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                      Agreed Price ($/cs)
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={`$${unitPrice.toFixed(2)}`}
                      disabled
                      style={{ width: '100%', opacity: 0.8 }}
                    />
                  </div>
                </div>

                {/* Commercial Settlement Value */}
                <div 
                  style={{ 
                    padding: '12px 14px', 
                    backgroundColor: 'hsl(var(--bg-card))', 
                    borderRadius: '8px', 
                    border: '1px solid hsl(var(--border-color))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>Total Settlement Value</div>
                    <div 
                      data-testid="total-settlement-value"
                      style={{ fontSize: '1.15rem', fontWeight: 700, color: 'hsl(var(--success))', marginTop: '2px' }}
                    >
                      {formattedSettlementTotal}
                    </div>
                  </div>
                  {numAwarded < quantity && (
                    <span style={{ fontSize: '0.72rem', color: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.1)', padding: '4px 8px', borderRadius: '4px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                      Partial ({numAwarded} / {quantity} cs)
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleConfirmAccept}
                    disabled={isSubmitting || isSubmittingAccept || !pickupAddress || numAwarded <= 0}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontWeight: 600, width: '100%', justifyContent: 'center' }}
                  >
                    <CheckCircle2 size={16} /> Confirm & Initiate Settlement
                  </button>
                </div>
              </div>

              {/* Right Column (~62%): TipTap Email Builder */}
              <div 
                data-testid="accept-right-pane"
                style={{ 
                  flex: '1 1 62%', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '12px',
                  minWidth: '400px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                    Acceptance & Deal Settlement Email Template (TipTap)
                  </label>
                  <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>
                    Recipient: {buyerEmail}
                  </span>
                </div>

                <WorkflowTipTapBodyEditor
                  contentHtml={acceptanceMessage}
                  onChange={(html) => setAcceptanceMessage(html)}
                  disabled={isSubmitting}
                  availableTokens={SETTLEMENT_TOKENS}
                  tokenValues={settlementTokenValues}
                />
              </div>
            </div>
          )}

          {/* Mode: Counter / Re-negotiate — Split 2-Column Work Surface (Left ~38%, Right ~62%) */}
          {activeMode === 'counter' && (
            <div 
              data-testid="counter-split-work-surface"
              style={{ 
                display: 'flex', 
                gap: '24px',
                alignItems: 'flex-start'
              }}
            >
              {/* Left Column (~38%) */}
              <div 
                data-testid="counter-left-pane"
                style={{ 
                  flex: '0 0 38%', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '16px',
                  minWidth: '320px'
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                      Counter Price ($/cs)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      value={counterPrice}
                      onChange={(e) => setCounterPrice(e.target.value)}
                      placeholder="Enter counter price"
                    />
                    {counterPrice !== '' && !isPriceValid && (
                      <div style={{ color: '#ef4444', fontSize: '0.72rem', marginTop: '4px' }}>
                        Counter price must be greater than zero
                      </div>
                    )}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                      Counter Quantity (cs)
                    </label>
                    <input
                      type="number"
                      className="form-input"
                      value={counterQuantity}
                      onChange={(e) => setCounterQuantity(e.target.value)}
                      placeholder="Enter counter quantity"
                    />
                    {counterQuantity !== '' && !isQuantityValid && (
                      <div style={{ color: '#ef4444', fontSize: '0.72rem', marginTop: '4px' }}>
                        Counter quantity must be greater than zero
                      </div>
                    )}
                  </div>
                </div>

                {/* Live Delta Indicators */}
                {isCounterValid && (
                  <div
                    data-testid="counter-delta-indicators"
                    style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      backgroundColor: 'hsl(var(--bg-main))',
                      border: '1px solid hsl(var(--border-color))',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      fontSize: '0.8rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'hsl(var(--text-muted))' }}>Unit Price Delta:</span>
                      <span
                        style={{
                          fontWeight: 700,
                          color: priceDelta >= 0 ? 'hsl(var(--success))' : '#ef4444'
                        }}
                      >
                        {priceDelta >= 0 ? '+' : '-'}${Math.abs(priceDelta).toFixed(2)}/cs ({priceDelta >= 0 ? '+' : ''}{priceDeltaPct.toFixed(1)}%)
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'hsl(var(--text-muted))' }}>Gross Recovery Delta:</span>
                      <span
                        style={{
                          fontWeight: 700,
                          color: totalDelta >= 0 ? 'hsl(var(--success))' : '#ef4444'
                        }}
                      >
                        {totalDelta >= 0 ? '+' : '-'}${Math.abs(totalDelta).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({totalDelta >= 0 ? '+' : ''}{totalDeltaPct.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                )}

                {renderNegotiationHistoryThread()}
              </div>

              {/* Right Column (~62%) */}
              <div 
                data-testid="counter-right-pane"
                style={{ 
                  flex: '1 1 62%', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '16px',
                  minWidth: 0
                }}
              >
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                    Direct Message / Terms to Buyer
                  </label>
                  <WorkflowTipTapBodyEditor
                    contentHtml={counterMessage}
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

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleDispatchCounter}
                    disabled={isSubmitting || !isCounterValid}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontWeight: 600 }}
                  >
                    <RefreshCw size={16} /> Dispatch Counter-Offer
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Mode: Decline Offer */}
          {activeMode === 'decline' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div 
                style={{ 
                  padding: '16px', 
                  backgroundColor: 'rgba(239, 68, 68, 0.08)', 
                  borderRadius: '10px', 
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'flex-start'
                }}
              >
                <AlertTriangle size={20} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontWeight: 600, color: '#ef4444', fontSize: '0.9rem' }}>
                    Decline Workflow Guardrails
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'hsl(var(--text-secondary))', marginTop: '4px', lineHeight: 1.4 }}>
                    Declining this offer marks its lifecycle status as <strong>rejected</strong>, logs the structured justification into the lot CRM timeline, and notifies the buyer. A decline reason is required.
                  </div>
                </div>
              </div>

              <div>
                <label 
                  htmlFor="decline-reason-select"
                  style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}
                >
                  Decline Reason <span style={{ color: '#ef4444' }}>*</span> (Mandatory)
                </label>
                <select
                  id="decline-reason-select"
                  aria-label="Decline Reason"
                  className="form-input"
                  value={selectedDeclineReason}
                  onChange={(e) => setSelectedDeclineReason(e.target.value)}
                  style={{ width: '100%', height: '42px' }}
                >
                  <option value="">Select mandatory decline reason...</option>
                  {DECLINE_REASONS.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label 
                  htmlFor="decline-rationale-notes"
                  style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}
                >
                  Decline Rationale & Supplier Notes
                </label>
                <textarea
                  id="decline-rationale-notes"
                  className="form-input"
                  rows={4}
                  value={declineRationale}
                  onChange={(e) => setDeclineRationale(e.target.value)}
                  placeholder="Add specific rationale or notes for the buyer and lot audit trail..."
                  style={{ width: '100%', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={handleConfirmDecline}
                  disabled={!selectedDeclineReason || isSubmitting}
                  style={{
                    backgroundColor: '#ef4444',
                    color: '#ffffff',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: !selectedDeclineReason || isSubmitting ? 'not-allowed' : 'pointer',
                    opacity: !selectedDeclineReason || isSubmitting ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <XCircle size={16} />
                  {isSubmitting ? 'Declining...' : 'Confirm Decline'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BidActionInspectorModal;
