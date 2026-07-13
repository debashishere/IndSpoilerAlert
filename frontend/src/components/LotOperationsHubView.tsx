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
} from '../services/inventoryService';
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
  AlertTriangle
} from 'lucide-react';

export interface LotOperationsHubViewProps {
  lot?: any;
  onBack?: () => void;
  subTab?: 'details' | 'bids' | 'activities';
  setSubTab?: (tab: 'details' | 'bids' | 'activities') => void;
  
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

  const handleSelectedBidForNegotiationChange = (bid: any) => {
    if (props.setSelectedBidForNegotiation) props.setSelectedBidForNegotiation(bid);
    else dispatch(setReduxSelectedBidForNegotiation(bid));
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
          <span>Bidding & Awarding ({negotiationBids.length || bidsList.length || 0})</span>
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
      {subTab === 'bids' && (
        <div className="lot-hub-grid">
          {/* Left Column: Active Bids & Awarding Table */}
          <div className="lot-hub-card">
            <div className="lot-hub-card-header">
              <div className="lot-hub-card-title"><Award size={18} color="hsl(var(--primary))" /> Incoming Bids & Offers ({bidsList.length || negotiationBids.length})</div>
            </div>
            {negotiationBidsLoading ? (
              <div style={{ padding: '60px 0', textAlign: 'center' }}>
                <div className="loader" style={{ margin: '0 auto 12px' }} />
                <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))' }}>Retrieving live bidding dashboard...</p>
              </div>
            ) : (bidsList.length === 0 && negotiationBids.length === 0) ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'hsl(var(--text-muted))' }}>
                <MessageSquare size={36} style={{ opacity: 0.3, margin: '0 auto 12px' }} />
                <p>No active bids currently placed for this lot.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {(negotiationBids.length > 0 ? negotiationBids : bidsList).map((bid: any) => (
                  <div 
                    key={bid._id}
                    style={{
                      padding: '16px',
                      backgroundColor: selectedBidForNegotiation?._id === bid._id ? 'hsl(var(--bg-card-hover))' : 'hsl(var(--bg-main))',
                      border: selectedBidForNegotiation?._id === bid._id ? '2px solid hsl(var(--primary))' : '1px solid hsl(var(--border-color))',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onClick={() => handleSelectedBidForNegotiationChange(bid)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '1rem', color: 'hsl(var(--text-primary))' }}>
                          {bid.buyerId?.companyName || 'Verified Buyer Network'}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'hsl(var(--text-secondary))' }}>
                          Offer: <strong style={{ color: 'hsl(var(--success))', fontSize: '0.95rem' }}>${bid.bidPricePerCase?.toFixed(2)}</strong>/cs for <strong>{bid.quantityCases}</strong> cases
                        </div>
                      </div>
                      <span className="badge badge-outline-primary" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>
                        {bid.status || 'Submitted'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid hsl(var(--border-color))' }}>
                      <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>
                        Total Recovery: <strong>${(bid.bidPricePerCase * bid.quantityCases).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                      </span>

                      <div style={{ display: 'flex', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="number" 
                          placeholder="Partial Qty" 
                          style={{ width: '90px', padding: '4px 8px', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid hsl(var(--border-color))', backgroundColor: 'hsl(var(--bg-main))', color: 'hsl(var(--text-primary))' }}
                          value={expandedBidId === bid._id ? partialAwardCases : ''}
                          onChange={(e) => {
                            handleExpandedBidIdChange(bid._id);
                            handlePartialAwardCasesChange(e.target.value === '' ? '' : Number(e.target.value));
                          }}
                        />
                        <button 
                          className="btn btn-sm btn-primary"
                          disabled={awardingBidId === bid._id}
                          onClick={() => handleAwardBidAction(bid._id, expandedBidId === bid._id && typeof partialAwardCases === 'number' ? partialAwardCases : undefined)}
                        >
                          {awardingBidId === bid._id ? 'Awarding...' : 'Award Notice & BOL'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Negotiation Console & Counter-Offer Form */}
          <div className="lot-hub-card">
            <div className="lot-hub-card-header">
              <div className="lot-hub-card-title"><MessageSquare size={18} color="hsl(var(--primary))" /> Live Negotiation Chat & Counter-Offer</div>
            </div>

            {selectedBidForNegotiation ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
                <div style={{ padding: '12px', backgroundColor: 'hsl(var(--bg-main))', borderRadius: '8px', border: '1px solid hsl(var(--border-color))' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Negotiating with: {selectedBidForNegotiation.buyerId?.companyName || 'Verified Buyer'}</div>
                  <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>Current Bid: ${selectedBidForNegotiation.bidPricePerCase?.toFixed(2)}/cs ({selectedBidForNegotiation.quantityCases} cases)</div>
                </div>

                {/* Message Log */}
                <div style={{ flex: 1, minHeight: '220px', maxHeight: '320px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', padding: '10px', backgroundColor: 'hsl(var(--bg-main) / 50%)', borderRadius: '8px' }}>
                  {(selectedBidForNegotiation.negotiationHistory || []).map((item: any, idx: number) => (
                    <div 
                      key={idx}
                      style={{
                        alignSelf: item.sender === 'Supplier' ? 'flex-end' : 'flex-start',
                        backgroundColor: item.sender === 'Supplier' ? 'hsl(var(--primary) / 20%)' : 'hsl(var(--bg-card))',
                        border: `1px solid ${item.sender === 'Supplier' ? 'hsl(var(--primary) / 40%)' : 'hsl(var(--border-color))'}`,
                        padding: '10px 14px',
                        borderRadius: '10px',
                        maxWidth: '85%'
                      }}
                    >
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: item.sender === 'Supplier' ? 'hsl(var(--primary))' : 'hsl(var(--text-secondary))', marginBottom: '2px' }}>
                        {item.sender === 'Supplier' ? 'You (SpoilerAlert Account)' : selectedBidForNegotiation.buyerId?.companyName}
                      </div>
                      <div style={{ fontSize: '0.85rem', lineHeight: 1.4 }}>{item.message || `Counter offer placed at $${item.price}/cs`}</div>
                      <div style={{ fontSize: '0.65rem', color: 'hsl(var(--text-muted))', marginTop: '4px', textAlign: 'right' }}>
                        {new Date(item.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))}
                  {(!selectedBidForNegotiation.negotiationHistory || selectedBidForNegotiation.negotiationHistory.length === 0) && (
                    <p style={{ textAlign: 'center', color: 'hsl(var(--text-muted))', fontSize: '0.8rem', margin: 'auto' }}>
                      No messages recorded yet for this offer. Send a message or counter-offer below.
                    </p>
                  )}
                </div>

                {/* Counter Offer Input */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '8px', padding: '12px', backgroundColor: 'hsl(var(--bg-main))', borderRadius: '8px' }}>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder={`Counter Price ($/cs)`} 
                    value={counterOfferPrice}
                    onChange={(e) => handleCounterOfferPriceChange(e.target.value === '' ? '' : Number(e.target.value))}
                  />
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder={`Cases (${selectedBidForNegotiation.quantityCases})`} 
                    value={counterOfferQty}
                    onChange={(e) => handleCounterOfferQtyChange(e.target.value === '' ? '' : Number(e.target.value))}
                  />
                  <button className="btn btn-primary" onClick={handleSendCounterOfferAction}>
                    Counter Offer
                  </button>
                </div>

                {/* Chat Message Box */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Type direct message to buyer..." 
                    style={{ flex: 1 }}
                    value={negotiationChatInput}
                    onChange={(e) => handleNegotiationChatInputChange(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSendNegotiationMessageAction(); }}
                  />
                  <button className="btn btn-secondary" onClick={handleSendNegotiationMessageAction}>
                    <Send size={16} /> Send
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '80px 20px', color: 'hsl(var(--text-muted))' }}>
                <MessageSquare size={36} style={{ opacity: 0.3, margin: '0 auto 12px' }} />
                <p>Select an incoming bid from the left panel to open live chat and counter-offer controls.</p>
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
    </div>
  );
};

export default LotOperationsHubView;
