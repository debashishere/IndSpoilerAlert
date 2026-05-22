# Liquidation Cycles and Dynamic Reconciliation

We decided to introduce a `LiquidationCycle` metadata container and use dynamic reconciliation (FEFO allocation) instead of a rigid parent list collection structure to group and reconcile inventory and sales reports.

### Context
When suppliers upload heterogeneous stock reports and sales reports, they need to consolidate them to calculate net available stock and audit historical campaigns. A simple parent-child document structure (like `ParentList` embedding inventory and sales arrays) would lead to large MongoDB document sizes, concurrent modification locks, and tight data coupling.

### Rationale
- **Dynamic Reconciliation**: By calculating net available stock using `InventoryLot.availableQty` and writing discrete `Sale` records, we avoid concurrency issues. If a sales report lacks a lot number, we use a First Expiring, First Out (FEFO) allocation algorithm to match the sale to the soonest-expiring active inventory lot for that SKU.
- **Flat Campaign Schema**: The `LiquidationCycle` acts as a lightweight logical container. `InventoryLot` and `Sale` documents reference a `liquidationCycleId`, allowing us to query and aggregate data dynamically for specific liquidation windows without nested document constraints.
- **Workflow Automation Hook**: This campaign-based structure allows `LiquidationAutomation` templates to easily target, filter, and automate bids, listings, and donations within a specific cycle's scope.
