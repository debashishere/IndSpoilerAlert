# Issue #23: Liquidation Cycles Schema, API & Basic Campaign Filter UI

> **State:** `ready-for-agent`
> **Category:** `enhancement`

## Parent

- Issue #22

## What to build

Introduce the `LiquidationCycle` schema and model to represent specific closeout campaigns. Add reference fields to `InventoryLot` and `Sale` schemas. Implement Express API endpoints to create and list cycles. Build a campaign filter dropdown in the dashboard UI that restricts the displayed inventory lots to the active cycle.

## Acceptance criteria

- [ ] Mongoose model for `LiquidationCycle` created and registered.
- [ ] Express API endpoints `POST /api/liquidation-cycles` and `GET /api/liquidation-cycles` return 200/201.
- [ ] Dashboard UI displays a dropdown to select or create a Liquidation Cycle.
- [ ] Switching cycles in the UI filters the inventory list view dynamically to show only lots associated with that cycle.
- [ ] Integration tests verify cycle creation, listing, and cycle-based filtering.

## Blocked by

None - can start immediately
