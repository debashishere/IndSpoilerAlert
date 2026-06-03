# Issue #33: Live Runs Feed & Run History Audit UI

> **State:** `ready-for-agent`
> **Category:** `enhancement`

## Parent

- Issue #22

## What to build

Build dashboard elements to monitor currently running evaluations and audit historical execution results.

1. **Build "Currently Active Runs" Feed**:
   * Create a widget card displayed prominently at the top of the workflows panel.
   * Query the database for active `AutomationRun` documents with status `evaluating`.
   * Display real-time execution details: time remaining in evaluation (countdown), number of bids received, and best bid amount.
   * Provide actions: "View Bids" (opens the lot hub for manual award) and "Force Expire & Donate" (manually triggers the fallback early).
2. **Build "Run History" Search Table**:
   * Add a historical log table under the workflow cards.
   * Query and display past runs with columns: Dispatch Time, Status (`awarded`, `fallback_executed`, `failed`), Snapshot lot count, and Resolution Summary (e.g. "Awarded to National Retailers for $12.50/case" or "Diverted to Midwest Food Bank").
   * Support basic filtering by status.

## Acceptance criteria

- [ ] Active runs widget displays correct remaining countdowns and active bid metrics.
- [ ] Historical runs table accurately maps past logs and resolved transaction details.
- [ ] Users can manually trigger early timeout/fallback from the active runs widget.
- [ ] History layout remains responsive and fits with the existing dark-mode design system.

## Blocked by

- Issue #32
