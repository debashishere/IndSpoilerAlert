import { createSlice, createAsyncThunk, createSelector, type PayloadAction } from '@reduxjs/toolkit';
import coreService, { DEFAULT_SUPPLIERS } from '../../services/coreService';
import networkService from '../../services/networkService';
import type { RootState } from '../index';

export interface Supplier {
  _id: string;
  name: string;
  companyCode: string;
  preferredDisposition: string;
  [key: string]: any;
}

export interface Buyer {
  _id?: string;
  email: string;
  name?: string;
  companyName?: string;
  tier?: string;
  status?: string;
  isActive?: boolean;
  optInBidding?: boolean;
  optInSales?: boolean;
  phone?: string;
  address?: string;
  notes?: string;
  deactivatedAt?: string;
  deactivatedReason?: string;
  excludedAllergens?: string[];
  [key: string]: any;
}

export interface BuyerList {
  _id: string;
  name: string;
  type: 'primary' | 'secondary' | 'custom';
  buyerIds: any[]; // populated Buyer objects or raw ObjectId strings
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type NavigationTab = 
  | 'ingestion' 
  | 'dashboard' 
  | 'analytics' 
  | 'marketplace' 
  | 'inventory' 
  | 'logistics' 
  | 'lot-hub' 
  | 'workflows'
  | 'inbox'
  | 'settings';

export interface CoreState {
  activeTab: NavigationTab;
  returnTab: NavigationTab | null;
  sidebarExpanded: boolean;
  backendHealthy: boolean | null;
  sidecarHealthy: boolean | null;
  suppliers: Supplier[];
  buyers: Buyer[];
  buyerLists: BuyerList[];
  loading: boolean;
  error: string | null;
  analyticsSummary: any | null;
  analyticsLoading: boolean;
}

export const checkSystemHealth = createAsyncThunk(
  'core/checkSystemHealth',
  async (_, { rejectWithValue }) => {
    try {
      const result = await coreService.checkHealth();
      return result;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to check system health');
    }
  }
);

export const fetchCoreReferenceData = createAsyncThunk(
  'core/fetchCoreReferenceData',
  async (params: { all?: boolean } | boolean | undefined = undefined, { rejectWithValue }) => {
    try {
      const [suppliers, buyers, buyerLists] = await Promise.all([
        coreService.getSuppliers(),
        coreService.getBuyers(params),
        networkService.getBuyerLists(),
      ]);
      return { suppliers, buyers, buyerLists };
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch core reference data');
    }
  }
);

export const fetchBuyerLists = createAsyncThunk(
  'core/fetchBuyerLists',
  async (_, { rejectWithValue }) => {
    try {
      const lists = await networkService.getBuyerLists();
      return lists;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch buyer lists');
    }
  }
);

export const createBuyerListThunk = createAsyncThunk(
  'core/createBuyerList',
  async (payload: { name: string; description?: string }, { rejectWithValue }) => {
    try {
      const newList = await networkService.createBuyerList(payload);
      return newList;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to create buyer list');
    }
  }
);

export const updateBuyerListThunk = createAsyncThunk(
  'core/updateBuyerList',
  async ({ id, name, description }: { id: string; name?: string; description?: string }, { rejectWithValue }) => {
    try {
      const updated = await networkService.updateBuyerList(id, { name, description });
      return updated;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to update buyer list');
    }
  }
);

export const deleteBuyerListThunk = createAsyncThunk(
  'core/deleteBuyerList',
  async (id: string, { rejectWithValue }) => {
    try {
      await networkService.deleteBuyerList(id);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to delete buyer list');
    }
  }
);

export const updateBuyerListMembersThunk = createAsyncThunk(
  'core/updateBuyerListMembers',
  async ({ id, buyerIds }: { id: string; buyerIds: string[] }, { rejectWithValue }) => {
    try {
      const updated = await networkService.updateBuyerListMembers(id, buyerIds);
      return updated;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to update list members');
    }
  }
);

export const fetchAnalyticsSummaryThunk = createAsyncThunk(
  'core/fetchAnalyticsSummary',
  async (_, { rejectWithValue }) => {
    try {
      return await coreService.fetchAnalyticsSummary();
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch analytics summary');
    }
  }
);

const getInitialTab = (): NavigationTab => {
  if (typeof window !== 'undefined' && window.location) {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    const validTabs: NavigationTab[] = ['ingestion', 'dashboard', 'analytics', 'marketplace', 'inventory', 'logistics', 'lot-hub', 'workflows', 'inbox', 'settings'];
    if (tab && validTabs.includes(tab as NavigationTab)) {
      return tab as NavigationTab;
    }
    try {
      const stored = localStorage.getItem('indSpoilerAlert_activeTab');
      if (stored && validTabs.includes(stored as NavigationTab)) {
        return stored as NavigationTab;
      }
    } catch {
      // ignore localStorage error in tests/SSR
    }
  }
  return 'ingestion';
};

export const DEFAULT_BUYER_LISTS: BuyerList[] = [
  {
    _id: 'list-primary',
    name: 'Primary Buyers',
    type: 'primary',
    buyerIds: [],
    description: 'System default primary buyer list'
  },
  {
    _id: 'list-secondary',
    name: 'Secondary Liquidators',
    type: 'secondary',
    buyerIds: [],
    description: 'System default secondary liquidators list'
  }
];

export function ensureDefaultBuyerLists(lists: BuyerList[] = []): BuyerList[] {
  const source = Array.isArray(lists) && lists.length > 0 ? lists : DEFAULT_BUYER_LISTS;
  
  const uniqueLists: BuyerList[] = [];
  const seenIds = new Set<string>();
  const seenNames = new Set<string>();
  let primaryFound = false;
  let secondaryFound = false;

  for (const list of source) {
    if (!list) continue;
    const id = list._id || list.id;
    const nameNorm = (list.name || '').trim().toLowerCase();
    const isPrimary = list.type === 'primary' || id === 'list-primary' || nameNorm.includes('primary');
    const isSecondary = list.type === 'secondary' || id === 'list-secondary' || nameNorm.includes('secondary');

    if (isPrimary) {
      if (primaryFound) continue;
      primaryFound = true;
    } else if (isSecondary) {
      if (secondaryFound) continue;
      secondaryFound = true;
    } else {
      if (id && seenIds.has(id)) continue;
      if (nameNorm && seenNames.has(nameNorm)) continue;
    }

    if (id) seenIds.add(id);
    if (nameNorm) seenNames.add(nameNorm);

    uniqueLists.push(list);
  }

  if (!primaryFound) {
    uniqueLists.unshift(DEFAULT_BUYER_LISTS[0]);
  }

  if (!secondaryFound) {
    const primaryIdx = uniqueLists.findIndex(
      (l) => l.type === 'primary' || l._id === 'list-primary' || (l.name || '').toLowerCase().includes('primary')
    );
    const insertIdx = primaryIdx >= 0 ? primaryIdx + 1 : 1;
    uniqueLists.splice(insertIdx, 0, DEFAULT_BUYER_LISTS[1]);
  }

  return uniqueLists;
}

const initialState: CoreState = {
  activeTab: getInitialTab(),
  returnTab: null,
  sidebarExpanded: false,
  backendHealthy: null,
  sidecarHealthy: null,
  suppliers: [],
  buyers: [],
  buyerLists: DEFAULT_BUYER_LISTS,
  loading: false,
  error: null,
  analyticsSummary: null,
  analyticsLoading: false,
};

export const coreSlice = createSlice({
  name: 'core',
  initialState,
  reducers: {
    setActiveTab: (state, action: PayloadAction<NavigationTab>) => {
      if (action.payload === 'lot-hub' && state.activeTab !== 'lot-hub') {
        state.returnTab = state.activeTab;
      } else if (action.payload !== 'lot-hub') {
        state.returnTab = null;
      }
      state.activeTab = action.payload;
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem('indSpoilerAlert_activeTab', action.payload);
        } catch {
          // ignore
        }
      }
    },
    setReturnTab: (state, action: PayloadAction<NavigationTab | null>) => {
      state.returnTab = action.payload;
    },
    setSidebarExpanded: (state, action: PayloadAction<boolean>) => {
      state.sidebarExpanded = action.payload;
    },
    toggleSidebarExpanded: (state) => {
      state.sidebarExpanded = !state.sidebarExpanded;
    },
    setHealthStatus: (
      state,
      action: PayloadAction<{ backendHealthy: boolean | null; sidecarHealthy: boolean | null }>
    ) => {
      state.backendHealthy = action.payload.backendHealthy;
      state.sidecarHealthy = action.payload.sidecarHealthy;
    },
    setSuppliers: (state, action: PayloadAction<Supplier[]>) => {
      state.suppliers = action.payload && action.payload.length > 0 ? action.payload : DEFAULT_SUPPLIERS;
    },
    setBuyers: (state, action: PayloadAction<Buyer[]>) => {
      state.buyers = action.payload;
    },
    setBuyerLists: (state, action: PayloadAction<BuyerList[]>) => {
      state.buyerLists = ensureDefaultBuyerLists(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkSystemHealth.fulfilled, (state, action) => {
        state.backendHealthy = action.payload.backendHealthy;
        state.sidecarHealthy = action.payload.sidecarHealthy;
      })
      .addCase(checkSystemHealth.rejected, (state) => {
        state.backendHealthy = false;
        state.sidecarHealthy = false;
      })
      .addCase(fetchCoreReferenceData.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCoreReferenceData.fulfilled, (state, action) => {
        state.loading = false;
        state.suppliers = action.payload.suppliers && action.payload.suppliers.length > 0 ? action.payload.suppliers : DEFAULT_SUPPLIERS;
        state.buyers = action.payload.buyers;
        state.buyerLists = ensureDefaultBuyerLists(action.payload.buyerLists || []);
      })
      .addCase(fetchCoreReferenceData.rejected, (state, action) => {
        state.loading = false;
        if (!state.suppliers || state.suppliers.length === 0) {
          state.suppliers = DEFAULT_SUPPLIERS;
        }
        state.error = action.payload as string || 'Error fetching core reference data';
      })
      .addCase(fetchAnalyticsSummaryThunk.pending, (state) => {
        state.analyticsLoading = true;
      })
      .addCase(fetchAnalyticsSummaryThunk.fulfilled, (state, action) => {
        state.analyticsLoading = false;
        state.analyticsSummary = action.payload;
      })
      .addCase(fetchAnalyticsSummaryThunk.rejected, (state, action) => {
        state.analyticsLoading = false;
        state.error = action.payload as string || 'Error fetching analytics summary';
      })
      .addCase(fetchBuyerLists.fulfilled, (state, action) => {
        state.buyerLists = ensureDefaultBuyerLists(action.payload || []);
      })
      .addCase(createBuyerListThunk.fulfilled, (state, action) => {
        if (action.payload) {
          state.buyerLists.push(action.payload);
        }
      })
      .addCase(updateBuyerListThunk.fulfilled, (state, action) => {
        if (action.payload) {
          const idx = state.buyerLists.findIndex((l) => l._id === action.payload._id);
          if (idx >= 0) {
            state.buyerLists[idx] = { ...state.buyerLists[idx], ...action.payload };
          }
        }
      })
      .addCase(deleteBuyerListThunk.fulfilled, (state, action) => {
        state.buyerLists = ensureDefaultBuyerLists(state.buyerLists.filter((l) => l._id !== action.payload));
      })
      .addCase(updateBuyerListMembersThunk.fulfilled, (state, action) => {
        if (action.payload) {
          const idx = state.buyerLists.findIndex((l) => l._id === action.payload._id);
          if (idx >= 0) {
            state.buyerLists[idx] = { ...state.buyerLists[idx], ...action.payload };
          }
        }
      });
  },
});

