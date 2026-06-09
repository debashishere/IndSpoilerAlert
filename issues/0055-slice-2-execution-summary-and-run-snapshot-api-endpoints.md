Issue: 0055
Title: "Slice 2: Execution Summary & Run Snapshot REST API Endpoints"
Status: COMPLETED

## What to build

Implement backend REST API endpoints to support execution history dropdown populators and detailed audit modal inspection. `GET /api/liquidation-automations/:id/runs` returns a lightweight list of execution run timestamps and summary stats. `GET /api/liquidation-automations/runs/:runId` returns the complete detailed run execution snapshot.

## Acceptance criteria

- [ ] `GET /api/liquidation-automations/:id/runs` returns array of execution run summaries containing `runId`, `executedAt`, `status`, `affectedLotCount`, and `buyerCount`.
- [ ] `GET /api/liquidation-automations/runs/:runId` returns complete run execution snapshot (affected lots, buyer emails, campaign settings, resolution outcome).
- [ ] Handles 404 for non-existent run IDs and invalid automation IDs gracefully.

## Blocked by

- [Issue 0054](file:///Users/debashisroy/Documents/SpoilerAlert/issues/0054-slice-1-automationrun-schema-executedat-logging.md)
