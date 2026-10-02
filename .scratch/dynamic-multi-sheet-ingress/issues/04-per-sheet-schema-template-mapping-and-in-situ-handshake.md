# 04: Per-Sheet Schema Template Mapping & In-Situ Handshake

**What to build:** Per-sheet column mapping support and in-situ handshake verification. When a new spreadsheet syncs, it auto-detects canonical headers; if unmapped or novel columns exist, the sheet surfaces an "Edit Column Mapping" action in the Connected Sheets Roster. Clicking it launches the `GridMapperTable` loaded with that specific spreadsheet's headers and latest sample rows, allowing the operator to adjust field alignments and save them to the spreadsheet's bound `SupplierTemplate`.

**Blocked by:** 03: Live Connected Sheets Roster & Management Actions

**Status:** completed

- [x] Connected Sheets Roster displays an "Edit Column Mapping" button/action for each spreadsheet entry.
- [x] Triggering "Edit Column Mapping" opens the `GridMapperTable` populated with the target sheet's discovered headers and sample rows.
- [x] Saving mapping updates the sheet's bound `SupplierTemplate` and ensures subsequent webhook batches parse with the customized column schema.
- [x] Drawer seamlessly transitions between the roster view and the mapping workbench with breadcrumb navigation.
- [x] End-to-end integration tests verify per-sheet column re-mapping and ingestion reconciliation.
