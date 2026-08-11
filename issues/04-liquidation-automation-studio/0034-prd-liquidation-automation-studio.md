# Issue #34: Rearchitect Liquidation Automation Module into High-Grade SaaS Studio (PRD)

> **State:** `ready-for-agent`
> **Category:** `enhancement`

## Problem Statement

Suppliers currently struggle with configuring automated liquidation workflows. The existing workflow UI is buried inside secondary tab views or basic forms, lacks visual clarity, and fails to give suppliers immediate feedback on *which* surplus inventory lots and *how much* dollar value/case volume a workflow will affect before launching. Suppliers cannot easily inspect matched inventory, override individual lot inclusions/exclusions, visualize multi-stage buyer escalation (stage-gates), or preview buyer-facing email drafts with populated inventory tables (`{{inventory_table}}`).

## Solution

Rearchitect the workflow module into a full-page **Liquidation Automation Studio** with modern enterprise SaaS aesthetics and live impact feedback:

1. **Full-Page Studio Focus**: Make the workflow creation, management, and execution studio the primary focal view of the Workflow module.
2. **Interactive Template Picker & Visual Logic Banner**: Display curated **Stage-Gate Workflow Template** cards at the top with an interactive flow diagram preview explaining trigger rules, stage actions, and expected ROI recovery.
3. **Live Impact & Allocation Panel**: A sticky real-time sidebar/drawer that calculates and displays matched lot counts, total case volumes, COGS recovery value, RSL distribution, and target buyer reach as filters change.
4. **Hybrid Inventory Selector**: Combine dynamic query filters (Category, Max RSL, Expiration) with granular manual checkbox overrides (`explicitLotIds` and `excludedLotIds`) and compliance warning badges.
5. **Stage-Gate Timeline Cards**: Visual sequence cards for multi-tier buyer targeting (Stage 1 Preferred Buyers -> Stage 2 Secondary Buyers -> Stage 3 Donation) with customized discount rules, wait delays, and timezones.
6. **Pre-Flight Launch Audit & Live Email Draft Preview**: An interactive preview of buyer-facing HTML emails with rendered `{{inventory_table}}` dynamic tokens, paired with a mandatory pre-flight audit modal prior to launching or scheduling.

## User Stories

1. As a supplier operations manager, I want the Liquidation Automation Creation Studio to be the primary full-page view, so that I can focus entirely on configuring complex liquidation workflows without feeling cramped by modals or tab subviews.
2. As a supplier, I want to view visual Stage-Gate Workflow Template cards (e.g., Short-Dated Clearance, Dairy Fast-Track, Overstock Blast) with step-by-step logic diagrams at the top of the studio, so that I immediately understand how each workflow functions before choosing one.
3. As a supplier, I want selecting a template to automatically pre-populate the inventory rules, buyer target groups, and stage-gate escalation settings below, so that I can launch standard automations with minimal setup time.
4. As a supplier, I want a Live Impact & Allocation Panel sticky on the side of the creation view, so that I can see real-time updates of matched lot counts, total case volume, estimated $ COGS recovery, and buyer reach as I adjust filters.
5. As a supplier, I want to use dynamic inventory filters (Category, Max Remaining Shelf Life, Days to Expiration, Min Cases) to select distressed inventory, so that I can target specific risk profiles automatically.
6. As a supplier, I want an interactive inventory lot data grid within the Hybrid Inventory Selector, so that I can review each matched lot's SKU, RSL, case count, warehouse location, and compliance status.
7. As a supplier, I want to manually uncheck specific lots or check non-matching lots in the data grid, so that I can handle business edge cases by adding explicit inclusions or exclusions to the workflow.
8. As a supplier, I want to see visual warning badges on lots with missing FDA compliance documents (COA/Batch records) or active open bids, so that I do not accidentally push unverified or locked inventory into automated listing workflows.
9. As a supplier, I want to configure multi-stage cascading rules using Stage-Gate Timeline Cards, so that I can target Tier 1 buyers first at a lower discount, and automatically escalate to Tier 2 buyers or Donation after specified wait delay gates.
10. As a supplier, I want to set pricing and discount rules for each stage gate (e.g. AI Yield Recommended, Fixed % Off, or Custom Bid Floor), so that I can maximize recovered inventory value.
11. As a supplier, I want to choose between immediate execution ("Run Now") or scheduled execution with a dedicated Workflow Timezone (e.g., America/New_York), so that scheduled runs fire at the optimal time for target buyers.
12. As a supplier, I want an inline rendered HTML email preview showing the exact message and populated `{{inventory_table}}` that buyers will receive, so that I can verify formatting and pricing before dispatching.
13. As a supplier, I want to open a Pre-Flight Launch Audit modal when clicking launch or schedule, so that I can perform a final review of total lots, case counts, value at risk, target buyers, and schedule details.
14. As a supplier, I want to view active and past workflow runs in a dedicated history list with status tracking (e.g. Active, Completed, Force Expired), so that I can audit past liquidation performance.

