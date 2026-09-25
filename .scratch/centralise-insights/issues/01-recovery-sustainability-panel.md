# 01: Replace static Insight charts with live Recovery & Sustainability panel

**What to build:** When a supplier navigates to the Insight tab and clicks the second subtab (currently "Inventory Insights & Analytics"), they should see live COGS recovery metrics, a 6-month recovery-rate-vs-waste-diverted trendline chart, a product stock disposition breakdown (Sold / Donated / Recycled / Expired stacked bar), and a CPG category volume distribution — all driven by real data from the `/analytics/summary` endpoint. The current 4 static hardcoded SVG charts with "Coming Soon" badges are replaced entirely.

The subtab switcher bar changes from 3 pills (`bidding` / `charts` / `sales`) to the first 3 of the final 4 (`recovery` / `bidding` / `sales`), with `recovery` as the new default. The `recovery` panel mounts the existing `SummaryMetrics`, `COGSRecoveryDashboard`, and `RSLDistributionChart` components (currently orphaned behind the `SHOW_DISTRESSED_ANALYTICS` flag in `AnalyticsView`). These components already consume live Redux selectors (`selectCOGSRecoveryMetrics`, `selectRSLDistribution`, `selectLandfillDiversionStats`) — they just need `fetchAnalyticsSummaryThunk` dispatched when the Insight tab mounts.

The static `InventoryChartsDashboard` component is no longer imported or rendered. It remains in the codebase but is unused. `BiddingDataView` and `SalesDataView` are completely untouched internally.

**Blocked by:** None (can start immediately).

**Status:** done

- [x] Subtab state type expanded to include `'recovery'`; `'charts'` removed; default is `'recovery'`
- [x] `fetchAnalyticsSummaryThunk` dispatched in a `useEffect` when the Insight view mounts (guarded against redundant fetches)
- [x] Recovery panel renders `SummaryMetrics`, `COGSRecoveryDashboard`, and `RSLDistributionChart` with Tailwind styling consistent with the Insight Hub design language
- [x] `InventoryChartsDashboard` import removed from `InventoryListView`
- [x] Subtab switcher bar pills updated: "Recovery & Sustainability", "Current Bidding Data", "Sales & Clearing"
- [x] Existing `AnalyticsViewAndSelectors` test suite still passes (selectors and standalone render unaffected)
- [x] New regression test verifies the Recovery subtab renders live metric labels (COGS Recovery Rate, Landfill Waste Diverted, Product Stock Disposition) when analytics data is present in the store
- [x] Full Vitest suite passes with zero regressions (807 tests)
