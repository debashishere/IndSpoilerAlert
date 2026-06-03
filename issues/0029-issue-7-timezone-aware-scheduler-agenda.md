# Issue #29: Timezone-Aware Scheduler (Agenda.js integration)

> **State:** `ready-for-agent`
> **Category:** `enhancement`

## Parent

- Issue #22

## What to build

Integrate Agenda.js into the backend Express application to handle cron execution in user-specified timezones, eliminating polling loops and managing Daylight Saving Time (DST) changes.

1. **Install and Configure Agenda**:
   * Initialize Agenda connected to the existing MongoDB database connection in `backend/src/index.ts`.
   * Configure Agenda worker parameters.
2. **Define Job triggers**:
   * Define the `trigger-liquidation-workflow` job.
   * On job execution, the worker reads the `automationId`, fetches the `LiquidationAutomation` template, and initiates the dispatch run.
3. **Register/Update Schedules**:
   * When a sales rep creates or updates a `LiquidationAutomation` workflow template, automatically register or cancel-and-recreate its schedule in Agenda using `agenda.every()`.
   * Pass the `schedule.timezone` parameter directly into Agenda options to offload local time evaluation.
4. **Implement Admin/Status Helper API**:
   * Create an endpoint `/api/liquidation-automations/:id/schedule` returning the next run time (`nextRunAt`) resolved in UTC.

## Acceptance criteria

- [ ] Agenda is initialized and processes jobs successfully at system startup.
- [ ] Saving an active template schedules a recurring job inside the Agenda database collections.
- [ ] Deactivating or deleting a template successfully cancels its associated Agenda jobs.
- [ ] Integration tests verify that job schedules are fired correctly relative to local timezone specifications.

## Blocked by

- Issue #28
