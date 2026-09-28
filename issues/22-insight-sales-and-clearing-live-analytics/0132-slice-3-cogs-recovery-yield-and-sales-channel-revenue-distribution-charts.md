# 0132: Slice 3 - COGS Recovery Yield & Sales Channel Revenue Distribution Charts

## Parent
[0129-prd-insight-sales-and-clearing-live-analytics.md](file:///Users/debashisroy/Documents/SpoilerAlert/issues/22-insight-sales-and-clearing-live-analytics/0129-prd-insight-sales-and-clearing-live-analytics.md)

## What to build
Implement backend aggregation pipelines joining `Sale` with `InventoryLot`, `ProductMaster`, and `Buyer` to compute product category recovery yield and sales channel revenue distribution. Connect Chart 2 (**COGS Recovery % by Product Category**) and Chart 3 (**Sales Channel Revenue Share**) in `SalesDataView.tsx` to live backend data, replacing hardcoded category arrays and static SVG donut stroke dasharrays with dynamic calculations.

## Acceptance criteria
- [ ] Backend aggregation joins `Sale` -> `InventoryLot` -> `ProductMaster` to compute category metrics: category name, total COGS (`quantityCases * costPerCase`), realized revenue, and `recoveryPct` (`(revenue / cogs) * 100`).
- [ ] Backend aggregation joins `Sale` -> `Buyer` to compute revenue distribution across buyer segments/types (*Off-Price Wholesalers*, *Regional Liquidators*, *Food Rescue & Discount*, etc.), calculating dollar revenue and exact percentage share (`(segmentRevenue / totalRevenue) * 100`).
- [ ] Chart 2 renders dynamic horizontal recovery bars for all active categories returned from the backend, completely removing the hardcoded `categoryRecoveryData` array.
- [ ] Chart 3 renders a dynamic SVG Donut chart calculating SVG `<circle>` `strokeDasharray` and `strokeDashoffset` from real channel percentages, completely removing the hardcoded `channelBreakdown` array.
- [ ] Zero-state handling displays clean zeroed progress tracks and a neutral "0% Revenue Share" ring when no sales records exist.
- [ ] Integration tests verify category COGS calculations, buyer channel segment grouping, and Donut SVG segment calculations.

## Blocked by
- [0130: Slice 1 - Dedicated Sales Analytics Backend Seam & Telemetry KPI Bar](file:///Users/debashisroy/Documents/SpoilerAlert/issues/22-insight-sales-and-clearing-live-analytics/0130-slice-1-dedicated-sales-analytics-backend-seam-and-telemetry-kpi-bar.md)
