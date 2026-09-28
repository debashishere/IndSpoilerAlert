# 01: Dedicated Operations Analytics Backend Seam & Real-Time Operational Telemetry Cards

**What to build:** Users inspecting the Insight → Cross-Platform Operations dashboard see authentic, real-time aggregated metrics across all 4 operational pillars (Ingestion, Buyer Communications, Workflow Campaigns, and Cold-Chain Compliance). Users can switch between 7D, 30D, 90D, and YTD timeframes, with all mock and fallback numbers completely removed and replaced by live backend data and clean zero-state baselines.

**Blocked by:** None (can start immediately)

**Status:** completed

- [x] Implement `GET /api/analytics/operations` with timeframe (`7d`, `30d`, `90d`, `ytd`) and supplier scoping in `analyticsController.ts` and `analyticsService.ts`, backed by Redis caching.
- [x] Aggregate live metrics across `InventoryLot`, `Buyer`, `EmailDispatchLog`/`EmailThread`, `LiquidationAutomation`/`AutomationRun`, and `ColdChainLog`/`Shipment`.
- [x] Hook up Redux state `operationsAnalytics` and `fetchOperationsAnalyticsThunk` in `coreSlice.ts`.
- [x] Equip `CrossPlatformOperationsPanel.tsx` with an institutional multi-timeframe selector (`7D`, `30D` [default], `90D`, `YTD`).
- [x] Rebind all 4 KPI cards to live data, removing all mock fallbacks (`|| 18`, `94.2%`, `< 2.4 Hours`, `|| 12`, `98.5%`).
- [x] Render clean mathematical zero-state baselines when no events exist in the active timeframe.
- [x] Pass all backend endpoint tests and frontend component tests.
