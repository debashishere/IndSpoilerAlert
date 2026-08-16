# 0095 — Slice 1: Workflow-Grouped Main List View with Strategy Health Metrics & Search

**What to build:**
Refactor the main **Run History & Audit Log** surface in `WorkflowsView.tsx` into a modular, workflow-centric view (`WorkflowRunHistoryView.tsx`). Group all historical run executions under their parent Saved Workflow Strategy cards with aggregate summary metrics, status filtering, and fast workflow/run search.

**Blocked by:** None — can start immediately.

**Status:** complete

- [x] Group historical runs by parent workflow (`automationId` / strategy template), including standalone/ad-hoc groups for unmatched executions.
- [x] Display aggregate workflow health metrics in strategy card headers: Total Runs count badge, Clearance/Award Rate %, Cumulative Dollar Value Recovered ($), and Latest Execution timestamp.
- [x] Provide expand/collapse accordions for individual workflow strategy cards, as well as global "Expand All" / "Collapse All" controls.
- [x] Render chronological execution run rows under each expanded workflow displaying Run ID, trigger mode (scheduled/manual), timestamp, target lots count, total bids received, recovered value, and status badge.
- [x] Implement search bar (matching workflow names and run IDs) and status filter pills (`all`, `evaluating`, `awarded`, `fallback_executed`, `failed`).
- [x] Render an Active Evaluations highlight banner whenever in-flight runs are evaluating.
- [x] Unit and component integration tests verifying grouping, metric calculations, search, and filtering behavior.
