# 05: Inventory Analytics — Live Data Telemetry & Feature Flag (UI-01)

**What to build:** Connect the Inventory Performance Analytics preview charts to real backend inventory analytics telemetry, with feature-flag gating (`VITE_ENABLE_ANALYTICS_PREVIEW`) for unreleased charts.

**Blocked by:** None (can start immediately)

**Status:** completed

- [x] Replace static SVG chart preview in `InventoryChartsDashboard.tsx` with live Redux/Backend inventory telemetry.
- [x] Add `VITE_ENABLE_ANALYTICS_PREVIEW` feature flag check to conditionally toggle analytics features.
- [x] Verify chart rendering with real inventory state.
