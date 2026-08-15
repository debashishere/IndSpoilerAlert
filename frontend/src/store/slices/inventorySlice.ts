import { createSlice, createSelector, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';

export type InventorySubTab = 'inventory' | 'sales' | 'bidding';
export type SortField = 'sku' | 'description' | 'supplier' | 'warehouse' | 'quantityCases' | 'availableQty' | 'expirationDate' | 'costPerCase';
export type SortDirection = 'asc' | 'desc';

export type LotHubSubTab = 'details' | 'bids' | 'activities';

export interface InventoryState {
  inventoryList: any[];
  allBids: any[];
  allBidsLoading: boolean;
  loading: boolean;
  error: string | null;
  selectedLot: any | null;
  listFilterSearch: string;
  listFilterSupplier: string;
  listFilterDC: string;
  listFilterCategory: string;
  listFilterStatus: string;
  sortField: SortField;
  sortDirection: SortDirection;
  currentPage: number;
  itemsPerPage: number;
  activeSubTab: InventorySubTab;
  selectedBuyerEmail: string;

  selectedLotHubId: string | null;
  lotHubSubTab: LotHubSubTab;
  lotHubData: {
    loading: boolean;
    error: string | null;
    bidsList: any[];
    bidsLoading: boolean;
    negotiationBids: any[];
    negotiationBidsLoading: boolean;
    lotActivities: any[];
    activitiesLoading: boolean;
    riskProfile: any | null;
    opportunityData: any | null;
    listingData: any | null;
    pricingData: any | null;
    pricingLoading: boolean;
    buyerMatches: any[];
    buyersLoading: boolean;
    sliderDays: number;
    sliderQty: number;
    txLoading: boolean;
    txSuccess: boolean;
    txDetails: any | null;
    expandedBidId: string | null;
    partialAwardCases: number | '';
    selectedBidForNegotiation: any | null;
    negotiationChatInput: string;
    counterOfferPrice: number | '';
    counterOfferQty: number | '';
    counterOfferTerms: string;
    activityFilter: string;
    selectedFormType: string;
    activitySubjectInput: string;
    activityContentInput: string;
    activityRecipientInput: string;
    isTypingSimulated: boolean;
  };

  riskAssessment: {
    loading: boolean;
    data: any | null;
    error: string | null;
  };

  compliance: {
    docType: 'COA' | 'BATCH_RECORD' | 'FSMA_ATTESTATION' | 'ORGANIC_CERT';
    uploading: boolean;
    error: string | null;
  };

  analyticsData?: any;

  modals: {
    showRiskModal: boolean;
    showComplianceModal: boolean;
    showAwardModal: boolean;
    showEmailSentVisualizer: boolean;
    visualizerEmailDetails: any | null;
    selectedBidToAward: any | null;
    selectedLotForAward?: any | null;
    selectedLotForRisk?: any | null;
    selectedLotForCompliance?: any | null;
    complianceUploading?: boolean;
    complianceError?: string | null;
    riskAssessment?: any;
    awardedQtyInput: number;
    emailDraftSubject: string;
    emailDraftBody: string;
    txLoading?: boolean;
  };
}

const initialState: InventoryState = {
  inventoryList: [],
  allBids: [],
  allBidsLoading: false,
  loading: false,
  error: null,
  selectedLot: null,
  listFilterSearch: '',
  listFilterSupplier: '',
  listFilterDC: '',
  listFilterCategory: '',
  listFilterStatus: '',
  sortField: 'expirationDate',
  sortDirection: 'asc',
  currentPage: 1,
  itemsPerPage: 10,
  activeSubTab: 'inventory',
  selectedBuyerEmail: '',

  selectedLotHubId: null,
  lotHubSubTab: 'details',
  lotHubData: {
    loading: false,
    error: null,
    bidsList: [],
    bidsLoading: false,
    negotiationBids: [],
    negotiationBidsLoading: false,
    lotActivities: [],
    activitiesLoading: false,
    riskProfile: null,
    opportunityData: null,
    listingData: null,
    pricingData: null,
    pricingLoading: false,
    buyerMatches: [],
    buyersLoading: false,
    sliderDays: 30,
    sliderQty: 100,
    txLoading: false,
    txSuccess: false,
    txDetails: null,
    expandedBidId: null,
    partialAwardCases: '',
    selectedBidForNegotiation: null,
    negotiationChatInput: '',
    counterOfferPrice: '',
    counterOfferQty: '',
    counterOfferTerms: '',
    activityFilter: 'all',
    selectedFormType: 'Email',
    activitySubjectInput: '',
    activityContentInput: '',
    activityRecipientInput: '',
    isTypingSimulated: false,
  },

  riskAssessment: {
    loading: false,
    data: null,
    error: null,
  },

  compliance: {
    docType: 'COA',
    uploading: false,
    error: null,
  },

  modals: {
    showRiskModal: false,
    showComplianceModal: false,
    showAwardModal: false,
    showEmailSentVisualizer: false,
    visualizerEmailDetails: null,
    selectedBidToAward: null,
    selectedLotForAward: null,
    awardedQtyInput: 1,
    emailDraftSubject: '',
    emailDraftBody: '',
    txLoading: false,
  },
};

export const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    setInventoryList: (state, action: PayloadAction<any[]>) => {
      state.inventoryList = action.payload;
    },
    setAllBids: (state, action: PayloadAction<any[]>) => {
      state.allBids = action.payload;
    },
    setAllBidsLoading: (state, action: PayloadAction<boolean>) => {
      state.allBidsLoading = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setSelectedLot: (state, action: PayloadAction<any | null>) => {
      state.selectedLot = action.payload;
    },
    setFilterSearch: (state, action: PayloadAction<string>) => {
      state.listFilterSearch = action.payload;
      state.currentPage = 1;
    },
    setFilterSupplier: (state, action: PayloadAction<string>) => {
      state.listFilterSupplier = action.payload;
      state.currentPage = 1;
    },
    setFilterDC: (state, action: PayloadAction<string>) => {
      state.listFilterDC = action.payload;
      state.currentPage = 1;
    },
    setFilterCategory: (state, action: PayloadAction<string>) => {
      state.listFilterCategory = action.payload;
      state.currentPage = 1;
    },
    setFilterStatus: (state, action: PayloadAction<string>) => {
      state.listFilterStatus = action.payload;
      state.currentPage = 1;
    },
    setSort: (state, action: PayloadAction<{ field: SortField; direction: SortDirection }>) => {
      state.sortField = action.payload.field;
      state.sortDirection = action.payload.direction;
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload;
    },
    setActiveSubTab: (state, action: PayloadAction<InventorySubTab>) => {
      state.activeSubTab = action.payload;
    },
    setSelectedBuyerEmail: (state, action: PayloadAction<string>) => {
      state.selectedBuyerEmail = action.payload;
    },
    setRiskAssessmentLoading: (state, action: PayloadAction<boolean>) => {
      state.riskAssessment.loading = action.payload;
      state.riskAssessment.error = null;
    },
    setRiskAssessmentData: (state, action: PayloadAction<any>) => {
      state.riskAssessment.data = action.payload;
      state.riskAssessment.loading = false;
    },
    setRiskAssessmentError: (state, action: PayloadAction<string>) => {
      state.riskAssessment.error = action.payload;
      state.riskAssessment.loading = false;
    },
    setComplianceDocType: (state, action: PayloadAction<any>) => {
      state.compliance.docType = action.payload;
    },
    setComplianceUploading: (state, action: PayloadAction<boolean>) => {
      state.compliance.uploading = action.payload;
    },
    setComplianceError: (state, action: PayloadAction<string | null>) => {
      state.compliance.error = action.payload;
    },
    updateLotInList: (state, action: PayloadAction<any>) => {
      const updated = action.payload;
      const idx = state.inventoryList.findIndex((item) => item._id === updated._id);
      if (idx !== -1) {
        state.inventoryList[idx] = { ...state.inventoryList[idx], ...updated };
      }
      if (state.selectedLot?._id === updated._id) {
        state.selectedLot = { ...state.selectedLot, ...updated };
      }
    },
    openRiskModal: (state, action: PayloadAction<any>) => {
      state.selectedLot = action.payload;
      state.modals.selectedLotForRisk = action.payload;
      state.modals.riskAssessment = state.riskAssessment;
      state.modals.showRiskModal = true;
    },
    openComplianceModal: (state, action: PayloadAction<any>) => {
      state.selectedLot = action.payload;
      state.modals.selectedLotForCompliance = action.payload;
      state.modals.complianceUploading = state.compliance.uploading;
      state.modals.complianceError = state.compliance.error;
      state.modals.showComplianceModal = true;
      state.compliance.error = null;
    },
    openAwardModal: (state, action: PayloadAction<{ bid: any; lot: any }>) => {
      state.selectedLot = action.payload.lot;
      state.modals.selectedLotForAward = action.payload.lot;
      state.modals.selectedBidToAward = action.payload.bid;
      state.modals.showAwardModal = true;
      const defaultQty = action.payload.bid.quantity || action.payload.lot.availableQty || 1;
      state.modals.awardedQtyInput = defaultQty;
      state.modals.emailDraftSubject = `Surplus Bid Awarded: ${action.payload.lot.productId?.description || 'Lot'}`;
      state.modals.emailDraftBody = `Dear ${action.payload.bid.buyerId?.companyName || 'Buyer'},\n\nWe are pleased to award your bid.\n\n- Quantity Awarded: ${defaultQty} cases\n- Total Value: $${(defaultQty * (action.payload.bid.price || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}\n\nLogistics coordination details follow below.`;
    },
    openEmailSentVisualizer: (state, action: PayloadAction<any>) => {
      state.modals.visualizerEmailDetails = action.payload;
      state.modals.showEmailSentVisualizer = true;
    },
    closeRiskModal: (state) => {
      state.modals.showRiskModal = false;
    },
    closeComplianceModal: (state) => {
      state.modals.showComplianceModal = false;
    },
    closeAwardModal: (state) => {
      state.modals.showAwardModal = false;
    },
    closeEmailSentVisualizer: (state) => {
      state.modals.showEmailSentVisualizer = false;
    },
    closeAllGlobalModals: (state) => {
      state.modals.showRiskModal = false;
      state.modals.showComplianceModal = false;
      state.modals.showAwardModal = false;
      state.modals.showEmailSentVisualizer = false;
    },
    setAwardedQtyInput: (state, action: PayloadAction<number>) => {
      state.modals.awardedQtyInput = action.payload;
    },
    setEmailDraftSubject: (state, action: PayloadAction<string>) => {
      state.modals.emailDraftSubject = action.payload;
    },
    setEmailDraftBody: (state, action: PayloadAction<string>) => {
      state.modals.emailDraftBody = action.payload;
    },
    setSelectedLotHubId: (state, action: PayloadAction<string | null>) => {
      state.selectedLotHubId = action.payload;
    },
    setLotHubSubTab: (state, action: PayloadAction<LotHubSubTab>) => {
      state.lotHubSubTab = action.payload;
    },
    setLotHubData: (state, action: PayloadAction<Partial<InventoryState['lotHubData']>>) => {
      state.lotHubData = { ...state.lotHubData, ...action.payload };
    },
    resetLotHubData: (state) => {
      state.lotHubData = { ...initialState.lotHubData };
    },
    setSliderDays: (state, action: PayloadAction<number>) => {
      state.lotHubData.sliderDays = action.payload;
    },
    setSliderQty: (state, action: PayloadAction<number>) => {
      state.lotHubData.sliderQty = action.payload;
    },
    setExpandedBidId: (state, action: PayloadAction<string | null>) => {
      state.lotHubData.expandedBidId = action.payload;
    },
    setPartialAwardCases: (state, action: PayloadAction<number | ''>) => {
      state.lotHubData.partialAwardCases = action.payload;
    },
    setSelectedBidForNegotiation: (state, action: PayloadAction<any | null>) => {
      state.lotHubData.selectedBidForNegotiation = action.payload;
      if (action.payload) {
        state.lotHubData.counterOfferQty = action.payload.quantityCases || action.payload.quantity || '';
      }
    },
    setNegotiationChatInput: (state, action: PayloadAction<string>) => {
      state.lotHubData.negotiationChatInput = action.payload;
    },
    setCounterOfferPrice: (state, action: PayloadAction<number | ''>) => {
      state.lotHubData.counterOfferPrice = action.payload;
    },
    setCounterOfferQty: (state, action: PayloadAction<number | ''>) => {
      state.lotHubData.counterOfferQty = action.payload;
    },
    setCounterOfferTerms: (state, action: PayloadAction<string>) => {
      state.lotHubData.counterOfferTerms = action.payload;
    },
    setActivityFilter: (state, action: PayloadAction<string>) => {
      state.lotHubData.activityFilter = action.payload;
    },
    setSelectedFormType: (state, action: PayloadAction<string>) => {
      state.lotHubData.selectedFormType = action.payload;
    },
    setActivitySubjectInput: (state, action: PayloadAction<string>) => {
      state.lotHubData.activitySubjectInput = action.payload;
    },
    setActivityContentInput: (state, action: PayloadAction<string>) => {
      state.lotHubData.activityContentInput = action.payload;
    },
    setActivityRecipientInput: (state, action: PayloadAction<string>) => {
      state.lotHubData.activityRecipientInput = action.payload;
    },
    setIsTypingSimulated: (state, action: PayloadAction<boolean>) => {
      state.lotHubData.isTypingSimulated = action.payload;
    },
    updateProductAllergensInList: (state, action: PayloadAction<{ productId: string; allergens: string[] }>) => {
      const { productId, allergens } = action.payload;
      if (state.selectedLot && state.selectedLot.productId?._id === productId) {
        state.selectedLot.productId.allergens = allergens;
      }
      state.inventoryList.forEach((item) => {
        if (item.productId?._id === productId) {
          item.productId.allergens = allergens;
        }
      });
    },
  },
});

