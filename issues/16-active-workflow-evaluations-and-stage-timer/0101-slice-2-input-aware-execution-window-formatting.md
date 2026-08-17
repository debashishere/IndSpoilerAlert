# 0101 — Slice 2: Input-Aware Stage Execution Window Duration Formatting

**What to build:**
Implement a robust duration formatting utility (`formatExecutionWindow`) that displays configured wait/execution windows in human-readable format reflecting the user's input unit (`Mins`, `Hours`, `Days`). Provide smart inference for legacy execution records (e.g. `< 1 hour` converts to minutes, multiples of 24 hours convert to days, otherwise hours). Update all references across the Timeline Stepper, Strategy Snapshot tab, and stage cards to use this formatter.

**Blocked by:** `0100-slice-1-active-workflow-highlighting-and-unified-list-rows.md`

**Status:** done

- [x] Implement `formatExecutionWindow(waitHours?: number, waitUnit?: 'd' | 'h' | 'm'): string` helper supporting explicit units and legacy fallback conversions.
- [x] Update `WorkflowRunTimelineStepper` to display "Execution Window: [Formatted Duration]" for each configured stage gate (e.g. `30 Mins`, `12 Hours`, `1 Day`, `2 Days`).
- [x] Update Strategy Snapshot tab in `WorkflowRunAuditModal` to display the formatted execution window instead of hardcoded hours.
- [x] Add unit tests verifying correct formatting for minutes, days, hours, and fractional values.
