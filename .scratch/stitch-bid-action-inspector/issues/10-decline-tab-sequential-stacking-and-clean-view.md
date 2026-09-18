# 10: Sequential Stacking & Clean Single-Column View for Decline Offer Tab

**What to build:**
Refactor the Decline Offer tab from a two-column split layout (`decline-left-pane` and `decline-right-pane` side-by-side) into a vertical, single-column sequential flow. The sections are stacked in top-down dependency order: [Step 1] Decline Specification Card $\rightarrow$ [Step 2] Communication Card & Rejection Email Builder $\rightarrow$ [Step 3] Decline Action Footer. Within the Decline Specification Card, each input (Mandatory Reason dropdown, Internal Audit Memo textarea, Inventory Return toggle) occupies its own full-width row sequentially with clean step indicators. The decline action footer docks stickily at the bottom of the viewport (`sticky bottom-0 z-20 backdrop-blur`) aligned with the `1100px` container. All test IDs (`decline-split-work-surface`, `decline-left-pane`, `decline-right-pane`, `decline-specification-card`, `decline-communication-card`, `decline-action-footer`) and decline workflow behaviors remain intact.

**Blocked by:** 07: Full-Screen Workspace Shell, Centralized Tabs & Maximize Removal.

**Status:** complete

- [x] Refactors `decline-split-work-surface` container into a single-column vertical flex layout (`flex flex-col gap-6 w-full max-w-[1100px] mx-auto`) with no side-by-side pane split.
- [x] Stacks sections in sequential order: Step 1 Decline Specification Card (`decline-left-pane`) $\rightarrow$ Step 2 Multi-channel Communication Card & TipTap Decline Email Builder (`decline-right-pane`) $\rightarrow$ Step 3 Decline Action Footer (`decline-action-footer`).
- [x] Refactors all form fields in Decline Specification Card onto individual full-width rows (Mandatory Reason select, Internal Audit Memo textarea, Inventory Relist toggle), with clean step badges and validation feedback.
- [x] Preserves TipTap decline dynamic token synchronization, dynamic token chips, catalog links, and channel selector pills across the full-width editor canvas.
- [x] Docks the decline action footer stickily at the bottom of the workspace viewport (`sticky bottom-0 z-20 backdrop-blur`) aligned with the `1100px` container, keeping the escrow deposit release indicator and Confirm Decline button visible.
- [x] Preserves all test IDs (`decline-split-work-surface`, `decline-left-pane`, `decline-right-pane`, `decline-specification-card`, `decline-communication-card`, `decline-action-footer`) and confirms all Decline mode tests in Vitest remain green.
