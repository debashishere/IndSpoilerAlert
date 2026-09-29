# 05: Filter Synchronization, Zero-State & End-to-End Regression Suite

**What to build:** Complete end-to-end filter synchronization, authentic zero-state handling, dark/light theme polish, and automated integration regression tests validating that the consolidated 2-tab sub-navigation (`Overview & Analytics` and `Leaderboard`), nested `Lead Buyers` / `Lead Warehouses` sub-tabs, accordion expansions, search filters, and Lot Hub modal links work harmoniously across all views with zero mock data.

**Blocked by:** 02: Sales & Clearing Sub-Navigation Consolidation & Overview Isolation, 03: Top Buyers Expandable Accordion & Transaction Drilldown, 04: Top Warehouses / DCs Expandable Accordion & Fulfillment Drilldown

**Status:** ready for implementation

- [ ] Timeframe changes (`7D`, `30D`, `90D`, `YTD`), Category filter changes, and DC filter changes dynamically re-query the backend and update buyer/DC aggregations and child tables.
- [ ] Authentic zero-state views render clean guidance and zero-metrics ($0.00, empty list with prompt to ingest sales data) when no transactions match active filters.
- [ ] Expanding cards, searching within child tables, and clicking Lot Hub links do not cause UI flickering, DOM node bloat, or page regressions.
- [ ] Institutional Tailwind design tokens and dark/light mode styles match the rest of the application.
- [ ] Automated regression test suites in `SalesDataViewSubNav.test.tsx`, `SalesTopBuyersDrilldown.test.tsx`, `SalesTopWarehousesDrilldown.test.tsx`, and `SalesClearingEndToEndRegression.test.tsx` pass cleanly with full coverage of the 2-level Leaderboard hierarchy.
