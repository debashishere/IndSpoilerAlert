# 04 — `trigger-workflow-stage` Agenda Job

**What to build:** Define the new Agenda job `trigger-workflow-stage` that fires for Stage N of a run. It computes the remaining (unsold) inventory pool by subtracting awarded lots from the stage's allocated or full pool, resolves Stage N's buyers via the buyer resolver helper, dispatches emails, records `stageExecutions[N]`, then either schedules Stage N+1's job or terminates the cascade.

Cascade termination rules:
- If Stage N+1 exists → schedule `trigger-workflow-stage` at `now + stageN.waitHours` with `{ runId, stageIndex: N+1 }`
- If Stage N is the last stage and type is NOT `landfill` → schedule `execute-workflow-fallback`
- If Stage N is the last stage and type IS `landfill` → mark run `fallback_executed` with `action: 'landfill_dispatched'`, no further job

**Blocked by:** 01 (schema), 02 (buyer resolver), 03 (Stage 1 dispatch, which schedules this job)

**Status:** done

- [x] Agenda job `trigger-workflow-stage` defined, reading `{ runId, stageIndex }` from job payload
- [x] Loads `AutomationRun` and `LiquidationAutomation`; aborts if run status is `awarded` or `fallback_executed`
- [x] Computes remaining lot pool: full matched pool minus lots already marked awarded across all prior `stageExecutions`; respects per-stage `allocatedLotIds` if configured
- [x] Partial quantity carry-forward: if a lot was partially awarded (e.g., 50 of 200 cases), carries remaining cases into this stage's lot pool
- [x] Resolves Stage N buyers via the helper; sends emails to Stage N buyers only
- [x] Records `stageExecutions[N]` and updates `run.currentStageIndex = N`
- [x] Sets `run.status = 'escalating'` while transitioning, then `'evaluating'` after dispatch
- [x] Schedules correct follow-up job based on cascade termination rules above
- [x] If remaining lot pool is empty (all lots awarded in prior stages), cancels cascade and closes run as `awarded`
- [x] Integration test: 3-stage workflow fires Stage 2 job after Stage 1 waitHours, Stage 3 after Stage 2 waitHours
