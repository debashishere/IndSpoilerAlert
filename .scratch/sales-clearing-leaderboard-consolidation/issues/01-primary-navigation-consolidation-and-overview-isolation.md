# 01: Primary Navigation Consolidation & Overview Isolation

**What to build:** Consolidate the primary sub-navigation strip in Sales & Clearing into two rounded pills: "Overview & Analytics" and "Leaderboard". Completely remove the duplicate static leaderboard card and hardcoded dummy data arrays from the Overview view, ensuring that Overview isolates exclusively the four live visual charts while the Leaderboard view mounts cleanly when selected.

**Blocked by:** None (can start immediately)

**Status:** completed

- [x] Sub-navigation strip in `SalesDataView` updated from 3 pills to 2 primary rounded pills: `Overview & Analytics` and `Leaderboard`.
- [x] Primary tabs support ARIA tab attributes (`role="tab"`, `aria-selected`, `aria-controls`) and keyboard arrow navigation.
- [x] The Section 5 static `Sales Channel & Fulfillment Leaderboard` card and the dummy `topBuyers` and `topWarehouses` arrays are completely eliminated from `Overview & Analytics`.
- [x] In `Overview & Analytics`, only the four core analytical charts (Trajectory, Category COGS Recovery %, Channel Donut, RSL Decay Scatter Matrix) and telemetry/filter bars are displayed.
- [x] Toggling to `Leaderboard` hides the 4 overview charts and presents the dedicated Leaderboard container.
