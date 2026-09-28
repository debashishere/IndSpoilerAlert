import { createSlice, createAsyncThunk, createSelector, type PayloadAction } from '@reduxjs/toolkit';
import coreService, { DEFAULT_SUPPLIERS } from '../../services/coreService';
import networkService from '../../services/networkService';
import type { RootState } from '../index';

export interface Supplier {
  _id: string;
  name: string;
  companyCode: string;
  preferredDisposition: string;
  email?: string;
  userId?: string;
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
  id?: string;
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

export interface SalesTrajectoryPoint {
  period: string;
  revenue: number;
  volume: number;
}

export interface CategoryRecoveryData {
  category: string;
  revenue: number;
  cogs: number;
  recoveryPct: number;
}

export interface ChannelDistributionData {
  channel: string;
  revenue: number;
  pct: number;
}

export interface CloseoutTransactionPoint {
  id: string;
  sku: string;
  product: string;
  rslDays: number;
  price: number;
  recoveryPct: number;
  buyer: string;
  saleDate: string;
}

export interface SalesAnalyticsData {
  totalRevenue: number;
  revenueGrowthPct: number;
  totalVolume: number;
  avgPrice: number;
  reconciledCount: number;
  totalCount: number;
  categories: string[];
  warehouses: string[];
  trajectory: SalesTrajectoryPoint[];
  categoryRecovery?: CategoryRecoveryData[];
  channelDistribution?: ChannelDistributionData[];
  recentCloseouts?: CloseoutTransactionPoint[];
}

export interface WorkflowYieldData {
  yieldPct: number;
  successfulRuns: number;
  totalRuns: number;
}

export interface TurnaroundBucket {
  count: number;
  pct: number;
}

export interface TurnaroundDistributionData {
  under2h: TurnaroundBucket;
  twoToSixH: TurnaroundBucket;
  sixToTwentyFourH: TurnaroundBucket;
  over24h: TurnaroundBucket;
  totalEvaluated: number;
}

export interface ColdChainComplianceData {
  dockCompliancePct: number;
  tempCompliancePct: number;
  totalShipments: number;
  totalColdLogs: number;
}

export interface PlatformSlaYieldDistributionData {
  workflowYield: WorkflowYieldData;
  turnaroundDistribution: TurnaroundDistributionData;
  coldChainCompliance: ColdChainComplianceData;
}

export interface OperationsAnalyticsData {
  timeframe: string;
  ingestion: {
    portfolioValue: string;
    portfolioValueRaw: number;
    criticalRsl: string;
    criticalRslCount: number;
    liquidationVelocity: string;
    liquidationVelocityRaw: number;
    matchedBuyers: string;
    matchedBuyersCount: number;
  };
  buyerComms: {
    activeBuyers: number;
    dispatchVolume: number;
    engagementRate: number;
    responseVelocityHours: number;
  };
  workflowCampaigns: {
    activeCampaigns: number;
    inactiveCampaigns: number;
    casesInScope: number;
    automationRuns: number;
    executionYield: number;
  };
  coldChain: {
    tempComplianceSla: string;
    fsma204Status: string;
    dockSla: string;
    logisticsLinkStatus: string;
  };
  velocityTrendline?: VelocityTrendPoint[];
  distribution?: PlatformSlaYieldDistributionData;
}

export interface VelocityTrendPoint {
  date: string;
  label: string;
  lots: number;
  runs: number;
  dispatches: number;
}

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
  salesAnalytics: SalesAnalyticsData | null;
  salesAnalyticsLoading: boolean;
  operationsAnalytics: OperationsAnalyticsData | null;
  operationsAnalyticsLoading: boolean;
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
  async (params: { all?: boolean; supplierId?: string; token?: string } | boolean | string | undefined = undefined, { rejectWithValue, getState }) => {
    try {
      let supplierId: string | undefined;
      let token: string | undefined;
      let all: boolean | undefined;

      if (typeof params === 'object' && params !== null) {
        supplierId = params.supplierId;
        token = params.token;
        all = params.all;
      } else if (typeof params === 'string') {
        supplierId = params;
      } else if (typeof params === 'boolean') {
        all = params;
      }

      if (!supplierId) {
        const state = getState() as any;
        supplierId = state?.ingestion?.selectedSupplier || undefined;
      }

      const [suppliers, buyers, buyerLists] = await Promise.all([
        coreService.getSuppliers(),
        coreService.getBuyers({ all, supplierId, token }),
        networkService.getBuyerLists(supplierId, token),
      ]);
      return { suppliers, buyers, buyerLists };
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch core reference data');
    }
  }
);

