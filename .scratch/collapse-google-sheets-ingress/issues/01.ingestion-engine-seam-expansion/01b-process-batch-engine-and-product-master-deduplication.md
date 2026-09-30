# 01B: Batch Ingestion Engine & ProductMaster Deduplication

## Parent
[01: Ingestion Engine Seam Expansion & Normalized Batch Port](./01-ingestion-engine-seam-expansion-and-normalized-batch-port.md)

**What to build:** The core batch execution pipeline `ingestService.processBatch(batch: IngestionBatch): Promise<IngestionBatchResult>` behind the expanded tabular ingestion seam (ADR-0065). Implements supplier distribution center resolution, header index alignment against provided column mappings or canonical fallbacks, in-memory pre-indexed `ProductMaster` deduplication, resilient in-process date/shelf-life normalization, and staging/idempotent reconciliation of `InventoryLot` documents with a structured non-fatal row error ledger.

**Blocked by:** 01A: IngestionBatch Contract & Resilient Date/Shelf-Life Normalization Core

**Status:** completed

- [x] Implement `ingestService.processBatch(batch: IngestionBatch): Promise<IngestionBatchResult>` as a pure batch execution seam.
- [x] Automatically resolve or create the supplier's primary `DistributionCenter` if one does not exist, or resolve named warehouse DC.
- [x] Dynamically align column indices from `batch.columnMappings` or fall back to canonical `suggestMappings(batch.headers)`.
- [x] Implement batched, in-memory pre-indexed `ProductMaster` deduplication (`Map<string, ProductMaster>`) populated via single `$in` query by `(supplierId, sku)`, updating descriptions or category attributes when changes are detected.
- [x] Apply resilient in-process normalization core (`parseIngestionDate`, `calculateRemainingShelfLife`, `generateFallbackSku`, `getCategoryShelfLifeDays`) with non-blocking sidecar fallback.
- [x] Implement unified natural-key reconciliation: match existing `InventoryLot` by `(distributionCenterId, productId, lotNumber)`, updating mutable fields (quantity, price, expiration, remaining shelf life), marking zero-quantity lots as depleted, or inserting fresh lots.
- [x] Collect non-fatal row-level validation errors (missing SKU/Description, malformed quantities) into `result.errors` without aborting the batch, while committing all valid rows.
- [x] Report accurate batch metrics: `totalRows`, `inserted`, `updated`, `depleted`, `errors`, and `lotIds`.
- [x] Add unit and integration tests verifying `ingestService.processBatch(...)` with heterogeneous tabular data inputs, malformed rows, duplicate SKUs in the same batch, and natural-key updates.
