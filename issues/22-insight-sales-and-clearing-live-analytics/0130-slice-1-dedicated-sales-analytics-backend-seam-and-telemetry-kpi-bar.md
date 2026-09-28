# 0130: Slice 1 - Dedicated Sales Analytics Backend Seam & Telemetry KPI Bar

## Parent
[0129-prd-insight-sales-and-clearing-live-analytics.md](file:///Users/debashisroy/Documents/SpoilerAlert/issues/22-insight-sales-and-clearing-live-analytics/0129-prd-insight-sales-and-clearing-live-analytics.md)

## What to build
Establish the primary server-side analytics API contract and connect the top 4 telemetry KPI cards in Insight → Sales & Clearing (`SalesDataView.tsx`) to live backend aggregations. Implement `GET /api/analytics/sales` with supplier scoping and Redis caching, returning total realized revenue, period-over-period (PoP) revenue velocity delta, volume sold, average realized price, and transaction reconciliation progress. Hydrate this via Redux `coreSlice` and render authentic mathematical zero baselines (`$0.00`) when no sales exist.

## Acceptance criteria
- [x] `GET /api/analytics/sales` is implemented in `analyticsController.ts` and `analyticsService.ts`, registered under `/api/analytics/sales` with authentication and supplier scoping.
- [x] Backend computes high-level telemetry KPIs: `totalRevenue`, `revenueGrowthPct` (PoP velocity vs immediately preceding equal period), `totalVolume` (cases), `avgPrice` ($/cs), `reconciledCount`, `totalCount`, and unique dynamic filter values (`categories`, `warehouses`).
- [x] Endpoint is backed by Redis caching with a 5-minute TTL and graceful fallback to MongoDB queries when Redis is unavailable.
- [x] `coreSlice.ts` defines `salesAnalytics`, `salesAnalyticsLoading`, and `fetchSalesAnalyticsThunk({ timeframe, category, warehouse, supplierId })`.
- [x] `SalesDataView.tsx` reads live telemetry metrics from `state.core.salesAnalytics`, replacing the hardcoded `+14.2%` badge with dynamic directional indicators (`+X.X%` with `ArrowUpRight` in emerald, `-X.X%` with `ArrowDownRight` in rose, or neutral `0.0%`).
- [x] Zero-state behavior cleanly renders `$0.00`, `0 cases`, `$0.00 / cs`, and `0 / 0` without `NaN`, errors, or synthetic fallbacks.
- [x] Unit and integration tests verify endpoint calculations, period velocity logic, and Redux slice state updates.

## Blocked by
- None (can start immediately).
