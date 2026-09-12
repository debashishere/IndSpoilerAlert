import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import {
  setSelectedLotHubId,
  setLotHubSubTab,
  setSliderDays as setReduxSliderDays,
  setSliderQty as setReduxSliderQty,
  setExpandedBidId as setReduxExpandedBidId,
  setPartialAwardCases as setReduxPartialAwardCases,
  setSelectedBidForNegotiation as setReduxSelectedBidForNegotiation,
  setNegotiationChatInput as setReduxNegotiationChatInput,
  setCounterOfferPrice as setReduxCounterOfferPrice,
  setCounterOfferQty as setReduxCounterOfferQty,
  setActivityFilter as setReduxActivityFilter,
  setSelectedFormType as setReduxSelectedFormType,
  setActivityContentInput as setReduxActivityContentInput,
  openAwardModal,
  setSelectedLot,
  setLotHubData,
  setInventoryList,
} from '../store/slices/inventorySlice';
import { setActiveTab } from '../store/slices/coreSlice';
import {
  enableLotBiddingThunk,
  donateLotThunk,
  recycleLotThunk,
  fetchPricingThunk,
  updateProductAllergensThunk,
  updateLotComplianceThunk,
  uploadComplianceDocThunk,
  sendNegotiationMessageThunk,
  createLotActivityThunk,
  InventoryService,
} from '../services/inventoryService';
import BidActionInspectorModal from './BidActionInspectorModal';
import { 
  ArrowLeft, 
  Box, 
  Clock, 
  Calendar, 
  FileText, 
  ShieldCheck, 
  Award, 
  MessageSquare, 
  Send, 
  HeartHandshake, 
  Recycle, 
  Layers,
  Activity,
  Users,
  AlertTriangle,
  Search,
  CheckCircle2
} from 'lucide-react';

export interface LotOperationsHubViewProps {
  lot?: any;
  onBack?: () => void;
  subTab?: 'details' | 'bids' | 'activities';
  setSubTab?: (tab: 'details' | 'bids' | 'activities') => void;
  
  // Bid Selection / Inspector
  onSelectBid?: (bid: any) => void;
  onOpenBidInspector?: (bid: any) => void;
  isBidInspectorOpen?: boolean;
  setIsBidInspectorOpen?: (open: boolean) => void;
  onDeclineBid?: (bidId: string, payload: { reason: string; rationale?: string }) => Promise<void> | void;
  onResetBid?: (bidId: string) => Promise<void> | void;
  onCounterBid?: (bidId: string, payload: { price: number; quantity: number; message: string }) => Promise<void | any> | void | any;
  
  // Handlers & state from parent
  onEnableBidding?: (lot: any) => void;
  onDonate?: (lot: any) => void;
  onRecycle?: (lot: any) => void;
  onPublishMarketplace?: (lot: any) => void;
  
  // Details state
  drawerLoading?: boolean;
  txSuccess?: boolean;
  txDetails?: any;
  riskProfile?: any;
  handleSuggestPricing?: (lot: any) => void;
  suggestingPricing?: boolean;
  recommendedBuyers?: any[];
  buyersLoading?: boolean;
  complianceFile?: File | null;
  setComplianceFile?: (file: File | null) => void;
  handleUploadComplianceDoc?: () => void;
  handleUpdateLotCompliance?: (lotId: string, updates: any) => void;
  sliderDays?: number;
  setSliderDays?: (val: number) => void;
  sliderQty?: number;
  setSliderQty?: (val: number) => void;
  onSlidersCommit?: (days: number, qty: number) => void;
  pricingData?: any;
  handleUpdateProductAllergens?: (productId: string, newAllergens: string[]) => Promise<void>;
  
  // Bids state
  bidsList?: any[];
  expandedBidId?: string | null;
  setExpandedBidId?: (id: string | null) => void;
  handleAwardBid?: (bidId: string, partialCases?: number) => void;
  awardingBidId?: string | null;
  partialAwardCases?: number | '';
  setPartialAwardCases?: (cases: number | '') => void;
  negotiationBids?: any[];
  negotiationBidsLoading?: boolean;
  selectedBidForNegotiation?: any;
  setSelectedBidForNegotiation?: (bid: any) => void;
  negotiationChatInput?: string;
  setNegotiationChatInput?: (val: string) => void;
  handleSendNegotiationMessage?: () => void;
  counterOfferPrice?: number | '';
  setCounterOfferPrice?: (val: number | '') => void;
  counterOfferQty?: number | '';
  setCounterOfferQty?: (val: number | '') => void;
  handleSendCounterOffer?: () => void;
  
  // Activities state
  lotActivities?: any[];
  activityFilter?: string;
  setActivityFilter?: (val: string) => void;
  activityTypeInput?: string;
  setActivityTypeInput?: (val: string) => void;
  activityContentInput?: string;
  setActivityContentInput?: (val: string) => void;
  handleCreateLotActivity?: () => void;
}

