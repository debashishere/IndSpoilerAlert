# Issue #24: Sales Reconciliation API & FEFO Matching Logic

> **State:** `ready-for-agent`
> **Category:** `enhancement`

## Parent

- Issue #22

## What to build

Implement the reconciliation logic in backend services. When a sales report is ingested, match sales against inventory in the same distribution center. If a sales record lacks a lot number, use a First Expiring, First Out (FEFO) fallback matching strategy to subtract quantity from the soonest-expiring lot. Log reconciliation warning flags for manual audit in the UI.

## Acceptance criteria

- [ ] Reconciliation service method correctly matches sales to inventory lots in the same distribution center.
- [ ] Missing lot numbers trigger FEFO allocation across active lots of the same SKU, sorting by expiration date ascending.
- [ ] Successfully reconciled quantities decrement `InventoryLot.availableQty`.
- [ ] Sales records with ambiguous or incomplete matching are saved with a `reconciliationWarning` flag.
- [ ] Integration and unit tests verify FEFO distribution logic and edge cases.

## Blocked by

- Issue #23
