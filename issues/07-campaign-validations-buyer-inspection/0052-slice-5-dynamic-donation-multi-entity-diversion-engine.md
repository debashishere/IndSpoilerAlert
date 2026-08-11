# Issue 0052: Dynamic Donation & Multi-Entity Diversion Configuration Engine

## What to build

Introduce a Dynamic Donation & Multi-Entity Diversion section into the Liquidation Automation Studio and extend the backend background job runner to support multi-entity food bank diversion. Suppliers can enable auto-donation backstops, set global case caps, configure recipient non-profit entities (`Name`, `Email`, `Max Cases`, `% Allocation`), select diversion strategies (`percentage_split` vs `priority_cascade`), and track multi-entity allocation summaries upon fallback execution.

## Acceptance criteria

- [ ] UI provides a Dynamic Donation Configuration section with an auto-donation toggle, global max cases cap, diversion strategy selector, and multi-entity receiver table.
- [ ] Multi-entity receiver table supports dynamically adding, editing, and deleting recipient food bank entities.
- [ ] `LiquidationAutomation` schema persists `donationConfig` payload.
- [ ] `execute-workflow-fallback` job in `agendaService.ts` executes multi-entity allocation logic and logs donation summary metadata in the run resolution.
- [ ] Automated backend tests verify `donationConfig` persistence and fallback job execution.

## Blocked by

None - can start immediately
