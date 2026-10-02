# 01: Master Ingress Key & Dynamic Multi-Sheet Backend Seam

**What to build:** Enable suppliers to connect multiple Google Spreadsheets under a single persistent Ingress Key. When any Google Spreadsheet sends a webhook synchronization payload with the supplier's `X-Ingress-Key`, the backend dynamically discovers, auto-registers, and updates that specific spreadsheet and tab within the supplier's integration record. Expose REST endpoints to fetch the active Connected Sheets Roster and disconnect a spreadsheet, maintaining separate sync health and metrics per sheet.

**Blocked by:** None (can start immediately)

**Status:** complete

- [x] `GoogleSheetsSyncConfig` model supports an embedded `connectedSheets` subdocument array tracking `spreadsheetId`, `spreadsheetTitle`, `sheetName`, `syncStatus`, `lastSyncedAt`, `lastSyncMetrics`, and `supplierTemplateId`.
- [x] Inbound webhook at `/api/v1/ingestion/google-sheets/webhook` matches `X-Ingress-Key` against the supplier's master key, dynamically locates or appends the sheet subdocument, and records real-time sync metrics.
- [x] `GET /api/v1/ingestion/google-sheets/roster` returns the array of connected sheets for a supplier with lot counts, sync timestamps, and status.
- [x] `DELETE /api/v1/ingestion/google-sheets/disconnect` removes a specified spreadsheet from the connected sheets array.
- [x] Comprehensive unit and integration test coverage verifies multi-sheet registration, metrics recording, and sheet disconnection.
