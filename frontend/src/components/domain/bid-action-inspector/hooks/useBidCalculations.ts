import { useMemo } from 'react';
import {
  NEGOTIATION_TOKENS,
  SETTLEMENT_TOKENS,
  DECLINE_TOKENS
} from '../constants/bidActionInspectorConstants';
import {
  DEFAULT_COUNTER_MESSAGE,
  DEFAULT_DECLINE_MESSAGE
} from '../constants/bidActionInspectorTemplates';

export interface UseBidCalculationsParams {
  bid: any;
  lot?: any;
  internalStatus: string;
  internalMessages: any[];
  agreedUnitPrice: number;
  counterPrice: number | string;
  counterQuantity: number | string;
  counterMessage: string;
  awardedQuantity: number | string;
  pickupAddress: string;
  pickupHours: string;
  acceptanceMessage: string;
  selectedDeclineReason: string;
  declineRationale: string;
  declineMessage: string;
}

export const countTokensInText = (text: string, tokens: string[]): number => {
  return tokens.reduce((count, token) => {
    if ((text || '').includes(`data-token="${token}"`) || (text || '').includes(`{{${token}}}`)) {
      return count + 1;
    }
    return count;
  }, 0);
};

export const countWordsInHtml = (html: string): number => {
  return (html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
};

export const hydrateTemplateWithTokens = (
  rawHtml: string,
  tokens: Record<string, string>
): string => {
  let processed = rawHtml;
  Object.entries(tokens).forEach(([tokenKey, tokenVal]) => {
    const cleanVal = tokenVal.replace(/^\[/, '').replace(/\]$/, '');
    const regexTokenTag = new RegExp(`<span[^>]*data-token=["']${tokenKey}["'][^>]*>.*?<\\/span>`, 'gi');
    processed = processed.replace(regexTokenTag, cleanVal);
    const regexBrackets = new RegExp(`\\{\\{${tokenKey}\\}\\}`, 'gi');
    processed = processed.replace(regexBrackets, cleanVal);
  });
  return processed;
};

export const useBidCalculations = ({
  bid,
  lot,
  internalStatus,
  internalMessages,
  agreedUnitPrice,
  counterPrice,
  counterQuantity,
  counterMessage,
  awardedQuantity,
  pickupAddress,
  pickupHours,
  acceptanceMessage,
  selectedDeclineReason,
  declineRationale,
  declineMessage
}: UseBidCalculationsParams) => {
  const unitPrice = typeof bid?.price === 'number' ? bid.price : (typeof bid?.bidPricePerCase === 'number' ? bid.bidPricePerCase : 0);
  const effectiveUnitPrice = agreedUnitPrice > 0 ? agreedUnitPrice : unitPrice;
  const quantity = typeof bid?.quantity === 'number' ? bid.quantity : (typeof bid?.quantityCases === 'number' ? bid.quantityCases : 0);
  const buyerCompany = bid?.buyerId?.companyName || 'Verified Buyer';
  const buyerEmail = bid?.buyerId?.email || bid?.buyerEmail || 'N/A';
  const rawStatus = (internalStatus || bid?.status || 'pending').toLowerCase();

  const isRejected = rawStatus === 'rejected' || rawStatus === 'declined';
  const isAccepted = rawStatus === 'fully_accepted' || rawStatus === 'partially_accepted' || rawStatus === 'awarded';
  const isCountered = rawStatus === 'countered';

  const finalPrice = typeof bid?.finalPrice === 'number' ? bid.finalPrice : undefined;
  const hasNegotiatedSettledPrice = isAccepted && finalPrice !== undefined && Math.abs(finalPrice - unitPrice) > 0.001;
  const effectiveAwardedQty = (isAccepted && typeof bid?.awardedQty === 'number' && bid.awardedQty > 0) ? bid.awardedQty : quantity;
  const effectivePrice = (isAccepted && finalPrice !== undefined) ? finalPrice : unitPrice;
  const initialTotalRecovery = unitPrice * quantity;
  const totalRecovery = effectivePrice * effectiveAwardedQty;

  const messages = useMemo(() => {
    return Array.isArray(internalMessages)
      ? [...internalMessages].sort((a: any, b: any) => new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime())
      : [];
  }, [internalMessages]);

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

  const tokenValues: Record<string, string> = useMemo(() => ({
    buyer_name: buyerCompany ? `[${buyerCompany}]` : '{{buyer_name}}',
    product_name: productTitle ? `[${productTitle}]` : '{{product_name}}',
    counter_price: isPriceValid ? `[$${numCounterPrice.toFixed(2)}/cs]` : '{{counter_price}}',
    counter_quantity: isQuantityValid ? `[${numCounterQuantity} cases]` : '{{counter_quantity}}',
    original_price: unitPrice > 0 ? `[$${unitPrice.toFixed(2)}/cs]` : '{{original_price}}',
    accept_counter_link: `[${negotiationBaseUrl}?action=accept]`,
    renegotiate_link: `[${negotiationBaseUrl}?action=rebid]`
  }), [buyerCompany, productTitle, isPriceValid, numCounterPrice, isQuantityValid, numCounterQuantity, unitPrice, negotiationBaseUrl]);

  const numAwarded = Number(awardedQuantity) || quantity;
  const settlementTotal = numAwarded * effectiveUnitPrice;
  const formattedSettlementTotal = `$${settlementTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const settlementTokenValues: Record<string, string> = useMemo(() => ({
    buyer_name: buyerCompany ? `[${buyerCompany}]` : '{{buyer_name}}',
    product_name: productTitle ? `[${productTitle}]` : '{{product_name}}',
    sku: lot?.productId?.sku ? `[${lot.productId.sku}]` : '{{sku}}',
    awarded_quantity: `[${numAwarded} cases]`,
    price_per_case: `[$${effectiveUnitPrice.toFixed(2)}/case]`,
    total_amount: `[${formattedSettlementTotal}]`,
    pickup_location: pickupAddress ? `[${pickupAddress}]` : '{{pickup_location}}',
    pickup_hours: pickupHours ? `[${pickupHours}]` : '{{pickup_hours}}',
    payment_link: `[/deal/${bid?._id || ''}#payment]`,
    deal_document_link: `[/deal/${bid?._id || ''}]`
  }), [buyerCompany, productTitle, lot?.productId?.sku, numAwarded, effectiveUnitPrice, formattedSettlementTotal, pickupAddress, pickupHours, bid?._id]);

  const dynamicTokenCount = useMemo(() => {
    return countTokensInText(acceptanceMessage || '', SETTLEMENT_TOKENS);
  }, [acceptanceMessage]);

  const acceptanceWordCount = useMemo(() => {
    return countWordsInHtml(acceptanceMessage || '');
  }, [acceptanceMessage]);

  const counterTokenCount = useMemo(() => {
    return countTokensInText(counterMessage || DEFAULT_COUNTER_MESSAGE, NEGOTIATION_TOKENS);
  }, [counterMessage]);

  const counterWordCount = useMemo(() => {
    return countWordsInHtml(counterMessage || DEFAULT_COUNTER_MESSAGE);
  }, [counterMessage]);

  const catalogLink = typeof window !== 'undefined' ? `${window.location.origin}/marketplace` : '/marketplace';

  const declineTokenValues: Record<string, string> = useMemo(() => ({
    buyer_name: buyerCompany ? `[${buyerCompany}]` : '{{buyer_name}}',
    product_name: productTitle ? `[${productTitle}]` : '{{product_name}}',
    lot_number: lotNumber ? `[${lotNumber}]` : '{{lot_number}}',
    decline_reason: selectedDeclineReason ? `[${selectedDeclineReason}]` : '{{decline_reason}}',
    decline_rationale: declineRationale ? `[${declineRationale}]` : '{{decline_rationale}}',
    catalog_link: `[${catalogLink}]`
  }), [buyerCompany, productTitle, lotNumber, selectedDeclineReason, declineRationale, catalogLink]);

  const declineTokenCount = useMemo(() => {
    return countTokensInText(declineMessage || DEFAULT_DECLINE_MESSAGE, DECLINE_TOKENS);
  }, [declineMessage]);

  const declineWordCount = useMemo(() => {
    return countWordsInHtml(declineMessage || DEFAULT_DECLINE_MESSAGE);
  }, [declineMessage]);

  return {
    unitPrice,
    effectiveUnitPrice,
    quantity,
    buyerCompany,
    buyerEmail,
    rawStatus,
    isRejected,
    isAccepted,
    isCountered,
    finalPrice,
    hasNegotiatedSettledPrice,
    effectiveAwardedQty,
    effectivePrice,
    initialTotalRecovery,
    totalRecovery,
    messages,
    isPending,
    isBuyerCountered,
    lotNumber,
    lotSku,
    productTitle,
    lotAvailableQty,
    isFullClearing,
    reserveFloorPrice,
    allocationPct,
    netClearingTotal,
    numCounterPrice,
    numCounterQuantity,
    isPriceValid,
    isQuantityValid,
    isCounterValid,
    priceDelta,
    priceDeltaPct,
    counterTotalRecovery,
    totalDelta,
    totalDeltaPct,
    marginUpliftPct,
    formattedUplift,
    isReserveMet,
    maxCounterVolume,
    reserveFloorTotal,
    tokenValues,
    numAwarded,
    settlementTotal,
    formattedSettlementTotal,
    settlementTokenValues,
    dynamicTokenCount,
    acceptanceWordCount,
    counterTokenCount,
    counterWordCount,
    declineTokenValues,
    declineTokenCount,
    declineWordCount
  };
};
