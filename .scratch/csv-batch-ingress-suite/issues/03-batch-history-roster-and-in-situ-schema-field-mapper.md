# 03: Batch History Roster & In-Situ Schema Field Mapper

**What to build:** An operator staging a CSV/Excel file in the suite can inspect recent imports in Quadrant 3 (Batch Ingestion History Roster displaying File Name, Pipeline Target, Records Ingested, Ingestion Status, Timestamp, and Re-stage action) and configure column mappings directly in Quadrant 4 via an in-situ `GridMapperTable`. The mapper displays parsed source headers against target domain attributes with semantic translation rules and a "Confirm & Ingest" action. On successful confirmation, Quadrant 4 displays an in-situ completion banner detailing created lot/record IDs, updates the batch history roster in Quadrant 3, and provides explicit CTAs ("View in Pipeline Table →" and "Ingest Another File").

**Blocked by:** #5 (02: CSV Telemetry & Multi-Target Intake Dropzone)

**Status:** completed

- [x] Implement Quadrant 3 Batch Ingestion History & Audit Roster showing historical/staged batches with status indicators and record counts.
- [x] Implement Quadrant 4 embedding `GridMapperTable` configured for the active destination target (`inventory`, `sales`, or `buyers`).
- [x] Wire confirmation dispatch to `confirmInventoryThunk`, `confirmSalesThunk`, or `confirmBuyerThunk` upon clicking "Confirm & Ingest".
- [x] Render in-situ post-ingestion success banner displaying created lot count and generated IDs without leaving the page.
- [x] Provide explicit action CTAs to transition to the pipeline registry table or reset the dropzone to upload another batch.
- [x] Unit and component tests verify mapping changes, confirmation thunk dispatch, success banner rendering, and roster state updates.
