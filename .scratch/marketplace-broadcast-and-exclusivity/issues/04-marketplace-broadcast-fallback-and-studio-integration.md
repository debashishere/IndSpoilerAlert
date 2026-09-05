# 04 — Marketplace Broadcast Fallback & Studio Integration

**What to build:** Integrate the **Marketplace Broadcast** fallback option into the Liquidation Automation Studio UI and the Agenda fallback execution engine. When all private stages in a workflow expire with unawarded inventory, and the fallback rule is set to `marketplace_broadcast`, the engine automatically projects and publishes the remaining unsold inventory to the public marketplace.

**Blocked by:** 02 — Stage Balance Carry-Forward & Partial Awards Handling, 03 — Compliance Hold Gate & Supplier Document Alerts

**Status:** complete

- [x] Add `"Marketplace Broadcast"` option to Fallback Actions dropdown in `LiquidationAutomationStudio.tsx`.
- [x] Implement `marketplace_broadcast` fallback handler in `agendaService.ts` (`execute-workflow-fallback`).
- [x] Record `resolution.action = 'marketplace_broadcast'` and list published `listingIds` on the `AutomationRun` record.
- [x] Display the marketplace broadcast outcome in the Workflow Run Audit Inspector.
