# Issue 0050: Saved Campaigns Action Popover & View Transition UX

## What to build

Enhance the Saved Campaigns tab UX by improving popover menu positioning and sub-tab view transitions. The 3-dots action menu (`Edit`, `Activate`, `Stop`, `Delete`) for items located near the bottom of the table must pop upward into a non-scroll-clipped overlay rather than expanding into the scrollable container. Additionally, switching between Saved Campaigns and the Campaign Builder must feature a smooth cross-fade animation and smooth top-scroll reset.

## Acceptance criteria

- [ ] 3-dots action dropdown menu detects row position and pops upward (`bottom: 44px`) for bottom rows to prevent scroll-container clipping.
- [ ] View switching between `Saved Campaigns` and `Campaign Builder` sub-tabs applies smooth cross-fade CSS transitions.
- [ ] Clicking `Edit` on a saved campaign triggers `window.scrollTo({ top: 0, behavior: 'smooth' })`.
- [ ] Integration tests verify action menu popover rendering and sub-tab state transitions.

## Blocked by

None - can start immediately
