# 0102 — Slice 3: Active Stage Live Countdown Timer & Progress Tracking in Full-Screen Audit Inspector

**What to build:**
Render real-time countdown timers and execution window progress tracking for active workflow evaluations in the Full-Screen Audit Inspector (`WorkflowRunAuditModal`). When viewing an evaluating run, display an Active Stage Window & Countdown hero widget in the Summary tab featuring the active stage name, total execution window, live countdown timer (`00h 00m 00s remaining`), elapsed duration, and percentage progress bar. Also render live countdown indicators on the active stage card inside `WorkflowRunTimelineStepper`.

**Blocked by:** `0101-slice-2-input-aware-execution-window-formatting.md`

**Status:** done

- [x] Implement live 1-second interval timer in `WorkflowRunAuditModal` and `WorkflowRunTimelineStepper`.
- [x] Render a top Hero Countdown Card in the Summary & Timeline tab for active evaluating runs with stage name, total window, ticking remaining time, and progress bar.
- [x] Add an in-stepper live countdown badge on the active stage card in `WorkflowRunTimelineStepper` showing remaining window time.
- [x] Handle evaluation window expiration gracefully with a `"Window Expired – Resolution / Escalation in Progress"` state.
- [x] Add automated unit tests covering countdown rendering, progress calculation, and modal interactions.
