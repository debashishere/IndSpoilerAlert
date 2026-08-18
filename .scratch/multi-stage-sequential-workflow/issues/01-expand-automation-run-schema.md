# 01 — Expand `AutomationRun` Schema

**What to build:** Extend the `AutomationRun` model and its TypeScript interface to support multi-stage sequential execution tracking. No execution behaviour changes in this ticket — it is a pure schema expansion that gates all subsequent work.

Add the following to `AutomationRun`:

- `stageExecutions[]` — embedded array, one entry per stage that has fired, each containing: `stageIndex`, `firedAt`, `buyerEmails[]`, `lotsOffered[]` (lotId + awardedQty + remainingQty), `agendaJobId` (the next-stage job scheduled after this stage), `status` (`pending | dispatched | partially_awarded | awarded | expired`)
- `currentStageIndex` — integer (0-based) pointing to the currently active stage
- Extended `status` enum — add `partially_awarded` and `escalating` alongside existing values

**Blocked by:** None — can start immediately

**Status:** done

- [x] `IAutomationRun` TypeScript interface updated with `stageExecutions`, `currentStageIndex`, and new status values
- [x] `AutomationRunSchema` Mongoose schema updated to match (use `Schema.Types.Mixed` for `stageExecutions` entries to keep flexibility)
- [x] `status` enum in schema expanded to include `partially_awarded` and `escalating`
- [x] Existing reads/writes of `AutomationRun.status` and `AutomationRun.fallbackJobId` remain backward-compatible (no breaking changes)
