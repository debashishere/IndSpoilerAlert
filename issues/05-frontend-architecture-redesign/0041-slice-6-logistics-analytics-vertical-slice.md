# Issue #41: Logistics & Analytics Vertical Slice (LogisticsService, LogisticsSlice, LogisticsView & AnalyticsView)

> **State:** `ready-for-agent`
> **Category:** `enhancement`

## Parent

Issue #35

## What to build

Extract and modularize the freight logistics workflows and distressed inventory decision intelligence reporting from the monolithic file into distinct, highly cohesive vertical views. Create `LogisticsService` encapsulating shipment queries (`/shipments`), dock appointment scheduling confirmations (`/shipments/:id/confirm-appointment`), and FSMA-compliant cold chain temperature recording (`/shipments/:id/temperature`). Create `LogisticsSlice` to manage shipment records, dock appointment modal states (`pickupWindow`), and cold chain logging triggers.

Build lazy-loaded `LogisticsView` (`ShipmentTable`, `DockAppointmentModal`, `ColdChainLogger`) and `AnalyticsView` (`SummaryMetrics`, `RSLDistributionChart`, `COGSRecoveryDashboard`) to replace the inline render blocks inside `App.tsx`. Ensure that `AnalyticsView` consumes data from `CoreService` (`/analytics/summary`) and `InventoryService` while utilizing memoized selectors to render complex reporting charts (`Remaining Shelf Life` distribution and landfill diversion stats) smoothly without unnecessary re-renders when navigation or modals toggle.

## Acceptance criteria

- [ ] `LogisticsService` encapsulates all shipment fetching, dock appointment scheduling, and cold chain temperature logging endpoints with exact HTTP header preservation.
- [ ] `logisticsSlice` manages shipment data, appointment scheduling modal states, and temperature log history cleanly without prop drilling.
- [ ] `LogisticsView` and `AnalyticsView` are dynamically loaded via `React.lazy`, preserving 100% exact visual layout, CSS classes, and table structures from `App.css` and `index.css`.
- [ ] `AnalyticsView` renders high-fidelity decision intelligence summaries (`COGS recovery rate`, `RSL distribution`, `landfill diversion`) using memoized data slices.
- [ ] Automated integration tests verify shipment appointment confirmations (`scheduled` -> `confirmed`), cold chain temperature submissions, and analytics summary display.

## Blocked by

Issue #36
