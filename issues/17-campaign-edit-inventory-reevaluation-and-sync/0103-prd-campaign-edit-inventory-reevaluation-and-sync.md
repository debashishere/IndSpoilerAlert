# 0103 — PRD: Campaign Edit Inventory Re-evaluation, Drift Detection & Scope Sync

**What to build:**
When a user edits an existing saved campaign in the Workflow Builder (`LiquidationAutomationStudio.tsx`), dynamic inventory filter rules (e.g., Category, RSL threshold ≤ 15%, Min Cases) are evaluated in real time against current active warehouse inventory. If the campaign previously executed, the live matched count (e.g., 1 lot) often differs drastically from the historical execution run's snapshot count (e.g., 104 lots) due to time-relative RSL degradation, inventory liquidation, or status changes.

This epic introduces:
1. **Automated Drift Detection & In-Context Re-evaluation Banner**: Detects discrepancy between the campaign's last execution run snapshot and current live matched lots, rendering an informative alert banner in the Studio editor.
2. **Inventory Scope Diff & Lot Status Breakdown**: Provides an interactive inspection dialog comparing currently eligible lots vs. previously liquidated, expired, or aged-out inventory lots.
3. **Scope Sync & Mode Actions**: Empowers the user to choose between maintaining a continuous **Dynamic Rule (Sweep Mode)** or **Freezing Current Eligible Lots (Explicit Snapshot Mode)** with one click.

**Blocked by:** `issues/16-active-workflow-evaluations-and-stage-timer/0099-prd-active-workflow-evaluations-highlighting-and-stage-timers.md`

**Status:** completed

- [x] Fetch the most recent execution run for `editingCampaignId` to retrieve the historical snapshot inventory scope count and lot IDs.
- [x] Render a prominent "Re-evaluate & Sync" notification banner when drift is detected between prior run snapshot count and current live matched count.
- [x] Provide an interactive "Review Lot Breakdown" modal displaying the diff between historical run lots and currently eligible live lots (Eligible, Liquidated/Depleted, Expired/Aged Out, Newly Entered).
- [x] Provide clear mode actions in the Studio header / inventory filter panel: "Keep Dynamic Rule" vs "Freeze as Explicit Scope".
- [x] Add full suite of automated unit and integration tests.
