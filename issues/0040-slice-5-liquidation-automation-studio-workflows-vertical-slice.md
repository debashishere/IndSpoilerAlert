# Issue #40: Liquidation Automation Studio & Workflows Vertical Slice (WorkflowService, WorkflowSlice & WorkflowsView)

> **State:** `ready-for-agent`
> **Category:** `enhancement`

## Parent

Issue #35

## What to build

Extract and modularize the `Liquidation Automation Studio` and campaign management (`Liquidation Cycles`) from the presentation monolith into a high-performance vertical slice. Create `WorkflowService` to encapsulate campaign CRUD (`/liquidation-cycles`), rule-based automation templates (`/liquidation-automations`), live email table token rendering previews (`/liquidation-automations/preview-email`), and background execution triggers (`/automation-runs`, `/automation-runs/:id/force-expire`).

Build `workflowSlice` to manage `liquidationCycles`, `editingCampaignId`, multi-step `campaignWizardStep` states, stage-gate timeline cards, and explicit inventory lot selection checkboxes (`explicitLotIds`, `excludedLotIds`). Implement high-performance Reselect selectors (`selectLiveImpactMetrics`) to aggregate and memoize real-time metrics for the `Live Impact & Allocation Panel` (`matched lot count`, `total case volume`, `COGS recovery dollar value`, and `RSL distribution`). Build lazy-loaded `WorkflowsView` wrapping `LiquidationAutomationStudio`, `CampaignDrawer`, and `PreFlightAuditModal` with 100% exact visual and CSS layout fidelity.

## Acceptance criteria

- [ ] `WorkflowService` encapsulates all liquidation cycle, automation studio, preview email, and run execution HTTP calls with exact existing network payloads and headers.
- [ ] `workflowSlice` manages campaign wizard progression, stage-gate timeline rules (`discountType`, `waitHours`), and explicit/excluded lot selections cleanly.
- [ ] Memoized Reselect selectors (`selectLiveImpactMetrics`) compute real-time impact metrics instantaneously when filter sliders or explicit checkboxes are modified.
- [ ] `WorkflowsView` lazy-loads `LiquidationAutomationStudio`, preserving exact CSS styling across the sticky `Live Impact & Allocation Panel`, `Hybrid Inventory Selector` grid, and `PreFlightAuditModal`.
- [ ] Automated integration tests verify campaign creation wizard flows, live impact metric recalculations across filter adjustments, email token preview (`{{inventory_table}}`) rendering, and pre-flight audit triggers.

## Blocked by

Issue #36
