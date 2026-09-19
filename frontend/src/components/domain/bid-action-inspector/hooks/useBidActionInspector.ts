import { useState, useEffect, useCallback } from 'react';
import type {
  BidActionInspectorModalProps,
  InspectorMode,
  TimelineCategoryFilter,
  CommunicationChannel,
  InSituToastState
} from '../types/bidActionInspector.types';
import {
  DEFAULT_COUNTER_MESSAGE,
  DEFAULT_DECLINE_MESSAGE,
  DEFAULT_ACCEPTANCE_MESSAGE
} from '../constants/bidActionInspectorTemplates';
import {
  useBidCalculations,
  hydrateTemplateWithTokens
} from './useBidCalculations';
import { useTimelineAudit } from './useTimelineAudit';

export const useBidActionInspector = ({
  bid,
  lot,
  onDecline,
  onReset,
  onAccept,
  onCounter,
  isSubmitting = false
}: BidActionInspectorModalProps) => {
  const [activeMode, setActiveMode] = useState<InspectorMode>('accept');
  const [timelineCategoryFilter, setTimelineCategoryFilter] = useState<TimelineCategoryFilter>('all');
  const [timelineSearchQuery, setTimelineSearchQuery] = useState<string>('');
  const [selectedDeclineReason, setSelectedDeclineReason] = useState('');
  const [declineRationale, setDeclineRationale] = useState('');
  const [autoRelist, setAutoRelist] = useState<boolean>(true);
  const [declineMessage, setDeclineMessage] = useState<string>(DEFAULT_DECLINE_MESSAGE);
  const [declineActiveChannel, setDeclineActiveChannel] = useState<CommunicationChannel>('email');
  const [isDeclineCommunicationAccordionOpen, setIsDeclineCommunicationAccordionOpen] = useState<boolean>(true);
  const [agreedUnitPrice, setAgreedUnitPrice] = useState<number>(bid?.price || bid?.bidPricePerCase || 0);
  const [isSubmittingDecline, setIsSubmittingDecline] = useState<boolean>(false);

  // Counter mode state
  const [counterPrice, setCounterPrice] = useState<number | string>(bid?.price || bid?.bidPricePerCase || '');
  const [counterQuantity, setCounterQuantity] = useState<number | string>(bid?.quantity || bid?.quantityCases || '');
  const [counterMessage, setCounterMessage] = useState('');
  const [internalStatus, setInternalStatus] = useState<string>(bid?.status || 'pending');
  const [internalMessages, setInternalMessages] = useState<any[]>(bid?.messages || []);
  const [counterActiveChannel, setCounterActiveChannel] = useState<CommunicationChannel>('email');
  const [isCounterCommunicationAccordionOpen, setIsCounterCommunicationAccordionOpen] = useState<boolean>(true);
  const [inSituToast, setInSituToast] = useState<InSituToastState>(null);

  // Accept mode state
  const [awardedQuantity, setAwardedQuantity] = useState<number | string>(bid?.awardedQty || bid?.quantity || bid?.quantityCases || '');
  const [pickupAddress, setPickupAddress] = useState<string>('');
  const [pickupHours, setPickupHours] = useState<string>('08:00 AM - 04:30 PM CST');
  const [acceptanceMessage, setAcceptanceMessage] = useState<string>(DEFAULT_ACCEPTANCE_MESSAGE);
  const [isSubmittingAccept, setIsSubmittingAccept] = useState<boolean>(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);
  const [activeChannel, setActiveChannel] = useState<CommunicationChannel>('email');
  const [isCommunicationAccordionOpen, setIsCommunicationAccordionOpen] = useState<boolean>(true);

  useEffect(() => {
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

  const calculations = useBidCalculations({
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
  });

  const timeline = useTimelineAudit({
    bid,
    lot,
    internalStatus,
    internalMessages,
    selectedDeclineReason,
    declineRationale,
    timelineCategoryFilter,
    timelineSearchQuery
  });

  const getActivePreviewEmailContent = useCallback(() => {
    let rawHtml = '';
    let currentTokens: Record<string, string> = {};
    if (activeMode === 'accept') {
      rawHtml = acceptanceMessage || DEFAULT_ACCEPTANCE_MESSAGE;
      currentTokens = calculations.settlementTokenValues;
    } else if (activeMode === 'counter') {
      rawHtml = counterMessage || DEFAULT_COUNTER_MESSAGE;
      currentTokens = calculations.tokenValues;
    } else {
      rawHtml = declineMessage || DEFAULT_DECLINE_MESSAGE;
      currentTokens = calculations.declineTokenValues;
    }

    return hydrateTemplateWithTokens(rawHtml, currentTokens);
  }, [
    activeMode,
    acceptanceMessage,
    calculations.settlementTokenValues,
    counterMessage,
    calculations.tokenValues,
    declineMessage,
    calculations.declineTokenValues
  ]);

  const handleConfirmAccept = useCallback(async () => {
    if (!onAccept || isSubmittingAccept || isSubmitting) return;
    setIsSubmittingAccept(true);
    try {
      const res: any = await onAccept({
        awardedQuantity: calculations.numAwarded,
        pickupAddress,
        pickupHours,
        templateHtml: acceptanceMessage || DEFAULT_ACCEPTANCE_MESSAGE,
        pricePerCase: calculations.effectiveUnitPrice
      });

      const newStatus = calculations.numAwarded < calculations.quantity ? 'partially_accepted' : 'fully_accepted';
      setInternalStatus(res?.status || newStatus);

      if (res?.emailDispatch?.dispatched === false && res?.emailDispatch?.warning) {
        setInSituToast({
          message: `Offer accepted! Note: email dispatch warning: ${res.emailDispatch.warning}`,
          type: 'warning'
        });
      } else {
        setInSituToast({
          message: `Offer successfully accepted! Settlement email dispatched to ${calculations.buyerEmail}.`,
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
  }, [onAccept, isSubmittingAccept, isSubmitting, calculations.numAwarded, calculations.quantity, calculations.effectiveUnitPrice, calculations.buyerEmail, pickupAddress, pickupHours, acceptanceMessage]);

  const handleConfirmDecline = useCallback(async () => {
    if (!selectedDeclineReason || isSubmitting || isSubmittingDecline) return;
    setIsSubmittingDecline(true);
    try {
      if (onDecline) {
        await onDecline({
          reason: selectedDeclineReason,
          rationale: declineRationale,
          templateHtml: declineMessage || DEFAULT_DECLINE_MESSAGE,
          emailSubject: `Offer Declined: ${calculations.productTitle} (Lot #${calculations.lotNumber})`,
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
        message: `Offer successfully declined. Rejection notice dispatched to ${calculations.buyerEmail}.`,
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
  }, [selectedDeclineReason, isSubmitting, isSubmittingDecline, onDecline, declineRationale, declineMessage, calculations.productTitle, calculations.lotNumber, autoRelist, calculations.buyerEmail]);

  const handleResetToPending = useCallback(async () => {
    if (onReset) {
      await onReset();
    }
  }, [onReset]);

  const handleDispatchCounter = useCallback(async () => {
    if (!calculations.isCounterValid || isSubmitting) return;
    const payload = {
      price: calculations.numCounterPrice,
      quantity: calculations.numCounterQuantity,
      message: counterMessage
    };
    let result: any;
    if (onCounter) {
      result = await onCounter(payload);
    }
    const newProposal = {
      sender: 'supplier',
      content: counterMessage || `Supplier counter-offer: $${calculations.numCounterPrice.toFixed(2)}/cs for ${calculations.numCounterQuantity} cases.`,
      proposedPrice: calculations.numCounterPrice,
      proposedQuantity: calculations.numCounterQuantity,
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
        message: `Counter-offer successfully dispatched ($${calculations.numCounterPrice.toFixed(2)}/cs for ${calculations.numCounterQuantity} cases). Status updated to Countered.`,
        type: 'success'
      });
    }
    setTimeout(() => {
      setInSituToast(null);
    }, 4500);
  }, [calculations.isCounterValid, calculations.numCounterPrice, calculations.numCounterQuantity, isSubmitting, counterMessage, onCounter]);

  return {
    activeMode,
    setActiveMode,
    timelineCategoryFilter,
    setTimelineCategoryFilter,
    timelineSearchQuery,
    setTimelineSearchQuery,
    selectedDeclineReason,
    setSelectedDeclineReason,
    declineRationale,
    setDeclineRationale,
    autoRelist,
    setAutoRelist,
    declineMessage,
    setDeclineMessage,
    declineActiveChannel,
    setDeclineActiveChannel,
    isDeclineCommunicationAccordionOpen,
    setIsDeclineCommunicationAccordionOpen,
    agreedUnitPrice,
    setAgreedUnitPrice,
    isSubmittingDecline,
    counterPrice,
    setCounterPrice,
    counterQuantity,
    setCounterQuantity,
    counterMessage,
    setCounterMessage,
    internalStatus,
    internalMessages,
    counterActiveChannel,
    setCounterActiveChannel,
    isCounterCommunicationAccordionOpen,
    setIsCounterCommunicationAccordionOpen,
    inSituToast,
    setInSituToast,
    awardedQuantity,
    setAwardedQuantity,
    pickupAddress,
    setPickupAddress,
    pickupHours,
    setPickupHours,
    acceptanceMessage,
    setAcceptanceMessage,
    isSubmittingAccept,
    isPreviewModalOpen,
    setIsPreviewModalOpen,
    activeChannel,
    setActiveChannel,
    isCommunicationAccordionOpen,
    setIsCommunicationAccordionOpen,
    calculations,
    timeline,
    getActivePreviewEmailContent,
    handleConfirmAccept,
    handleConfirmDecline,
    handleResetToPending,
    handleDispatchCounter
  };
};
