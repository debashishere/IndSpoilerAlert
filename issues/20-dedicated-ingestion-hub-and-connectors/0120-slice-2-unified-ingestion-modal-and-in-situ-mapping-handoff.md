# 0120: Slice 2 - Unified Ingestion Modal & In-Situ Mapping Handoff

**What to build:**
Build the **Unified Surplus Data Ingestion Modal** and connect it end-to-end to the **Ingestion Mapping Window**:
1. Clicking "Upload File" in the CSV / Excel connector card (or any pipeline "Import CSV" button) opens the modal.
2. Step 1 provides dataset destination selection: `Inventory Data`, `Sales Data`, or `Buyer Data`.
3. Step 2 provides a drag-and-drop file uploader accepting `.csv`, `.xlsx`, and `.xls` files with file preview.
4. On clicking "Ingest Dataset", the modal closes, the active pipeline tab switches to the selected target, and the file is parsed via the corresponding thunk (`uploadInventoryThunk`, `uploadSalesThunk`, or `uploadBuyerThunk`).
5. The **Ingestion Mapping Window** mounts in-situ directly above that pipeline's table, allowing the user to map column headers to domain fields, review raw preview rows, and click "Confirm & Import" or "Cancel".

**Blocked by:** `0119-slice-1-ingestion-shell-telemetry-connectors-and-master-tab-bar`

**Status:** completed

- [x] `UnifiedIngestionModal` renders Step 1 (3-card target destination selector) and Step 2 (drag-and-drop zone with file size formatting).
- [x] Passing an initial target pre-selects the corresponding pipeline radio (e.g. clicking Import in Buyer pipeline pre-selects `buyer`).
- [x] Submitting the modal invokes file parsing, dismisses the modal, and transitions the active pipeline tab.
- [x] The Ingestion Mapping Window renders the spreadsheet preview table and column mapping dropdowns in-situ above the table.
- [x] Confirming the mapping commits records to the registry, while cancelling restores normal table display.
- [x] Unit and integration tests verify modal open/close, target switching, and mapping handoff.