## Implementation Decisions

- **Full-Page Studio Component**:
  - Implement `LiquidationAutomationStudio.tsx` in `frontend/src/components/` as the primary workspace view for the Workflow tab in `App.tsx`.
- **Live Impact Calculation Engine**:
  - Compute live metrics client-side (or via light preview API call) using `useMemo` on matched `InventoryLot` items, returning total matched count, total cases, total estimated value, and RSL bucket distribution.
- **Hybrid Inventory Selector**:
  - Store `inventoryFilters` state as `{ category, maxRsl, minCases, warehouse, explicitLotIds: string[], excludedLotIds: string[] }`.
  - Grid UI allows toggling single lot IDs into `explicitLotIds` or `excludedLotIds`.
- **Stage-Gate Timeline Component**:
  - Store `stages` array on the automation object: `[{ stageIndex: 1, buyerSegmentId: string, discountType: 'yield'|'fixed'|'floor', discountValue: number, waitHours: number }]`.
- **Email Draft Rendering & Dynamic Tokens**:
  - Render an HTML email preview component that replaces `{{inventory_table}}` with a styled HTML `<table>` summarizing matched lot details (`SKU`, `Description`, `Cases`, `RSL`, `Discount Price`).
- **Pre-Flight Launch Audit Modal**:
  - Implement a modal dialog displaying high-level key performance metrics and a final launch/schedule trigger button that calls `POST /api/liquidation-automations` or `POST /api/liquidation-automations/:id/trigger`.

## Testing Decisions

- **Seams for Testing**:
  - **Frontend Component Seam (React / Vitest / RTL)**:
    - Test `LiquidationAutomationStudio.tsx`:
      - Template selection pre-populates default filters and updates the visual flow banner.
      - Changing filter sliders/inputs updates the **Live Impact & Allocation Panel** metrics in real-time.
      - Explicitly unchecking a lot adds its ID to `excludedLotIds` and updates the matched count in the side panel.
      - Adding a stage gate correctly appends a new Stage Card to the escalation sequence.
      - Pre-Flight Launch Audit opens with populated email table preview and correct lot counts.
  - **Backend API Integration Seam (Supertest)**:
    - Test `POST /api/liquidation-automations` and `POST /api/liquidation-automations/:id/trigger` in `backend/src/tests/liquidation.test.ts` to ensure explicit/excluded lot IDs and stage-gate arrays are saved and filtered properly during execution.
- **Prior Art**: Refer to `backend/src/tests/liquidation.test.ts` and `frontend/src/components/LotOperationsHubView.tsx` for layout and component test patterns.

## Out of Scope

- Real-time WebSocket live-collaborative workflow editing by multiple simultaneous users.
- Third-party Zapier/Make external webhook builder node canvas.

## Further Notes

- Updated `docs/CONTEXT.md` with canonical terms: `Liquidation Automation Studio`, `Live Impact & Allocation Panel`, and `Pre-Flight Launch Audit`.
