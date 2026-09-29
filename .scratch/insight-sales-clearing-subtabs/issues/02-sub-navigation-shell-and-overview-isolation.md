# 02: Sales & Clearing Sub-Navigation Consolidation & Overview Isolation

**What to build:** A consolidated 2-pill primary sub-navigation strip within Insight → Sales & Clearing (`Overview & Analytics`, `Leaderboard`) positioned below the persistent telemetry bar and interactive filters. `Overview & Analytics` encapsulates exclusively the 4 visual charts, completely removing the duplicate static leaderboard card so that partner ranking data lives in only one place. `Leaderboard` houses a unified header card with a secondary pill toggle (`Lead Buyers` | `Lead Warehouses`) that renders live entity performance rankings and expandable transaction drilldowns.

**Blocked by:** 01: Backend Server-Side Entity Aggregation & Cache Pipeline

**Status:** ready for implementation

- [ ] Primary sub-navigation updated to 2 rounded pills: `Overview & Analytics` and `Leaderboard`.
- [ ] Duplicate static leaderboard card (`Sales Channel & Fulfillment Leaderboard` and dummy `topBuyers`/`topWarehouses` arrays) completely removed from `Overview & Analytics`.
- [ ] Unified Leaderboard header card implemented with title, description, and secondary pill switcher (`Lead Buyers` | `Lead Warehouses`).
- [ ] Sub-navigation supports full keyboard navigation (Arrow keys, Home, End) and ARIA tab roles (`role="tab"`, `aria-selected`, `role="tabpanel"`).
- [ ] Selecting `Overview & Analytics` displays only the 4 visual charts (Revenue Trajectory, COGS Recovery %, Channel Revenue Share, RSL Decay Scatter Matrix).
- [ ] Selecting `Leaderboard` toggles between `Lead Buyers` (`TopBuyersDrilldown`) and `Lead Warehouses` (`TopWarehousesDrilldown`) without duplicate banner wrapping.
- [ ] Global telemetry metrics bar and interactive filter bar remain visible and reactive across all views.
- [ ] Sub-tab transitions seamlessly preserve active filter parameters (`timeframe`, `category`, `warehouse`).
