# 0133: Slice 4 - RSL Decay Scatter Matrix & Price Realization Trendline

## Parent
[0129-prd-insight-sales-and-clearing-live-analytics.md](file:///Users/debashisroy/Documents/SpoilerAlert/issues/22-insight-sales-and-clearing-live-analytics/0129-prd-insight-sales-and-clearing-live-analytics.md)

## What to build
Implement backend aggregation returning up to 50 recent closeout transactions with calculated shelf-life remaining at sale time, and connect Chart 4 (**Price Realization vs. Days to Expiry (RSL Decay)**) in `SalesDataView.tsx`. Replace the hardcoded `scatterPoints` array and static bezier curve with dynamic SVG coordinates, an interactive click-to-inspect detail card, and a dynamic least-squares regression trendline path.

## Acceptance criteria
- [x] Backend queries up to the 50 most recent closeout sales matching active timeframe/filters, calculating: transaction ID, SKU, product description, `rslDays` (`Math.max(0, round((lot.expirationDate - saleDate) / 86400000))`), realized unit price (`pricePerCase`), recovery percentage vs lot cost, and buyer name.
- [x] Chart 4 in `SalesDataView.tsx` renders dynamic SVG `<circle>` nodes mapped to `(rslDays, price)` coordinates across the 500×150 SVG canvas, removing the hardcoded `scatterPoints` array.
- [x] An authentic least-squares regression line/curve is computed dynamically from the real scatter points, replacing the static hardcoded `<path d="M 50,130 C 150,110 ...">`.
- [x] Clicking any scatter node selects that transaction and opens the interactive inspection banner showing SKU, product name, remaining shelf life at sale, unit price, and recovery yield.
- [x] When 0 transactions exist, the chart renders a clean empty coordinate grid with the message: *"No closeout transaction points recorded."*
- [x] Tests verify RSL calculation logic, dynamic regression path generation, and transaction click-to-inspect interactivity.

## Blocked by
- [0130: Slice 1 - Dedicated Sales Analytics Backend Seam & Telemetry KPI Bar](file:///Users/debashisroy/Documents/SpoilerAlert/issues/22-insight-sales-and-clearing-live-analytics/0130-slice-1-dedicated-sales-analytics-backend-seam-and-telemetry-kpi-bar.md)
