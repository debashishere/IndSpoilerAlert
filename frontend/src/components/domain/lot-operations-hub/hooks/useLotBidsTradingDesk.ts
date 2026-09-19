import { useState, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../../../../store';
import {
  setLotHubData,
  setInventoryList,
  setSelectedLot,
  setSelectedBidForNegotiation as setReduxSelectedBidForNegotiation,
} from '../../../../store/slices/inventorySlice';
import { InventoryService } from '../../../../services/inventoryService';
import { getBidStatusInfo } from '../constants/lotPricingCalculations';
import type { BidFilterStatus, FeedbackToastState } from '../types/lotOperations.types';

interface UseLotBidsTradingDeskParams {
  lot: any;
  bidsList?: any[];
  negotiationBids?: any[];
  negotiationBidsLoading?: boolean;
  selectedBidForNegotiation?: any;
  setSelectedBidForNegotiation?: (bid: any) => void;
  inventoryList?: any[];
  selectedLot?: any;
  onSelectBid?: (bid: any) => void;
  onOpenBidInspector?: (bid: any) => void;
  isBidInspectorOpen?: boolean;
  setIsBidInspectorOpen?: (open: boolean) => void;
  onDeclineBid?: (bidId: string, payload: { reason: string; rationale?: string }) => Promise<void> | void;
  onResetBid?: (bidId: string) => Promise<void> | void;
  onCounterBid?: (bidId: string, payload: { price: number; quantity: number; message: string }) => Promise<void | any> | void | any;
  onAcceptBid?: (bidId: string, payload?: any) => Promise<void | any> | void | any;
  setFeedbackToast: (toast: FeedbackToastState | null) => void;
}

export function useLotBidsTradingDesk({
  lot,
  bidsList = [],
  negotiationBids = [],
  negotiationBidsLoading,
  selectedBidForNegotiation,
  setSelectedBidForNegotiation: propSetSelectedBidForNegotiation,
  inventoryList = [],
  selectedLot,
  onSelectBid,
  onOpenBidInspector,
  isBidInspectorOpen: propIsBidInspectorOpen,
  setIsBidInspectorOpen: propSetIsBidInspectorOpen,
  onDeclineBid,
  onResetBid,
  onCounterBid,
  onAcceptBid,
  setFeedbackToast,
}: UseLotBidsTradingDeskParams) {
  const dispatch = useDispatch<AppDispatch>();

  const [bidStatusFilter, setBidStatusFilter] = useState<BidFilterStatus>('All');
  const [bidSearchQuery, setBidSearchQuery] = useState('');
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [selectedBidForInspector, setSelectedBidForInspector] = useState<any>(null);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // Deduplicate bids
  const allBids = useMemo(() => {
    const rawBids = [...(bidsList || []), ...(negotiationBids || [])];
    const uniqueBidsMap = new Map<string, any>();
    for (const b of rawBids) {
      if (b && b._id) {
        if (!uniqueBidsMap.has(String(b._id))) {
          uniqueBidsMap.set(String(b._id), b);
        } else {
          uniqueBidsMap.set(String(b._id), { ...uniqueBidsMap.get(String(b._id)), ...b });
        }
      }
    }
    return Array.from(uniqueBidsMap.values());
  }, [bidsList, negotiationBids]);

  // Filtered bids
  const filteredBids = useMemo(() => {
    return allBids.filter((bid: any) => {
      const statusInfo = getBidStatusInfo(bid.status, bid);
      if (bidStatusFilter !== 'All' && statusInfo.key !== bidStatusFilter) {
        if (bidStatusFilter === 'Pending' && statusInfo.key === 'Buyer Countered') {
          // Buyer Countered is a sub-state of pending offers
        } else {
          return false;
        }
      }
      if (bidSearchQuery.trim()) {
        const q = bidSearchQuery.toLowerCase();
        const company = (bid.buyerId?.companyName || '').toLowerCase();
        const email = (bid.buyerId?.email || '').toLowerCase();
        const status = (statusInfo.label || '').toLowerCase();
        if (!company.includes(q) && !email.includes(q) && !status.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [allBids, bidStatusFilter, bidSearchQuery]);

  const handleSelectedBidForNegotiationChange = (bid: any) => {
    if (propSetSelectedBidForNegotiation) {
      propSetSelectedBidForNegotiation(bid);
    } else {
      dispatch(setReduxSelectedBidForNegotiation(bid));
    }
  };

  const handleBidRowSelect = (bid: any) => {
    setSelectedBidForInspector(bid);
    handleSelectedBidForNegotiationChange(bid);
    if (onSelectBid) onSelectBid(bid);
    if (onOpenBidInspector) onOpenBidInspector(bid);
    if (propSetIsBidInspectorOpen) propSetIsBidInspectorOpen(true);
    setIsInspectorOpen(true);
  };

  const handleDeclineBidAction = async (payload: { reason: string; rationale: string }, explicitBid?: any) => {
    const targetBid = explicitBid || selectedBidForInspector || selectedBidForNegotiation;
    if (!targetBid?._id) return;
    setIsSubmittingAction(true);
    try {
      let declineRes: any;
      if (onDeclineBid) {
        declineRes = await onDeclineBid(targetBid._id, payload);
      } else {
        declineRes = await InventoryService.declineBid(
          targetBid._id,
          payload.reason,
          payload.rationale,
          (payload as any).templateHtml,
          (payload as any).emailSubject
        );
      }

      const updatedBid = { ...targetBid, status: 'rejected' };
      setSelectedBidForInspector(updatedBid);
      handleSelectedBidForNegotiationChange(updatedBid);

      const updateList = (list: any[]) =>
        (list || []).map((b: any) => (b._id === targetBid._id ? { ...b, status: 'rejected' } : b));

      const newBidsList = updateList(bidsList);
      const newNegotiationBids = updateList(negotiationBids);

      dispatch(
        setLotHubData({
          bidsList: newBidsList,
          negotiationBids: newNegotiationBids,
        })
      );

      const warningMsg = declineRes?.emailDispatch?.warning;
      setFeedbackToast({
        message: warningMsg
          ? `Offer declined (${payload.reason}), but email delivery warning: ${warningMsg}`
          : `Offer declined (${payload.reason}). Recorded in lot CRM timeline.`,
        type: warningMsg ? 'warning' : 'success',
      });
      setTimeout(() => setFeedbackToast(null), 4500);

      if (propSetIsBidInspectorOpen) propSetIsBidInspectorOpen(false);
      setIsInspectorOpen(false);
    } catch (err: any) {
      console.error('Error declining bid:', err);
      setFeedbackToast({
        message: err.message || 'Failed to decline offer',
        type: 'error',
      });
      setTimeout(() => setFeedbackToast(null), 4500);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleResetBidAction = async () => {
    const targetBid = selectedBidForInspector || selectedBidForNegotiation;
    if (!targetBid?._id) return;
    setIsSubmittingAction(true);
    try {
      if (onResetBid) {
        await onResetBid(targetBid._id);
      } else {
        await InventoryService.resetBid(targetBid._id);
      }

      const updatedBid = { ...targetBid, status: 'pending' };
      setSelectedBidForInspector(updatedBid);
      handleSelectedBidForNegotiationChange(updatedBid);

      const updateList = (list: any[]) =>
        (list || []).map((b: any) => (b._id === targetBid._id ? { ...b, status: 'pending' } : b));

      const newBidsList = updateList(bidsList);
      const newNegotiationBids = updateList(negotiationBids);

      dispatch(
        setLotHubData({
          bidsList: newBidsList,
          negotiationBids: newNegotiationBids,
        })
      );

      setFeedbackToast({
        message: 'Bid status reset to pending. Bid is now re-actionable.',
        type: 'success',
      });
      setTimeout(() => setFeedbackToast(null), 4500);
    } catch (err: any) {
      console.error('Error resetting bid:', err);
      setFeedbackToast({
        message: err.message || 'Failed to reset bid',
        type: 'error',
      });
      setTimeout(() => setFeedbackToast(null), 4500);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleCounterBidAction = async (
    payload: { price: number; quantity: number; message: string },
    explicitBid?: any
  ) => {
    const targetBid = explicitBid || selectedBidForInspector || selectedBidForNegotiation;
    if (!targetBid?._id) return;
    setIsSubmittingAction(true);
    try {
      let updatedOffer: any;
      if (onCounterBid) {
        updatedOffer = await onCounterBid(targetBid._id, payload);
      } else {
        updatedOffer = await InventoryService.renegotiateBid(
          targetBid._id,
          payload.price,
          payload.quantity,
          payload.message
        );
      }

      const mergedBid =
        updatedOffer && updatedOffer._id
          ? updatedOffer
          : {
              ...targetBid,
              status: 'countered',
              messages: [
                ...(targetBid.messages || []),
                {
                  sender: 'supplier',
                  content: payload.message,
                  proposedPrice: payload.price,
                  proposedQuantity: payload.quantity,
                  timestamp: new Date().toISOString(),
                },
              ],
            };

      setSelectedBidForInspector(mergedBid);
      handleSelectedBidForNegotiationChange(mergedBid);

      const updateList = (list: any[]) =>
        (list || []).map((b: any) => (b._id === targetBid._id ? mergedBid : b));

      const newBidsList = updateList(bidsList);
      const newNegotiationBids = updateList(negotiationBids);

      dispatch(
        setLotHubData({
          bidsList: newBidsList,
          negotiationBids: newNegotiationBids,
        })
      );

      if (updatedOffer?.emailDispatch && !updatedOffer.emailDispatch.dispatched) {
        setFeedbackToast({
          message: `Counter-offer recorded, but email dispatch warning: ${
            updatedOffer.emailDispatch.warning || 'Mail transport disconnected'
          }`,
          type: 'warning',
        });
      } else {
        setFeedbackToast({
          message: `Counter-offer dispatched ($${payload.price.toFixed(2)}/cs for ${
            payload.quantity
          } cs). Status is now countered.`,
          type: 'success',
        });
      }
      setTimeout(() => setFeedbackToast(null), 4500);

      return updatedOffer;
    } catch (err: any) {
      console.error('Error countering bid:', err);
      setFeedbackToast({
        message: err.message || 'Failed to dispatch counter-offer',
        type: 'error',
      });
      setTimeout(() => setFeedbackToast(null), 4500);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleAcceptBidAction = async (payload?: any, explicitBid?: any) => {
    const targetBid = explicitBid || selectedBidForInspector || selectedBidForNegotiation;
    if (!targetBid?._id) return;
    setIsSubmittingAction(true);
    try {
      let result: any;
      if (onAcceptBid) {
        result = await onAcceptBid(targetBid._id, payload);
      } else {
        result = await InventoryService.acceptBid(targetBid._id, payload);
      }

      const awardedNum = payload?.awardedQuantity || targetBid.quantity;
      const newStatus =
        result?.status || (awardedNum < targetBid.quantity ? 'partially_accepted' : 'fully_accepted');

      const mergedBid = {
        ...targetBid,
        ...(result || {}),
        status: newStatus,
        awardedQty: awardedNum,
        dealId: result?.dealId || result?.award?._id || targetBid.dealId,
      };

      setSelectedBidForInspector(mergedBid);
      handleSelectedBidForNegotiationChange(mergedBid);

      const updateList = (list: any[]) =>
        (list || []).map((b: any) => (b._id === targetBid._id ? mergedBid : b));

      const newBidsList = updateList(bidsList);
      const newNegotiationBids = updateList(negotiationBids);

      dispatch(
        setLotHubData({
          bidsList: newBidsList,
          negotiationBids: newNegotiationBids,
        })
      );

      if (lot && lot.availableQty !== undefined) {
        const updatedAvailable = Math.max(0, lot.availableQty - awardedNum);
        const updatedInventory = (inventoryList || []).map((l: any) =>
          l._id === lot._id ? { ...l, availableQty: updatedAvailable } : l
        );
        dispatch(setInventoryList(updatedInventory));
        if (selectedLot && selectedLot._id === lot._id) {
          dispatch(setSelectedLot({ ...selectedLot, availableQty: updatedAvailable }));
        }
      }

      if (result?.emailDispatch && !result.emailDispatch.dispatched) {
        setFeedbackToast({
          message: `Offer accepted, but email dispatch warning: ${
            result.emailDispatch.warning || 'Mail transport disconnected'
          }`,
          type: 'warning',
        });
      } else {
        setFeedbackToast({
          message: `Offer successfully accepted (${awardedNum} cases awarded). Settlement email dispatched.`,
          type: 'success',
        });
      }
      setTimeout(() => setFeedbackToast(null), 4500);
      return result;
    } catch (err: any) {
      console.error('Error accepting bid:', err);
      setFeedbackToast({
        message: err.message || 'Failed to accept bid',
        type: 'error',
      });
      setTimeout(() => setFeedbackToast(null), 4500);
      throw err;
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleResendSettlementAction = async (bidId: string) => {
    setIsSubmittingAction(true);
    try {
      setFeedbackToast({
        message: 'Resending settlement communications to buyer...',
        type: 'info',
      });
      const result = await InventoryService.resendSettlementCommunications(bidId);
      if (result?.emailDispatch && !result.emailDispatch.dispatched) {
        setFeedbackToast({
          message: `Settlement email resend warning: ${
            result.emailDispatch.warning || 'Mail transport disconnected'
          }`,
          type: 'warning',
        });
      } else {
        setFeedbackToast({
          message: 'Settlement communications successfully resent to buyer!',
          type: 'success',
        });
      }
    } catch (err: any) {
      setFeedbackToast({
        message: err.message || 'Failed to resend settlement communications',
        type: 'error',
      });
    } finally {
      setIsSubmittingAction(false);
      setTimeout(() => setFeedbackToast(null), 4000);
    }
  };

  return {
    allBids,
    filteredBids,
    bidStatusFilter,
    setBidStatusFilter,
    bidSearchQuery,
    setBidSearchQuery,
    isInspectorOpen: propIsBidInspectorOpen !== undefined ? propIsBidInspectorOpen : isInspectorOpen,
    setIsInspectorOpen: (open: boolean) => {
      if (propSetIsBidInspectorOpen) propSetIsBidInspectorOpen(open);
      setIsInspectorOpen(open);
    },
    selectedBidForInspector: selectedBidForInspector || selectedBidForNegotiation,
    isSubmittingAction,
    negotiationBidsLoading,
    handleBidRowSelect,
    handleDeclineBidAction,
    handleResetBidAction,
    handleCounterBidAction,
    handleAcceptBidAction,
    handleResendSettlementAction,
  };
}
