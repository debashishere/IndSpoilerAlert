# 0131: Slice 2 - Dynamic Revenue & Volume Trajectory with Multi-Timeframe Filtering

## Parent
[0129-prd-insight-sales-and-clearing-live-analytics.md](file:///Users/debashisroy/Documents/SpoilerAlert/issues/22-insight-sales-and-clearing-live-analytics/0129-prd-insight-sales-and-clearing-live-analytics.md)

## What to build
Implement server-side multi-timeframe aggregation for sales trajectory (`7d` daily buckets, `30d` weekly intervals, `90d` monthly intervals, `ytd` quarterly intervals) and connect Chart 1 (**Realized Closeout Revenue & Volume Trajectory**) in `SalesDataView.tsx`. Upgrade the interactive filter bar (`timeframe`, `category`, `warehouse`) to dynamically fetch filtered backend data and replace the static SVG bezier curve with dynamically scaled SVG area and line paths computed from real time-bucket coordinates.

## Acceptance criteria
- [x] Backend aggregation groups sales into discrete time buckets according to `timeframe` query parameter: 7 daily buckets for `7d`, 5 weekly buckets for `30d`, 3 monthly buckets for `90d`, and quarterly buckets for `ytd`.
- [x] Trajectory buckets dynamically compute sum of `revenue` and sum of `volume` (cases sold) based on real `saleDate` timestamps, applying active `category` and `warehouse` query filters.
- [x] Category and Warehouse filter dropdowns in `SalesDataView.tsx` are dynamically populated with unique options returned by the backend (instead of static hardcoded lists).
- [x] Toggling timeframe (`7d`, `30d`, `90d`, `ytd`), category, or warehouse dispatches `fetchSalesAnalyticsThunk` with active parameters.
- [x] The static SVG path (`M 0,110 Q 100,50 ...`) in Chart 1 is replaced with dynamic SVG path generators mapping real revenue points to emerald area curves and real volume points to dashed indigo lines.
- [x] When 0 transactions exist for a selected timeframe/filter, Chart 1 displays a flat baseline axis with an in-situ informative notice: *"No closeout sales recorded for this timeframe/warehouse."*
- [x] Regression tests verify time-bucket generation, filter triggering, and SVG path coordinate calculations.

## Blocked by
- [0130: Slice 1 - Dedicated Sales Analytics Backend Seam & Telemetry KPI Bar](file:///Users/debashisroy/Documents/SpoilerAlert/issues/22-insight-sales-and-clearing-live-analytics/0130-slice-1-dedicated-sales-analytics-backend-seam-and-telemetry-kpi-bar.md)
