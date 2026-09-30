# 04: Dynamic Handshake & Sync-Now Ingestion Seam Delegation

**What to build:** The integration of the two-phase mapping handshake and the "Sync Now" trigger in `GoogleSheetsConfigDrawer` directly through the unified ingestion engine seam. Replaces hardcoded sample rows in `getSampleRows` with dynamic schema sampling from `SupplierTemplate` and ensures manual sync dispatches run through the single ingestion reconciliation pipeline.

**Blocked by:** 03: Google Sheets Adapter Contraction & Controller Decoupling

**Status:** completed

- [x] Move template mapping persistence and sample row generation from `googleSheetsIngressController.ts` into a dedicated method on `ingestService`.
- [x] Connect `POST /api/v1/ingestion/google-sheets/sync-now` to delegate batch reconciliation directly to `ingestService.processBatch(...)`.
- [x] Ensure `GoogleSheetsConfigDrawer` and `IngestionHubConnectors` receive consistent sync receipts and live lot counts from the consolidated endpoint.
- [x] Update frontend test suites (`GoogleSheetsConfigDrawer.test.tsx`, `GoogleSheetsSyncServiceAndSlice.test.ts`) to verify end-to-end handshake and manual sync behavior through the new seam.
