# 08: Sequential Stacking & Clean Single-Column View for Accept Offer Tab

**What to build:**
Refactor the Accept Offer tab from a two-column split layout (`accept-left-pane` and `accept-right-pane` side-by-side) into a vertical, single-column sequential flow. The sections are stacked in top-down dependency order: [Step 1] Logistics & Allocation Parameters Card $\rightarrow$ [Step 2] Communication Card & Email Builder $\rightarrow$ [Step 3] Settlement Summary Footer. Within the Logistics & Allocation Card, all inputs (DC Pickup Address, Dock Operating Hours, Awarded Quantity, Settled Unit Price) each occupy their own full-width row sequentially with clean helper labels and badges, eliminating cramped side-by-side inputs. The settlement summary bar docks stickily at the bottom of the viewport (`sticky bottom-0 z-20 backdrop-blur`) aligned with the `1100px` container. All test IDs (`accept-work-surface`, `accept-left-pane`, `accept-right-pane`, `accept-logistics-card`, `accept-communication-card`, `accept-execution-bar`) remain intact.

**Blocked by:** 07: Full-Screen Workspace Shell, Centralized Tabs & Maximize Removal.

**Status:** complete

- [x] Refactors `accept-work-surface` container into a single-column vertical flex layout (`flex flex-col gap-6 w-full max-w-[1100px] mx-auto`) with no side-by-side pane split.
- [x] Stacks sections in sequential order: Step 1 Logistics & Allocation card (`accept-left-pane`) $\rightarrow$ Step 2 Multi-channel Communication Card & TipTap Email Builder (`accept-right-pane`) $\rightarrow$ Step 3 Settlement Summary Bar (`accept-execution-bar`).
- [x] Refactors all form fields in Logistics & Allocation card onto individual full-width rows (DC Pickup Address, Dock Operating Hours, Awarded Quantity, and Settled Unit Price), with step badges and clean spacing.
- [x] Expands TipTap Email Builder to full container width with clean toolbar controls, token badges, and channel selector pills (`Email`, `In-App`, `SMS`).
- [x] Docks the settlement execution bar stickily at the bottom of the workspace viewport (`sticky bottom-0 z-20 backdrop-blur`) aligned with the `1100px` container, keeping live recovery calculations and the primary Confirm Offer CTA visible.
- [x] Preserves all test IDs (`accept-work-surface`, `accept-left-pane`, `accept-right-pane`, `accept-logistics-card`, `accept-communication-card`, `accept-execution-bar`) and confirms all Accept mode tests in Vitest remain green.
