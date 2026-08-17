# 0100 — Slice 1: Active Workflow Evaluations Highlighting, Section Division & Unified List Rows

**What to build:**
Divide the previous single "Run History & Audit Log" hero element in `WorkflowRunHistoryView` into two distinct, dedicated functional sections:
1. **Actively Running**: A dedicated hero section displaying all live, in-flight workflow evaluations currently awaiting buyer bids or stage escalation windows.
2. **History**: A dedicated execution history and audit log section equipped with workflow strategy grouping, global search, status filters (All, Evaluating, Awarded, Fallback, Failed), and expand/collapse controls.

Unify the list item row layout across both sections so that active and historical runs share the exact same structural components (Run ID chip, dispatch timestamp, automation mode tag, target lots count, received bids, recovered dollar value, Force Expire button, and Full-Screen Audit Log button). Active in-flight runs are visually highlighted with an amber/warning border (`hsl(var(--warning))`), subtle background tint, pulsing status pill, and timer icon.

**Blocked by:** `0099-prd-active-workflow-evaluations-highlighting-and-stage-timers.md`

**Status:** ready-for-agent

---

### Key Requirements & Layout Specifications

#### 1. Section Division: "Actively Running" vs. "History"
- **Actively Running Section**:
  - Header with `Zap` / live activity icon, title ("Actively Running Evaluations"), active count badge, and a subtitle ("Live Bidding & Stage Escalation Windows").
  - Renders when active in-flight evaluations (`status: 'evaluating'` or `'dispatched'`) exist and the selected status filter permits.
  - Lists all active runs using the unified row layout styled with warning/amber emphasis.
  - When no active evaluations are running, conditionally renders a subtle empty state or hides smoothly.
- **History Section**:
  - Header with `History` icon, title ("Execution History & Audit Log"), and total runs count badge.
  - Toolbar controls integrated into the History header:
    - Search input (filtering by workflow title, run ID, mode, SKU).
    - Status filter pills (`All`, `Evaluating`, `Awarded`, `Fallback`, `Failed`).
    - Global `[ Expand All ]` and `[ Collapse All ]` toggle buttons.
  - Renders workflow-grouped strategy cards containing historical execution runs.

#### 2. Unified Row Component Layout
- Active runs (in the top "Actively Running" section and within expanded strategy cards) and historical runs (under grouped workflow cards) must share a unified row structure:
  - **Left Section**: Run ID chip (monospace, 1-click copy), dispatch timestamp, automation mode badge (`Autonomous` vs `Manual Approval`).
  - **Middle Section**: Target Lots count badge (`X Lots`), Bids received badge (`Y Bids`), and Resolution summary (e.g. `$Z Recovered` or `Fallback Executed`).
  - **Right Section / Actions**:
    - Status badge: Pulsing amber badge (`Evaluating - Stage N`) for active runs; standard status badges (`Awarded`, `Fallback`, `Failed`) for completed runs.
    - `[ Force Expire ]` action button (available on active in-flight runs).
    - `[ Full-Screen Audit Log ↗ ]` secondary button (opens full-screen audit modal for any run).

#### 3. Styling & Visual Hierarchy
- Active runs: Warning/amber border (`1px solid hsl(var(--warning) / 50%)`), tinted background (`hsl(var(--warning) / 6%)`), and pulsing amber indicator dot.
- Historical runs: Standard subtle card border (`1px solid hsl(var(--border-color))`), default background, and status-colored badges.

---

### Implementation Checklist

- [ ] Split the single "Run History & Audit Log" hero element in `WorkflowRunHistoryView.tsx` into two dedicated top-level section containers: "Actively Running" and "History".
- [ ] Implement the "Actively Running" section hero with live badge count, active evaluation indicators, and amber/warning container styling.
- [ ] Refactor the "History" section header to host the search input, status filters (`All`, `Evaluating`, `Awarded`, `Fallback`, `Failed`), and global expand/collapse controls.
- [ ] Extract and standardize a reusable `WorkflowExecutionRow` layout component/function used for active runs and historical runs alike.
- [ ] Ensure active evaluation rows render identical metadata (Run ID, target lots, bids received, recovery amount) and action triggers (`Force Expire`, `Full-Screen Audit Log`) as historical rows.
- [ ] Apply highlighted amber/warning theme (`hsl(var(--warning))` borders, background tints, and active pulse badges) to in-flight runs across both the Actively Running section and workflow strategy groups.
- [ ] Ensure non-active historical runs maintain standard card backgrounds with status-specific badges.
- [ ] Write unit tests verifying section header division, filter behavior, and unified execution row rendering.
