# 02: Contextual Ingestion Manual Record Creation Modals and Tab Actions

**What to build:** Ingestion operators can record single surplus inventory lots or direct sales clearances on-demand without running full batch CSV/Excel parsing pipelines. The `PipelineSwitcherBar` renders contextual primary action buttons: "Create Inventory" on the Inventory tab and "Create Sales" on the Sales tab. Clicking either button opens a dedicated custom modal form (`CreateInventoryModal` and `CreateSalesModal`) covering institutional fields (SKU, Lot #, Cases, Pricing, Expiration Date, DC Location, Storage Temp, Buyer Organization) that immediately update Redux state, active table rosters, and telemetry counters.

**Blocked by:** 01: Streamline Pipeline Switcher Tab Labels and Standardize Create Buyer Action

**Status:** ready-for-agent

- [x] `PipelineSwitcherBar` exposes `onCreateInventory` and `onCreateSales` props and mounts contextual buttons (`#create-inventory-btn` and `#create-sales-btn`) under their respective active tabs.
- [x] Dedicated custom form modal `CreateInventoryModal` is implemented with validation for Product Name, SKU, Cases, Expiration Date, Unit Cost, Sell Price, Storage Temp, and DC Location.
- [x] Dedicated custom form modal `CreateSalesModal` is implemented with validation for Product Name, SKU, Lot #, Buyer Organization, Quantity Sold, Price Per Case, Status, and Sale Date.
- [x] Redux reducers `addInventoryLot` in `inventorySlice` and `addSalesRecord` in `ingestionSlice` are added and exported.
- [x] Submitting the custom forms immediately unshifts the new records into active table rosters and telemetry in Redux.
- [x] Decoupled custom event listeners (`open-create-inventory-modal`, `open-create-sales-modal`) are supported in `IngestionView` and panel workbenches.
