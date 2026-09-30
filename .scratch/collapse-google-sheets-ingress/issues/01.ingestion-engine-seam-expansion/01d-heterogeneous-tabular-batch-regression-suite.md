# 01D: Heterogeneous Tabular Batch & Ingress Regression Suite

## Parent
[01: Ingestion Engine Seam Expansion & Normalized Batch Port](./01-ingestion-engine-seam-expansion-and-normalized-batch-port.md)

**What to build:** The automated test suite validating that `ingestService.processBatch` reliably ingests heterogeneous tabular data across all sources (`csv`, `google-sheets`, `manual`) with malformed dates, missing SKUs, negative quantities, and disparate column orderings while ensuring zero regressions across all existing ingestion tests.

**Blocked by:** 01C: CSV Confirm Ingestion Seam Delegation

**Status:** ready-for-agent

- [ ] Create `backend/src/tests/ingest_batch_process.test.ts` testing `processBatch` across edge cases (empty rows, missing headers, unparseable dates, description-only rows).
- [ ] Verify that lots generated from `processBatch` have valid `remainingShelfLife` (between `0.0` and `1.0`), correct `DistributionCenter` references, and proper statuses.
- [ ] Verify that batch error reporting captures invalid rows without halting processing for valid rows.
- [ ] Verify that batch execution works identically regardless of source tag (`'csv'`, `'google-sheets'`, `'manual'`).
- [ ] Run full backend test suite (`backend/src/tests/`) confirming zero regression across legacy ingestion, Google Sheets ingress, and workflow triggers.
