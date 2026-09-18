# 09: Sequential Stacking & Clean Single-Column View for Negotiate / Counter Tab

**What to build:**
Refactor the Negotiate tab from a two-column split layout (`counter-left-pane` and `counter-right-pane` side-by-side) into a vertical, single-column sequential flow. The sections are stacked in top-down dependency order: [Step 1] Counter-Offer Parameters Card $\rightarrow$ [Step 2] Communication Card & Email Builder with live token sync $\rightarrow$ [Step 3] Counter Summary Dispatch Bar. Within the Counter-Offer Parameters Card, each input control (Counter Unit Price stepper, Counter Volume cases stepper, Proposal Holding Window, Reserve Floor indicator) occupies its own full-width row sequentially with live margin uplift badges and delta variance indicators. The counter summary dispatch bar docks stickily at the bottom of the viewport (`sticky bottom-0 z-20 backdrop-blur`) aligned with the `1100px` container. All test IDs (`counter-split-work-surface`, `counter-left-pane`, `counter-right-pane`, `negotiate-parameters-card`, `counter-communication-card`, `counter-summary-bar`) and in-situ continuity behaviors remain intact.

**Blocked by:** 07: Full-Screen Workspace Shell, Centralized Tabs & Maximize Removal.

**Status:** closed

- [x] Refactors `counter-split-work-surface` container into a single-column vertical flex layout (`flex flex-col gap-6 w-full max-w-[1100px] mx-auto`) with no side-by-side pane split.
- [x] Stacks sections in sequential order: Step 1 Counter-Offer Parameters Card (`counter-left-pane`) $\rightarrow$ Step 2 Multi-channel Communication Card & TipTap Counter Email Builder (`counter-right-pane`) $\rightarrow$ Step 3 Counter Summary Dispatch Bar (`counter-summary-bar`).
- [x] Refactors all form fields in Counter-Offer Parameters Card onto individual full-width rows (Counter Price stepper, Counter Quantity stepper, Holding Window selector, Reserve Floor price), with margin uplift badges and baseline delta indicators.
- [x] Preserves TipTap live dynamic token re-hydration, token chip stability, and communication channel toggles across the full-width editor canvas.
- [x] Docks the counter summary dispatch bar stickily at the bottom of the workspace viewport (`sticky bottom-0 z-20 backdrop-blur`) aligned with the `1100px` container, keeping real-time counter totals and the Send Counter-Offer CTA visible.
- [x] Preserves all test IDs (`counter-split-work-surface`, `counter-left-pane`, `counter-right-pane`, `negotiate-parameters-card`, `counter-communication-card`, `counter-summary-bar`) and confirms all Negotiate mode tests in Vitest remain green.
