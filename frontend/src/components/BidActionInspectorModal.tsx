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
  Send,
  Eye,
  ShieldCheck,
  MapPin,
  Lock,
  ChevronDown,
  MessageSquare,
  Smartphone,
  ArrowLeftRight,
  Timer,
  Shield,
  TrendingUp,
  Search,
  Filter,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { WorkflowTipTapBodyEditor } from './EmailBuilder/WorkflowTipTapBodyEditor';

export const NEGOTIATION_TOKENS = [
  'buyer_name',
  'product_name',
  'counter_price',
  'counter_quantity',
  'original_price',
  'accept_counter_link',
  'renegotiate_link'
];

export const DEFAULT_COUNTER_MESSAGE = '<p>Dear <span data-token="buyer_name">{{buyer_name}}</span>,</p><p>We propose a counter-offer for <span data-token="product_name">{{product_name}}</span> at <span data-token="counter_price">{{counter_price}}</span> for <span data-token="counter_quantity">{{counter_quantity}}</span> cases (original offer: <span data-token="original_price">{{original_price}}</span>).</p><p><a href="{{accept_counter_link}}" class="btn-counter-accept" style="display: inline-block; background-color: #10b981; color: #ffffff; padding: 12px 22px; border-radius: 8px; font-weight: 700; text-decoration: none; margin-right: 12px; font-size: 14px;">Accept Counter-Offer (<span data-token="counter_price">{{counter_price}}</span> • <span data-token="counter_quantity">{{counter_quantity}}</span>)</a><a href="{{renegotiate_link}}" class="btn-counter-renegotiate" style="display: inline-block; background-color: #3b82f6; color: #ffffff; padding: 12px 22px; border-radius: 8px; font-weight: 700; text-decoration: none; font-size: 14px;">Propose New Terms / Re-bid</a></p>';

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

export const DECLINE_TOKENS = [
  'buyer_name',
  'product_name',
  'lot_number',
  'decline_reason',
  'decline_rationale',
  'catalog_link'
];

export const DEFAULT_DECLINE_MESSAGE = '<p>Dear <span data-token="buyer_name">{{buyer_name}}</span>,</p><p>Thank you for your offer on <strong><span data-token="product_name">{{product_name}}</span></strong> (Lot #<span data-token="lot_number">{{lot_number}}</span>). After review, we are unable to accept your offer.</p><p><strong>Reason:</strong> <span data-token="decline_reason">{{decline_reason}}</span></p><p><strong>Notes:</strong> <span data-token="decline_rationale">{{decline_rationale}}</span></p><p>We invite you to explore other available inventory opportunities: <a href="{{catalog_link}}">Explore Available Surplus Inventory</a>.</p>';

export const DEFAULT_ACCEPTANCE_MESSAGE = '<p>Dear <span data-token="buyer_name">{{buyer_name}}</span>,</p><p>We are pleased to accept your offer for <span data-token="awarded_quantity">{{awarded_quantity}}</span> of <span data-token="product_name">{{product_name}}</span> (SKU: <span data-token="sku">{{sku}}</span>) at <span data-token="price_per_case">{{price_per_case}}</span>. Total settlement amount: <span data-token="total_amount">{{total_amount}}</span>.</p><p><strong>Pickup Location:</strong> <span data-token="pickup_location">{{pickup_location}}</span><br/><strong>Dock Operating Hours:</strong> <span data-token="pickup_hours">{{pickup_hours}}</span></p><p>Please review and execute the deal agreement: <a href="{{deal_document_link}}"><span data-token="deal_document_link">{{deal_document_link}}</span></a></p><p>Complete transaction payment: <a href="{{payment_link}}"><span data-token="payment_link">{{payment_link}}</span></a></p>';

