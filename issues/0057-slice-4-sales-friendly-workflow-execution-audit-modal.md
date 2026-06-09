---
Issue: 0057
Title: "Slice 4: Sales-Friendly Workflow Execution Audit Modal"
Status: COMPLETED
---

## What to build

Build a sales-friendly Workflow Execution Data Inspector Modal that opens when an execution timestamp is selected. Renders 4 structured sections: Execution Header, Affected Inventory Lots table, Targeted Buyer Email List, Frozen Campaign Settings snapshot, and Resolution Outcome.

## Acceptance criteria

- [ ] Displays Execution Header with real-time start time (`executedAt`), status badge, and execution mode.
- [ ] Section 1 displays Affected Inventory Lots table (Lot IDs, SKUs, descriptions, case counts, RSL).
- [ ] Section 2 displays Targeted Buyer Email List with company names and segment tags.
- [ ] Section 3 displays Frozen Campaign Settings snapshot (discount rules, email template, donation config).
- [ ] Section 4 displays Resolution Outcome details (winning buyer / donation entity allocations).

## Blocked by

- [Issue 0056](file:///Users/debashisroy/Documents/SpoilerAlert/issues/0056-slice-3-saved-campaigns-executedat-column-dropdown-ui.md)
