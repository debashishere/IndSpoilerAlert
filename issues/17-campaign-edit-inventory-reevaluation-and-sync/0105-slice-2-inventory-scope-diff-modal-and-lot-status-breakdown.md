# 0105 — Slice 2: Inventory Scope Diff Modal & Lot Status Breakdown

**What to build:**
Implement an interactive **"Inventory Re-evaluation Diff Breakdown"** modal in `LiquidationAutomationStudio.tsx` triggered by the `[Review Lot Breakdown]` action button in the drift banner.

This modal categorizes all inventory lots associated with the campaign into clear audit buckets so users can easily see why the lot count changed over time.

**Key Specifications:**
1. **Lot Categorization & Diff Engine**:
   - Compare `latestRun.snapshotInventoryIds` (historical lot IDs) against `matchedLots` (current eligible lots) and `allInventoryLots` (warehouse inventory pool):
     - **Currently Eligible** (in `matchedLots`): Green badge with current RSL % and available cases.
     - **Liquidated / Sold** (in historical snapshot, but `availableQty === 0` or status is `sold`/`inactive`): Neutral/slate badge.
     - **Aged Out / Expired** (in historical snapshot, but `calculateLotRsl(lot) === 0` or passed expiration date): Red badge.
     - **Newly Eligible** (not in historical snapshot, but matches current RSL/category criteria): Blue badge.
2. **Modal Presentation & Controls**:
   - Header with summary chips: `1 Currently Eligible` • `98 Liquidated` • `5 Expired` • `0 Newly Added`.
   - Filterable tabs: `All Lots`, `Eligible Only`, `Previously Processed (Unavailable)`.
   - Data table displaying: `Lot #`, `SKU / Description`, `Current RSL %`, `Available Cases`, `Status / Reason`.
   - Pagination (default 10 per page, max 30).
   - Close / Done action button.

**Acceptance Criteria:**
- [x] Clicking `[Review Lot Breakdown]` in the drift banner opens the Inventory Scope Diff modal.
- [x] Accurately categorizes lots into Currently Eligible, Liquidated/Depleted, Expired/Aged Out, and Newly Eligible.
- [x] Data table renders SKU, Description, RSL %, Quantity, and Status badge for each lot.
- [x] Table pagination and category filter chips function smoothly.
- [x] Comprehensive unit and interaction tests covering diff calculation and modal rendering.
