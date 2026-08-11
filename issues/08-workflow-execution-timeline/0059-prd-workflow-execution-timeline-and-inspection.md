# PRD---
Issue: 0059
Title: "PRD: Workflow Execution Timeline & Inspection Modal"
Status: COMPLETED
---

## Problem Statement

CPG sales representatives and operations managers running automated liquidation campaigns require historical transparency into past workflow job executions. Currently, when a campaign executes via an automated Agenda/Cron schedule or manual trigger, sales representatives cannot inspect the exact real-time backend execution timestamp (`executedAt`), the specific inventory lot IDs affected, the list of target buyer emails notified, or the frozen campaign settings active at that moment. This lack of execution auditability makes it difficult for sales teams to verify campaign performance and satisfy compliance requirements.

## Solution

Implement an end-to-end **Workflow Execution Timeline & Inspection** feature. This extends the backend `AutomationRun` data model to capture real-time execution start timestamps (`executedAt`), targeted buyer email lists (`buyerEmails`), affected inventory lot metadata snapshots (`affectedInventoryLots`), and immutable campaign settings snapshots (`campaignSnapshot`). In the frontend **Saved Campaigns Workspace**, add an **`ExecutedAt`** table column with an interactive reverse-chronological timestamp `<select>` dropdown. Selecting any execution timestamp immediately opens a sales-friendly visual audit modal rendering affected lots, buyer emails, frozen campaign settings, and resolution outcomes.

## User Stories

1. As a CPG sales representative, I want to see an `ExecutedAt` column in the Saved Campaigns table, so that I can immediately know when each campaign was last executed.
2. As a CPG sales representative, I want to select past execution timestamps from a dropdown in the table, so that I can inspect previous workflow runs without leaving the Saved Campaigns workspace.
3. As an operations manager, I want each execution run to record the exact real-time backend execution start timestamp (`executedAt`), so that I can verify schedule accuracy.
4. As a sales representative, I want to view a table of affected inventory Lot IDs, SKUs, product descriptions, case counts, and RSL in the execution inspection modal, so that I can see which items were liquidated during that run.
5. As a sales representative, I want to view the list of buyer emails notified during a specific run, so that I can follow up with targeted buyers.
6. As a compliance manager, I want the system to save an immutable snapshot of campaign settings and stage rules at the moment of execution, so that historical audit reports remain accurate even if current campaign rules are edited later.
7. As a sales representative, I want to view the resolution outcome (winning buyer or multi-entity donation allocation summary) for any past run, so that I can evaluate campaign success.

## Implementation Decisions

- **Domain Glossary Alignment**: Introduced canonical term `Workflow Execution Timeline` in `docs/CONTEXT.md` (*See [ADR 0017](docs/adr/0017-immutable-workflow-execution-timeline-snapshots.md)*).
- **Backend Schema Extensions**:
  - `AutomationRun` model extended with `executedAt` (`Date`), `buyerEmails` (`string[]`), `affectedInventoryLots` (`Array<{ lotId, lotNumber, sku, description, cases, rsl }>`), and `campaignSnapshot` (`Mixed`).
- **Backend REST API Contracts**:
  - `GET /api/liquidation-automations/:id/runs`: Returns lightweight summary array of execution runs (`runId`, `executedAt`, `status`, `affectedLotCount`, `buyerCount`).
  - `GET /api/liquidation-automations/runs/:runId`: Returns full execution snapshot for detailed modal inspection.
- **Frontend Saved Campaigns Table (`WorkflowsView.tsx`)**:
  - Added **`ExecutedAt`** column. Renders `Never Executed` pill for 0 runs, single timestamp badge for 1 run, and reverse-chronological `<select>` dropdown for multiple runs.
- **Sales-Friendly Execution Audit Modal**:
  - Structured modal rendering Execution Header, Affected Inventory Lots table, Targeted Buyer Email List, Frozen Campaign Settings snapshot, and Resolution Outcome.

## Testing Decisions

- **Seams**:
  - **Backend REST API Seam**: `backend/src/tests/execution_timeline.test.ts` testing `GET /api/liquidation-automations/:id/runs` and `GET /api/liquidation-automations/runs/:runId` against MongoDB and Agenda execution runs.
  - **Frontend Component Seam**: `frontend/src/test/ExecutionTimelineInspection.test.tsx` testing table dropdown rendering in `WorkflowsView` and inspection modal rendering in `LiquidationAutomationStudio`.
- **Prior Art**: Extends existing `automations.test.ts` and `CampaignValidationAndRosterInspection.test.tsx` patterns.

## Out of Scope

- Real-time WebSocket live streaming of running jobs (polling and snapshot GET requests are used).
- Editing or modifying historical execution run snapshots (all snapshots are strictly immutable).

## Further Notes

- All changes adhere to [ADR 0017: Immutable Workflow Execution Timeline Snapshots](docs/adr/0017-immutable-workflow-execution-timeline-snapshots.md).
