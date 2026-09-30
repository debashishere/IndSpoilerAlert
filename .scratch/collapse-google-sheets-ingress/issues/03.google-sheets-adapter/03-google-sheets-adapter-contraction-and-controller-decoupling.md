# 03: Google Sheets Adapter Contraction & Controller Decoupling

**What to build:** The contraction of `googleSheetsIngressService` into a thin transport adapter and the clean refactoring of `googleSheetsIngressController`. Replaces the 130-line duplicated lot processing loop with direct delegation to `ingestService.processBatch(...)`, and eliminates dynamic inline `import()` statements and direct database mutations from controller methods.

**Blocked by:** 02: Unified Idempotent Reconciliation & Sync Lifecycle State

**Status:** completed

- [x] Refactor `googleSheetsIngressService.processGoogleSheetsWebhook(...)` to resolve template mappings, build an `IngestionBatch`, and forward it to `ingestService.processBatch(...)`.
- [x] Delete the duplicate ad-hoc lot processing loop, redundant category shelf-life constants, and unbatched N+1 DB queries in `googleSheetsIngressService.ts`.
- [x] Refactor `googleSheetsIngressController.ts` to remove dynamic `await import(...)` calls, replacing them with standard top-level imports and service delegations.
- [x] Replace direct controller state modifications (e.g. `config.syncStatus = 'success'`, `InventoryLot.countDocuments`) with `ingestService` method calls.
- [x] Verify that existing Google Sheets webhook tests (`google_sheets_ingress.test.ts`) pass against the contracted adapter.
