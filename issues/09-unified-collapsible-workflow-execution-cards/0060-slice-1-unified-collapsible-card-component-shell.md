# Issue #60: Slice 1 - Unified Collapsible Card Component Shell & Section Collapse Controls

## What to build

Implement a shared collapsible card container layout used across both "Active Workflow Evaluations" and "Run History & Audit Log" sections in `WorkflowsView.tsx`. Add global section toolbar controls for `[ Expand All Cards ]` and `[ Collapse All Cards ]` across both active evaluation feeds and historical execution logs.

## Acceptance criteria

- [ ] Replaces the flat HTML table layout in "Run History & Audit Log" with individual execution cards sharing the container design of "Active Workflow Evaluations".
- [ ] Each card supports a collapsed state (1-to-2 line header with chevron toggle, status pill, strategy name, date, and quick stats) and an expanded state.
- [ ] Section headers for both "Active Workflow Evaluations" and "Run History & Audit Log" feature global "Expand All" and "Collapse All" toggle buttons.
- [ ] Card collapse/expand state is tracked per card ID and preserved during real-time updates and filter switches.

## Blocked by

None - can start immediately
