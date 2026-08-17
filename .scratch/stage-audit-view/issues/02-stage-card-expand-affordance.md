# 02 — Stage Card Expand Affordance in WorkflowRunTimelineStepper

**What to build:** Each stage card in the Stage-Gate Execution Timeline & Escalation Trace gains an "Expand Audit" chevron button on its right side. The button only appears on completed and active stages — pending and skipped stages show no expand affordance. Clicking the chevron toggles an accordion panel open beneath the stage card header. The panel renders a "Stage Audit" section label with its own collapse chevron, visually separated from the compact stage header above it. The accordion content area is a styled empty shell at this point — the mechanic is confirmed before real content is built in later tickets. Smooth expand/collapse animation is required.

**Blocked by:** None — can start immediately

**Status:** done

- [x] A chevron button appears on the right side of completed and active stage cards only
- [x] Pending and skipped stage cards show no chevron and are not expandable
- [x] Clicking the chevron expands/collapses a panel beneath the stage header without affecting other stage cards
- [x] The expanded panel opens with a "Stage Audit" section label and a matching collapse chevron
- [x] The section label is visually separated from the compact stage header (border or spacing divider)
- [x] Expand/collapse animates smoothly (CSS transition on height or opacity)
- [x] The `WorkflowRunTimelineStepper` component accepts additional props it needs from the audit modal (`allBuyers`, `allBids`, `inventoryList`, `run`) — wired through even if unused yet
- [x] No regressions to the existing stage card layout, live countdown timer, or status badges
