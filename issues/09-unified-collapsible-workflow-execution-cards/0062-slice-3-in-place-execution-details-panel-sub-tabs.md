# Issue #62: Slice 3 - In-Place Execution Details Panel with Multi-Tab Audit Navigation

## What to build

Implement an inline, tabbed **Execution Details Panel** directly inside both Active and History cards in `WorkflowsView.tsx`. Replace external modal popups with inline tabs for Run Overview, Target Inventory Lots, Stage Waterfall History, and Raw Audit Payload JSON.

## Acceptance criteria

- [ ] Clicking the "Details" action button on any active or historical workflow card toggles an inline Execution Details Panel directly inside the card container.
- [ ] Panel includes 4 interactive sub-tabs:
  1. **Overview & Audit Summary**: Timestamps, trigger mode, resolution action, winning buyer details.
  2. **Target Inventory Lots**: Tabular breakdown of snapshot lots evaluated (SKUs, expiration, floor vs. awarded price).
  3. **Stage Execution History**: Stage-by-stage pipeline audit (Stage 1 blast, Stage 2 escalation, Fallback action).
  4. **Raw Audit Log**: Formatted JSON audit payload with copy-to-clipboard functionality.
- [ ] Tab switching operates locally within the expanded card without altering parent workspace sub-tabs or triggering page re-renders.

## Blocked by

- Issue #61