export const LotOperationsHubView: React.FC<LotOperationsHubViewProps> = (props) => {
  const dispatch = useDispatch<AppDispatch>();
  const reduxInventory = useSelector((state: RootState) => state.inventory);
  const { selectedLotHubId, lotHubSubTab, lotHubData, selectedLot, inventoryList } = reduxInventory;

  const [localComplianceFile, setLocalComplianceFile] = useState<File | null>(null);

  // Compute resolved values (preferring passed props, falling back to Redux state)
  const lot = props.lot || selectedLot || inventoryList.find((l: any) => l._id === selectedLotHubId);
  const subTab = props.subTab || lotHubSubTab || 'details';
  const drawerLoading = props.drawerLoading ?? lotHubData.loading;
  const riskProfile = props.riskProfile ?? lotHubData.riskProfile;
  const suggestingPricing = props.suggestingPricing ?? lotHubData.pricingLoading;
  const recommendedBuyers = props.recommendedBuyers ?? lotHubData.buyerMatches ?? [];
  const buyersLoading = props.buyersLoading ?? lotHubData.buyersLoading;
  const complianceFile = props.complianceFile !== undefined ? props.complianceFile : localComplianceFile;
  const sliderDays = props.sliderDays ?? lotHubData.sliderDays ?? 30;
  const sliderQty = props.sliderQty ?? lotHubData.sliderQty ?? (lot?.quantityCases || 100);
  const pricingData = props.pricingData ?? lotHubData.pricingData;
  const bidsList = props.bidsList ?? lotHubData.bidsList ?? [];
  const expandedBidId = props.expandedBidId !== undefined ? props.expandedBidId : lotHubData.expandedBidId;
  const awardingBidId = props.awardingBidId ?? (lotHubData.txLoading ? lotHubData.expandedBidId : null);
  const partialAwardCases = props.partialAwardCases !== undefined ? props.partialAwardCases : lotHubData.partialAwardCases;
  const negotiationBids = props.negotiationBids ?? lotHubData.negotiationBids ?? [];
  const negotiationBidsLoading = props.negotiationBidsLoading ?? lotHubData.negotiationBidsLoading;
  const selectedBidForNegotiation = props.selectedBidForNegotiation !== undefined ? props.selectedBidForNegotiation : lotHubData.selectedBidForNegotiation;
  const negotiationChatInput = props.negotiationChatInput !== undefined ? props.negotiationChatInput : lotHubData.negotiationChatInput;
  const counterOfferPrice = props.counterOfferPrice !== undefined ? props.counterOfferPrice : lotHubData.counterOfferPrice;
  const counterOfferQty = props.counterOfferQty !== undefined ? props.counterOfferQty : lotHubData.counterOfferQty;
  const lotActivities = props.lotActivities ?? lotHubData.lotActivities ?? [];
  const activityFilter = props.activityFilter ?? lotHubData.activityFilter ?? 'all';
  const activityTypeInput = props.activityTypeInput ?? lotHubData.selectedFormType ?? 'Email';
  const activityContentInput = props.activityContentInput !== undefined ? props.activityContentInput : lotHubData.activityContentInput;

  const [bidStatusFilter, setBidStatusFilter] = useState<'All' | 'Pending' | 'Countered' | 'Awarded' | 'Declined'>('All');
  const [bidSearchQuery, setBidSearchQuery] = useState('');
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [selectedBidForInspector, setSelectedBidForInspector] = useState<any>(null);
  const [feedbackToast, setFeedbackToast] = useState<{ message: string; type: 'success' | 'info' | 'error' | 'warning' } | null>(null);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const isSubmittingDecline = isSubmittingAction;
  const setIsSubmittingDecline = setIsSubmittingAction;

  const getBidStatusInfo = (rawStatus?: string) => {
    const s = (rawStatus || '').toLowerCase();
    if (s === 'countered') {
      return { label: 'Countered', key: 'Countered', className: 'badge-outline-primary', bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: 'rgba(59, 130, 246, 0.3)' };
    }
    if (s === 'fully_accepted' || s === 'partially_accepted' || s === 'awarded' || s === 'accepted') {
      return { label: 'Awarded', key: 'Awarded', className: 'badge-success', bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: 'rgba(16, 185, 129, 0.3)' };
    }
    if (s === 'rejected' || s === 'declined') {
      return { label: 'Declined', key: 'Declined', className: 'badge-danger', bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' };
    }
    return { label: 'Pending', key: 'Pending', className: 'badge-warning', bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' };
  };

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
  const allBids = Array.from(uniqueBidsMap.values());

  const filteredBids = allBids.filter((bid: any) => {
    const statusInfo = getBidStatusInfo(bid.status);
    if (bidStatusFilter !== 'All' && statusInfo.key !== bidStatusFilter) {
      return false;
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

  const handleSelectedBidForNegotiationChange = (bid: any) => {
    if (props.setSelectedBidForNegotiation) props.setSelectedBidForNegotiation(bid);
    else dispatch(setReduxSelectedBidForNegotiation(bid));
  };

  const handleBidRowSelect = (bid: any) => {
    setSelectedBidForInspector(bid);
    handleSelectedBidForNegotiationChange(bid);
    if (props.onSelectBid) props.onSelectBid(bid);
    if (props.onOpenBidInspector) props.onOpenBidInspector(bid);
    if (props.setIsBidInspectorOpen) props.setIsBidInspectorOpen(true);
    setIsInspectorOpen(true);
  };

  const handleDeclineBidAction = async (payload: { reason: string; rationale: string }, explicitBid?: any) => {
    const targetBid = explicitBid || selectedBidForInspector || selectedBidForNegotiation;
    if (!targetBid?._id) return;
    setIsSubmittingDecline(true);
    try {
      if (props.onDeclineBid) {
        await props.onDeclineBid(targetBid._id, payload);
      } else {
        await InventoryService.declineBid(targetBid._id, payload.reason, payload.rationale);
      }

      const updatedBid = { ...targetBid, status: 'rejected' };
      setSelectedBidForInspector(updatedBid);
      handleSelectedBidForNegotiationChange(updatedBid);

      const updateList = (list: any[]) =>
        (list || []).map((b: any) => (b._id === targetBid._id ? { ...b, status: 'rejected' } : b));

      const newBidsList = updateList(bidsList);
      const newNegotiationBids = updateList(negotiationBids);

      dispatch(setLotHubData({
        bidsList: newBidsList,
        negotiationBids: newNegotiationBids
      }));

      setFeedbackToast({
        message: `Offer declined (${payload.reason}). Recorded in lot CRM timeline.`,
        type: 'success'
      });
      setTimeout(() => setFeedbackToast(null), 4500);

      if (props.setIsBidInspectorOpen) props.setIsBidInspectorOpen(false);
      setIsInspectorOpen(false);
    } catch (err: any) {
      console.error('Error declining bid:', err);
      setFeedbackToast({
        message: err.message || 'Failed to decline offer',
        type: 'error'
      });
      setTimeout(() => setFeedbackToast(null), 4500);
    } finally {
      setIsSubmittingDecline(false);
    }
  };

  const handleResetBidAction = async () => {
    const targetBid = selectedBidForInspector || selectedBidForNegotiation;
    if (!targetBid?._id) return;
    setIsSubmittingDecline(true);
    try {
      if (props.onResetBid) {
        await props.onResetBid(targetBid._id);
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

      dispatch(setLotHubData({
        bidsList: newBidsList,
        negotiationBids: newNegotiationBids
      }));

      setFeedbackToast({
        message: 'Bid status reset to pending. Bid is now re-actionable.',
        type: 'success'
      });
      setTimeout(() => setFeedbackToast(null), 4500);
    } catch (err: any) {
      console.error('Error resetting bid:', err);
      setFeedbackToast({
        message: err.message || 'Failed to reset bid',
        type: 'error'
      });
      setTimeout(() => setFeedbackToast(null), 4500);
    } finally {
      setIsSubmittingDecline(false);
    }
  };

  const handleCounterBidAction = async (payload: { price: number; quantity: number; message: string }, explicitBid?: any) => {
    const targetBid = explicitBid || selectedBidForInspector || selectedBidForNegotiation;
    if (!targetBid?._id) return;
    setIsSubmittingDecline(true);
    try {
      let updatedOffer: any;
      if (props.onCounterBid) {
        updatedOffer = await props.onCounterBid(targetBid._id, payload);
      } else {
        updatedOffer = await InventoryService.renegotiateBid(targetBid._id, payload.price, payload.quantity, payload.message);
      }

      const mergedBid = updatedOffer && updatedOffer._id ? updatedOffer : {
        ...targetBid,
        status: 'countered',
        messages: [
          ...(targetBid.messages || []),
          {
            sender: 'supplier',
            content: payload.message,
            proposedPrice: payload.price,
            proposedQuantity: payload.quantity,
            timestamp: new Date().toISOString()
          }
        ]
      };

      setSelectedBidForInspector(mergedBid);
      handleSelectedBidForNegotiationChange(mergedBid);

      const updateList = (list: any[]) =>
        (list || []).map((b: any) => (b._id === targetBid._id ? mergedBid : b));

      const newBidsList = updateList(bidsList);
      const newNegotiationBids = updateList(negotiationBids);

      dispatch(setLotHubData({
        bidsList: newBidsList,
        negotiationBids: newNegotiationBids
      }));

      if (updatedOffer?.emailDispatch && !updatedOffer.emailDispatch.dispatched) {
        setFeedbackToast({
          message: `Counter-offer recorded, but email dispatch warning: ${updatedOffer.emailDispatch.warning || 'Mail transport disconnected'}`,
          type: 'warning'
        });
      } else {
        setFeedbackToast({
          message: `Counter-offer dispatched ($${payload.price.toFixed(2)}/cs for ${payload.quantity} cs). Status is now countered.`,
          type: 'success'
        });
      }
      setTimeout(() => setFeedbackToast(null), 4500);

      // In-Situ Negotiation Continuity: Retain open inspector session
      return updatedOffer;
    } catch (err: any) {
      console.error('Error countering bid:', err);
      setFeedbackToast({
        message: err.message || 'Failed to dispatch counter-offer',
        type: 'error'
      });
      setTimeout(() => setFeedbackToast(null), 4500);
    } finally {
      setIsSubmittingDecline(false);
    }
  };

  const handleAcceptBidAction = async (payload?: any, explicitBid?: any) => {
    const targetBid = explicitBid || selectedBidForInspector || selectedBidForNegotiation;
    if (!targetBid?._id) return;
    setIsSubmittingDecline(true);
    try {
      let result: any;
      if (props.onAcceptBid) {
        result = await props.onAcceptBid(targetBid._id, payload);
      } else {
        result = await InventoryService.acceptBid(targetBid._id, payload);
      }

      const awardedNum = payload?.awardedQuantity || targetBid.quantity;
      const newStatus = result?.status || (awardedNum < targetBid.quantity ? 'partially_accepted' : 'fully_accepted');

      const mergedBid = {
        ...targetBid,
        ...(result || {}),
        status: newStatus,
        awardedQty: awardedNum,
        dealId: result?.dealId || result?.award?._id || targetBid.dealId
      };

      setSelectedBidForInspector(mergedBid);
      handleSelectedBidForNegotiationChange(mergedBid);

      const updateList = (list: any[]) =>
        (list || []).map((b: any) => (b._id === targetBid._id ? mergedBid : b));

      const newBidsList = updateList(bidsList);
      const newNegotiationBids = updateList(negotiationBids);

      dispatch(setLotHubData({
        bidsList: newBidsList,
        negotiationBids: newNegotiationBids
      }));

      // Update lot availableQty in Redux inventoryList if present
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
          message: `Offer accepted, but email dispatch warning: ${result.emailDispatch.warning || 'Mail transport disconnected'}`,
          type: 'warning'
        });
      } else {
        setFeedbackToast({
          message: `Offer successfully accepted (${awardedNum} cases awarded). Settlement email dispatched.`,
          type: 'success'
        });
      }
      setTimeout(() => setFeedbackToast(null), 4500);
      return result;
    } catch (err: any) {
      console.error('Error accepting bid:', err);
      setFeedbackToast({
        message: err.message || 'Failed to accept bid',
        type: 'error'
      });
      setTimeout(() => setFeedbackToast(null), 4500);
      throw err;
    } finally {
      setIsSubmittingDecline(false);
    }
  };

  const handleResendSettlementAction = async (bidId: string) => {
    setIsSubmittingAction(true);
    try {
      setFeedbackToast({
        message: 'Resending settlement communications to buyer...',
        type: 'info'
      });
      const result = await InventoryService.resendSettlementCommunications(bidId);
      if (result?.emailDispatch && !result.emailDispatch.dispatched) {
        setFeedbackToast({
          message: `Settlement email resend warning: ${result.emailDispatch.warning || 'Mail transport disconnected'}`,
          type: 'warning'
        });
      } else {
        setFeedbackToast({
          message: 'Settlement communications successfully resent to buyer!',
          type: 'success'
        });
      }
    } catch (err: any) {
      setFeedbackToast({
        message: err.message || 'Failed to resend settlement communications',
        type: 'error'
      });
    } finally {
      setIsSubmittingAction(false);
      setTimeout(() => setFeedbackToast(null), 4000);
    }
  };

  const returnTab = useSelector((state: RootState) => state.core?.returnTab);
  const backButtonLabel = returnTab === 'ingestion' ? 'Back to Ingestion Table' : 'Back to Inventory List';

  const handleBack = () => {
    if (props.onBack) {
      props.onBack();
    } else {
      dispatch(setSelectedLotHubId(null));
      dispatch(setSelectedLot(null));
      dispatch(setActiveTab((returnTab || 'inventory') as any));
    }
  };

  const handleSubTabChange = (tab: 'details' | 'bids' | 'activities') => {
    if (props.setSubTab) {
      props.setSubTab(tab);
    } else {
      dispatch(setLotHubSubTab(tab));
    }
  };

  const handleEnableBiddingAction = (targetLot: any) => {
    if (props.onEnableBidding) {
      props.onEnableBidding(targetLot);
    } else {
      dispatch(enableLotBiddingThunk(targetLot) as any);
    }
  };

  const handleDonateAction = (targetLot: any) => {
    if (props.onDonate) {
      props.onDonate(targetLot);
    } else {
      dispatch(donateLotThunk(targetLot._id) as any);
    }
  };

  const handleRecycleAction = (targetLot: any) => {
    if (props.onRecycle) {
      props.onRecycle(targetLot);
    } else {
      dispatch(recycleLotThunk(targetLot._id) as any);
    }
  };

  const handleSuggestPricingAction = (targetLot: any) => {
    if (props.handleSuggestPricing) {
      props.handleSuggestPricing(targetLot);
    } else if (targetLot.opportunity?._id) {
      dispatch(fetchPricingThunk({
        opportunityId: targetLot.opportunity._id,
        daysRemaining: typeof sliderDays === 'number' ? sliderDays : 30,
        quantityCases: typeof sliderQty === 'number' ? sliderQty : (targetLot.quantityCases || 100)
      }) as any);
    }
  };

  const handleSliderDaysChange = (val: number) => {
    if (props.setSliderDays) props.setSliderDays(val);
    else dispatch(setReduxSliderDays(val));
  };

  const handleSliderQtyChange = (val: number) => {
    if (props.setSliderQty) props.setSliderQty(val);
    else dispatch(setReduxSliderQty(val));
  };

  const handleSlidersCommitAction = (days: number, qty: number) => {
    if (props.onSlidersCommit) {
      props.onSlidersCommit(days, qty);
    } else if (lot?.opportunity?._id) {
      dispatch(fetchPricingThunk({
        opportunityId: lot.opportunity._id,
        daysRemaining: days,
        quantityCases: qty
      }) as any);
    }
  };

  const handleUpdateProductAllergensAction = async (productId: string, newAllergens: string[]) => {
    if (props.handleUpdateProductAllergens) {
      await props.handleUpdateProductAllergens(productId, newAllergens);
    } else {
      await dispatch(updateProductAllergensThunk({ productId, allergens: newAllergens }) as any);
    }
  };

  const handleUpdateLotComplianceAction = (lotId: string, updates: any) => {
    if (props.handleUpdateLotCompliance) {
      props.handleUpdateLotCompliance(lotId, updates);
    } else {
      dispatch(updateLotComplianceThunk({ lotId, updates }) as any);
    }
  };

  const handleSetComplianceFile = (file: File | null) => {
    if (props.setComplianceFile) props.setComplianceFile(file);
    else setLocalComplianceFile(file);
  };

  const handleUploadComplianceDocAction = () => {
    if (props.handleUploadComplianceDoc) {
      props.handleUploadComplianceDoc();
    } else if (complianceFile && lot?._id) {
      dispatch(uploadComplianceDocThunk({
        lotId: lot._id,
        docType: 'COA',
        file: complianceFile
      }) as any).then(() => {
        handleSetComplianceFile(null);
      });
    }
  };

  const handleExpandedBidIdChange = (id: string | null) => {
    if (props.setExpandedBidId) props.setExpandedBidId(id);
    else dispatch(setReduxExpandedBidId(id));
  };

  const handlePartialAwardCasesChange = (cases: number | '') => {
    if (props.setPartialAwardCases) props.setPartialAwardCases(cases);
    else dispatch(setReduxPartialAwardCases(cases));
  };

  const handleAwardBidAction = (bidId: string, partialCases?: number) => {
    if (props.handleAwardBid) {
      props.handleAwardBid(bidId, partialCases);
    } else {
      const bidListToSearch = bidsList.length > 0 ? bidsList : negotiationBids;
      const targetBid = bidListToSearch.find((b: any) => b._id === bidId);
      if (targetBid && lot) {
        const qtyToAward = typeof partialCases === 'number' ? partialCases : (targetBid.quantityCases || targetBid.quantity || lot.availableQty || 1);
        const bidWithQty = { ...targetBid, quantity: qtyToAward, price: targetBid.bidPricePerCase ?? targetBid.price ?? 0 };
        dispatch(openAwardModal({ bid: bidWithQty, lot }));
      }
    }
  };



  const handleNegotiationChatInputChange = (val: string) => {
    if (props.setNegotiationChatInput) props.setNegotiationChatInput(val);
    else dispatch(setReduxNegotiationChatInput(val));
  };

  const handleSendNegotiationMessageAction = () => {
    if (props.handleSendNegotiationMessage) {
      props.handleSendNegotiationMessage();
    } else if (selectedBidForNegotiation?._id && negotiationChatInput.trim() && lot?._id) {
      const msgContent = negotiationChatInput.trim();
      dispatch(setReduxNegotiationChatInput(''));
      dispatch(sendNegotiationMessageThunk({
        bidId: selectedBidForNegotiation._id,
        payload: { sender: 'Supplier', content: msgContent },
        lotId: lot._id
      }) as any).then((res: any) => {
        if (res?.payload) {
          dispatch(setReduxSelectedBidForNegotiation(res.payload));
        }
      });
    }
  };

  const handleCounterOfferPriceChange = (val: number | '') => {
    if (props.setCounterOfferPrice) props.setCounterOfferPrice(val);
    else dispatch(setReduxCounterOfferPrice(val));
  };

  const handleCounterOfferQtyChange = (val: number | '') => {
    if (props.setCounterOfferQty) props.setCounterOfferQty(val);
    else dispatch(setReduxCounterOfferQty(val));
  };

  const handleSendCounterOfferAction = () => {
    if (props.handleSendCounterOffer) {
      props.handleSendCounterOffer();
    } else if (selectedBidForNegotiation?._id && typeof counterOfferPrice === 'number' && lot?._id) {
      const proposedQty = typeof counterOfferQty === 'number' ? counterOfferQty : (selectedBidForNegotiation.quantityCases || 100);
      dispatch(sendNegotiationMessageThunk({
        bidId: selectedBidForNegotiation._id,
        payload: {
          sender: 'Supplier',
          content: `Counter-offer proposed at $${counterOfferPrice}/cs for ${proposedQty} cases.`,
          proposedPrice: counterOfferPrice,
          proposedQuantity: proposedQty
        },
        lotId: lot._id
      }) as any).then((res: any) => {
        if (res?.payload) {
          dispatch(setReduxSelectedBidForNegotiation(res.payload));
          dispatch(setReduxCounterOfferPrice(''));
        }
      });
    }
  };

  const handleActivityFilterChange = (val: string) => {
    if (props.setActivityFilter) props.setActivityFilter(val);
    else dispatch(setReduxActivityFilter(val));
  };

  const handleActivityTypeInputChange = (val: string) => {
    if (props.setActivityTypeInput) props.setActivityTypeInput(val);
    else dispatch(setReduxSelectedFormType(val));
  };

  const handleActivityContentInputChange = (val: string) => {
    if (props.setActivityContentInput) props.setActivityContentInput(val);
    else dispatch(setReduxActivityContentInput(val));
  };

  const handleCreateLotActivityAction = () => {
    if (props.handleCreateLotActivity) {
      props.handleCreateLotActivity();
    } else if (lot?._id && activityContentInput.trim()) {
      const content = activityContentInput.trim();
      dispatch(setReduxActivityContentInput(''));
      dispatch(createLotActivityThunk({
        lotId: lot._id,
        payload: {
          type: activityTypeInput || 'Email',
          content,
          author: 'Supplier Account'
        }
      }) as any);
    }
  };

  if (!lot) {
    return (
      <div className="lot-hub-container" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <p style={{ color: 'hsl(var(--text-muted))' }}>No inventory lot selected. Please select an item from the Inventory tab.</p>
        <button className="btn btn-secondary" style={{ marginTop: '16px' }} onClick={handleBack}>
          <ArrowLeft size={16} /> {backButtonLabel}
        </button>
      </div>
    );
  }

  const calculateDaysRemaining = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const getPricingForDay = (t: number, qty: number, originalPrice: number, category: string) => {
    const elasticities: Record<string, number> = {
      "Dairy": -1.8,
      "Produce": -2.2,
      "Meat": -2.0,
      "Dry Goods": -1.2,
      "Beverages": -1.5
    };
    const elasticity = elasticities[category] || -1.5;
    const k = 4.0 * Math.abs(elasticity);

    let bestDiscount = 0.05;
    let maxRev = -1;
    const d_half = Math.max(0.1, Math.min(0.8, 0.8 - 0.7 * (t / 30.0)));

    for (let d = 0; d <= 0.95; d += 0.01) {
      const price = originalPrice * (1.0 - d);
      let sellThrough = 1.0 / (1.0 + Math.exp(-k * (d - d_half)));
      if (qty > 500) sellThrough *= 0.90;
      else if (qty > 100) sellThrough *= 0.95;
      sellThrough = Math.min(0.99, Math.max(0.01, sellThrough));
      const revenue = qty * price * sellThrough;
      if (revenue > maxRev) {
        maxRev = revenue;
        bestDiscount = d;
      }
    }

    const price = originalPrice * (1.0 - bestDiscount);
    return { discount: bestDiscount, price, revenue: maxRev };
  };

  const renderPricingPlot = () => {
    const originalPrice = lot.costPerCase || lot.productId?.standardSellPrice || 0;
    const category = lot.productId?.category || "Dry Goods";
    const currentQty = typeof sliderQty === 'number' ? sliderQty : lot.quantityCases;
    const currentDays = typeof sliderDays === 'number' ? sliderDays : daysRemaining;
    
    // Generate data points
    const points: { t: number; price: number; revenue: number }[] = [];
    const maxDays = 45;
    let maxRev = 0.01;
    
    for (let t = 0; t <= maxDays; t += 5) {
      const res = getPricingForDay(t, currentQty, originalPrice, category);
      points.push({ t, price: res.price, revenue: res.revenue });
      if (res.revenue > maxRev) {
        maxRev = res.revenue;
      }
    }
    
    // SVG Dimensions
    const width = 360;
    const height = 150;
    const paddingLeft = 45;
    const paddingRight = 15;
    const paddingTop = 15;
    const paddingBottom = 25;
    
    const plotWidth = width - paddingLeft - paddingRight;
    const plotHeight = height - paddingTop - paddingBottom;
    
    // Map data points to SVG coordinates
    const getX = (t: number) => paddingLeft + (t / maxDays) * plotWidth;
    const getYPrice = (price: number) => paddingBottom + plotHeight - (price / (originalPrice || 1)) * plotHeight + paddingTop;
    const getYRev = (rev: number) => paddingBottom + plotHeight - (rev / maxRev) * plotHeight + paddingTop;
    
    // Build path strings
    let pricePath = "";
    let revPath = "";
    
    points.forEach((pt, idx) => {
      const x = getX(pt.t);
      const yP = getYPrice(pt.price);
      const yR = getYRev(pt.revenue);
      
      if (idx === 0) {
        pricePath = `M ${x} ${yP}`;
        revPath = `M ${x} ${yR}`;
      } else {
        pricePath += ` L ${x} ${yP}`;
        revPath += ` L ${x} ${yR}`;
      }
    });
    
    // Current slider days X coordinate
    const currentX = getX(currentDays);
    
    return (
      <div className="pricing-plot-container" style={{ marginTop: '20px', padding: '16px', backgroundColor: 'hsl(var(--bg-main))', borderRadius: '8px', border: '1px solid hsl(var(--border-color))' }}>
        <h5 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '12px', color: 'hsl(var(--text-secondary))', display: 'flex', justifyContent: 'space-between' }}>
          <span>Cleared Price & Yield Decay Curves</span>
          <span style={{ fontSize: '0.75rem', fontWeight: 'normal', color: 'hsl(var(--text-muted))' }}>X-Axis: Days to Expiry</span>
        </h5>
        
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
          {/* Grid lines */}
          <line x1={paddingLeft} y1={paddingTop} x2={paddingLeft} y2={paddingTop + plotHeight} stroke="hsl(var(--border-color))" strokeDasharray="2,2" />
          <line x1={paddingLeft} y1={paddingTop + plotHeight} x2={paddingLeft + plotWidth} y2={paddingTop + plotHeight} stroke="hsl(var(--border-color))" />
          <line x1={paddingLeft + plotWidth} y1={paddingTop} x2={paddingLeft + plotWidth} y2={paddingTop + plotHeight} stroke="hsl(var(--border-color))" strokeDasharray="2,2" />
          
          {/* Horizontal grid lines */}
          <line x1={paddingLeft} y1={paddingTop} x2={paddingLeft + plotWidth} y2={paddingTop} stroke="hsl(var(--border-color))" strokeOpacity="0.3" strokeDasharray="3,3" />
          <line x1={paddingLeft} y1={paddingTop + plotHeight / 2} x2={paddingLeft + plotWidth} y2={paddingTop + plotHeight / 2} stroke="hsl(var(--border-color))" strokeOpacity="0.3" strokeDasharray="3,3" />
          
          {/* Price curve (Cyan) */}
          <path d={pricePath} fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          
          {/* Revenue curve (Green) */}
          <path d={revPath} fill="none" stroke="hsl(var(--success))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          
          {/* Current Days Dotted Line */}
          <line x1={currentX} y1={paddingTop} x2={currentX} y2={paddingTop + plotHeight} stroke="hsl(var(--warning))" strokeWidth="1.5" strokeDasharray="3,3" />
          
          {/* Current Position Marker Dot for Price */}
          {pricingData && (
            <>
              <circle cx={currentX} cy={getYPrice(pricingData.recommendedPrice)} r="5" fill="hsl(var(--primary))" stroke="white" strokeWidth="1.5" />
              <circle cx={currentX} cy={getYRev(pricingData.expectedRevenue)} r="5" fill="hsl(var(--success))" stroke="white" strokeWidth="1.5" />
            </>
          )}
          
          {/* Axes labels */}
          <text x={paddingLeft} y={paddingTop + plotHeight + 15} fill="hsl(var(--text-muted))" fontSize="9" textAnchor="middle">0d</text>
          <text x={paddingLeft + plotWidth / 2} y={paddingTop + plotHeight + 15} fill="hsl(var(--text-muted))" fontSize="9" textAnchor="middle">22d</text>
          <text x={paddingLeft + plotWidth} y={paddingTop + plotHeight + 15} fill="hsl(var(--text-muted))" fontSize="9" textAnchor="middle">45d</text>
          
          {/* Y Axis labels */}
          <text x={paddingLeft - 8} y={paddingTop + 4} fill="hsl(var(--text-muted))" fontSize="9" textAnchor="end">${(originalPrice || 0).toFixed(0)}</text>
          <text x={paddingLeft - 8} y={paddingTop + plotHeight + 4} fill="hsl(var(--text-muted))" fontSize="9" textAnchor="end">$0</text>
        </svg>
        
        {/* Legend */}
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '12px', fontSize: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '3px', backgroundColor: 'hsl(var(--primary))', borderRadius: '2px' }} />
            <span style={{ color: 'hsl(var(--text-secondary))' }}>Unit Price ($)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '3px', backgroundColor: 'hsl(var(--success))', borderRadius: '2px' }} />
            <span style={{ color: 'hsl(var(--text-secondary))' }}>Expected Yield ($)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '0px', borderTop: '2px dotted hsl(var(--warning))' }} />
            <span style={{ color: 'hsl(var(--text-secondary))' }}>Current ({currentDays}d)</span>
          </div>
        </div>
      </div>
    );
  };



  const daysRemaining = calculateDaysRemaining(lot.expirationDate);
  const totalValue = lot.availableQty * (lot.costPerCase ?? 0);
  const rslRatio = Math.max(0, Math.min(100, Math.round((daysRemaining / (lot.productId?.shelfLifeDays || 30)) * 100)));

  let statusColor = 'hsl(var(--warning))';
  if (lot.status === 'active') statusColor = 'hsl(var(--primary))';
  if (lot.status === 'sold') statusColor = 'hsl(var(--success))';
  if (lot.status === 'donated' || lot.status === 'recycled') statusColor = 'hsl(var(--secondary))';
  if (lot.status === 'expired') statusColor = 'hsl(var(--error))';

  const filteredActivities = lotActivities.filter(act => {
    if (activityFilter === 'all') return true;
    return act.type?.toLowerCase() === activityFilter.toLowerCase();
  });

  return (
    <div className="lot-hub-container">
      {/* Header Banner */}
      <div className="lot-hub-header">
        <div className="lot-hub-title-section">
          <button className="lot-hub-back-btn" onClick={handleBack}>
            <ArrowLeft size={16} /> {backButtonLabel}
          </button>
          <div className="lot-hub-title-row">
            <h1 className="lot-hub-title">{lot.productId?.description || 'Unknown Product'}</h1>
            <span className="badge badge-outline-primary" style={{ fontSize: '0.75rem' }}>
              {lot.productId?.sku}
            </span>
            <span 
              className="badge" 
              style={{ 
                backgroundColor: `${statusColor} / 15%`, 
                color: statusColor, 
                border: `1px solid ${statusColor} / 30%`,
                textTransform: 'uppercase',
                fontWeight: 700
              }}
            >
              {lot.status === 'active' ? 'Active List' : lot.status}
            </span>
            <span className="badge" style={{ backgroundColor: 'hsl(var(--border-color))', color: 'hsl(var(--text-secondary))' }}>
              Lot #{lot.lotNumber}
            </span>
          </div>
        </div>

        {/* Quick Actions Bar */}
        <div className="lot-hub-actions">
          {(lot.status === 'pending' || lot.status === 'active') && (
            <button
              className="btn btn-emerald flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded bg-emerald-600 hover:bg-emerald-500 text-white shadow"
              onClick={() => props.onPublishMarketplace ? props.onPublishMarketplace(lot) : alert('Publishing to Marketplace...')}
              title="Publish sanitized listing to public Buyer Marketplace"
            >
              <Award size={16} /> Publish to Marketplace
            </button>
          )}
          {lot.status === 'pending' && (
            <button className="btn btn-primary" onClick={() => handleEnableBiddingAction(lot)}>
              <Award size={16} /> Enable Bids
            </button>
          )}
          {(lot.status === 'pending' || lot.status === 'active') && (
            <>
              <button className="btn btn-secondary" onClick={() => handleDonateAction(lot)} title="Divert to Charity Network">
                <HeartHandshake size={16} /> Donate
              </button>
              <button className="btn btn-secondary" onClick={() => handleRecycleAction(lot)} title="Schedule Ecological Disposal">
                <Recycle size={16} /> Recycle
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="lot-hub-nav-tabs">
        <button 
          className={`lot-hub-tab-btn ${subTab === 'details' ? 'active' : ''}`}
          onClick={() => handleSubTabChange('details')}
        >
          <Layers size={18} />
          <span>Lot Details & Operations</span>
        </button>
        <button 
          className={`lot-hub-tab-btn ${subTab === 'bids' ? 'active' : ''}`}
          onClick={() => handleSubTabChange('bids')}
        >
          <Award size={18} />
          <span>Bid & Offer (Bidding & Awarding) ({allBids.length || negotiationBids.length || bidsList.length || 0})</span>
        </button>
        <button 
          className={`lot-hub-tab-btn ${subTab === 'activities' ? 'active' : ''}`}
          onClick={() => handleSubTabChange('activities')}
        >
          <Activity size={18} />
          <span>Lot CRM & Audit Timeline ({lotActivities.length || 0})</span>
        </button>
      </div>

      {/* =========================================
          SUB-TAB 1: DETAILS & OPERATIONS
      ========================================= */}
      {subTab === 'details' && (
        <div className="lot-hub-grid">
          {/* Left Column: Overview Metadata & Timestamps */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="lot-hub-card">
              <div className="lot-hub-card-header">
                <div className="lot-hub-card-title"><Box size={18} color="hsl(var(--primary))" /> Inventory Lot Overview</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '0.9rem' }}>
                <div>
                  <span style={{ color: 'hsl(var(--text-muted))', fontSize: '0.8rem' }}>Supplier</span>
                  <div style={{ fontWeight: 600 }}>{lot.supplierId?.name || 'N/A'}</div>
                </div>
                <div>
                  <span style={{ color: 'hsl(var(--text-muted))', fontSize: '0.8rem' }}>Distribution Center</span>
                  <div style={{ fontWeight: 600 }}>{lot.distributionCenterId?.name || 'N/A'}</div>
                </div>
                <div>
                  <span style={{ color: 'hsl(var(--text-muted))', fontSize: '0.8rem' }}>Available Cases</span>
                  <div style={{ fontWeight: 600, color: 'hsl(var(--primary))' }}>{lot.availableQty} / {lot.quantityCases} cases</div>
                </div>
                <div>
                  <span style={{ color: 'hsl(var(--text-muted))', fontSize: '0.8rem' }}>Total Lot Value</span>
                  <div style={{ fontWeight: 600 }}>${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })} (${lot.costPerCase?.toFixed(2)}/cs)</div>
                </div>
                <div>
                  <span style={{ color: 'hsl(var(--text-muted))', fontSize: '0.8rem' }}>Create Date</span>
                  <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={14} color="hsl(var(--text-secondary))" />
                    {lot.createdAt ? new Date(lot.createdAt).toLocaleString() : 'N/A'}
                  </div>
                </div>
                <div>
                  <span style={{ color: 'hsl(var(--text-muted))', fontSize: '0.8rem' }}>Update Date</span>
                  <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={14} color="hsl(var(--text-secondary))" />
                    {lot.updatedAt ? new Date(lot.updatedAt).toLocaleString() : (lot.createdAt ? new Date(lot.createdAt).toLocaleString() : 'N/A')}
                  </div>
                </div>
              </div>

              {/* Expiration Decay Bar */}
              <div style={{ marginTop: '8px', padding: '12px', backgroundColor: 'hsl(var(--bg-main))', borderRadius: '8px', border: '1px solid hsl(var(--border-color))' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
                  <span>Expiration Date: <strong>{new Date(lot.expirationDate).toLocaleDateString()}</strong></span>
                  <strong style={{ color: daysRemaining < 10 ? 'hsl(var(--error))' : 'hsl(var(--text-secondary))' }}>
                    {daysRemaining === 0 ? '❌ Expired' : `${daysRemaining} Days Remaining (${rslRatio}% RSL)`}
                  </strong>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: 'hsl(var(--border-color))', borderRadius: '4px', overflow: 'hidden' }}>
                  <div 
                    style={{ 
                      width: `${rslRatio}%`, 
                      height: '100%', 
                      backgroundColor: rslRatio < 25 ? 'hsl(var(--error))' : rslRatio < 50 ? 'hsl(var(--warning))' : 'hsl(var(--success))' 
                    }} 
                  />
                </div>
              </div>
            </div>

            {/* Product Allergens & Traceability Card */}
            <div className="lot-hub-card">
              <div className="lot-hub-card-header">
                <div className="lot-hub-card-title"><AlertTriangle size={18} color="hsl(var(--warning))" /> Product Allergens & Traceability</div>
              </div>
              <div style={{ fontSize: '0.9rem' }}>
                <div style={{ marginBottom: '10px' }}>
                  <strong style={{ display: 'block', marginBottom: '6px' }}>Active Allergens:</strong>
                  {lot.productId?.allergens && lot.productId.allergens.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {lot.productId.allergens.map((allergen: string) => (
                        <span 
                          key={allergen} 
                          className="badge" 
                          style={{ 
                            backgroundColor: 'hsl(var(--warning) / 10%)', 
                            color: 'hsl(var(--warning))', 
                            border: '1px solid hsl(var(--warning) / 30%)',
                            fontSize: '0.75rem',
                            padding: '2.5px 8px',
                            textTransform: 'capitalize',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          title="Click to remove allergen"
                          onClick={() => {
                            if (lot.productId) {
                              const newAllergens = lot.productId.allergens.filter((a: string) => a !== allergen);
                              handleUpdateProductAllergensAction(lot.productId._id, newAllergens);
                            }
                          }}
                        >
                          {allergen} ✕
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span style={{ color: 'hsl(var(--text-muted))', fontSize: '0.85rem', fontStyle: 'italic' }}>None declared</span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <input 
                    type="text" 
                    placeholder="Add allergen (e.g. milk, soy) + Enter..."
                    style={{ 
                      flex: 1, 
                      padding: '6px 10px', 
                      fontSize: '0.85rem', 
                      borderRadius: '6px', 
                      border: '1px solid hsl(var(--border-color))',
                      backgroundColor: 'hsl(var(--bg-main))',
                      color: 'hsl(var(--text-main))'
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const input = e.currentTarget;
                        const allergen = input.value.trim().toLowerCase();
                        if (allergen && lot.productId) {
                          const currentAllergens = lot.productId.allergens || [];
                          if (!currentAllergens.includes(allergen)) {
                            const newAllergens = [...currentAllergens, allergen];
                            handleUpdateProductAllergensAction(lot.productId._id, newAllergens);
                            input.value = '';
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Compliance Document Management Card */}
            <div className="lot-hub-card">
              <div className="lot-hub-card-header">
                <div className="lot-hub-card-title"><ShieldCheck size={18} color="hsl(var(--secondary))" /> Regulatory Compliance & Documents</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}>
                  <input 
                    type="checkbox" 
                    checked={!!lot.fdaRegulated}
                    onChange={(e) => handleUpdateLotComplianceAction(lot._id, { fdaRegulated: e.target.checked })}
                    style={{ width: '16px', height: '16px' }}
                  />
                  <span>FDA Regulated Lot (Requires COA / Batch Records)</span>
                </label>

                {lot.fdaRegulated && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', backgroundColor: 'hsl(var(--bg-main))', padding: '12px', borderRadius: '8px' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>Min Storage Temp (°F)</span>
                      <input 
                        type="number" 
                        className="form-input" 
                        style={{ marginTop: '4px', padding: '6px 10px', fontSize: '0.85rem' }}
                        value={lot.temperatureMin ?? ''}
                        onChange={(e) => handleUpdateLotComplianceAction(lot._id, { temperatureMin: e.target.value ? Number(e.target.value) : undefined })}
                        placeholder="e.g. 34"
                      />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>Max Storage Temp (°F)</span>
                      <input 
                        type="number" 
                        className="form-input" 
                        style={{ marginTop: '4px', padding: '6px 10px', fontSize: '0.85rem' }}
                        value={lot.temperatureMax ?? ''}
                        onChange={(e) => handleUpdateLotComplianceAction(lot._id, { temperatureMax: e.target.value ? Number(e.target.value) : undefined })}
                        placeholder="e.g. 40"
                      />
                    </div>
                  </div>
                )}

                {/* Upload & List Docs */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'hsl(var(--text-secondary))' }}>Attached Certificates:</span>
                  {(lot.complianceDocs && lot.complianceDocs.length > 0) ? (
                    lot.complianceDocs.map((doc: any, idx: number) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', backgroundColor: 'hsl(var(--bg-main))', borderRadius: '6px', border: '1px solid hsl(var(--border-color))' }}>
                        <FileText size={16} color="hsl(var(--primary))" />
                        <span style={{ flex: 1, fontSize: '0.85rem' }}>{doc.fileName || 'COA Document.pdf'}</span>
                        <span className="badge badge-outline-primary" style={{ fontSize: '0.7rem' }}>{doc.docType || 'COA'}</span>
                      </div>
                    ))
                  ) : (
                    <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', fontStyle: 'italic' }}>No regulatory documentation uploaded yet.</p>
                  )}

                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                    <input 
                      type="file" 
                      id={`coa-upload-${lot._id}`}
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleSetComplianceFile(e.target.files[0]);
                        }
                      }}
                    />
                    <label 
                      htmlFor={`coa-upload-${lot._id}`}
                      className="btn btn-secondary btn-sm"
                      style={{ cursor: 'pointer', flex: 1, textAlign: 'center' }}
                    >
                      {complianceFile ? `Selected: ${complianceFile.name}` : '+ Choose COA / Batch Record'}
                    </label>
                    {complianceFile && (
                      <button className="btn btn-primary btn-sm" onClick={handleUploadComplianceDocAction}>
                        Upload
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: AI Risk Assessment & Pricing */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="lot-hub-card">
              <div className="lot-hub-card-header">
                <div className="lot-hub-card-title"><Activity size={18} color="hsl(var(--primary))" /> AI Distressed Risk Assessment</div>
                {drawerLoading && <span className="badge">Analyzing...</span>}
              </div>
              
              {drawerLoading ? (
                <div style={{ padding: '40px 0', textAlign: 'center' }}>
                  <div className="loader" style={{ margin: '0 auto 12px' }} />
                  <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))' }}>Generating risk & recovery profile...</p>
                </div>
              ) : riskProfile ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ 
                      width: '64px', height: '64px', borderRadius: '50%', 
                      backgroundColor: riskProfile.score > 70 ? 'hsl(var(--error) / 15%)' : 'hsl(var(--primary) / 15%)',
                      color: riskProfile.score > 70 ? 'hsl(var(--error))' : 'hsl(var(--primary))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.4rem', fontWeight: 800, border: `2px solid ${riskProfile.score > 70 ? 'hsl(var(--error))' : 'hsl(var(--primary))'}`
                    }}>
                      {riskProfile.score || 45}
                    </div>
                    <div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'hsl(var(--text-primary))' }}>
                        {riskProfile.urgency || 'High Urgency Action'}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'hsl(var(--text-secondary))' }}>
                        Suggested Route: <strong>{riskProfile.suggestedRoute?.toUpperCase() || 'MARKETPLACE LIQUIDATION'}</strong>
                      </div>
                    </div>
                  </div>

                  {riskProfile.rationale && (
                    <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-secondary))', lineHeight: 1.5, padding: '12px', backgroundColor: 'hsl(var(--bg-main))', borderRadius: '8px' }}>
                      {riskProfile.rationale}
                    </p>
                  )}

                  {/* AI Yield Optimization / Dynamic Pricing Simulator */}
                  <div style={{ borderTop: '1px solid hsl(var(--border-color))', paddingTop: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>AI Dynamic Pricing Simulator</div>
                        <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>Simulate clearances and expected yield decay curves</span>
                      </div>
                      {!pricingData && (
                        <button 
                          className="btn btn-sm btn-primary"
                          onClick={() => handleSuggestPricingAction(lot)}
                          disabled={suggestingPricing}
                        >
                          {suggestingPricing ? 'Calculating...' : 'Generate Curve'}
                        </button>
                      )}
                    </div>

                    {suggestingPricing && (
                      <div style={{ textAlign: 'center', padding: '16px 0', fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>
                        Recalculating curves...
                      </div>
                    )}

                    {pricingData && !suggestingPricing && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <div className="slider-group">
                          <div className="slider-header" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                            <span>Shelf Life (Days Left)</span>
                            <strong style={{ color: 'hsl(var(--primary))' }}>{sliderDays} Days</strong>
                          </div>
                          <input 
                            type="range" 
                            min="1" 
                            max="45" 
                            value={sliderDays ?? 30} 
                            onChange={(e) => handleSliderDaysChange(Number(e.target.value))}
                            onMouseUp={() => handleSlidersCommitAction(sliderDays ?? 30, sliderQty ?? lot.quantityCases)}
                            onTouchEnd={() => handleSlidersCommitAction(sliderDays ?? 30, sliderQty ?? lot.quantityCases)}
                            style={{ width: '100%', cursor: 'pointer' }}
                          />
                        </div>

                        <div className="slider-group">
                          <div className="slider-header" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                            <span>Liquidation Volume (Cases)</span>
                            <strong style={{ color: 'hsl(var(--primary))' }}>{sliderQty} Cases</strong>
                          </div>
                          <input 
                            type="range" 
                            min="1" 
                            max={lot.quantityCases} 
                            value={sliderQty ?? lot.quantityCases} 
                            onChange={(e) => handleSliderQtyChange(Number(e.target.value))}
                            onMouseUp={() => handleSlidersCommitAction(sliderDays ?? 30, sliderQty ?? lot.quantityCases)}
                            onTouchEnd={() => handleSlidersCommitAction(sliderDays ?? 30, sliderQty ?? lot.quantityCases)}
                            style={{ width: '100%', cursor: 'pointer' }}
                          />
                        </div>

                        {renderPricingPlot()}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.85rem', backgroundColor: 'hsl(var(--bg-main))', padding: '12px', borderRadius: '8px', border: '1px solid hsl(var(--border-color))' }}>
                          <div>
                            <span style={{ color: 'hsl(var(--text-muted))', fontSize: '0.75rem' }}>Simulated Clearing Price</span>
                            <div style={{ fontWeight: 700, color: 'hsl(var(--primary))', fontSize: '1.05rem' }}>${pricingData.recommendedPrice?.toFixed(2)}/cs</div>
                          </div>
                          <div>
                            <span style={{ color: 'hsl(var(--text-muted))', fontSize: '0.75rem' }}>Expected Yield</span>
                            <div style={{ fontWeight: 700, color: 'hsl(var(--success))', fontSize: '1.05rem' }}>${pricingData.expectedRevenue?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.85rem', fontStyle: 'italic' }}>
                  Risk profile will auto-generate upon activation or data refresh.
                </p>
              )}
            </div>

            {/* Recommended Buyer Demand Matches */}
            <div className="lot-hub-card">
              <div className="lot-hub-card-header">
                <div className="lot-hub-card-title"><Users size={18} color="hsl(var(--success))" /> AI Recommended Buyer Matches ({recommendedBuyers.length})</div>
              </div>
              {buyersLoading ? (
                <div style={{ padding: '20px', textAlign: 'center' }}>
                  <div className="loader" style={{ margin: '0 auto 10px' }} />
                  <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>Matching buyer preferences from Sidecar AI...</p>
                </div>
              ) : recommendedBuyers.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '280px', overflowY: 'auto' }}>
                  {recommendedBuyers.map((match: any, idx: number) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: 'hsl(var(--bg-main))', borderRadius: '8px', border: '1px solid hsl(var(--border-color))' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{match.buyer?.companyName || 'Verified Buyer'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>{match.buyer?.preferredCategory || 'All Categories'} • Match Score: <strong style={{ color: 'hsl(var(--success))' }}>{Math.round(match.score * 100)}%</strong></div>
                      </div>
                      <span className="badge badge-outline-primary" style={{ fontSize: '0.75rem' }}>
                        {match.reason || 'Strong category synergy'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))', fontStyle: 'italic' }}>
                  No exact demand matches found yet. Activate lot on marketplace to broadcast to buyer network.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================
          SUB-TAB 2: BIDDING & AWARDING
      ========================================= */}
      {/* =========================================
          SUB-TAB 2: BID & OFFER WORKSPACE
      ========================================= */}
      {subTab === 'bids' && (
        <div className="lot-hub-grid" style={{ display: 'block' }}>
          <div className="lot-hub-card" style={{ width: '100%', padding: 0, overflow: 'hidden' }}>
            {/* Card Header with Title, Status Filters, and Search */}
            <div 
              className="lot-hub-card-header" 
              style={{ 
                padding: '16px 20px', 
                borderBottom: '1px solid hsl(var(--border-color))', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                flexWrap: 'wrap', 
                gap: '12px' 
              }}
            >
              <div className="lot-hub-card-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Award size={20} color="hsl(var(--primary))" />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'hsl(var(--text-primary))' }}>
                  Bid & Offer ({filteredBids.length})
                </h3>
              </div>

              {/* Filter Tabs & Search Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                {/* Status Filter Tabs */}
                <div 
                  role="tablist"
                  aria-label="Status Filters"
                  style={{ 
                    display: 'flex', 
                    gap: '4px', 
                    backgroundColor: 'hsl(var(--bg-main))', 
                    padding: '4px', 
                    borderRadius: '8px', 
                    border: '1px solid hsl(var(--border-color))' 
                  }}
                >
                  {(['All', 'Pending', 'Countered', 'Awarded', 'Declined'] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      role="tab"
                      aria-selected={bidStatusFilter === status}
                      className={`btn btn-sm ${bidStatusFilter === status ? 'btn-primary' : 'btn-ghost'}`}
                      style={{
                        padding: '4px 10px',
                        fontSize: '0.75rem',
                        borderRadius: '6px',
                        fontWeight: bidStatusFilter === status ? 600 : 400
                      }}
                      onClick={() => setBidStatusFilter(status)}
                    >
                      {status}
                    </button>
                  ))}
                </div>

                {/* Search Bar */}
                <div style={{ position: 'relative', minWidth: '220px' }}>
                  <Search 
                    size={14} 
                    style={{ 
                      position: 'absolute', 
                      left: '10px', 
                      top: '50%', 
                      transform: 'translateY(-50%)', 
                      color: 'hsl(var(--text-muted))' 
                    }} 
                  />
                  <input
                    type="text"
                    aria-label="Search bids"
                    placeholder="Search bids by buyer, email..."
                    value={bidSearchQuery}
                    onChange={(e) => setBidSearchQuery(e.target.value)}
                    className="form-input"
                    style={{
                      paddingLeft: '32px',
                      paddingRight: '12px',
                      paddingTop: '6px',
                      paddingBottom: '6px',
                      fontSize: '0.8rem',
                      borderRadius: '8px',
                      width: '100%'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* List Body */}
            {negotiationBidsLoading ? (
              <div style={{ padding: '60px 0', textAlign: 'center' }}>
                <div className="loader" style={{ margin: '0 auto 12px' }} />
                <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))' }}>Retrieving live bidding dashboard...</p>
              </div>
            ) : filteredBids.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'hsl(var(--text-muted))' }}>
                <MessageSquare size={36} style={{ opacity: 0.3, margin: '0 auto 12px' }} />
                <p style={{ fontWeight: 500, fontSize: '0.95rem', margin: '0 0 4px 0' }}>
                  {allBids.length === 0 ? 'No active bids currently placed for this lot.' : 'No bids match the selected filter or search.'}
                </p>
                {allBids.length > 0 && (
                  <button 
                    className="btn btn-sm btn-ghost" 
                    style={{ fontSize: '0.8rem', marginTop: '8px' }}
                    onClick={() => { setBidStatusFilter('All'); setBidSearchQuery(''); }}
                  >
                    Reset filters
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {/* List Header */}
                <div 
                  style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '2fr 1.2fr 1fr 1.2fr 1.2fr 1fr', 
                    gap: '12px', 
                    padding: '12px 20px', 
                    backgroundColor: 'hsl(var(--bg-main))', 
                    borderBottom: '1px solid hsl(var(--border-color))',
                    fontSize: '0.75rem', 
                    fontWeight: 700, 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.05em', 
                    color: 'hsl(var(--text-secondary))' 
                  }}
                >
                  <div>Buyer Details</div>
                  <div>Unit Price</div>
                  <div>Quantity</div>
                  <div>Total Recovery</div>
                  <div>Submitted</div>
                  <div style={{ textAlign: 'right' }}>Status</div>
                </div>

                {/* Bid Rows */}
                {filteredBids.map((bid: any) => {
                  const unitPrice = typeof bid.price === 'number' ? bid.price : (typeof bid.bidPricePerCase === 'number' ? bid.bidPricePerCase : 0);
                  const quantity = typeof bid.quantity === 'number' ? bid.quantity : (typeof bid.quantityCases === 'number' ? bid.quantityCases : 0);
                  const totalRecovery = unitPrice * quantity;
                  const statusInfo = getBidStatusInfo(bid.status);
                  const submittedDate = bid.submittedAt || bid.createdAt || bid.timestamp;
                  const formattedDate = submittedDate ? new Date(submittedDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A';
                  const isSelected = selectedBidForNegotiation?._id === bid._id;

                  return (
                    <div
                      key={bid._id}
                      data-testid={`bid-row-${bid._id}`}
                      role="row"
                      onClick={() => handleBidRowSelect(bid)}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 1.2fr 1fr 1.2fr 1.2fr 1fr',
                        gap: '12px',
                        alignItems: 'center',
                        padding: '14px 20px',
                        borderBottom: '1px solid hsl(var(--border-color))',
                        backgroundColor: isSelected ? 'hsl(var(--bg-card-hover))' : 'transparent',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'hsl(var(--text-primary))' }}>
                          {bid.buyerId?.companyName || 'Verified Buyer'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>
                          {bid.buyerId?.email || 'N/A'}
                        </div>
                      </div>

                      <div>
                        <span style={{ fontWeight: 600, color: 'hsl(var(--success))', fontSize: '0.9rem' }}>
                          ${unitPrice.toFixed(2)}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>/cs</span>
                      </div>

                      <div>
                        <span style={{ fontWeight: 600, color: 'hsl(var(--text-primary))', fontSize: '0.85rem' }}>
                          {quantity}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}> cs</span>
                      </div>

                      <div>
                        <span style={{ fontWeight: 700, color: 'hsl(var(--text-primary))', fontSize: '0.9rem' }}>
                          ${totalRecovery.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.8rem', color: 'hsl(var(--text-secondary))' }}>
                        {formattedDate}
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span 
                          className={`badge ${statusInfo.className}`} 
                          style={{ 
                            fontSize: '0.75rem', 
                            padding: '4px 8px', 
                            borderRadius: '6px',
                            backgroundColor: statusInfo.bg,
                            color: statusInfo.color,
                            border: `1px solid ${statusInfo.border}`,
                            textTransform: 'capitalize',
                            fontWeight: 600
                          }}
                        >
                          {statusInfo.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================
          SUB-TAB 3: ACTIVITIES & AUDIT TIMELINE
      ========================================= */}
      {subTab === 'activities' && (
        <div className="lot-hub-grid">
          {/* Left Column: Filter & Activity Timeline */}
          <div className="lot-hub-card" style={{ gridColumn: '1 / -1' }}>
            <div className="lot-hub-card-header">
              <div className="lot-hub-card-title"><Activity size={18} color="hsl(var(--primary))" /> Lot CRM Activities & Email Audit Trail ({filteredActivities.length})</div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {['all', 'Email', 'Call', 'Meeting', 'Note'].map(type => (
                  <button 
                    key={type}
                    className={`btn btn-sm ${activityFilter.toLowerCase() === type.toLowerCase() ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => handleActivityFilterChange(type)}
                    style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                  >
                    {type === 'all' ? 'All Activities' : type}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Activity Entry Form */}
            <div style={{ display: 'flex', gap: '12px', padding: '16px', backgroundColor: 'hsl(var(--bg-main))', borderRadius: '10px', border: '1px solid hsl(var(--border-color))' }}>
              <select 
                className="form-input" 
                style={{ width: '130px' }}
                value={activityTypeInput}
                onChange={(e) => handleActivityTypeInputChange(e.target.value)}
              >
                <option value="Email">📧 Email</option>
                <option value="Call">📞 Call</option>
                <option value="Meeting">🤝 Meeting</option>
                <option value="Note">📝 Note</option>
              </select>
              <input 
                type="text" 
                className="form-input" 
                style={{ flex: 1 }}
                placeholder="Log new interaction, note, call summary, or meeting takeaway..."
                value={activityContentInput}
                onChange={(e) => handleActivityContentInputChange(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && activityContentInput.trim()) handleCreateLotActivityAction(); }}
              />
              <button 
                className="btn btn-primary"
                onClick={handleCreateLotActivityAction}
                disabled={!activityContentInput.trim()}
              >
                + Log Activity
              </button>
            </div>

            {/* Chronological Activities Log */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
              {filteredActivities.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: 'hsl(var(--text-muted))' }}>
                  <Activity size={36} style={{ opacity: 0.3, margin: '0 auto 12px' }} />
                  <p>No activities found for this filter. Log a new interaction above.</p>
                </div>
              ) : (
                filteredActivities.map((act: any, idx: number) => {
                  let badgeBg = 'hsl(var(--primary) / 15%)';
                  let badgeColor = 'hsl(var(--primary))';
                  if (act.type === 'Call') { badgeBg = 'hsl(var(--warning) / 15%)'; badgeColor = 'hsl(var(--warning))'; }
                  if (act.type === 'Meeting') { badgeBg = 'hsl(var(--success) / 15%)'; badgeColor = 'hsl(var(--success))'; }
                  if (act.type === 'Note') { badgeBg = 'hsl(var(--secondary) / 15%)'; badgeColor = 'hsl(var(--secondary))'; }

                  return (
                    <div 
                      key={idx}
                      style={{
                        display: 'flex',
                        gap: '16px',
                        padding: '16px',
                        backgroundColor: 'hsl(var(--bg-main))',
                        border: '1px solid hsl(var(--border-color))',
                        borderRadius: '10px'
                      }}
                    >
                      <div style={{ 
                        padding: '6px 12px', 
                        borderRadius: '6px', 
                        backgroundColor: badgeBg, 
                        color: badgeColor,
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        height: 'fit-content',
                        textTransform: 'uppercase'
                      }}>
                        {act.type || 'Note'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.92rem', color: 'hsl(var(--text-primary))', lineHeight: 1.5, fontWeight: 500 }}>
                          {act.content || act.summary || 'Activity recorded'}
                        </div>
                        {act.details && (
                          <div style={{ fontSize: '0.8rem', color: 'hsl(var(--text-secondary))', marginTop: '6px', padding: '8px 12px', backgroundColor: 'hsl(var(--bg-card))', borderRadius: '6px' }}>
                            {act.details}
                          </div>
                        )}
                        <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', marginTop: '8px', display: 'flex', gap: '12px' }}>
                          <span>Logged by: <strong>{act.author || 'System AI'}</strong></span>
                          <span>•</span>
                          <span>{act.timestamp ? new Date(act.timestamp).toLocaleString() : 'Just now'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast Feedback Notification */}
      {feedbackToast && (
        <div
          role="status"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 1100,
            padding: '12px 20px',
            borderRadius: '8px',
            backgroundColor: feedbackToast.type === 'error' ? '#ef4444' : '#10b981',
            color: '#ffffff',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 600,
            fontSize: '0.85rem'
          }}
        >
          {feedbackToast.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
          <span>{feedbackToast.message}</span>
        </div>
      )}

      {/* Bid Action Inspector Modal */}
      <BidActionInspectorModal
        isOpen={props.isBidInspectorOpen !== undefined ? props.isBidInspectorOpen : isInspectorOpen}
        onClose={() => {
          if (props.setIsBidInspectorOpen) props.setIsBidInspectorOpen(false);
          setIsInspectorOpen(false);
        }}
        bid={selectedBidForInspector || selectedBidForNegotiation}
        lot={lot}
        onDecline={(payload) => handleDeclineBidAction(payload, selectedBidForInspector || selectedBidForNegotiation)}
        onReset={() => handleResetBidAction(selectedBidForInspector || selectedBidForNegotiation)}
        onCounter={(counterData) => handleCounterBidAction(counterData, selectedBidForInspector || selectedBidForNegotiation)}
        onAccept={(acceptPayload) => handleAcceptBidAction(acceptPayload, selectedBidForInspector || selectedBidForNegotiation)}
        onResendSettlement={handleResendSettlementAction}
        isSubmitting={isSubmittingAction}
      />
    </div>
  );
};

export default LotOperationsHubView;
