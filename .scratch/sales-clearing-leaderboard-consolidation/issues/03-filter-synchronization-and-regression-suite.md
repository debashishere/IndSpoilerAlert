# 03: End-to-End Filter Synchronization & Full Regression Suite

**What to build:** Synchronize active timeframe, category, and DC filters seamlessly across the consolidated Leaderboard views. Update and run all unit and regression test suites (`SalesDataViewSubNav.test.tsx`, `SalesTopBuyersDrilldown.test.tsx`, `SalesTopWarehousesDrilldown.test.tsx`, `SalesClearingEndToEndRegression.test.tsx`) to guarantee zero mock data and zero regressions across the 2-level hierarchy.

**Blocked by:** 02: Leaderboard Unified Header & Sub-Tab Switcher

**Status:** completed

- [x] Global timeframe (`7D`, `30D`, `90D`, `YTD`), category, and facility filters remain interactive and reactive across both `Overview & Analytics` and `Leaderboard`.
- [x] Switching between primary tabs and secondary sub-tabs preserves active filter state without unexpected resets or UI re-render glitches.
- [x] Update `SalesDataViewSubNav.test.tsx` to validate the 2-pill primary nav, secondary switcher, ARIA tab roles, keyboard navigation, and the complete elimination of duplicate overview leaderboard elements.
- [x] Update `SalesTopBuyersDrilldown.test.tsx`, `SalesTopWarehousesDrilldown.test.tsx`, and `SalesClearingEndToEndRegression.test.tsx` navigation selectors to traverse the 2-level hierarchy (`Leaderboard` -> `Lead Buyers` / `Lead Warehouses`).
- [x] All frontend test suites in `frontend/src/test/` pass with zero failures and zero console warnings.
