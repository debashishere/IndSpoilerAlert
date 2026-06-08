## What to build

Extend the `AutomationRun` backend data model and background execution job runner to capture real-time execution start timestamps (`executedAt`), target buyer email lists (`buyerEmails`), affected inventory lot metadata snapshots (`affectedInventoryLots`), and frozen campaign configuration snapshots (`campaignSnapshot`).

## Acceptance criteria

Issue: 0054
Title: "Slice 1: AutomationRun Schema & Real-Time ExecutedAt Timeline Logging"
Status: COMPLETED

- [ ] `AutomationRun` model includes `executedAt`, `buyerEmails`, `affectedInventoryLots`, and `campaignSnapshot` fields.
- [ ] Background Agenda job runner populates `executedAt` with the exact backend execution start timestamp when a job triggers.
- [ ] Job execution captures immutable snapshots of affected lot IDs, SKUs, case counts, target buyer emails, and campaign settings.

## Blocked by

None - can start immediately
