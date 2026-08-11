---
id: 0038-slice-3-surplus-inventory-marketplace-vertical-slice
title: "Slice 3: Surplus Inventory & Marketplace Vertical Slice (`inventorySlice`, `InventoryService`, `InventoryListView`, `MarketplaceView`, Global Modals)"
status: VERIFIED
assignee: "@antigravity"
parent_issue: "0035-monolith-to-modular-architecture-refactor-epic.md"
dependencies: ["0036-slice-1-foundation-core-domain-refactor.md"]
---

# Slice 3: Surplus Inventory & Marketplace Vertical Slice (`inventorySlice`, `InventoryService`, `InventoryListView`, `MarketplaceView`, Global Modals)

## Objective
Extract and modularize the surplus inventory management (`Inventory` tab) and the B2B surplus marketplace (`Marketplace` tab) from `App.tsx` into a robust, self-contained domain slice within our new 4-layer architecture. This slice must encapsulate inventory listing, sorting, complex filtering, remaining shelf-life (RSL) calculations, risk assessment profiles, compliance documentation (`COA`, `Batch Records`), marketplace buyer profile filtering (`transportRadius`, `excludedAllergens`), and bid award workflows.

## Acceptance Criteria
- [x] Create `inventorySlice.ts` containing normalized Redux state for `inventoryList`, `selectedLot`, `filterSettings`, `riskAssessment`, `compliance`, and `modals`.
- [x] Implement memoized selectors using `Reselect` (`createSelector`) for high-performance multi-criteria filtering (`selectFilteredInventoryLots`, `selectActiveMarketplaceListings`).
- [x] Create `InventoryService.ts` encapsulating all API endpoints (`/inventory`, `/inventory/lot/{id}/assess-risk`, `/inventory/lot/{id}/compliance`, `/marketplace`, `/inventory/{id}/bids/award`).
- [x] Create lazy-loaded `InventoryListView` (`InventoryFilterBar`, `InventoryTable`, `RiskAssessmentModal`) and `MarketplaceView` (`MarketplaceCard`, `ListingGrid`).
- [x] Mount the cross-domain `AwardModal` and `EmailSentVisualizer` centrally inside `GlobalModals` (`AppShell`), allowing them to be triggered via Redux actions from either the inventory table or marketplace cards.
- [x] Maintain 100% pixel fidelity by preserving existing CSS classes (`premium-table`, `badge`, `kpi-card`, `buyer-marketplace-grid`, etc.) from `App.tsx`.
- [x] Verify complete vertical slice functionality with unit and integration tests using `Vitest` + `React Testing Library` + `jsdom` (`/tdd` Red-Green-Refactor loop).

## Technical Specification & Architecture Plan

### 1. State Layer (`inventorySlice.ts`)
```typescript
interface InventoryState {
  inventoryList: any[];
  selectedLot: any | null;
  listFilterSearch: string;
  listFilterSupplier: string;
  listFilterDC: string;
  listFilterCategory: string;
  listFilterStatus: string;
  sortField: 'sku' | 'supplier' | 'warehouse' | 'expirationDate' | 'availableQty' | 'costPerCase' | 'createdAt' | 'updatedAt' | 'status';
  sortDirection: 'asc' | 'desc';
  currentPage: number;
  itemsPerPage: number;
  selectedBuyerEmail: string;
  riskAssessment: {
    loading: boolean;
    data: any | null;
    error: string | null;
  };
  compliance: {
    uploading: boolean;
    error: string | null;
  };
  modals: {
    showRiskModal: boolean;
    selectedLotForRisk: any | null;
    showComplianceModal: boolean;
    selectedLotForCompliance: any | null;
    showAwardModal: boolean;
    selectedBidToAward: any | null;
    selectedLotForAward: any | null;
    awardedQtyInput: number;
    emailDraftSubject: string;
    emailDraftBody: string;
    showEmailSentVisualizer: boolean;
    visualizerEmailDetails: any | null;
    txLoading: boolean;
  };
}
```

### 2. Memoized Selectors (`Reselect`)
```typescript
export const selectFilteredInventoryLots = createSelector(
  [selectRawInventoryList, selectInventoryFilters, selectSortSettings],
  (list, filters, sort) => {
    // Multi-attribute filtering across description, SKU, supplier, DC, category, status
    // RSL sorting & multi-field comparator
  }
);

export const selectActiveMarketplaceListings = createSelector(
  [selectRawInventoryList, selectSelectedBuyerEmail, selectCoreBuyers],
  (list, selectedBuyerEmail, buyers) => {
    // Filter active listings & apply allergen exclusions against active buyer profile
  }
);
```

### 3. Service Layer (`InventoryService.ts`)
Encapsulates:
- `fetchInventoryLots(liquidationCycleId?: string)`
- `fetchMarketplaceListings()`
- `assessLotRisk(lotId: string)`
- `updateLotCompliance(lotId: string, updates: any)`
- `uploadComplianceDoc(lotId: string, docType: string, file: File)`
- `enableBidding(lotId: string, payload: any)`
- `awardBid(lotId: string, bidId: string, payload: { emailSent: string; emailSubject?: string; awardedQty?: number })`

## Tracer Bullet Implementation Slices (`/tdd`)
1. **Tracer Bullet 1: Inventory Slice & Memoized Selectors** (`[x]`)
   - Test: `inventorySliceAndSelectors.test.ts`
   - Target: `store/slices/inventorySlice.ts`, `store/index.ts`
2. **Tracer Bullet 2: Service Layer & Async Thunks** (`[x]`)
   - Test: `inventoryServiceAndThunks.test.ts`
   - Target: `services/inventoryService.ts`
3. **Tracer Bullet 3: Domain Components & Lazy-Loaded Views** (`[x]`)
   - Test: `InventoryAndMarketplaceViews.test.tsx`
   - Target: `components/domain/inventory/*`, `views/InventoryListView.tsx`, `views/MarketplaceView.tsx`
4. **Tracer Bullet 4: Global Modals & Cross-Domain Triggering** (`[x]`)
   - Test: `GlobalModalsAndAppIntegration.test.tsx`
   - Target: `components/modals/AwardModal.tsx`, `EmailSentVisualizer.tsx`, `GlobalModals.tsx`, `components/shell/AppShell.tsx` #36
