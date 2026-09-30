# 01C: CSV Confirm Ingestion Seam Delegation

## Parent
[01: Ingestion Engine Seam Expansion & Normalized Batch Port](./01-ingestion-engine-seam-expansion-and-normalized-batch-port.md)

**What to build:** The refactoring of the legacy `confirmIngestion` function in `ingestService` to act as an adapter that constructs an `IngestionBatch` from `DocumentImport.rawGrid` and delegates processing directly to `ingestService.processBatch(...)`. Preserves existing template persistence (`SupplierTemplate`) and controller contracts without breaking legacy CSV/Excel upload workflows.

**Blocked by:** 01B: Batch Ingestion Engine & ProductMaster Deduplication

**Status:** done

- [x] Refactor `confirmIngestion` in `backend/src/services/ingestService.ts` to extract `rawGrid`, build an `IngestionBatch`, and forward execution to `ingestService.processBatch(batch)`.
- [x] Preserve existing `SupplierTemplate` upsert logic, template name generation, and semantic rules persistence.
- [x] Maintain backward-compatible return payload structure for `confirmIngestion` (`importedLotsCount`, `lots`, `aggregates`, `templateId`) so `ingestController.ts` and UI callers receive expected shapes.
- [x] Ensure `computeGridAggregates` and semantic rules continue evaluating as part of the confirmation workflow.
- [x] Verify existing CSV upload tests (`backend/src/tests/ingest.test.ts`) continue passing without modification.