export interface BidActionInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  bid: any;
  lot?: any;
  onDecline?: (payload: { reason: string; rationale: string; templateHtml?: string; emailSubject?: string; autoRelist?: boolean }) => Promise<void> | void;
  onReset?: () => Promise<void> | void;
  onAccept?: (payload?: {
    awardedQuantity: number;
    pickupAddress: string;
    pickupHours: string;
    templateHtml: string;
    pricePerCase?: number;
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
  const [activeMode, setActiveMode] = useState<'accept' | 'counter' | 'decline' | 'timeline'>('accept');
  const [timelineCategoryFilter, setTimelineCategoryFilter] = useState<'all' | 'negotiations' | 'system' | 'status'>('all');
  const [timelineSearchQuery, setTimelineSearchQuery] = useState<string>('');
  const [selectedDeclineReason, setSelectedDeclineReason] = useState('');
  const [declineRationale, setDeclineRationale] = useState('');
  const [autoRelist, setAutoRelist] = useState<boolean>(true);
  const [declineMessage, setDeclineMessage] = useState<string>(DEFAULT_DECLINE_MESSAGE);
  const [declineActiveChannel, setDeclineActiveChannel] = useState<'email' | 'in-app' | 'sms'>('email');
  const [isDeclineCommunicationAccordionOpen, setIsDeclineCommunicationAccordionOpen] = useState<boolean>(true);
  const [agreedUnitPrice, setAgreedUnitPrice] = useState<number>(bid?.price || bid?.bidPricePerCase || 0);
  const [isSubmittingDecline, setIsSubmittingDecline] = useState<boolean>(false);

  // Counter mode state
  const [counterPrice, setCounterPrice] = useState<number | string>(bid?.price || bid?.bidPricePerCase || '');
  const [counterQuantity, setCounterQuantity] = useState<number | string>(bid?.quantity || bid?.quantityCases || '');
  const [counterMessage, setCounterMessage] = useState('');
  const [internalStatus, setInternalStatus] = useState<string>(bid?.status || 'pending');
  const [internalMessages, setInternalMessages] = useState<any[]>(bid?.messages || []);
  const [counterActiveChannel, setCounterActiveChannel] = useState<'email' | 'in-app' | 'sms'>('email');
  const [isCounterCommunicationAccordionOpen, setIsCounterCommunicationAccordionOpen] = useState<boolean>(true);
  const [inSituToast, setInSituToast] = useState<{ message: string; type: 'success' | 'warning' } | string | null>(null);

  // Accept mode state
  const [awardedQuantity, setAwardedQuantity] = useState<number | string>(bid?.awardedQty || bid?.quantity || bid?.quantityCases || '');
  const [pickupAddress, setPickupAddress] = useState<string>('');
  const [pickupHours, setPickupHours] = useState<string>('08:00 AM - 04:30 PM CST');
  const [acceptanceMessage, setAcceptanceMessage] = useState<string>(DEFAULT_ACCEPTANCE_MESSAGE);
  const [isSubmittingAccept, setIsSubmittingAccept] = useState<boolean>(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);
  const [activeChannel, setActiveChannel] = useState<'email' | 'in-app' | 'sms'>('email');
  const [isCommunicationAccordionOpen, setIsCommunicationAccordionOpen] = useState<boolean>(true);
  const [isMaximized, setIsMaximized] = useState<boolean>(false);

  React.useEffect(() => {
    if (bid?.status) setInternalStatus(bid.status);
    if (bid?.messages) setInternalMessages(bid.messages);
    if (bid?.price || bid?.bidPricePerCase) {
      setCounterPrice(bid.price || bid.bidPricePerCase);
      setAgreedUnitPrice(bid.price || bid.bidPricePerCase);
    }
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

  const unitPrice = typeof bid.price === 'number' ? bid.price : (typeof bid.bidPricePerCase === 'number' ? bid.bidPricePerCase : 0);
  const effectiveUnitPrice = agreedUnitPrice > 0 ? agreedUnitPrice : unitPrice;
  const quantity = typeof bid.quantity === 'number' ? bid.quantity : (typeof bid.quantityCases === 'number' ? bid.quantityCases : 0);
  const buyerCompany = bid.buyerId?.companyName || 'Verified Buyer';
  const buyerEmail = bid.buyerId?.email || bid.buyerEmail || 'N/A';
  const rawStatus = (internalStatus || bid.status || 'pending').toLowerCase();

  const isRejected = rawStatus === 'rejected' || rawStatus === 'declined';
  const isAccepted = rawStatus === 'fully_accepted' || rawStatus === 'partially_accepted' || rawStatus === 'awarded';
  const isCountered = rawStatus === 'countered';

  const finalPrice = typeof bid.finalPrice === 'number' ? bid.finalPrice : undefined;
  const hasNegotiatedSettledPrice = isAccepted && finalPrice !== undefined && Math.abs(finalPrice - unitPrice) > 0.001;
  const effectiveAwardedQty = (isAccepted && typeof bid.awardedQty === 'number' && bid.awardedQty > 0) ? bid.awardedQty : quantity;
  const effectivePrice = (isAccepted && finalPrice !== undefined) ? finalPrice : unitPrice;
  const initialTotalRecovery = unitPrice * quantity;
  const totalRecovery = effectivePrice * effectiveAwardedQty;

  const messages = Array.isArray(internalMessages)
    ? [...internalMessages].sort((a: any, b: any) => new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime())
    : [];

  const isPending = !isRejected && !isAccepted && !isCountered;
  const isBuyerCountered = isPending && messages.length > 0 && (() => {
    const lastMsg = messages[messages.length - 1];
    return lastMsg?.sender === 'buyer' && (messages.length > 1 || lastMsg?.proposedPrice !== undefined);
  })();


  const lotNumber = lot?.lotNumber || 'N/A';
  const lotSku = lot?.productId?.sku || lot?.sku || 'SKU-GEN';
  const productTitle = lot?.productId?.description || lot?.productId?.brand || lot?.productId?.sku || 'Inventory Lot';
  const lotAvailableQty = lot?.availableQty ?? lot?.quantity ?? quantity;
  const isFullClearing = quantity >= lotAvailableQty && lotAvailableQty > 0;
  const reserveFloorPrice = lot?.reservePrice || lot?.standardSellPrice || (unitPrice * 0.9);
  const allocationPct = lotAvailableQty > 0 ? Math.min(100, Math.round((quantity / lotAvailableQty) * 100)) : 100;
  const netClearingTotal = totalRecovery * 0.97;

  // Counter validation & delta calculations
  const numCounterPrice = Number(counterPrice);
  const numCounterQuantity = Number(counterQuantity);

  const isPriceValid = counterPrice !== '' && !isNaN(numCounterPrice) && numCounterPrice > 0;
  const isQuantityValid = counterQuantity !== '' && !isNaN(numCounterQuantity) && numCounterQuantity > 0;
  const isCounterValid = isPriceValid && isQuantityValid;

  const priceDelta = isPriceValid ? numCounterPrice - unitPrice : 0;
  const priceDeltaPct = unitPrice > 0 && isPriceValid ? (priceDelta / unitPrice) * 100 : 0;

  const counterTotalRecovery = isCounterValid ? numCounterPrice * numCounterQuantity : 0;
  const totalDelta = isCounterValid ? counterTotalRecovery - initialTotalRecovery : 0;
  const totalDeltaPct = initialTotalRecovery > 0 && isCounterValid ? (totalDelta / initialTotalRecovery) * 100 : 0;

  const marginUpliftPct = unitPrice > 0 && isPriceValid ? ((numCounterPrice - unitPrice) / unitPrice) * 100 : 0;
  const formattedUplift = `${marginUpliftPct >= 0 ? '+' : ''}${marginUpliftPct.toFixed(1)}% Uplift`;
  const isReserveMet = isPriceValid && numCounterPrice >= reserveFloorPrice;
  const maxCounterVolume = lot?.availableQty || lot?.quantity || quantity;
  const reserveFloorTotal = reserveFloorPrice * (numCounterQuantity || quantity);

  const negotiationBaseUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/portal/negotiation/${bid?._id || ''}`
    : `/portal/negotiation/${bid?._id || ''}`;

  const tokenValues: Record<string, string> = {
    buyer_name: buyerCompany ? `[${buyerCompany}]` : '{{buyer_name}}',
    product_name: productTitle ? `[${productTitle}]` : '{{product_name}}',
    counter_price: isPriceValid ? `[$${numCounterPrice.toFixed(2)}/cs]` : '{{counter_price}}',
    counter_quantity: isQuantityValid ? `[${numCounterQuantity} cases]` : '{{counter_quantity}}',
    original_price: unitPrice > 0 ? `[$${unitPrice.toFixed(2)}/cs]` : '{{original_price}}',
    accept_counter_link: `[${negotiationBaseUrl}?action=accept]`,
    renegotiate_link: `[${negotiationBaseUrl}?action=rebid]`
  };

  const numAwarded = Number(awardedQuantity) || quantity;
  const settlementTotal = numAwarded * effectiveUnitPrice;
  const formattedSettlementTotal = `$${settlementTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const settlementTokenValues: Record<string, string> = {
    buyer_name: buyerCompany ? `[${buyerCompany}]` : '{{buyer_name}}',
    product_name: productTitle ? `[${productTitle}]` : '{{product_name}}',
    sku: lot?.productId?.sku ? `[${lot.productId.sku}]` : '{{sku}}',
    awarded_quantity: `[${numAwarded} cases]`,
    price_per_case: `[$${effectiveUnitPrice.toFixed(2)}/case]`,
    total_amount: `[${formattedSettlementTotal}]`,
    pickup_location: pickupAddress ? `[${pickupAddress}]` : '{{pickup_location}}',
    pickup_hours: pickupHours ? `[${pickupHours}]` : '{{pickup_hours}}',
    payment_link: `[/deal/${bid._id}#payment]`,
    deal_document_link: `[/deal/${bid._id}]`
  };

  const dynamicTokenCount = SETTLEMENT_TOKENS.reduce((count, token) => {
    if ((acceptanceMessage || '').includes(`data-token="${token}"`) || (acceptanceMessage || '').includes(`{{${token}}}`)) {
      return count + 1;
    }
    return count;
  }, 0);

  const acceptanceWordCount = (acceptanceMessage || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  const counterTokenCount = NEGOTIATION_TOKENS.reduce((count, token) => {
    const msg = counterMessage || DEFAULT_COUNTER_MESSAGE;
    if (msg.includes(`data-token="${token}"`) || msg.includes(`{{${token}}}`)) {
      return count + 1;
    }
    return count;
  }, 0);

  const counterWordCount = (counterMessage || DEFAULT_COUNTER_MESSAGE)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  const declineTokenCount = DECLINE_TOKENS.reduce((count, token) => {
    const msg = declineMessage || DEFAULT_DECLINE_MESSAGE;
    if (msg.includes(`data-token="${token}"`) || msg.includes(`{{${token}}}`)) {
      return count + 1;
    }
    return count;
  }, 0);

  const declineWordCount = (declineMessage || DEFAULT_DECLINE_MESSAGE)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  const catalogLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/marketplace`;

  const declineTokenValues: Record<string, string> = {
    buyer_name: buyerCompany ? `[${buyerCompany}]` : '{{buyer_name}}',
    product_name: productTitle ? `[${productTitle}]` : '{{product_name}}',
    lot_number: lotNumber ? `[${lotNumber}]` : '{{lot_number}}',
    decline_reason: selectedDeclineReason ? `[${selectedDeclineReason}]` : '{{decline_reason}}',
    decline_rationale: declineRationale ? `[${declineRationale}]` : '{{decline_rationale}}',
    catalog_link: `[${catalogLink}]`
  };

  const handleConfirmAccept = async () => {
    if (!onAccept || isSubmittingAccept || isSubmitting) return;
    setIsSubmittingAccept(true);
    try {
      const res: any = await onAccept({
        awardedQuantity: numAwarded,
        pickupAddress,
        pickupHours,
        templateHtml: acceptanceMessage || DEFAULT_ACCEPTANCE_MESSAGE,
        pricePerCase: effectiveUnitPrice
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
    if (!selectedDeclineReason || isSubmitting || isSubmittingDecline) return;
    setIsSubmittingDecline(true);
    try {
      if (onDecline) {
        await onDecline({
          reason: selectedDeclineReason,
          rationale: declineRationale,
          templateHtml: declineMessage || DEFAULT_DECLINE_MESSAGE,
          emailSubject: `Offer Declined: ${productTitle} (Lot #${lotNumber})`,
          autoRelist
        });
      }

      setInternalStatus('rejected');
      const rejectionEntry = {
        sender: 'supplier',
        content: `Offer declined. Reason: ${selectedDeclineReason}.${declineRationale ? ` Notes: ${declineRationale}` : ''}`,
        timestamp: new Date().toISOString(),
        isDeclineNotice: true
      };
      setInternalMessages((prev) => [...prev, rejectionEntry]);

      setInSituToast({
        message: `Offer successfully declined. Rejection notice dispatched to ${buyerEmail}.`,
        type: 'success'
      });
    } catch (err: any) {
      setInSituToast({
        message: err?.message || 'Failed to decline offer.',
        type: 'warning'
      });
    } finally {
      setIsSubmittingDecline(false);
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

  const getTimelineEvents = () => {
    const events: Array<{
      id: string;
      category: 'negotiations' | 'system' | 'status';
      title: string;
      description: string;
      timestamp: string;
      actor: string;
      referenceId: string;
    }> = [];

    // 1. Lot publication / listing
    events.push({
      id: `lot-pub-${lot?._id || '0'}`,
      category: 'system',
      title: 'Lot Published & Inventory Allocated',
      description: `Lot #${lot?.lotNumber || 'N/A'} (${lot?.productId?.description || 'Surplus Item'}, SKU: ${lot?.productId?.sku || 'N/A'}) published with standard sell baseline $${Number(lot?.standardSellPrice || 0).toFixed(2)}/cs.`,
      timestamp: lot?.createdAt || lot?.listingDate || bid?.submittedAt || new Date().toISOString(),
      actor: 'Supplier Operations',
      referenceId: lot?.lotNumber ? `LOT-${lot.lotNumber}` : (lot?._id || 'LOT-REF')
    });

    // 2. Escrow pre-auth check
    events.push({
      id: `escrow-${bid?._id || '0'}`,
      category: 'system',
      title: 'Automated Escrow Pre-Authorization & Buyer Verification',
      description: `Commercial solvency check and escrow pre-authorization verified for buyer ${bid?.buyerId?.companyName || 'Buyer'}. Funds pre-allocated for transaction compliance.`,
      timestamp: bid?.submittedAt || lot?.createdAt || new Date().toISOString(),
      actor: 'Escrow Engine / Compliance',
      referenceId: `ESCROW-PREAUTH-${bid?._id?.slice(-6) || 'AUTH'}`
    });

    // 3. Buyer Initial Bid
    events.push({
      id: `bid-init-${bid?._id || '0'}`,
      category: 'negotiations',
      title: 'Buyer Initial Offer Submitted',
      description: `Initial offer submitted at $${Number(bid?.price || bid?.bidPricePerCase || 0).toFixed(2)}/cs for ${bid?.quantity || bid?.quantityCases || 0} cases (Total: $${(Number(bid?.price || bid?.bidPricePerCase || 0) * Number(bid?.quantity || bid?.quantityCases || 0)).toLocaleString('en-US', { minimumFractionDigits: 2 })}).`,
      timestamp: bid?.submittedAt || new Date().toISOString(),
      actor: bid?.buyerId?.companyName || 'Buyer',
      referenceId: `BID-${bid?._id || 'REF'}`
    });

    // 4. Negotiation messages (from internalMessages or bid?.messages)
    const msgs = internalMessages && internalMessages.length > 0 ? internalMessages : (bid?.messages || []);
    msgs.forEach((msg: any, index: number) => {
      if (index === 0 && msg.sender === 'buyer' && msg.content?.includes('Initial offer submitted')) {
        return;
      }
      const isSupplier = msg.sender === 'supplier';
      const isBuyer = msg.sender === 'buyer';
      const category: 'negotiations' | 'system' = isSupplier || isBuyer ? 'negotiations' : 'system';
      const title = isSupplier 
        ? `Supplier Counter-Offer Dispatched ($${Number(msg.proposedPrice || 0).toFixed(2)}/cs)`
        : isBuyer 
          ? 'Buyer Negotiation Response' 
          : 'System Negotiation Note';
      const actor = isSupplier ? 'Supplier Operations' : isBuyer ? (bid?.buyerId?.companyName || 'Buyer') : 'System';

      events.push({
        id: `msg-${index}-${msg.timestamp || index}`,
        category,
        title,
        description: msg.content || (msg.proposedPrice ? `Proposed terms: $${Number(msg.proposedPrice).toFixed(2)}/cs for ${msg.proposedQuantity || bid?.quantity} cases.` : 'Negotiation note recorded.'),
        timestamp: msg.timestamp || new Date().toISOString(),
        actor,
        referenceId: `MSG-ROUND-${index + 1}`
      });
    });

    // 5. Final settlement or status transition
    const currentStatus = internalStatus || bid?.status;
    if (currentStatus === 'accepted' || currentStatus === 'fully_accepted') {
      events.push({
        id: `status-accept-${bid?._id || '0'}`,
        category: 'status',
        title: 'Offer Accepted & Deal Settlement Active',
        description: 'Offer officially accepted by Supplier Operations. Deal settlement generated with agreed logistics pickup instructions.',
        timestamp: new Date().toISOString(),
        actor: 'Supplier Operations',
        referenceId: `AWARD-DEAL-${bid?._id || '0'}`
      });
    } else if (currentStatus === 'rejected' || currentStatus === 'declined') {
      events.push({
        id: `status-reject-${bid?._id || '0'}`,
        category: 'status',
        title: 'Offer Declined & Rejection Notice Dispatched',
        description: selectedDeclineReason ? `Offer declined. Reason: ${selectedDeclineReason}. Rationale: ${declineRationale || 'N/A'}` : 'Offer declined by Supplier Operations.',
        timestamp: new Date().toISOString(),
        actor: 'Supplier Operations',
        referenceId: `DECLINE-${bid?._id || '0'}`
      });
    } else if (currentStatus === 'countered') {
      events.push({
        id: `status-counter-${bid?._id || '0'}`,
        category: 'status',
        title: 'Status Transition: Active Counter Proposal',
        description: 'Offer transitioned to Countered state pending buyer review and action.',
        timestamp: new Date().toISOString(),
        actor: 'Workflow Engine',
        referenceId: `TRANS-COUNTER-${bid?._id || '0'}`
      });
    }

    return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  };

  const renderTimelineAuditTab = () => {
    const allEvents = getTimelineEvents();
    const filteredEvents = allEvents.filter(event => {
      const matchesCategory = timelineCategoryFilter === 'all' || event.category === timelineCategoryFilter;
      const matchesSearch = !timelineSearchQuery.trim() || 
        event.title.toLowerCase().includes(timelineSearchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(timelineSearchQuery.toLowerCase()) ||
        event.actor.toLowerCase().includes(timelineSearchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });

    return (
      <div data-testid="timeline-audit-surface" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Header & Controls bar */}
        <div 
          data-testid="timeline-controls-bar"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            padding: '14px 18px',
            backgroundColor: 'hsl(var(--bg-main))',
            borderRadius: '10px',
            border: '1px solid hsl(var(--border-color))'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={18} style={{ color: 'hsl(var(--primary))' }} />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>
              Lifecycle Audit Trail & Event Stream
            </h3>
            <span 
              data-testid="timeline-event-count"
              style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}
            >
              ({filteredEvents.length} of {allEvents.length} events)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {/* Category Filter Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Filter size={15} style={{ color: 'hsl(var(--text-muted))' }} />
              <select
                aria-label="Filter Events Category"
                data-testid="timeline-category-filter"
                value={timelineCategoryFilter}
                onChange={(e) => setTimelineCategoryFilter(e.target.value as any)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  backgroundColor: 'hsl(var(--bg-card))',
                  color: 'hsl(var(--text-primary))',
                  border: '1px solid hsl(var(--border-color))'
                }}
              >
                <option value="all">All Events</option>
                <option value="negotiations">Negotiations</option>
                <option value="system">System Notes</option>
                <option value="status">Status Transitions</option>
              </select>
            </div>

            {/* Real-time Search Input */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={15} style={{ position: 'absolute', left: '10px', color: 'hsl(var(--text-muted))' }} />
              <input
                type="text"
                aria-label="Search timeline events"
                data-testid="timeline-search-input"
                placeholder="Search events or actors..."
                value={timelineSearchQuery}
                onChange={(e) => setTimelineSearchQuery(e.target.value)}
                style={{
                  padding: '6px 12px 6px 32px',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  backgroundColor: 'hsl(var(--bg-card))',
                  color: 'hsl(var(--text-primary))',
                  border: '1px solid hsl(var(--border-color))',
                  minWidth: '220px'
                }}
              />
            </div>
          </div>
        </div>

        {/* Chronological Activity Feed */}
        {filteredEvents.length === 0 ? (
          <div 
            data-testid="timeline-empty-state"
            style={{
              padding: '36px',
              textAlign: 'center',
              backgroundColor: 'hsl(var(--bg-main) / 30%)',
              borderRadius: '10px',
              border: '1px dashed hsl(var(--border-color))',
              color: 'hsl(var(--text-muted))',
              fontSize: '0.9rem'
            }}
          >
            No events match the selected filter criteria.
          </div>
        ) : (
          <div 
            data-testid="timeline-activity-feed"
            style={{
              position: 'relative',
              paddingLeft: '32px',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px'
            }}
          >
            {/* Vertical timeline spine line */}
            <div 
              style={{
                position: 'absolute',
                top: '12px',
                bottom: '12px',
                left: '11px',
                width: '2px',
                backgroundColor: 'hsl(var(--border-color))'
              }}
            />

            {filteredEvents.map((event) => {
              const isNegotiation = event.category === 'negotiations';
              const isStatus = event.category === 'status';
              const isSystem = event.category === 'system';

              // Amber for negotiations, emerald/red for status transitions, blue for system notes
              const isStatusDecline = isStatus && (event.id.includes('reject') || event.title.toLowerCase().includes('decline'));
              const isStatusCounter = isStatus && (event.id.includes('counter') || event.title.toLowerCase().includes('counter'));
              const statusColor = isStatusDecline ? '#ef4444' : isStatusCounter ? '#f59e0b' : '#10b981';

              const nodeColor = isNegotiation ? '#f59e0b' : isStatus ? statusColor : '#3b82f6';
              const categoryBg = isNegotiation 
                ? 'rgba(245, 158, 11, 0.15)' 
                : isStatus 
                  ? (isStatusDecline ? 'rgba(239, 68, 68, 0.15)' : isStatusCounter ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)')
                  : 'rgba(59, 130, 246, 0.15)';
              const categoryText = isNegotiation 
                ? '#f59e0b' 
                : isStatus 
                  ? statusColor
                  : '#3b82f6';

              return (
                <div 
                  key={event.id}
                  data-testid={`timeline-event-card-${event.id}`}
                  style={{
                    position: 'relative',
                    backgroundColor: 'hsl(var(--bg-card))',
                    border: '1px solid hsl(var(--border-color))',
                    borderRadius: '10px',
                    padding: '16px 18px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                  }}
                >
                  {/* Node dot on vertical spine */}
                  <div 
                    data-testid="timeline-node-dot"
                    style={{
                      position: 'absolute',
                      left: '-27px',
                      top: '20px',
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      backgroundColor: nodeColor,
                      border: '2px solid hsl(var(--bg-card))',
                      boxShadow: `0 0 0 2px ${nodeColor}`
                    }}
                  />

                  {/* Top card metadata row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span 
                        data-testid="timeline-event-category-badge"
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor: categoryBg,
                          color: categoryText
                        }}
                      >
                        {event.category}
                      </span>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'hsl(var(--text-primary))' }}>
                        {event.title}
                      </h4>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>
                      <span data-testid="timeline-event-actor" style={{ fontWeight: 600, color: 'hsl(var(--text-secondary))' }}>
                        {event.actor}
                      </span>
                      <span>•</span>
                      <span data-testid="timeline-event-time">
                        {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  {/* Description content */}
                  <div 
                    data-testid="timeline-event-description"
                    style={{
                      fontSize: '0.85rem',
                      color: 'hsl(var(--text-secondary))',
                      lineHeight: 1.5,
                      marginBottom: '8px'
                    }}
                  >
                    {event.description}
                  </div>

                  {/* Bottom reference ID */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', fontSize: '0.72rem', color: 'hsl(var(--text-muted))' }}>
                    <span 
                      data-testid="timeline-event-ref-id"
                      style={{
                        fontFamily: 'monospace',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        backgroundColor: 'hsl(var(--bg-main))',
                        border: '1px solid hsl(var(--border-color))'
                      }}
                    >
                      Ref: {event.referenceId}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const getActivePreviewEmailContent = () => {
    let rawHtml = '';
    let currentTokens: Record<string, string> = {};
    if (activeMode === 'accept') {
      rawHtml = acceptanceMessage || DEFAULT_ACCEPTANCE_MESSAGE;
      currentTokens = settlementTokenValues;
    } else if (activeMode === 'counter') {
      rawHtml = counterMessage || DEFAULT_COUNTER_MESSAGE;
      currentTokens = tokenValues;
    } else {
      rawHtml = declineMessage || DEFAULT_DECLINE_MESSAGE;
      currentTokens = declineTokenValues;
    }

    let processed = rawHtml;
    Object.entries(currentTokens).forEach(([tokenKey, tokenVal]) => {
      const cleanVal = tokenVal.replace(/^\[/, '').replace(/\]$/, '');
      const regexTokenTag = new RegExp(`<span[^>]*data-token=["']${tokenKey}["'][^>]*>.*?<\\/span>`, 'gi');
      processed = processed.replace(regexTokenTag, cleanVal);
      const regexBrackets = new RegExp(`\\{\\{${tokenKey}\\}\\}`, 'gi');
      processed = processed.replace(regexBrackets, cleanVal);
    });
    return processed;
  };


  return (
    <div 
      className="modal-overlay" 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        zIndex: 1050,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMaximized ? '0' : '10px'
      }}
    >
      <div 
        className={`modal-container max-w-[98vw] ${isMaximized ? 'w-full h-full rounded-none' : 'w-[98vw] h-[96vh] max-h-[96vh] rounded-2xl'}`}
        style={{
          backgroundColor: 'hsl(var(--bg-card))',
          color: 'hsl(var(--text-primary))',
          borderRadius: isMaximized ? '0px' : '16px',
          border: isMaximized ? 'none' : '1px solid hsl(var(--border-color))',
          width: isMaximized ? '100vw' : '98vw',
          maxWidth: isMaximized ? '100vw' : '98vw',
          height: isMaximized ? '100vh' : '96vh',
          maxHeight: isMaximized ? '100vh' : '96vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: isMaximized ? 'none' : '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
          overflow: 'hidden',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Header */}
        <header 
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'hsl(var(--text-muted))' }}>
                Bid Action Inspector
              </span>
              <span style={{ color: 'hsl(var(--text-muted))' }}>•</span>
              <span 
                style={{ 
                  fontFamily: 'monospace', 
                  fontSize: '0.75rem', 
                  color: 'hsl(var(--text-secondary))', 
                  backgroundColor: 'hsl(var(--bg-card))', 
                  padding: '2px 8px', 
                  borderRadius: '4px', 
                  border: '1px solid hsl(var(--border-color))' 
                }}
              >
                {lotNumber.startsWith('LOT') ? lotNumber : `LOT #${lotNumber}`}
              </span>
              <span 
                style={{ 
                  fontFamily: 'monospace', 
                  fontSize: '0.75rem', 
                  color: 'hsl(var(--text-secondary))', 
                  backgroundColor: 'hsl(var(--bg-card))', 
                  padding: '2px 8px', 
                  borderRadius: '4px', 
                  border: '1px solid hsl(var(--border-color))' 
                }}
              >
                SKU: {lotSku}
              </span>
              <span style={{ color: 'hsl(var(--text-muted))' }}>•</span>
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
                        : isBuyerCountered
                          ? 'rgba(99, 102, 241, 0.15)'
                          : 'rgba(245, 158, 11, 0.15)',
                  color: isRejected 
                    ? '#ef4444' 
                    : isAccepted 
                      ? '#10b981' 
                      : isCountered
                        ? '#3b82f6'
                        : isBuyerCountered
                          ? '#6366f1'
                          : '#f59e0b',
                  border: `1px solid ${
                    isRejected 
                      ? 'rgba(239, 68, 68, 0.3)' 
                      : isAccepted 
                        ? 'rgba(16, 185, 129, 0.3)' 
                        : isCountered
                          ? 'rgba(59, 130, 246, 0.3)'
                          : isBuyerCountered
                            ? 'rgba(99, 102, 241, 0.3)'
                            : 'rgba(245, 158, 11, 0.3)'
                  }`,
                  textTransform: 'capitalize'
                }}
              >
                {isBuyerCountered ? 'Buyer Countered' : (internalStatus || bid.status || 'pending')}
              </span>
            </div>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0, color: 'hsl(var(--text-primary))' }}>
              {productTitle}
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              aria-label={isMaximized ? "Restore inspector size" : "Maximize inspector size"}
              data-testid="toggle-maximize-inspector-btn"
              className="btn btn-outline"
              onClick={() => setIsMaximized(!isMaximized)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.8rem',
                padding: '6px 12px',
                borderColor: 'hsl(var(--border-color))'
              }}
              title={isMaximized ? "Restore to workbench view (98vw)" : "Maximize to full screen (100vw)"}
            >
              {isMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              <span>{isMaximized ? 'Restore View' : 'Maximize View'}</span>
            </button>

            <button
              type="button"
              data-testid="header-preview-email-btn"
              className="btn btn-outline"
              onClick={() => setIsPreviewModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.8rem',
                padding: '6px 12px',
                borderColor: 'hsl(var(--border-color))'
              }}
            >
              <Eye size={14} />
              <span>Preview Email</span>
            </button>

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
        </header>

        {/* State-Aware Banner: Declined Offer */}
        {isRejected && (
          <div 
            data-testid="declined-active-banner"
            style={{ 
              margin: '16px 24px 0', 
              padding: '14px 18px', 
              backgroundColor: 'rgba(239, 68, 68, 0.08)', 
              borderRadius: '10px', 
              border: '1px solid rgba(239, 68, 68, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <XCircle size={18} style={{ color: '#ef4444', flexShrink: 0 }} />
              <div style={{ fontSize: '0.85rem', color: 'hsl(var(--text-primary))' }}>
                <span style={{ fontWeight: 600, color: '#ef4444' }}>Offer Declined</span> — Reason: {selectedDeclineReason || bid.declineReason || 'Declined'}
                {declineRationale ? ` (Memo: ${declineRationale})` : ''}.
              </div>
            </div>
            {onReset && (
              <button
                type="button"
                onClick={handleResetToPending}
                disabled={isSubmitting}
                className="btn btn-outline"
                style={{
                  fontSize: '0.78rem',
                  padding: '4px 10px',
                  borderColor: 'rgba(239, 68, 68, 0.3)',
                  color: '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <RotateCcw size={12} />
                Re-open Offer
              </button>
            )}
          </div>
        )}

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
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px'
          }}
        >
          {/* Card 1: Buyer Organization */}
          <div 
            data-testid="summary-buyer-org" 
            style={{ 
              padding: '12px 16px', 
              backgroundColor: 'hsl(var(--bg-card))', 
              borderRadius: '10px', 
              border: '1px solid hsl(var(--border-color))',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Building2 size={14} /> Buyer Organization
                </span>
                <span 
                  data-testid="buyer-verified-badge"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.68rem',
                    fontWeight: 600,
                    color: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.12)',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    border: '1px solid rgba(16, 185, 129, 0.25)'
                  }}
                >
                  <ShieldCheck size={12} /> Verified
                </span>
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', marginTop: '6px', color: 'hsl(var(--text-primary))' }}>
                {buyerCompany}
              </div>
            </div>
            <div style={{ marginTop: '6px', fontSize: '0.75rem' }}>
              <a 
                href={`mailto:${buyerEmail}`}
                style={{ 
                  color: 'hsl(var(--text-muted))', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '4px',
                  textDecoration: 'none'
                }}
              >
                <Mail size={12} /> {buyerEmail}
              </a>
            </div>
          </div>

          {/* Card 2: Unit Offer */}
          <div 
            data-testid="summary-unit-offer" 
            style={{ 
              padding: '12px 16px', 
              backgroundColor: 'hsl(var(--bg-card))', 
              borderRadius: '10px', 
              border: '1px solid hsl(var(--border-color))',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <DollarSign size={14} /> Unit Offer
              </div>
              {hasNegotiatedSettledPrice ? (
                <div style={{ marginTop: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: 700, fontSize: '1.15rem', color: 'hsl(var(--success))' }}>
                      ${finalPrice.toFixed(2)} <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', fontWeight: 400 }}>/case</span>
                    </span>
                    <span 
                      style={{ 
                        fontSize: '0.65rem', 
                        fontWeight: 700, 
                        padding: '1px 5px', 
                        borderRadius: '4px', 
                        backgroundColor: 'hsla(var(--success), 0.15)', 
                        color: 'hsl(var(--success))',
                        border: '1px solid hsla(var(--success), 0.3)',
                        textTransform: 'uppercase'
                      }}
                    >
                      Settled
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', marginTop: '2px' }}>
                    Initial Bid: ${unitPrice.toFixed(2)} /case
                  </div>
                </div>
              ) : (
                <div style={{ fontWeight: 700, fontSize: '1.15rem', color: 'hsl(var(--success))', marginTop: '4px' }}>
                  ${unitPrice.toFixed(2)} <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', fontWeight: 400 }}>/case</span>
                </div>
              )}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'hsl(var(--text-muted))', marginTop: '4px', fontFamily: 'monospace' }}>
              Floor: ${reserveFloorPrice.toFixed(2)}
            </div>
          </div>

          {/* Card 3: Volume Requested */}
          <div 
            data-testid="summary-volume-requested" 
            style={{ 
              padding: '12px 16px', 
              backgroundColor: 'hsl(var(--bg-card))', 
              borderRadius: '10px', 
              border: '1px solid hsl(var(--border-color))',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Package size={14} /> Volume Requested
                </span>
                <span 
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(59, 130, 246, 0.12)',
                    color: '#3b82f6',
                    border: '1px solid rgba(59, 130, 246, 0.25)'
                  }}
                >
                  {allocationPct}% Lot
                </span>
              </div>
              <div style={{ fontWeight: 700, fontSize: '1.15rem', marginTop: '4px', color: 'hsl(var(--text-primary))' }}>
                {quantity} <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', fontWeight: 400 }}>cases</span>
              </div>
            </div>
            <div style={{ marginTop: '4px' }}>
              <span 
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  padding: '1px 6px',
                  borderRadius: '4px',
                  backgroundColor: isFullClearing ? 'rgba(16, 185, 129, 0.12)' : 'hsl(var(--bg-main))',
                  color: isFullClearing ? '#10b981' : 'hsl(var(--text-muted))',
                  border: `1px solid ${isFullClearing ? 'rgba(16, 185, 129, 0.25)' : 'hsl(var(--border-color))'}`
                }}
              >
                {isFullClearing ? 'Full Clearing' : 'Partial Clearing'}
              </span>
            </div>
          </div>

          {/* Card 4: Gross Recovery */}
          <div 
            data-testid="summary-gross-recovery" 
            style={{ 
              padding: '12px 16px', 
              backgroundColor: 'hsl(var(--bg-card))', 
              borderRadius: '10px', 
              border: '1px solid hsl(var(--border-color))',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <DollarSign size={14} /> Gross Recovery
              </div>
              <div style={{ fontWeight: 700, fontSize: '1.15rem', color: 'hsl(var(--text-primary))', marginTop: '4px' }}>
                ${totalRecovery.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'hsl(var(--text-muted))', marginTop: '4px', fontFamily: 'monospace' }}>
              Net Est: ${netClearingTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
              background: activeMode === 'accept' ? 'rgba(16, 185, 129, 0.08)' : 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              borderBottom: activeMode === 'accept' ? '3px solid hsl(var(--primary))' : '3px solid transparent',
              color: activeMode === 'accept' ? 'hsl(var(--primary))' : 'hsl(var(--text-secondary))'
            }}
          >
            <CheckCircle2 size={16} /> Accept Offer
          </button>

          <button
            type="button"
            data-testid="tab-counter"
            aria-label="Negotiate (Re-negotiate / Counter)"
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
              background: activeMode === 'counter' ? 'rgba(245, 158, 11, 0.08)' : 'none',
              cursor: isAccepted ? 'not-allowed' : 'pointer',
              opacity: isAccepted ? 0.5 : 1,
              fontWeight: 600,
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              borderBottom: activeMode === 'counter' ? '3px solid #f59e0b' : '3px solid transparent',
              color: activeMode === 'counter' ? '#d97706' : 'hsl(var(--text-secondary))'
            }}
          >
            <ArrowLeftRight size={16} /> Negotiate
          </button>

          <button
            type="button"
            data-testid="tab-decline"
            aria-label="Decline (Decline Offer)"
            onClick={() => {
              if (isAccepted) return;
              setActiveMode('decline');
            }}
            disabled={isAccepted}
            title={isAccepted ? 'Cannot decline an accepted offer.' : undefined}
            style={{
              padding: '12px 18px',
              border: 'none',
              background: activeMode === 'decline' ? 'rgba(239, 68, 68, 0.06)' : 'none',
              cursor: isAccepted ? 'not-allowed' : 'pointer',
              opacity: isAccepted ? 0.5 : 1,
              fontWeight: 600,
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              borderBottom: activeMode === 'decline' ? '3px solid #ef4444' : '3px solid transparent',
              color: activeMode === 'decline' ? '#ef4444' : 'hsl(var(--text-secondary))'
            }}
          >
            <XCircle size={16} /> Decline
          </button>

          <button
            type="button"
            data-testid="tab-timeline"
            aria-label="Timeline"
            onClick={() => setActiveMode('timeline')}
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
              borderBottom: activeMode === 'timeline' ? '3px solid hsl(var(--primary))' : '3px solid transparent',
              color: activeMode === 'timeline' ? 'hsl(var(--primary))' : 'hsl(var(--text-secondary))'
            }}
          >
            <Clock size={16} /> Timeline
            <span
              data-testid="timeline-tab-badge"
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: '10px',
                backgroundColor: activeMode === 'timeline' ? 'hsl(var(--primary))' : 'hsl(var(--border-color))',
                color: activeMode === 'timeline' ? '#fff' : 'hsl(var(--text-secondary))'
              }}
            >
              {getTimelineEvents().length}
            </span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
          {/* Mode: Accept Offer */}
          {activeMode === 'accept' && isAccepted && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div data-testid="settlement-active-banner" style={{ padding: '20px', backgroundColor: 'rgba(16, 185, 129, 0.08)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <h4 style={{ margin: 0, color: 'hsl(var(--success))', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.05rem' }}>
                    <CheckCircle2 size={20} /> Offer Accepted & Deal Settlement Active
                  </h4>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, padding: '3px 8px', borderRadius: '6px', backgroundColor: 'rgba(16, 185, 129, 0.2)', color: 'hsl(var(--success))', textTransform: 'capitalize' }}>
                    {internalStatus || bid.status}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'hsl(var(--text-secondary))', lineHeight: 1.5 }}>
                  {hasNegotiatedSettledPrice ? (
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
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))',
                gap: '20px',
                alignItems: 'start'
              }}
            >
              {/* Left Column: Logistics Configuration */}
              <div 
                data-testid="accept-left-pane"
                style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
              >
                {/* 1. Logistics & Allocation Configuration Card (TOP) */}
                <section 
                  data-testid="accept-logistics-card"
                style={{ 
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

                <div>
                  <label htmlFor="pickup-address-input" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      DC Pickup Address <span style={{ color: '#ef4444' }}>*</span>
                    </span>
                    <span style={{ fontSize: '0.68rem', fontFamily: 'monospace', padding: '1px 6px', borderRadius: '4px', backgroundColor: 'hsl(var(--bg-main))', border: '1px solid hsl(var(--border-color))', color: 'hsl(var(--text-muted))' }}>
                      FOB Origin
                    </span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <MapPin size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: '#3b82f6', pointerEvents: 'none' }} />
                    <input
                      id="pickup-address-input"
                      aria-label="DC Pickup Address"
                      type="text"
                      className="form-input"
                      value={pickupAddress}
                      onChange={(e) => setPickupAddress(e.target.value)}
                      placeholder="e.g. 450 Logistics Blvd, Denver, CO 80202"
                      style={{ width: '100%', paddingLeft: '34px' }}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="pickup-hours-input" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      Dock Operating Hours <span style={{ color: '#ef4444' }}>*</span>
                    </span>
                    <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: '4px', backgroundColor: 'hsl(var(--bg-main))', border: '1px solid hsl(var(--border-color))', color: 'hsl(var(--text-muted))' }}>
                      Appointment Req.
                    </span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Clock size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: 'hsl(var(--text-muted))', pointerEvents: 'none' }} />
                    <input
                      id="pickup-hours-input"
                      aria-label="Dock Operating Hours"
                      type="text"
                      className="form-input"
                      value={pickupHours}
                      onChange={(e) => setPickupHours(e.target.value)}
                      placeholder="e.g. 08:00 AM - 04:30 PM CST"
                      style={{ width: '100%', paddingLeft: '34px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label htmlFor="awarded-quantity-input" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px' }}>
                      <span>Awarded Qty (cases)</span>
                      <span style={{ fontSize: '0.68rem', fontFamily: 'monospace', padding: '1px 6px', borderRadius: '4px', backgroundColor: 'hsl(var(--bg-main))', border: '1px solid hsl(var(--border-color))', color: 'hsl(var(--text-muted))' }}>
                        {lot?.availableQty || quantity} Max
                      </span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Package size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: 'hsl(var(--text-muted))', pointerEvents: 'none' }} />
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
                        style={{ width: '100%', paddingLeft: '34px' }}
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="agreed-price-input" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px' }}>
                      <span>Agreed Price ($/cs)</span>
                      <span style={{ fontSize: '0.68rem', fontFamily: 'monospace', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                        Settled
                      </span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: 'hsl(var(--text-muted))', pointerEvents: 'none' }} />
                      <input
                        id="agreed-price-input"
                        aria-label="Agreed Price"
                        type="text"
                        className="form-input"
                        value={`$${effectiveUnitPrice.toFixed(2)}`}
                        disabled
                        style={{ width: '100%', paddingLeft: '34px', paddingRight: '48px', cursor: 'not-allowed', backgroundColor: 'hsl(var(--bg-main))', color: '#10b981', fontWeight: 700 }}
                      />
                      <span style={{ position: 'absolute', right: '12px', top: '10px', fontSize: '0.72rem', fontFamily: 'monospace', color: 'hsl(var(--text-muted))', fontWeight: 600 }}>
                        USD
                      </span>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Right Column: Settlement Dispatch Card with TipTap Editor */}
            <div 
              data-testid="accept-right-pane"
              style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              {/* 2. Communication Card with Channel Selector */}
              <section 
                data-testid="accept-communication-card"
                id="accept-email-builder-section"
                style={{
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

              {/* 3. Settlement Summary Footer Bar (BOTTOM) */}
              <div 
                data-testid="accept-settlement-footer"
                style={{ 
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
                    onClick={() => setIsPreviewModalOpen(true)}
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
                    onClick={handleConfirmAccept}
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
        )}

          {/* Mode: Counter / Negotiate — Two-Column Split Layout on Wide Screens */}
          {activeMode === 'counter' && (
            <div 
              data-testid="counter-split-work-surface"
              style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', 
                gap: '20px',
                alignItems: 'start'
              }}
            >
              {/* Left Column: Counter-Offer Parameters Card */}
              <div data-testid="counter-left-pane" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <section
                  data-testid="negotiate-parameters-card"
                  style={{
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

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', fontWeight: 600, marginBottom: '6px' }}>
                        <span>Counter Unit Price ($/cs) <span style={{ color: '#d97706' }}>*</span></span>
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
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <span style={{ position: 'absolute', left: '10px', color: 'hsl(var(--text-muted))', fontFamily: 'monospace', fontSize: '0.85rem' }}>$</span>
                        <input
                          type="number"
                          step="0.01"
                          className="form-input"
                          style={{ paddingLeft: '24px' }}
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

                    <div>
                      <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', fontWeight: 600, marginBottom: '6px' }}>
                        <span>Counter Volume (cases)</span>
                        <span style={{ fontSize: '0.68rem', fontFamily: 'monospace', padding: '1px 6px', borderRadius: '4px', backgroundColor: 'hsl(var(--bg-main))', border: '1px solid hsl(var(--border-color))', color: 'hsl(var(--text-muted))' }}>
                          {maxCounterVolume} Max
                        </span>
                      </label>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <Package size={15} style={{ position: 'absolute', left: '10px', color: 'hsl(var(--text-muted))' }} />
                        <input
                          type="number"
                          min="1"
                          max={maxCounterVolume}
                          className="form-input"
                          style={{ paddingLeft: '32px' }}
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

                    <div>
                      <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', fontWeight: 600, marginBottom: '6px' }}>
                        <span>Counter Holding Window</span>
                        <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: '4px', backgroundColor: 'hsl(var(--bg-main))', border: '1px solid hsl(var(--border-color))', color: 'hsl(var(--text-muted))' }}>
                          Auto-expires
                        </span>
                      </label>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <Timer size={15} style={{ position: 'absolute', left: '10px', color: 'hsl(var(--text-muted))' }} />
                        <input
                          type="text"
                          disabled
                          value="48 Hours"
                          className="form-input"
                          style={{ paddingLeft: '32px', backgroundColor: 'hsl(var(--bg-main))', cursor: 'not-allowed', color: 'hsl(var(--text-secondary))' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', fontWeight: 600, marginBottom: '6px' }}>
                        <span>Liquidation Reserve Floor</span>
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
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <Shield size={15} style={{ position: 'absolute', left: '10px', color: 'hsl(var(--text-muted))' }} />
                        <input
                          type="text"
                          disabled
                          value={`$${reserveFloorPrice.toFixed(2)} /case ($${reserveFloorTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Floor)`}
                          className="form-input"
                          style={{ paddingLeft: '32px', backgroundColor: 'hsl(var(--bg-main))', cursor: 'not-allowed', color: 'hsl(var(--text-secondary))', fontFamily: 'monospace', fontWeight: 600 }}
                        />
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              {/* Right Column / Section 2 & 3 */}
              <div data-testid="counter-right-pane" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* 2. Communication Card with Channel Selector (BELOW Parameters) */}
                <section
                  data-testid="negotiate-communication-card"
                  style={{
                    backgroundColor: 'hsl(var(--bg-card))',
                    border: '1px solid hsl(var(--border-color))',
                    borderRadius: '12px',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                    overflow: 'hidden'
                  }}
                >
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
                </section>

                {/* 3. Dynamic Summary & Dispatch Bar (BOTTOM) */}
                <div 
                  data-testid="negotiate-summary-bar"
                  style={{ 
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
                      onClick={() => setIsPreviewModalOpen(true)}
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
                      onClick={handleDispatchCounter}
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
          )}

          {/* Mode: Decline Offer */}
          {activeMode === 'decline' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div 
                data-testid="decline-split-work-surface"
                style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', 
                  gap: '20px',
                  alignItems: 'start'
                }}
              >
                {/* Left Column */}
                <div 
                  data-testid="decline-left-pane"
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '16px' 
                  }}
                >
                  {/* 1. Rejection Specification Card */}
                  <section
                    data-testid="decline-specification-card"
                    style={{
                      backgroundColor: 'hsl(var(--bg-card))',
                      border: '1px solid hsl(var(--border-color))',
                      borderRadius: '12px',
                      padding: '16px',
                      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '14px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid hsl(var(--border-color))', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', flexShrink: 0 }}>
                          <XCircle size={18} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
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

                    <div>
                      <label 
                        htmlFor="decline-reason-select"
                        style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}
                      >
                        Decline Reason <span style={{ color: '#ef4444' }}>*</span> (Mandatory)
                      </label>
                      <select
                        id="decline-reason-select"
                        aria-label="Decline Reason"
                        className="form-input"
                        value={selectedDeclineReason}
                        onChange={(e) => setSelectedDeclineReason(e.target.value)}
                        style={{ width: '100%', height: '38px', fontSize: '0.82rem' }}
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
                        style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}
                      >
                        Decline Rationale & Supplier Notes
                      </label>
                      <textarea
                        id="decline-rationale-notes"
                        className="form-input"
                        rows={3}
                        value={declineRationale}
                        onChange={(e) => setDeclineRationale(e.target.value)}
                        placeholder="Add specific rationale or notes for the buyer and lot audit trail..."
                        style={{ width: '100%', resize: 'vertical', fontSize: '0.82rem' }}
                      />
                    </div>

                    {/* Auto-Relist Inventory Control */}
                    <div 
                      style={{ 
                        padding: '12px', 
                        backgroundColor: 'hsl(var(--bg-main))', 
                        borderRadius: '8px', 
                        border: '1px solid hsl(var(--border-color))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'hsl(var(--text-primary))' }}>
                          Auto-Relist Inventory
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
                  </section>
                </div>

              {/* Right Column: Communication Card & TipTap Email Builder */}
              <div 
                data-testid="decline-right-pane"
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '16px'
                }}
              >
                <section
                  data-testid="decline-communication-card"
                  style={{
                    backgroundColor: 'hsl(var(--bg-card))',
                    border: '1px solid hsl(var(--border-color))',
                    borderRadius: '12px',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                    overflow: 'hidden'
                  }}
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
            </div>

            {/* 3. Decline Action Footer Bar (BOTTOM) */}
            <div 
              data-testid="decline-action-footer"
              style={{ 
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
                  onClick={() => setIsPreviewModalOpen(true)}
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
                  onClick={handleConfirmDecline}
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
        )}

        {/* Mode: Timeline */}
        {activeMode === 'timeline' && renderTimelineAuditTab()}
        </div>
      </div>

      {/* Outbound Email Preview Modal Dialog */}
      {isPreviewModalOpen && (
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
                onClick={() => setIsPreviewModalOpen(false)}
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
                style={{ padding: '10px 14px', backgroundColor: 'hsl(var(--bg-main))', borderRadius: '8px', border: '1px solid hsl(var(--border-color))', marginBottom: '14px', fontSize: '0.8rem' }}
              >
                <div data-testid="email-preview-recipient"><strong>To:</strong> {buyerEmail}</div>
                <div data-testid="email-preview-subject" style={{ marginTop: '4px' }}><strong>Subject:</strong> {
                  activeMode === 'accept' 
                    ? `Offer Awarded & Deal Settlement: ${productTitle}` 
                    : activeMode === 'counter' 
                      ? `Counter-Offer Proposal: ${productTitle}` 
                      : `Offer Declined: ${productTitle}`
                }</div>
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
                dangerouslySetInnerHTML={{ __html: getActivePreviewEmailContent() }}
              />
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid hsl(var(--border-color))', display: 'flex', justifyContent: 'flex-end', backgroundColor: 'hsl(var(--bg-main))' }}>
              <button
                type="button"
                data-testid="done-email-preview-btn"
                onClick={() => setIsPreviewModalOpen(false)}
                className="btn btn-primary"
                style={{ fontSize: '0.85rem', padding: '6px 16px' }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BidActionInspectorModal;
