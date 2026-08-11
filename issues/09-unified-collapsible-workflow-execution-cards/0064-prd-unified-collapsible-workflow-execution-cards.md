# PRD: Unified Collapsible Workflow Execution Cards and Mobile Compact Views

## Problem Statement

Logistics operators, CPG sales representatives, and financial auditors monitor automated surplus liquidation strategies across active evaluation windows and historical execution runs. Currently, Active Workflow Evaluations are rendered as rich cards while Run History & Audit Log is presented as a flat, desktop-centric HTML data table. This inconsistency hides critical execution metrics (winning bids, total dollar recovery, aggregate case volume, snapshot inventory lots, and stage progression history) behind modal popups. Furthermore, on mobile and tablet devices, the table requires awkward horizontal scrolling and lacks collapsible view structures for managing screen real estate.

## Solution

Unify both Active Workflow Evaluations and Run History & Audit Log under a single **Collapsible Workflow Execution Card System** in `WorkflowsView.tsx`. Replace the flat table layout in Run History with rich, collapsible cards that expose 4-card metric grids, interactive snapshot SKU chips, inline sub-tabbed Execution Details panels (Overview, Target Inventory Lots, Stage Waterfall History, Raw Audit JSON), responsive vertical stage steppers for mobile/tablet devices, and global `Expand All` / `Collapse All` section toolbar controls.

## User Stories

1. As a CPG sales operator, I want Run History & Audit Log to render using the same collapsible card layout as Active Workflow Evaluations, so that I have a consistent visual experience across all workflow feeds.
2. As a sales manager, I want each historical execution card to display a 4-card metric grid (Total Cases & Lots, Total Bids Received, Winning Bid $/case, Total Revenue Recovered $), so that I can immediately evaluate the financial performance of completed runs.
3. As a logistics operator, I want the card header summary pill to display status, dispatched/resolution date-time ("when"), total cases, and total dollar value recovered, so that I can assess run outcomes at a glance without expanding cards.
4. As an auditor, I want snapshot inventory lots rendered as interactive SKU tags on execution cards, so that I can quickly verify which surplus lots were evaluated in a specific run.
5. As a sales administrator, I want to click an inline "Details" button on any active or historical workflow card to open an Execution Details Panel directly within the card, so that I can inspect run parameters without navigating away or opening popups.
6. As a compliance reviewer, I want the Execution Details Panel to include an "Overview & Audit Summary" sub-tab detailing trigger mode (Scheduled vs. Manual), resolution action, and winning buyer details.
7. As an inventory manager, I want the Execution Details Panel to include a "Target Inventory Lots" sub-tab displaying lot SKUs, expiration dates, unit floor prices, and awarded prices.
8. As a sales supervisor, I want the Execution Details Panel to include a "Stage Execution History" sub-tab showing step-by-step buyer blast timings, escalation delays, and resolution gate triggers.
9. As a developer/troubleshooter, I want the Execution Details Panel to include a "Raw Audit Log" sub-tab rendering clean, formatted JSON audit logs with copy-to-clipboard functionality.
10. As a field sales representative using a tablet or mobile device, I want execution cards to collapse into a touch-friendly 1-line header summary by default, so that I can navigate long execution feeds easily on small viewports.
11. As a mobile user, I want 4-column metric grids to reformat into responsive 1-column or 2x2 stacks on screens under 768px wide, so that metric values are clear and unclipped.
12. As a mobile operator, I want horizontal stage steppers to automatically adapt into vertical stage timeline cards on narrow screens, so that pipeline progress is readable without horizontal scrolling.
13. As a busy operator monitoring dozens of historical runs, I want global "Expand All Cards" and "Collapse All Cards" toolbar buttons at the top of the Active and History sections, so that I can toggle all cards simultaneously.
14. As a user filtering execution logs by status (`All`, `Awarded`, `Fallback`, `Failed`), I want per-card expanded/collapsed states to persist cleanly during filter transitions.

## Implementation Decisions

- **Unified Card Layout Architecture**: Replaced the standard HTML `<table>` in `WorkflowsView.tsx` with a unified collapsible card system shared between Active Evaluations and Run History feeds.
- **Card View Modes**:
  - `Collapsed`: 1-to-2 line summary header with chevron toggle, status pill, strategy title, execution timestamp ("when"), total cases, winning bid summary, and total recovery ($).
  - `Expanded`: 4-card metric grid, interactive lot tags, buyer bids panel, stage stepper timeline, and inline details sub-tabs.
- **Inline Execution Details Panel**: Sub-tab navigation (`overview`, `inventory`, `stages`, `audit`) integrated directly inside card state (`expandedRunDetailsId` / `detailsActiveTab`).
- **Global Section Controls**: `expandAllActive`, `collapseAllActive`, `expandAllHistory`, `collapseAllHistory` state variables added to `WorkflowsView.tsx` with sticky toolbar buttons.
- **Responsive Adaptations**: CSS media queries (`@media (max-width: 768px)`) for vertical stage steppers, touch-friendly 44px action buttons, and responsive grid stacking.

## Testing Decisions

- **Seam Selection**: Test `WorkflowsView` at the React Testing Library component seam in `frontend/src/test/CollapsibleExecutionCards.test.tsx`.
- **Test Invariants**:
  - Verify non-empty active and historical run lists render as collapsible card components instead of HTML tables.
  - Verify clicking card chevrons or global "Expand All" / "Collapse All" toggles modifies card collapse state in the DOM.
  - Verify metrics grid displays accurate `bids.length`, `winningBid.price`, `totalCases`, `totalValue`, and formatted `dispatchedAt` dates.
  - Verify inline Details Panel sub-tabs toggle correctly without modal dialogs.
- **Prior Art**: Follows patterns established in `frontend/src/test/ExecutionTimelineInspection.test.tsx` and `frontend/src/test/WorkflowsView.test.tsx`.

## Out of Scope

- Modifying the underlying MongoDB `AutomationRun` backend schema or Redux slice actions.
- Real-time WebSocket pushing for historical logs (polling/refresh interval remains intact).
- Exporting execution history to CSV/PDF (handled in separate reporting PRD).

## Further Notes

- Maintains complete backwards compatibility with existing saved campaign strategy links (`View Saved Strategy →`).
- Fully documented in `docs/CONTEXT.md` and ADR `docs/adr/0019-unified-collapsible-workflow-execution-cards.md`.
