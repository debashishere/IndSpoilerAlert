# 07 — Execution Audit Inspector — Stage Timeline UI

**What to build:** Update the Summary & Timeline Tab in the Full-Screen Execution Audit Inspector to render `stageExecutions[]` as a visual sequential stage stepper. Each stage entry shows its stage name/type, `firedAt` timestamp, buyers notified count, lots offered, status badge, and — for the currently active stage — a live countdown of remaining evaluation window time.

**Blocked by:** 03 (Stage 1 populates stageExecutions), 04 (Stage N+ populates stageExecutions)

**Status:** completed

- [x] Stage stepper renders one node per entry in `run.stageExecutions[]`, in `stageIndex` order
- [x] Each node shows: stage name/type, fired timestamp, buyer count, lot count, and status badge (`dispatched | partially_awarded | awarded | expired | escalating`)
- [x] Active stage node shows a live countdown timer using `stageExecutions[currentStageIndex].firedAt + stage.waitHours` as the deadline (aligns with Formatted Execution Window domain term)
- [x] Awarded lots are visually distinguished from remaining lots in the Inventory Scope Tab (strike-through or muted style)
- [x] `run.status = 'escalating'` renders a transition indicator between stage nodes ("Escalating to Stage 2...")
- [x] Graceful fallback for legacy runs without `stageExecutions` (shows existing flat timeline)
- [x] No new API endpoints required — reads from existing `AutomationRun` document returned by the run detail endpoint
