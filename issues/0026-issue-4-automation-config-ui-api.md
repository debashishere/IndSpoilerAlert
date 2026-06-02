# Issue #26: Liquidation Automations - Config UI & Creation API

> **State:** `ready-for-agent`
> **Category:** `enhancement`

## Parent

- Issue #22

## What to build

Create the `LiquidationAutomation` model. Build the "Workflow Setup" tab UI, allowing suppliers to select an automation template, define inventory/buyer filters, set immediate/scheduled actions, and save the automation.

## Acceptance criteria

- [ ] `LiquidationAutomation` schema created and registered in the database.
- [ ] Express API endpoints to create, list, and update automations.
- [ ] Workflow Setup tab implemented in the frontend.
- [ ] Setup tab displays a clear explanation of how the chosen template operates.
- [ ] Filters (category, RSL, location) and schedules (immediate/scheduled) save successfully.

## Blocked by

- Issue #23
