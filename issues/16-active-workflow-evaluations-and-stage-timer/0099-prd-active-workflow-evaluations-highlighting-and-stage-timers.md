# 0099 — PRD: Active Workflow Evaluations Highlighting, Input-Aware Window Formatting & Live Stage Timers

**What to build:**
Enhance the **Run and History** tab of Workflow setup to provide unified list row presentation for both in-flight active workflows and past execution history, with active evaluations visually differentiated via an amber/warning highlight theme. Add input-aware human-readable duration formatting (Minutes, Hours, Days) for all stage execution windows. Render a real-time live countdown timer, elapsed percentage progress, and total execution window for active stages within the Full-Screen Execution Audit Inspector.

**Blocked by:** `issues/15-workflow-run-history-and-audit-log-redesign/0094-prd-workflow-run-history-and-audit-log-redesign.md`

**Status:** ready-for-agent

- [ ] Unify the Active Workflow Evaluations list items with the History List rows, using identical interfaces and data layouts (ID, target lots, bids, status badge, action buttons).
- [ ] Highlight active in-flight evaluations with warning/amber background tint, borders, pulsing status badge, and timer icons across both the top banner and workflow strategy groups.
- [ ] Format stage execution windows into human-readable format matching user input units (`Mins`, `Hours`, `Days`), with smart inference for legacy execution records.
- [ ] Render a live Active Stage Window & Countdown hero widget in the Full-Screen Audit Inspector showing current active stage, total window duration, live ticking countdown, elapsed time, and visual progress bar.
- [ ] Display per-stage execution window duration badges and live active stage countdowns inside the Stage Timeline Stepper (`WorkflowRunTimelineStepper`).
