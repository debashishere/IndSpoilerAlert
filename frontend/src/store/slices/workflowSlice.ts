import { createSlice, createSelector, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';
import {
  fetchLiquidationCyclesThunk,
  createLiquidationCycleThunk,
  updateLiquidationCycleThunk,
  deleteLiquidationCycleThunk,
  fetchLiquidationAutomationsThunk,
  createLiquidationAutomationThunk,
  updateLiquidationAutomationThunk,
  deleteLiquidationAutomationThunk,
  patchLiquidationAutomationStatusThunk,
  previewEmailTokenThunk,
  fetchAutomationRunsThunk,
  forceExpireRunThunk
} from '../../services/workflowService';

export interface StageGate {
  stageNumber: number;
  name: string;
  stageType?: 'liquidation' | 'donation' | 'landfill';
  disposalDeadline?: string;
  allocatedLotIds?: string[];
  discountType: 'fixed_price' | 'percentage_off_wholesale' | 'percentage_off_retail';
  discountValue: number;
  waitHours: number;
  buyerMode: 'segment' | 'custom' | 'all';
  buyerSegment?: string;
  customBuyers: any[];
  autoExecute: boolean;
}

export interface WorkflowState {
  liquidationCycles: any[];
  liquidationAutomations: any[];
  automationRuns: any[];
  loading: boolean;
  error: string | null;
  editingCampaignId: string | null;
  showCampaignDrawer: boolean;
  campaignWizardStep: number;
  workflowSubTab: 'saved' | 'builder' | 'runs';
  runsFilter: 'all' | 'evaluating' | 'awarded' | 'fallback_executed' | 'failed';
  selectedAutomationTemplate: string;
  stageGates: StageGate[];
  categoryFilter: string;
  maxRslFilter: number;
  minCasesFilter: number;
  explicitLotIds: string[];
  excludedLotIds: string[];
  selectorMode: 'automatic' | 'explicit' | 'hybrid';
  showPreFlightModal: boolean;
  previewHtml: string | null;
  previewLoading: boolean;
  selectedCycleId: string | null;
  selectedRunDetails: any | null;
  showRunDetailsModal: boolean;
}

const defaultStages: StageGate[] = [
  {
    stageNumber: 1,
    name: 'Primary Tier Bargain',
    discountType: 'percentage_off_wholesale',
    discountValue: 15,
    waitHours: 24,
    buyerMode: 'segment',
    buyerSegment: 'Tier 1 Wholesale',
    customBuyers: [],
    autoExecute: true,
  },
  {
    stageNumber: 2,
    name: 'Broad Market Clearance',
    discountType: 'percentage_off_wholesale',
    discountValue: 35,
    waitHours: 48,
    buyerMode: 'all',
    customBuyers: [],
    autoExecute: true,
  },
  {
    stageNumber: 3,
    name: 'Final Salvage / Donation Divert',
    discountType: 'fixed_price',
    discountValue: 1.0,
    waitHours: 12,
    buyerMode: 'all',
    customBuyers: [],
    autoExecute: false,
  },
];

const initialState: WorkflowState = {
  liquidationCycles: [],
  liquidationAutomations: [],
  automationRuns: [],
  loading: false,
  error: null,
  editingCampaignId: null,
  showCampaignDrawer: false,
  campaignWizardStep: 1,
  workflowSubTab: 'builder',
  runsFilter: 'all',
  selectedAutomationTemplate: '',
  stageGates: defaultStages,
  categoryFilter: '',
  maxRslFilter: 0,
  minCasesFilter: 0,
  explicitLotIds: [],
  excludedLotIds: [],
  selectorMode: 'automatic',
  showPreFlightModal: false,
  previewHtml: null,
  previewLoading: false,
  selectedCycleId: null,
  selectedRunDetails: null,
  showRunDetailsModal: false,
};

export const workflowSlice = createSlice({
  name: 'workflow',
  initialState,
  reducers: {
    setLiquidationCycles: (state, action: PayloadAction<any[]>) => {
      state.liquidationCycles = action.payload;
    },
    setLiquidationAutomations: (state, action: PayloadAction<any[]>) => {
      state.liquidationAutomations = action.payload;
    },
    setAutomationRuns: (state, action: PayloadAction<any[]>) => {
      state.automationRuns = action.payload;
    },
    setEditingCampaignId: (state, action: PayloadAction<string | null>) => {
      state.editingCampaignId = action.payload;
    },
    setShowCampaignDrawer: (state, action: PayloadAction<boolean>) => {
      state.showCampaignDrawer = action.payload;
    },
    setCampaignWizardStep: (state, action: PayloadAction<number>) => {
      state.campaignWizardStep = action.payload;
    },
    setWorkflowSubTab: (state, action: PayloadAction<'saved' | 'builder' | 'runs'>) => {
      state.workflowSubTab = action.payload;
    },
    setRunsFilter: (state, action: PayloadAction<'all' | 'evaluating' | 'awarded' | 'fallback_executed' | 'failed'>) => {
      state.runsFilter = action.payload;
    },
    setSelectedAutomationTemplate: (state, action: PayloadAction<string>) => {
      state.selectedAutomationTemplate = action.payload;
    },
    setStageGates: (state, action: PayloadAction<StageGate[]>) => {
      state.stageGates = action.payload;
    },
    updateStageGate: (state, action: PayloadAction<{ index: number; updates: Partial<StageGate> }>) => {
      const { index, updates } = action.payload;
      if (state.stageGates[index]) {
        state.stageGates[index] = { ...state.stageGates[index], ...updates };
      }
    },
    setFilterCategory: (state, action: PayloadAction<string>) => {
      state.categoryFilter = action.payload;
    },
    setFilterMaxRsl: (state, action: PayloadAction<number>) => {
      state.maxRslFilter = action.payload;
    },
    setFilterMinCases: (state, action: PayloadAction<number>) => {
      state.minCasesFilter = action.payload;
    },
    setExplicitLotIds: (state, action: PayloadAction<string[]>) => {
      state.explicitLotIds = action.payload;
    },
    setExcludedLotIds: (state, action: PayloadAction<string[]>) => {
      state.excludedLotIds = action.payload;
    },
    toggleExplicitLot: (state, action: PayloadAction<{ lotId: string; included: boolean }>) => {
      const { lotId, included } = action.payload;
      if (included) {
        state.excludedLotIds = [...state.excludedLotIds, lotId];
        state.explicitLotIds = state.explicitLotIds.filter(id => id !== lotId);
      } else {
        state.explicitLotIds = [...state.explicitLotIds, lotId];
        state.excludedLotIds = state.excludedLotIds.filter(id => id !== lotId);
      }
    },
    setSelectorMode: (state, action: PayloadAction<'automatic' | 'explicit' | 'hybrid'>) => {
      state.selectorMode = action.payload;
    },
    setShowPreFlightModal: (state, action: PayloadAction<boolean>) => {
      state.showPreFlightModal = action.payload;
    },
    setPreviewHtml: (state, action: PayloadAction<string | null>) => {
      state.previewHtml = action.payload;
    },
    setSelectedCycleId: (state, action: PayloadAction<string | null>) => {
      state.selectedCycleId = action.payload;
    },
    setSelectedRunDetails: (state, action: PayloadAction<any | null>) => {
      state.selectedRunDetails = action.payload;
    },
    setShowRunDetailsModal: (state, action: PayloadAction<boolean>) => {
      state.showRunDetailsModal = action.payload;
    },
    resetCampaignWizard: (state) => {
      state.editingCampaignId = null;
      state.campaignWizardStep = 1;
      state.selectedAutomationTemplate = '';
      state.categoryFilter = '';
      state.maxRslFilter = 0;
      state.minCasesFilter = 0;
      state.explicitLotIds = [];
      state.excludedLotIds = [];
      state.selectorMode = 'automatic';
      state.stageGates = defaultStages;
    },
  },
  extraReducers: (builder) => {
    // Fetch Cycles
    builder.addCase(fetchLiquidationCyclesThunk.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchLiquidationCyclesThunk.fulfilled, (state, action) => {
      state.loading = false;
      state.liquidationCycles = action.payload;
    });
    builder.addCase(fetchLiquidationCyclesThunk.rejected, (state, action) => {
      state.loading = false;
      state.error = (action.payload as string) || 'Failed to fetch liquidation cycles';
    });

    // Create Cycle
    builder.addCase(createLiquidationCycleThunk.fulfilled, (state, action) => {
      state.liquidationCycles.push(action.payload);
    });

    // Update Cycle
    builder.addCase(updateLiquidationCycleThunk.fulfilled, (state, action) => {
      const idx = state.liquidationCycles.findIndex(c => c._id === action.payload._id || c.id === action.payload.id);
      if (idx !== -1) {
        state.liquidationCycles[idx] = action.payload;
      }
    });

    // Delete Cycle
    builder.addCase(deleteLiquidationCycleThunk.fulfilled, (state, action) => {
      const id = action.meta.arg;
      state.liquidationCycles = state.liquidationCycles.filter(c => c._id !== id && c.id !== id);
    });

    // Fetch Automations
    builder.addCase(fetchLiquidationAutomationsThunk.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchLiquidationAutomationsThunk.fulfilled, (state, action) => {
      state.loading = false;
      const list = Array.isArray(action.payload) ? action.payload : [];
      const map = new Map<string, any>();
      list.forEach((item: any) => {
        const idKey = String(item._id || item.id);
        if (idKey) map.set(idKey, item);
      });
      state.liquidationAutomations = Array.from(map.values());
    });
    builder.addCase(fetchLiquidationAutomationsThunk.rejected, (state, action) => {
      state.loading = false;
      state.error = (action.payload as string) || 'Failed to fetch liquidation automations';
    });

    // Create Automation
    builder.addCase(createLiquidationAutomationThunk.fulfilled, (state, action) => {
      const newId = String(action.payload._id || action.payload.id);
      const idx = state.liquidationAutomations.findIndex(a => String(a._id || a.id) === newId);
      if (idx !== -1) {
        state.liquidationAutomations[idx] = action.payload;
      } else {
        state.liquidationAutomations.push(action.payload);
      }
    });

    // Update Automation
    builder.addCase(updateLiquidationAutomationThunk.fulfilled, (state, action) => {
      const targetId = String(action.payload._id || action.payload.id);
      const idx = state.liquidationAutomations.findIndex(a => String(a._id || a.id) === targetId);
      if (idx !== -1) {
        state.liquidationAutomations[idx] = action.payload;
      } else {
        state.liquidationAutomations.push(action.payload);
      }
    });

    // Patch Automation Status
    builder.addCase(patchLiquidationAutomationStatusThunk.fulfilled, (state, action) => {
      const targetId = String(action.payload._id || action.payload.id);
      const idx = state.liquidationAutomations.findIndex(a => String(a._id || a.id) === targetId);
      if (idx !== -1) {
        state.liquidationAutomations[idx] = action.payload;
      }
    });

    // Delete Automation
    builder.addCase(deleteLiquidationAutomationThunk.fulfilled, (state, action) => {
      const targetId = String(action.meta.arg);
      state.liquidationAutomations = state.liquidationAutomations.filter(a => String(a._id || a.id) !== targetId);
    });


    // Fetch Runs
    builder.addCase(fetchAutomationRunsThunk.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchAutomationRunsThunk.fulfilled, (state, action) => {
      state.loading = false;
      state.automationRuns = action.payload;
    });
    builder.addCase(fetchAutomationRunsThunk.rejected, (state, action) => {
      state.loading = false;
      state.error = (action.payload as string) || 'Failed to fetch automation runs';
    });

    // Preview Email Token
    builder.addCase(previewEmailTokenThunk.pending, (state) => {
      state.previewLoading = true;
    });
    builder.addCase(previewEmailTokenThunk.fulfilled, (state, action) => {
      state.previewLoading = false;
      state.previewHtml = action.payload?.html || null;
    });
    builder.addCase(previewEmailTokenThunk.rejected, (state) => {
      state.previewLoading = false;
    });

    // Force Expire Run
    builder.addCase(forceExpireRunThunk.fulfilled, (state, action) => {
      const idx = state.automationRuns.findIndex(r => r._id === action.meta.arg || r.id === action.meta.arg);
      if (idx !== -1 && action.payload?.status) {
        state.automationRuns[idx].status = action.payload.status;
      }
    });
  },
});

export const {
  setLiquidationCycles,
  setLiquidationAutomations,
  setAutomationRuns,
  setEditingCampaignId,
  setShowCampaignDrawer,
  setCampaignWizardStep,
  setWorkflowSubTab,
  setRunsFilter,
  setSelectedAutomationTemplate,
  setStageGates,
  updateStageGate,
  setFilterCategory,
  setFilterMaxRsl,
  setFilterMinCases,
  setExplicitLotIds,
  setExcludedLotIds,
  toggleExplicitLot,
  setSelectorMode,
  setShowPreFlightModal,
  setPreviewHtml,
  setSelectedCycleId,
  setSelectedRunDetails,
  setShowRunDetailsModal,
  resetCampaignWizard,
} = workflowSlice.actions;

// Reselect Selectors
const selectInventoryList = (state: RootState) => state.inventory?.inventoryList || [];
const selectCategoryFilter = (state: RootState) => state.workflow?.categoryFilter || '';
const selectMaxRslFilter = (state: RootState) => state.workflow?.maxRslFilter || 0;
const selectMinCasesFilter = (state: RootState) => state.workflow?.minCasesFilter || 0;
const selectExplicitLotIds = (state: RootState) => state.workflow?.explicitLotIds || [];
export function calculateLotRsl(lot: any): number {
  if (!lot) return 1.0;
  
  let computedRsl: number | null = null;
  if (lot.expirationDate) {
    const expTime = new Date(lot.expirationDate).getTime();
    if (!isNaN(expTime)) {
      const nowTime = new Date().getTime();
      const daysRemaining = Math.max(0, Math.ceil((expTime - nowTime) / (1000 * 60 * 60 * 24)));
      
      let totalShelfDays = (typeof lot.productId === 'object' ? lot.productId?.shelfLifeDays : undefined) || lot.shelfLifeDays;
      if (!totalShelfDays && lot.productionDate) {
        const totalDiff = expTime - new Date(lot.productionDate).getTime();
        totalShelfDays = Math.max(1, Math.ceil(totalDiff / (1000 * 60 * 60 * 24)));
      }
      if (!totalShelfDays) {
        const lotCat = (typeof lot.productId === 'object' ? lot.productId?.category : '') || lot.category || lot.productCategory || '';
        const categoryDefaults: Record<string, number> = {
          'Dairy': 45, 'Produce': 30, 'Meat': 90, 'Meat & Poultry': 90, 'Beverages': 120, 'Dry Goods': 180, 'Frozen Foods': 180
        };
        totalShelfDays = categoryDefaults[lotCat] || 90;
      }
      
      const r = daysRemaining / totalShelfDays;
      if (!isNaN(r)) {
        computedRsl = Math.min(1.0, Math.max(0.0, r));
      }
    }
  }

  const dbRsl = typeof lot.remainingShelfLife === 'number'
    ? (lot.remainingShelfLife > 1 ? lot.remainingShelfLife / 100 : lot.remainingShelfLife)
    : (typeof lot.rsl === 'number' ? (lot.rsl > 1 ? lot.rsl / 100 : lot.rsl) : null);

  if (dbRsl !== null && dbRsl < 1.0) return dbRsl;
  if (computedRsl !== null && dbRsl !== null) return Math.min(dbRsl, computedRsl);
  if (computedRsl !== null) return computedRsl;
  if (dbRsl !== null) return dbRsl;
  return 1.0;
}

const selectExcludedLotIds = (state: RootState) => state.workflow?.excludedLotIds || [];
const selectSelectorMode = (state: RootState) => state.workflow?.selectorMode || 'automatic';

export const selectMatchedLots = createSelector(
  [selectInventoryList, selectCategoryFilter, selectMaxRslFilter, selectMinCasesFilter, selectExplicitLotIds, selectExcludedLotIds, selectSelectorMode],
  (inventoryList, categoryFilter, maxRslFilter, minCasesFilter, explicitLotIds, excludedLotIds, selectorMode) => {
    return inventoryList.filter((lot: any) => {
      if (!lot) return false;
      const id = lot._id?.toString() || lot.id;
      if (!id) return false;

      if (selectorMode === 'explicit') {
        return explicitLotIds.includes(id);
      }
      if (selectorMode === 'hybrid') {
        if (excludedLotIds.includes(id)) return false;
        if (explicitLotIds.includes(id)) return true;
      }

      if (excludedLotIds.includes(id)) return false;
      if (explicitLotIds.includes(id)) return true;
      if (categoryFilter && lot.productId?.category !== categoryFilter) return false;
      const lotRsl = calculateLotRsl(lot);
      const normalizedMaxRsl = (maxRslFilter !== undefined && maxRslFilter !== null && maxRslFilter !== 0)
        ? (maxRslFilter >= 100 ? 1.0 : (maxRslFilter >= 1 ? (maxRslFilter === 1 ? 1.0 : maxRslFilter / 100) : maxRslFilter))
        : null;
      if (normalizedMaxRsl !== null && normalizedMaxRsl < 1 && lotRsl > normalizedMaxRsl) return false;
      if (minCasesFilter > 0 && (lot.availableQty ?? lot.quantityCases ?? 0) < minCasesFilter) return false;
      return true;
    });
  }
);

export const selectLiveImpactMetrics = createSelector(
  [selectMatchedLots],
  (matchedLots) => {
    const totalLots = matchedLots.length;
    const totalCases = matchedLots.reduce((a, l) => a + (l?.availableQty ?? l?.quantityCases ?? 0), 0);
    const totalValue = matchedLots.reduce((a, l) => {
      const cases = l?.availableQty ?? l?.quantityCases ?? 0;
      return a + (cases * (l?.costPerCase || l?.standardSellPrice || 10));
    }, 0);
    const urgentLots = matchedLots.filter(l => (l?.remainingShelfLife ?? 1) <= 0.15).length;
    return {
      totalLots,
      totalCases,
      totalValue,
      urgentLots,
      matchedLots
    };
  }
);

export default workflowSlice.reducer;
