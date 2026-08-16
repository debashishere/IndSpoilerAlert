# 0098 — Slice 4: Live Evaluation Overrides, Re-Trigger Dispatch & JSON/CSV Audit Report Export

**What to build:**
Add operational controls, re-execution dispatching, raw telemetry inspection, and audit report generation to `WorkflowRunHistoryView.tsx` and `WorkflowRunAuditModal.tsx`.

**Blocked by:** 0097 — Slice 3: Granular Scope Tabs (Strategy Snapshot, Inventory Lots, Comms Log, & Bids Ledger)

**Status:** completed

- [x] **Live Evaluation Override**: Provide "Force Expire / Resolve Now" controls for in-flight evaluating runs from both the active banner and full-screen inspector header.
- [x] **Re-Trigger Workflow Action**: Provide an on-demand re-trigger action from the modal header to launch a fresh execution with identical parameters.
- [x] **Audit Report Export**: Implement 1-click "Export Audit Report" to download a formatted, structured JSON report of the execution run.
- [x] **Raw Telemetry & JSON Tab**: Provide a searchable / filterable raw telemetry payload viewer with 1-click JSON copy and payload download.
- [x] Unit and component tests verifying force-expire, export triggers, JSON searching, and clipboard copying.
