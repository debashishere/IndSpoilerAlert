# 0128: Slice 3 - Ingestion Tab Telemetry Retirement and Cross-Tab Regression Verification

## Parent
[0125-prd-insight-telemetry-migration-and-exclusive-disclosure.md](file:///Users/debashisroy/Documents/SpoilerAlert/issues/21-insight-telemetry-migration-and-exclusive-disclosure/0125-prd-insight-telemetry-migration-and-exclusive-disclosure.md)

## What to build
Complete the cross-platform telemetry migration by removing `IngestionTelemetryBar` from `IngestionView.tsx`. Ensure `IngestionView` is focused purely on data connectors and registry pipelines without telemetry clutter. Update existing end-to-end integration tests (including `IngestionSlice6EndToEndIntegration.test.tsx`) to assert clean connector rendering, and execute the full test suite across Ingestion and Insight views to verify zero regressions.

## Acceptance criteria
- [x] `IngestionTelemetryBar` is removed from `IngestionView.tsx`, freeing vertical viewport space for Ingestion connectors and pipeline workbenches.
- [x] Unused telemetry imports, props, and obsolete comments in `IngestionView.tsx` are cleaned up.
- [x] End-to-end and component tests in `IngestionSlice6EndToEndIntegration.test.tsx` are updated to match the streamlined Ingestion layout.
- [x] Full test suite across both `IngestionView` and `InventoryListView` runs green with zero regression failures.

## Blocked by
- [0127: Slice 2 - Insight Hub Two-Tier Telemetry Grid with Single-Active Disclosure](file:///Users/debashisroy/Documents/SpoilerAlert/issues/21-insight-telemetry-migration-and-exclusive-disclosure/0127-slice-2-insight-hub-two-tier-telemetry-grid.md)
