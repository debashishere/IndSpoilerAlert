# 01: Ingestion Engine Seam Expansion & Normalized Batch Port

**What to build:** The backend ingestion module expansion establishing a clean `IngestionBatch` input interface on `ingestService`. Enables any tabular ingestion source (CSV/Excel upload, Google Sheets AppScript push, or manual paste) to be dispatched through a single deep seam with centralized date parsing heuristics, category shelf-life defaults, and `ProductMaster` deduplication.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

## Subtickets
This parent ticket has been decomposed into 4 vertical slices:
- [01A: IngestionBatch Contract & Resilient Date/Shelf-Life Normalization Core](./01a-ingestion-batch-contract-and-normalization-core.md)
- [01B: Batch Ingestion Engine & ProductMaster Deduplication](./01b-process-batch-engine-and-product-master-deduplication.md)
- [01C: CSV Confirm Ingestion Seam Delegation](./01c-csv-confirm-ingestion-adapter-delegation.md)
- [01D: Heterogeneous Tabular Batch & Ingress Regression Suite](./01d-heterogeneous-tabular-batch-regression-suite.md)

## Acceptance Criteria
- [x] Define the `IngestionBatch` port interface accepting `supplierId`, `headers`, `rows`, `columnMappings`, and `source` (`'csv'` | `'google-sheets'` | `'manual'`).
- [x] Extract and centralize resilient date parsing heuristics and category shelf-life fallback calculations inside the ingestion engine core.
- [x] Implement `ingestService.processBatch(...)` executing batched ProductMaster resolution and initial lot preparation behind the new interface.
- [x] Ensure existing CSV ingestion callers continue passing existing test suites uninterrupted (expand phase).
- [ ] Add unit tests verifying `ingestService.processBatch(...)` with heterogeneous tabular data inputs and malformed date strings.



