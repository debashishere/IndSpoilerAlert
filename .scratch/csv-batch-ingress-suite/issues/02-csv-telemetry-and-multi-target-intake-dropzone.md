# 02: CSV Telemetry & Multi-Target Intake Dropzone

**What to build:** An operator accessing the CSV / Excel Upload tab sees Quadrant 1 (Header & operational health telemetry: status badge `Manual Ingress Active`, and live KPIs: Total Batches Ingested, Total Rows Processed, and Active Pipeline Target) and Quadrant 2 (Destination pipeline target picker: `Inventory Data`, `Sales Data`, `Buyer Data`, coupled with an institutional drag-and-drop file dropzone supporting `.csv`, `.xlsx`, and `.xls` up to 100 MB). Selecting or dropping a file stages the spreadsheet, triggers file parsing via the existing ingestion thunk matching the selected target, and prepares raw grid headers for mapping.

**Blocked by:** #4 (01: Sub-Routing, Connector Shell 4th Tab & Hub Navigation Seam)

**Status:** completed

- [x] Implement Quadrant 1 Header & Telemetry with live status pill, latency/throughput metrics, and active target indicator.
- [x] Implement Quadrant 2 Target Selector supporting 3-way destination switching (`inventory`, `sales`, `buyers`) with visual feedback and radio group semantics.
- [x] Implement drag-and-drop and file browser dropzone supporting CSV and Excel spreadsheets with file size formatting and error boundaries.
- [x] Connect dropzone file submission to parser dispatch (`uploadInventoryThunk`, `uploadSalesThunk`, or `uploadBuyerThunk`), populating `parsedResult` with column headers and sample rows.
- [x] Unit tests verify target switching, drag-and-drop file staging, error messaging for invalid formats, and parser execution.