export const {
  setInventoryList,
  setAllBids,
  setAllBidsLoading,
  setLoading,
  setError,
  setSelectedLot,
  setFilterSearch,
  setFilterSupplier,
  setFilterDC,
  setFilterCategory,
  setFilterStatus,
  setSort,
  setPage,
  setActiveSubTab,
  setSelectedBuyerEmail,
  setRiskAssessmentLoading,
  setRiskAssessmentData,
  setRiskAssessmentError,
  setComplianceDocType,
  setComplianceUploading,
  setComplianceError,
  updateLotInList,
  openRiskModal,
  openComplianceModal,
  openAwardModal,
  openEmailSentVisualizer,
  closeRiskModal,
  closeComplianceModal,
  closeAwardModal,
  closeEmailSentVisualizer,
  closeAllGlobalModals,
  setAwardedQtyInput,
  setEmailDraftSubject,
  setEmailDraftBody,
  setSelectedLotHubId,
  setLotHubSubTab,
  setLotHubData,
  resetLotHubData,
  setSliderDays,
  setSliderQty,
  setExpandedBidId,
  setPartialAwardCases,
  setSelectedBidForNegotiation,
  setNegotiationChatInput,
  setCounterOfferPrice,
  setCounterOfferQty,
  setCounterOfferTerms,
  setActivityFilter,
  setSelectedFormType,
  setActivitySubjectInput,
  setActivityContentInput,
  setActivityRecipientInput,
  setIsTypingSimulated,
  updateProductAllergensInList,
} = inventorySlice.actions;

