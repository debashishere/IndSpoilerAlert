# 03 — Refactor `createAutomationRun()` — Stage 1 Dispatch Only

**What to build:** Fix the core bug. Refactor `createAutomationRun()` so it dispatches emails only to Stage 1's buyers, records `stageExecutions[0]` on the run document, and schedules a `trigger-workflow-stage` Agenda job for Stage 2 at `now + stage1.waitHours`. If the workflow has only one stage, no follow-up job is scheduled (fallback job is registered as before).

**Blocked by:** 01 (schema), 02 (buyer resolver)

**Status:** done

- [x] `createAutomationRun()` resolves buyers using the Stage Buyer Resolver helper scoped to `stages[0]` only
- [x] Email dispatch loop fires only for Stage 1's resolved buyer list
- [x] `run.stageExecutions[0]` is populated: `{ stageIndex: 0, firedAt, buyerEmails, lotsOffered, status: 'dispatched' }`
- [x] `run.currentStageIndex` set to `0`
- [x] If `stages.length > 1`: schedules a `trigger-workflow-stage` Agenda job at `now + stages[0].waitHours` with payload `{ runId, stageIndex: 1 }`, stores `agendaJobId` in `stageExecutions[0].agendaJobId`
- [x] If `stages.length === 1`: registers existing `execute-workflow-fallback` job as before
- [x] No regression on workflows with no `stages` array (legacy flat config path unchanged)
- [x] Integration test: 2-stage workflow dispatches exactly 1 email batch (Stage 1 buyers only) on run creation