export const fetchBuyerLists = createAsyncThunk(
  'core/fetchBuyerLists',
  async (supplierIdOrOptions: { supplierId?: string; token?: string } | string | undefined = undefined, { rejectWithValue, getState }) => {
    try {
      let supplierId: string | undefined;
      let token: string | undefined;

      if (typeof supplierIdOrOptions === 'object' && supplierIdOrOptions !== null) {
        supplierId = supplierIdOrOptions.supplierId;
        token = supplierIdOrOptions.token;
      } else if (typeof supplierIdOrOptions === 'string') {
        supplierId = supplierIdOrOptions;
      }

      if (!supplierId) {
        const state = getState() as any;
        supplierId = state?.ingestion?.selectedSupplier || undefined;
      }

      const lists = await networkService.getBuyerLists(supplierId, token);
      return lists;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch buyer lists');
    }
  }
);

export const createBuyerListThunk = createAsyncThunk(
  'core/createBuyerList',
  async (payload: { name: string; description?: string; supplierId?: string }, { rejectWithValue }) => {
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

export const fetchSalesAnalyticsThunk = createAsyncThunk(
  'core/fetchSalesAnalytics',
  async (
    params: { timeframe?: string; category?: string; warehouse?: string; supplierId?: string; token?: string } = {},
    { rejectWithValue, getState }
  ) => {
    try {
      let supplierId = params.supplierId;
      if (!supplierId) {
        const state = getState() as any;
        supplierId = state?.ingestion?.selectedSupplier || undefined;
      }
      return await coreService.fetchSalesAnalytics({ ...params, supplierId });
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch sales analytics');
    }
  }
);

export const fetchOperationsAnalyticsThunk = createAsyncThunk(
  'core/fetchOperationsAnalytics',
  async (
    params: { timeframe?: string; supplierId?: string; token?: string } = {},
    { rejectWithValue, getState }
  ) => {
    try {
      let supplierId = params.supplierId;
      if (!supplierId) {
        const state = getState() as any;
        supplierId = state?.ingestion?.selectedSupplier || undefined;
      }
      return await coreService.fetchOperationsAnalytics({ ...params, supplierId });
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch operations analytics');
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

export const DEFAULT_BUYER_LISTS: BuyerList[] = [];

export function ensureDefaultBuyerLists(lists: BuyerList[] = []): BuyerList[] {
  if (!Array.isArray(lists)) return [];
  const uniqueLists: BuyerList[] = [];
  const seenIds = new Set<string>();

  for (const list of lists) {
    if (!list) continue;
    const id = list._id || list.id;
    if (id && seenIds.has(id)) continue;
    if (id) seenIds.add(id);
    uniqueLists.push(list);
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
  buyerLists: [],
  loading: false,
  error: null,
  analyticsSummary: null,
  analyticsLoading: false,
  salesAnalytics: null,
  salesAnalyticsLoading: false,
  operationsAnalytics: null,
  operationsAnalyticsLoading: false,
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
    clearSupplierState: (state) => {
      state.suppliers = DEFAULT_SUPPLIERS;
      state.buyerLists = [];
      state.buyers = [];
      state.error = null;
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
      .addCase(fetchSalesAnalyticsThunk.pending, (state) => {
        state.salesAnalyticsLoading = true;
      })
      .addCase(fetchSalesAnalyticsThunk.fulfilled, (state, action) => {
        state.salesAnalyticsLoading = false;
        state.salesAnalytics = action.payload;
      })
      .addCase(fetchSalesAnalyticsThunk.rejected, (state, action) => {
        state.salesAnalyticsLoading = false;
        state.error = action.payload as string || 'Error fetching sales analytics';
      })
      .addCase(fetchOperationsAnalyticsThunk.pending, (state) => {
        state.operationsAnalyticsLoading = true;
      })
      .addCase(fetchOperationsAnalyticsThunk.fulfilled, (state, action) => {
        state.operationsAnalyticsLoading = false;
        state.operationsAnalytics = action.payload;
      })
      .addCase(fetchOperationsAnalyticsThunk.rejected, (state, action) => {
        state.operationsAnalyticsLoading = false;
        state.error = action.payload as string || 'Error fetching operations analytics';
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
  clearSupplierState,
} = coreSlice.actions;

const selectRawBuyerLists = (state: RootState) => state.core.buyerLists;
export const selectBuyerLists = createSelector(
  [selectRawBuyerLists],
  (buyerLists) => ensureDefaultBuyerLists(buyerLists)
);
export const selectBuyers = (state: RootState) => state.core.buyers;

export const selectAnalyticsSummary = (state: RootState) => state.core.analyticsSummary;
export const selectAnalyticsLoading = (state: RootState) => state.core.analyticsLoading;
export const selectSalesAnalytics = (state: RootState) => state.core.salesAnalytics;
export const selectSalesAnalyticsLoading = (state: RootState) => state.core.salesAnalyticsLoading;
export const selectOperationsAnalytics = (state: RootState) => state.core.operationsAnalytics;
export const selectOperationsAnalyticsLoading = (state: RootState) => state.core.operationsAnalyticsLoading;
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
