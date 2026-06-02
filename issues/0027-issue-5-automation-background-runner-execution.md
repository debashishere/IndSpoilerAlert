# Issue #27: Liquidation Automations - Background Runner & Execution Engine

> **State:** `ready-for-agent`
> **Category:** `enhancement`

## Parent

- Issue #22

## What to build

Implement the background worker/cron runner in Express. It queries filtered stock, calls FastAPI sidecar matching and pricing endpoints, and automatically executes listings or donations.

## Acceptance criteria

- [ ] Background scheduler queries active automations on their schedules.
- [ ] Scheduler extracts matching stock using the saved filters.
- [ ] For each matching item, it automatically calls the pricing and buyer recommendation services.
- [ ] Listings are created, or donations coordinate automatically based on the template.
- [ ] Automation run logs are generated and visible in the UI.

## Blocked by

- Issue #26
