# 65. Unified Batch Ingestion Seam and Idempotent Reconciliation

## Context & Motivation
Previously, tabular inventory ingress was fragmented across two duplicate pathways: CSV/Excel file uploads via `DocumentImport` and live Google Sheets webhook pushes via `googleSheetsIngressService`. Both pathways independently implemented row-level iteration, date parsing, cold-chain temperature extraction, facility creation, product catalog resolution, and natural-key upsert loops. This code duplication caused drift in column mapping fallbacks (e.g. `availableQty` vs. `quantityCases`), distinct lot status semantics, and divergent test coverage.

## Architectural Decision
We established a single, deep batch ingestion seam:
```typescript
ingestService.processBatch(batch: IngestionBatch): Promise<IngestionBatchResult>
```

1. **Normalized Batch Contract (`IngestionBatch`)**:
   - Both CSV file upload (`confirmIngestion`) and Google Sheets (`processGoogleSheetsWebhook`, `syncNowGoogleSheets`) adapt their transport payloads into a standardized `IngestionBatch` containing `supplierId`, `headers`, `rows`, `columnMappings`, `source` (`'csv' | 'excel' | 'google-sheets'`), and source-specific `metadata`.

2. **In-Memory Pre-Indexed Reconciliation**:
   - Deduplicates candidate SKUs across batch rows using a single pre-indexed `$in` query against `ProductMaster`, eliminating individual per-row lookup roundtrips.
   - Reconciles `InventoryLot` records idempotently using the compound natural key: `distributionCenterId` + `productId` + `lotNumber`.
   - Quantity drops to zero are atomically transitioned to `'depleted'`.

3. **In-Process Resilient Date & Shelf-Life Normalization**:
   - Implements multi-format date parsing (`YYYY-MM-DD`, `MM/DD/YYYY`, Excel serial dates) with category-based default shelf-life resolution and non-blocking sidecar fallback.

4. **Dynamic Handshake & Two-Way Sync Delegation**:
   - Google Sheets mapping configuration and sample row inspection delegate directly to `ingestService.getGoogleSheetsSampleRows` and `ingestService.saveGoogleSheetsMapping`, persisting schema mappings to `SupplierTemplate`.
   - On-demand sync dispatches (`POST /api/v1/ingestion/google-sheets/sync-now`) delegate directly through `processBatch` and atomically update sync status, receipts, and live active lot counts.

5. **Cross-Channel Equivalence & Downstream Hydration**:
   - Cross-channel integration suites (`crossChannelIngressEquivalence.test.ts`) verify that inventory ingested via CSV upload and live Google Sheets webhook produce identical `ProductMaster` records, identical `InventoryLot` records, and identical operational portfolio valuations.
   - Frontend connector cards, sync status badges (`Active Trigger • Auto-Sync`, relative sync timestamps, synced lot counts), and navigation drawer metrics (`Active Lots`, `Portfolio Value`) hydrate reactively from unified Redux state.