// Reselect Memoized Selectors
const selectRawInventoryList = (state: RootState) => state.inventory.inventoryList;
const selectFilterSearch = (state: RootState) => state.inventory.listFilterSearch;
const selectFilterSupplier = (state: RootState) => state.inventory.listFilterSupplier;
const selectFilterDC = (state: RootState) => state.inventory.listFilterDC;
const selectFilterCategory = (state: RootState) => state.inventory.listFilterCategory;
const selectFilterStatus = (state: RootState) => state.inventory.listFilterStatus;
const selectSortField = (state: RootState) => state.inventory.sortField;
const selectSortDirection = (state: RootState) => state.inventory.sortDirection;

const selectCoreBuyers = (state: RootState) => state.core.buyers;
const selectSelectedBuyerEmail = (state: RootState) => state.inventory.selectedBuyerEmail;

export const selectFilteredInventoryLots = createSelector(
  [
    selectRawInventoryList,
    selectFilterSearch,
    selectFilterSupplier,
    selectFilterDC,
    selectFilterCategory,
    selectFilterStatus,
    selectSortField,
    selectSortDirection,
  ],
  (inventoryList, search, supplier, dc, category, status, sortField, sortDirection) => {
    // 1. Group and Sort
    const sorted = [...inventoryList].sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === 'sku') {
        valA = a.productId?.sku || '';
        valB = b.productId?.sku || '';
      } else if (sortField === 'description') {
        valA = a.productId?.description || '';
        valB = b.productId?.description || '';
      } else if (sortField === 'supplier') {
        valA = a.supplierId?.name || '';
        valB = b.supplierId?.name || '';
      } else if (sortField === 'warehouse') {
        valA = a.distributionCenterId?.name || '';
        valB = b.distributionCenterId?.name || '';
      }

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      } else if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      } else {
        const dateA = new Date(valA || 0).getTime();
        const dateB = new Date(valB || 0).getTime();
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      }
    });

    // 2. Filter
    return sorted.filter((lot) => {
      const searchLower = search ? search.toLowerCase() : '';
      const matchesSearch =
        !search ||
        (lot.productId?.description || lot.description || lot.productName || '').toLowerCase().includes(searchLower) ||
        (lot.productId?.sku || lot.sku || '').toLowerCase().includes(searchLower) ||
        (lot.productId?.brand || lot.brand || '').toLowerCase().includes(searchLower) ||
        (lot.productId?.subCategory || lot.subCategory || '').toLowerCase().includes(searchLower) ||
        (lot.lotNumber || lot.batchNumber || '').toLowerCase().includes(searchLower) ||
        (lot.distributionCenterId?.name || lot.warehouse || lot.location || '').toLowerCase().includes(searchLower);

      const supplierName = lot.supplierId?.name || lot.supplier || '';
      const matchesSupplier = !supplier || supplierName === supplier;

      const dcName = lot.distributionCenterId?.name || lot.warehouse || lot.location || '';
      const matchesDC = !dc || dcName === dc;

      const categoryName = lot.productId?.category || lot.category || '';
      const matchesCategory = !category || categoryName === category;

      const matchesStatus =
        !status ||
        lot.status?.toLowerCase() === status.toLowerCase() ||
        (status.toLowerCase() === 'active' && (lot.status?.toLowerCase() === 'active listing' || lot.status?.toLowerCase() === 'active'));

      return matchesSearch && matchesSupplier && matchesDC && matchesCategory && matchesStatus;
    });
  }
);

export const selectActiveMarketplaceListings = createSelector(
  [selectRawInventoryList, selectSelectedBuyerEmail, selectCoreBuyers],
  (inventoryList, selectedBuyerEmail, buyers) => {
    const activeBuyer = buyers.find((b) => b.email === selectedBuyerEmail);
    return inventoryList.filter((lot) => {
      const isActive =
        lot.status === 'active' &&
        lot.listing &&
        lot.listing.allowBidding &&
        lot.availableQty > 0;
      if (!isActive) return false;

      if (activeBuyer) {
        const hasConflict = activeBuyer.excludedAllergens?.some((allergen: string) =>
          lot.productId?.allergens?.includes(allergen)
        );
        if (hasConflict) return false;
      }
      return true;
    });
  }
);

export default inventorySlice.reducer;
