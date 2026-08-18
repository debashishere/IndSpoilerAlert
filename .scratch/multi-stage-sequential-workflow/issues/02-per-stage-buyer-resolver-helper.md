# 02 — Per-Stage Buyer Resolver Helper

**What to build:** A standalone helper function that accepts a single stage config and automation context, and returns only that stage's resolved buyer list. This replaces the current loop in `createAutomationRun()` that merges all stages into one shared pool — the root cause of the bug.

The helper must respect `buyerMode` (`custom`, `list`, `segment`, `all`), resolve `customBuyers`, `customBuyerIds`, `buyerListId`, and `buyerSegment`, enforce `isActive`, `optInBidding`, and `optInSales` flags per stage type, and return `{ buyerEmails: string[], evaluatedBuyerIds: ObjectId[], resolvedBuyerMap: Map }`.

**Blocked by:** None — can start immediately

**Status:** done

- [x] Helper extracted into its own function (e.g. `resolveStageBuyers(stage, automation)`) within `stageResolver.ts` utility
- [x] Covers all four buyer modes: `custom`, `list`, `segment`, `all`
- [x] Enforces `optInBidding` / `optInSales` per stage type (`liquidation`, `donation`, `landfill`)
- [x] Returns a typed result: `{ buyerEmails, evaluatedBuyerIds, resolvedBuyerMap }`
- [x] Unit tests covering each buyer mode and opt-in filter combinations
