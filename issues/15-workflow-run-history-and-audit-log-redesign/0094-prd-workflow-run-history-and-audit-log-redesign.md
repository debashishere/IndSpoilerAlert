# 0094 — PRD: Run History & "A to Z" Audit Log Redesign

**What to build:**
Redesign the **Run History & Audit Log** in the Workflow Builder tab into a workflow-grouped strategy interface that lists past executions grouped by parent workflow, and opens a full-screen, deep "A to Z" audit popup modal with complete chronological execution logs, immutable strategy snapshots, itemized inventory lot scopes, buyer dispatches, bidding evaluations, and export capabilities.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] Group past executions under parent Saved Workflow Strategy cards with aggregate health metrics (total runs, clearance rate, total recovered value, last run date).
- [ ] Implement search by workflow name / run ID and status filter pills (All, Evaluating, Awarded, Fallback, Failed).
- [ ] Build a Full-Screen "A to Z" Execution Audit Inspector modal with sticky executive summary header and 6 dedicated audit tabs.
- [ ] Provide interactive visual stage-gate escalation stepper (`WorkflowRunTimelineStepper`) showing progression across configured stage gates.
- [ ] Provide granular audit tabs: Strategy Snapshot, Inventory Scope (itemized SKU/lot table), Communications Log, Bids Ledger, and Raw Telemetry / JSON.
- [ ] Implement live in-flight evaluation override ("Force Expire / Resolve Now"), Re-Trigger dispatch, and 1-click JSON Audit Report Export.
