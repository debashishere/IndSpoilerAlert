# 06 — Concurrent Run Guard

**What to build:** Before creating a new `AutomationRun` (scheduled or manual trigger), the system checks for an existing active run on the same `automationId`. If one exists, the trigger is rejected with a clear error rather than creating a parallel run that would compete for the same inventory lots.

Active run = status in `['evaluating', 'partially_awarded', 'escalating']`.

**Blocked by:** 01 (schema, for new status values)

**Status:** complete

- [x] Guard added at the top of `createAutomationRun()` — queries `AutomationRun` for an existing document with matching `automationId` and `status` in `['evaluating', 'partially_awarded', 'escalating']`
- [x] If found, throws / returns early with error reason: `"A run is already in progress for this workflow"`
- [x] Manual trigger endpoint surfaces this error to the UI (HTTP 409 or equivalent)
- [x] Scheduled Agenda job logs a warning and skips (does not crash the job)
- [x] Unit test: triggering a workflow with an active run returns the guard error
- [x] Unit test: triggering after run reaches `awarded` or `fallback_executed` succeeds normally
