# 05: End-to-End Ingress Integration & Zero-Regression Verification

**What to build:** The comprehensive cross-channel integration suite verifying that inventory batches ingested via CSV/Excel upload and live Google Sheets webhook pushes behave identically across all downstream platform systems: telemetry indicators, operational metric hydration in the navigation drawer, lot CRM timelines, and workflow inventory pool matching.

**Blocked by:** 04: Dynamic Handshake & Sync-Now Ingestion Seam Delegation

**Status:** completed

- [x] Execute an end-to-end integration test pushing inventory via both CSV upload and Google Sheets webhook, confirming identical `InventoryLot` and `ProductMaster` records are generated.
- [x] Verify that `IngestionView`, connector card sync badges, and drawer operational metrics (`Active Lots`, `Portfolio Value`) hydrate accurately after sync.
- [x] Run full backend and frontend regression suites (`backend/src/tests/` and `frontend/src/test/`) ensuring zero regression across legacy and new ingestion pathways.
- [x] Document the unified ingestion seam architecture in an ADR update under `docs/adr/`.
