# 04: Pipeline Triggers, Modal Deprecation & End-to-End Verification

**What to build:** An operator clicking import or CSV upload from any pipeline registry (`SalesRegistryPanel`, `BuyerRegistryPanel`, `InventoryRegistryPanel`) is smoothly redirected to the full-page CSV Integration Suite with the destination pre-selected (`?tab=ingestion&connector=csv-upload&target=sales|buyers|inventory`). Retires and removes the legacy `UnifiedIngestionModal`. Delivers end-to-end integration tests validating connector navigation from hub cards and pipeline triggers, file upload staging, in-situ schema mapping, batch confirmation, and registry table hydration.

**Blocked by:** #6 (03: Batch History Roster & In-Situ Schema Field Mapper)

**Status:** completed

- [x] Update table import buttons and `open-ingestion-upload-modal` event listeners across pipeline panels to deep-link into the CSV integration suite with pre-selected target.
- [x] Safely deprecate/retire `UnifiedIngestionModal.tsx` and remove its redundant mount from `IngestionView.tsx`.
- [x] Add end-to-end integration tests verifying full navigation flows: hub card -> suite, pipeline trigger -> pre-selected target in suite, file drop -> in-situ mapping -> registry confirmation.
- [x] Verify test suite passes cleanly with zero regressions across Ingestion views and connectors.
