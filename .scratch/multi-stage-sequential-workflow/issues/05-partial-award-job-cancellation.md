# 05 — Partial Award + Next-Stage Job Cancellation in `awardBid()`

**What to build:** When a bid is awarded, `awardBid()` (and `checkBidAgainstActiveWorkflows`) must mark the awarded lot in the active run's `stageExecutions[currentStageIndex].lotsOffered[]`, then decide whether to cancel the next-stage Agenda job or let it run.

Decision rule:
- If awarded lots = all lots in the current stage pool → cancel next-stage Agenda job (`agenda.cancel({ _id: agendaJobId })`), set `run.status = 'awarded'`
- If awarded lots < all lots → flip `run.status = 'partially_awarded'`, leave next-stage job intact (remaining lots carry forward when it fires)

Auto-award path: if a bid meets or exceeds `automation.rules.minimumBidFloorPrice`, the bid is awarded automatically without supplier intervention, triggering the same logic above.

**Blocked by:** 01 (schema), 04 (job must exist to be cancellable)

**Status:** completed

- [x] `awardBid()` looks up an active `AutomationRun` for the awarded lot (reuse `checkBidAgainstActiveWorkflows` lookup)
- [x] Marks lot as awarded in `run.stageExecutions[currentStageIndex].lotsOffered[].awardedQty`
- [x] Counts remaining unsold lots in current stage pool; if zero → `agenda.cancel` by job `_id` stored in `stageExecutions[currentStageIndex].agendaJobId`, set `run.status = 'awarded'`
- [x] If lots remain → `run.status = 'partially_awarded'`, no job cancellation
- [x] Auto-award path: bid price >= `minimumBidFloorPrice` triggers award automatically, same status logic applies
- [x] Manual award path: supplier explicitly awards; same status logic applies
- [x] Unit test: partial award (1 of 3 lots) leaves status `partially_awarded` and job intact
- [x] Unit test: full award (3 of 3 lots) sets status `awarded` and cancels job
