# 02: Unified Idempotent Reconciliation & Sync Lifecycle State

**What to build:** The consolidated domain reconciliation engine within `ingestService` that reconciles incoming batches against existing inventory lots using the composite natural key (`sku` + `lotNumber`). Updates mutable fields (quantity drift, price adjustments, warehouse location) while transitioning zero-quantity lots to depleted without disrupting active workflow stage bids, and records atomic sync metrics onto the connector configuration document.

**Blocked by:** 01: Ingestion Engine Seam Expansion & Normalized Batch Port

**Status:** completed

- [x] Unify composite natural key (`sku` + `lotNumber`) matching logic within `ingestService.processBatch(...)`.
- [x] Implement atomic quantity drift updates and price adjustments on matching active lots while maintaining historical audit immutability.
- [x] Implement safe lot depletion for zero-quantity items that preserves linked `Offer`, `Award`, and workflow stage bids.
- [x] Provide `ingestService.recordSyncCompletion(configId, metrics)` to atomically persist `syncStatus`, `lastSyncedAt`, and `lastSyncMetrics`.
- [x] Add unit and integration tests verifying idempotent reconciliation, quantity drift scenarios, and audit trail retention.

