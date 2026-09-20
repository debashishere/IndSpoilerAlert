# 0121: Slice 3 - Inventory Pipeline Modern Grid & Progressive Inspection Drawer

**What to build:**
Rebuild the Inventory Pipeline table view to match the Stitch design tokens and progressive inspection behavior:
1. Dedicated Inventory Filter Bar with 5 controls: Product/SKU search, Supplier select, Distribution Center select, Category select, and Status select, plus Clear Filters.
2. Modern table header and rows displaying Product/SKU, Supplier, DC, Expiration & RSL progress bar, Storage Temp, Quantity Cases, Price Details, Create Date, and Status badge.
3. Row click toggles the in-situ **Progressive Row Inspection Drawer** directly underneath the row, revealing:
   - Cold-Chain Telemetry (temperature range, sensor status, pallet count)
   - FEFO Lifecycle Matrix (pack date, exp date, FEFO priority rank)
   - Valuation & Recovery Margin (MSRP, Target Liquidation, Min Reserve)
   - Batch Operations containing the primary **"Open Operations Hub"** button calling `onOpenLotHub(lot)`, alongside COA, Quarantine, and Push to Bidding.
4. Synchronized with the master `Toggle All` button in the header (expands all rows if any are closed, collapses all if all are open).

**Blocked by:** `0119-slice-1-ingestion-shell-telemetry-connectors-and-master-tab-bar`

**Status:** completed

- [x] Filter bar correctly filters inventory lots by SKU/description, supplier, warehouse DC, category, and lifecycle status.
- [x] Table rows match the Stitch visual design (product pill tags, RSL shelf-life bar, price details).
- [x] Clicking a lot row expands/collapses the inline Progressive Row Inspection Drawer with smooth accordion behavior.
- [x] The inspection drawer displays cold-chain metrics, FEFO dates, valuation numbers, and batch operations.
- [x] Clicking "Open Operations Hub" invokes `onOpenLotHub(lot)` with the selected lot.
- [x] Master "Toggle All" expands or collapses all visible inventory inspection drawers and synchronizes its label.
- [x] Unit tests verify filter operations, drawer toggling, "Open Operations Hub" dispatch, and Toggle All synchronization.

