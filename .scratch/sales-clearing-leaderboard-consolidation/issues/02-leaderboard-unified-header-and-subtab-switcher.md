# 02: Leaderboard Unified Header & Sub-Tab Switcher

**What to build:** Build the unified Leaderboard header card with title, description, and secondary pill switcher ("Lead Buyers" | "Lead Warehouses"). Render `TopBuyersDrilldown` under "Lead Buyers" and `TopWarehousesDrilldown` under "Lead Warehouses", with full keyboard navigation and ARIA tab roles, without stacked duplicate banners.

**Blocked by:** 01: Primary Navigation Consolidation & Overview Isolation

**Status:** completed

- [x] Render a unified Leaderboard header card in `SalesDataView` with trophy/award emblem, title ("Sales Channel & Fulfillment Leaderboard"), and explanatory description.
- [x] Position a secondary segmented pill-toggle bar on the right side of the header containing `Lead Buyers` (`Users` icon) and `Lead Warehouses` (`Building2` icon).
- [x] Default active secondary sub-tab to `Lead Buyers`, with keyboard navigation (`ArrowRight`, `ArrowLeft`, `Home`, `End`) and ARIA tab roles (`role="tablist"`, `role="tab"`).
- [x] Under `Lead Buyers`, render `TopBuyersDrilldown` connected to `salesAnalytics?.topBuyers` and `onOpenLotHub`.
- [x] Under `Lead Warehouses`, render `TopWarehousesDrilldown` connected to `salesAnalytics?.topWarehouses` and `onOpenLotHub`.
- [x] Remove duplicate stacked wrapper banners previously placed above each drilldown component.
