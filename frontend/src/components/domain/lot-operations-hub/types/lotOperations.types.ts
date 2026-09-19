export type LotHubSubTab = 'details' | 'bids' | 'activities';

export type BidFilterStatus = 'All' | 'Pending' | 'Countered' | 'Awarded' | 'Declined';

export type ActivityFilterType = 'all' | 'Email' | 'Call' | 'Meeting' | 'Note';

export interface BidStatusInfo {
  label: string;
  key: string;
  className: string;
  bg: string;
  color: string;
  border: string;
}

export interface PricingDataPoint {
  t: number;
  price: number;
  revenue: number;
}

export interface PricingPlotProps {
  points: PricingDataPoint[];
  width: number;
  height: number;
  paddingLeft: number;
  paddingRight: number;
  paddingTop: number;
  paddingBottom: number;
  plotWidth: number;
  plotHeight: number;
  originalPrice: number;
  currentDays: number;
  pricingData?: any;
}

export interface FeedbackToastState {
  message: string;
  type: 'success' | 'info' | 'error' | 'warning';
}

export interface LotOperationsHubViewProps {
  lot?: any;
  onBack?: () => void;
  subTab?: LotHubSubTab;
  setSubTab?: (tab: LotHubSubTab) => void;
  
  // Bid Selection / Inspector
  onSelectBid?: (bid: any) => void;
  onOpenBidInspector?: (bid: any) => void;
  isBidInspectorOpen?: boolean;
  setIsBidInspectorOpen?: (open: boolean) => void;
  onDeclineBid?: (bidId: string, payload: { reason: string; rationale?: string }) => Promise<void> | void;
  onResetBid?: (bidId: string) => Promise<void> | void;
  onCounterBid?: (bidId: string, payload: { price: number; quantity: number; message: string }) => Promise<void | any> | void | any;
  onAcceptBid?: (bidId: string, payload?: any) => Promise<void | any> | void | any;
  
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
