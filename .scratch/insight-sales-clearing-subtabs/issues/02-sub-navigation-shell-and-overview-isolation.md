# 02: Sales & Clearing Sub-Navigation Shell & Overview Isolation

**What to build:** A clean 3-pill sub-navigation strip within Insight → Sales & Clearing (`Overview & Analytics`, `Top Buyers`, `Top Warehouses / DCs`) positioned below the persistent telemetry bar and interactive filters, encapsulating the 4 existing visual charts inside the `Overview & Analytics` view while keeping the top-level 4-tab Insight bar intact.

**Blocked by:** 01: Backend Server-Side Entity Aggregation & Cache Pipeline

**Status:** complete

- [x] Redux state and TypeScript types in `coreSlice.ts` updated to model `SalesBuyerSummary`, `SalesWarehouseSummary`, and `SalesTransactionPoint`.
- [x] 3-pill sub-navigation strip rendered beneath the persistent telemetry bar and filter controls in `SalesDataView.tsx`.
- [x] Sub-navigation supports keyboard navigation and ARIA tab roles (`role="tab"`, `aria-selected`).
- [x] Selecting `Overview & Analytics` renders the 4 existing visual charts (Revenue Trajectory, COGS Recovery, Channel Distribution Donut, RSL Decay Scatter Matrix).
- [x] Global telemetry metrics and filter bar remain visible and reactive across all three sub-views.
- [x] Sub-tab state seamlessly switches without resetting active filter parameters (`timeframe`, `category`, `warehouse`).
