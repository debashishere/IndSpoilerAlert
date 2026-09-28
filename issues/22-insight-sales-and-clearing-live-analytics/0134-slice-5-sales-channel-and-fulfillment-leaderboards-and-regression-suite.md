# 0134: Slice 5 - Sales Channel & Fulfillment Leaderboards and Regression Suite

## Parent
[0129-prd-insight-sales-and-clearing-live-analytics.md](file:///Users/debashisroy/Documents/SpoilerAlert/issues/22-insight-sales-and-clearing-live-analytics/0129-prd-insight-sales-and-clearing-live-analytics.md)

## What to build
Implement backend aggregations for the top 5 closeout buyer partners and top 5 distribution center nodes, and connect Section 5 (**Sales Channel & Fulfillment Leaderboard**) in `SalesDataView.tsx`. Replace the hardcoded `topBuyers` and `topWarehouses` arrays with dynamic ranked leaderboards supporting sub-tab toggling. Complete the end-to-end regression test suite verifying that no placeholder or mock data remains across the entire Sales & Clearing workbench.

## Acceptance criteria
- [ ] Backend aggregation computes Top 5 Buyers ranked by total spend: buyer company name, total spend ($), cases purchased, and share of total revenue (`(buyerSpend / totalRevenue) * 100`).
- [ ] Backend aggregation computes Top 5 Distribution Centers / Warehouses ranked by cleared revenue: DC name, cleared revenue ($), cases cleared, and COGS recovery yield (`(clearedRevenue / cogs) * 100`).
- [ ] Section 5 in `SalesDataView.tsx` renders dynamic ranked rows for `Top Buyers` and `Top Warehouses / DCs` with smooth sub-tab toggling, completely removing the hardcoded `topBuyers` and `topWarehouses` arrays.
- [ ] Clean zero-state row rendered when no partner transaction activity exists for the selected filters.
- [ ] Full backend test coverage in `backend/src/tests/analytics.test.ts` verifying all aggregation pipelines, query parameter filtering, Redis caching, and edge-case empty database responses.
- [ ] Full frontend test coverage in `frontend/src/test/SalesDataViewCharts.test.tsx` verifying dynamic Redux hydration, filter interaction, click inspection, and zero mock data regressions.

## Blocked by
- [0131: Slice 2 - Dynamic Revenue & Volume Trajectory with Multi-Timeframe Filtering](file:///Users/debashisroy/Documents/SpoilerAlert/issues/22-insight-sales-and-clearing-live-analytics/0131-slice-2-dynamic-revenue-and-volume-trajectory-with-multi-timeframe-filtering.md)
- [0132: Slice 3 - COGS Recovery Yield & Sales Channel Revenue Distribution Charts](file:///Users/debashisroy/Documents/SpoilerAlert/issues/22-insight-sales-and-clearing-live-analytics/0132-slice-3-cogs-recovery-yield-and-sales-channel-revenue-distribution-charts.md)
- [0133: Slice 4 - RSL Decay Scatter Matrix & Price Realization Trendline](file:///Users/debashisroy/Documents/SpoilerAlert/issues/22-insight-sales-and-clearing-live-analytics/0133-slice-4-rsl-decay-scatter-matrix-and-price-realization-trendline.md)
