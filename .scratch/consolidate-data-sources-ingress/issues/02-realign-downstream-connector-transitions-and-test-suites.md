# 02: Realign Downstream Connector Transitions & Test Suites

**What to build:** End-to-end integration and routing tests across the Ingestion workspace accurately reflect the unified ingress flow where operators launch the Integration Management Suite via the `+ Add Data Source` button and navigate between connectors using the in-suite switcher tabs. All test suites previously exercising the removed dock chips are migrated and passing.

**Blocked by:** 01: Streamline Data Sources Dock and Consolidate Ingress Action

**Status:** completed

- [x] Transition tests in `IngestionHubConnectorsTransitions.test.tsx` verify navigation via the `+ Add Data Source` button into the Integration Management Suite.
- [x] Direct routing and drawer/card test suites (`GoogleSheetsConnectorCard.test.tsx`, `GoogleSheetsIngestionIntegration.test.tsx`, `IngestionSubRouting.test.tsx`) are updated to test suite ingress through `+ Add Data Source` and cross-connector switching via `IngestionConnectorShell`.
- [x] All updated test suites execute and pass cleanly without deprecation warnings or failed selector queries.

