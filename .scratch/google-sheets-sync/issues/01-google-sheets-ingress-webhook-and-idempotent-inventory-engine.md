# 01: Google Sheets Ingress Webhook and Idempotent Inventory Engine

**What to build:** The backend ingestion engine that receives pushed Google Sheet data payloads, validates the supplier's secret ingress key, normalizes row values according to the supplier's column template, and idempotently upserts inventory lots into the database (updating quantities and pricing on existing lots while creating new lots for unseen rows).

**Blocked by:** None (can start immediately)

**Status:** completed

- [x] Create `GoogleSheetsSyncConfig` MongoDB schema tracking `supplierId`, `spreadsheetId`, `sheetName`, `ingressKey`, `syncStatus`, `lastSyncedAt`, `lastSyncMetrics`, and bound `SupplierTemplate`.
- [x] Implement `POST /api/v1/ingestion/google-sheets/webhook` endpoint validating the `X-Ingress-Key` authentication header.
- [x] Parse direct grid payloads (`headers` and `rows`) and map columns using the associated `SupplierTemplate` (or default canonical inventory schema).
- [x] Implement idempotent upsert matching existing `InventoryLot` records by composite natural key (`sku` + `lotNumber`): update mutable fields (available quantity, unit price, expiration date) and create new active lots for novel records.
- [x] Transition lots to `depleted`/`archived` if quantity drops to 0 while strictly preserving active workflow stage bids and audit history.
- [x] Implement unit and integration tests verifying authentication rejection, payload parsing, lot creation, quantity drift updates, and response sync receipts.
