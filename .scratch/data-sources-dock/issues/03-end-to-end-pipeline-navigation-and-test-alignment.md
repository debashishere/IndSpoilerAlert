# 03: End-to-End Pipeline Navigation, Test Suite Alignment & Regression Verification

**What to build:** An operator smoothly transitions between the Data Sources Dock and the full-page Integration Management Suite across the Ingestion Pipeline and Inventory views, with browser back/forward history properly synchronized. All existing test suites across the application reflect the redesigned "Data Sources" section, verifying end-to-end integration without regressions.

**Blocked by:** 02: Interactive Semi-Visible Source Preview Chips with Live Status & Deep Linking

**Status:** completed

- [x] End-to-end navigation from the Data Sources Dock into `IngestionConnectorShell` and returning via `← Back to Ingestion Pipeline` operates seamlessly.
- [x] Browser popstate and URL query parameters (`?tab=ingestion&connector=...`) remain in sync when clicking the `+` button or individual source chips.
- [x] All existing regression and integration tests (`IngestionHubConnectorsTransitions.test.tsx`, `IngestionSlice1Shell.test.tsx`, `IngestionSubRouting.test.tsx`, `ConnectorSuiteEndToEnd.test.tsx`, `IngestionSlice6EndToEndIntegration.test.tsx`) are updated to match the new "Data Sources" heading and interactions.
- [x] The full frontend test suite passes with zero failures.