export const {
  setActiveTab,
  setReturnTab,
  setSidebarExpanded,
  toggleSidebarExpanded,
  setHealthStatus,
  setSuppliers,
  setBuyers,
  setBuyerLists,
} = coreSlice.actions;

export const selectBuyerLists = (state: RootState) => ensureDefaultBuyerLists(state.core.buyerLists);
export const selectBuyers = (state: RootState) => state.core.buyers;

export const selectAnalyticsSummary = (state: RootState) => state.core.analyticsSummary;
export const selectAnalyticsLoading = (state: RootState) => state.core.analyticsLoading;
const selectInventoryList = (state: RootState) => (state.inventory ? state.inventory.inventoryList : []);

export const selectCOGSRecoveryMetrics = createSelector(
  [selectAnalyticsSummary, selectInventoryList],
  (summaryData, inventoryList) => {
    if (!summaryData?.summary) {
      const totalCOGS = inventoryList.reduce((sum: number, lot: any) => sum + (lot.quantityCases * (lot.costPerCase ?? 0)), 0);
      return {
        cogsRecoveryRate: 0,
        totalRecoveredValue: 0,
        totalSoldCOGS: 0,
        totalCOGS,
        wasteDivertedTons: 0,
        landfillFeesSaved: 0,
        co2SavedTons: 0,
      };
    }
    const summary = summaryData.summary;
    const totalCOGS = summary.totalCOGS || inventoryList.reduce((sum: number, lot: any) => sum + (lot.quantityCases * (lot.costPerCase ?? 0)), 0);
    return {
      cogsRecoveryRate: summary.cogsRecoveryRate || 0,
      totalRecoveredValue: summary.totalRecoveredValue || 0,
      totalSoldCOGS: summary.totalSoldCOGS || 0,
      totalCOGS,
      wasteDivertedTons: summary.wasteDivertedTons || 0,
      landfillFeesSaved: summary.landfillFeesSaved || 0,
      co2SavedTons: summary.co2SavedTons || 0,
    };
  }
);

export const selectRSLDistribution = createSelector(
  [selectAnalyticsSummary],
  (summaryData) => {
    if (!summaryData?.summary?.caseStats) {
      return {
        caseStats: {
          total: 0,
          sold: 0,
          donated: 0,
          recycled: 0,
          expired: 0,
          leftoverRate: 0,
        },
        categoryBreakdown: [],
      };
    }
    return {
      caseStats: summaryData.summary.caseStats,
      categoryBreakdown: summaryData.categoryBreakdown || [],
    };
  }
);

export const selectLandfillDiversionStats = createSelector(
  [selectAnalyticsSummary],
  (summaryData) => {
    const trends = summaryData?.trends || [];
    const maxTons = Math.max(...trends.map((t: any) => t.divertedTons || 0), 30);
    return {
      trends,
      maxTons,
    };
  }
);

export default coreSlice.reducer;
