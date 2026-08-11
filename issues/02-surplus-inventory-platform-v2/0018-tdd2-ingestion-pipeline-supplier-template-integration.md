# Ingestion Pipeline & Supplier Template Integration (confirmIngestion)

## Parent

Reference to Issue 0017 (Core Dynamic Data Translator Engine)

## What to build

Integrate the `translateAttributes` engine into the document ingestion confirmation pipeline (`confirmIngestion` in `backend/src/services/ingestService.ts`) and update `SupplierTemplateSchema` to support embedded `semanticRules`.

Specifically:
- Add optional embedded `semanticRules` array to `SupplierTemplateSchema` (`sourceKey`, `targetKey`, `transform`). Ensure no many-to-many join collections are introduced.
- In `confirmIngestion`, replace raw string key-value dumping into `inventoryLot.attributes` with a call to `translateAttributes(rawInput, template?.semanticRules)`.
- Persist both normalized `attributes` and original `rawAttributes` embedded directly on the saved `InventoryLot` document.

## Acceptance criteria

- [ ] RED test: integration test in `backend/src/tests/ingest.test.ts` verifying unmapped Docling table columns are translated during `confirmIngestion`.
- [ ] GREEN: Saved `InventoryLot` documents contain both standardized `attributes` dictionary and pristine `rawAttributes` without any many-to-many links.

## Blocked by

- [Issue 0017](file:///Users/debashisroy/Documents/IndSpoilerAlert/issues/0017-tdd1-core-dynamic-data-translator-engine.md)
