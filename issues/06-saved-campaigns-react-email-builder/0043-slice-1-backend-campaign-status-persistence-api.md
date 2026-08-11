# 0043 - Backend Campaign Status & Persistence REST Endpoints

## What to build

Extend the `LiquidationAutomation` MongoDB schema, Express controller endpoints (`backend/src/controllers/liquidationController.ts`), and API router (`backend/src/routes/api.ts`) to support full campaign persistence and state machine lifecycle. Enable saving campaigns with explicit `status` (`'draft'`, `'active'`, `'stopped'`, `'completed'`), `createdBy` metadata, and structured React Email block payloads. Expose `PATCH /api/liquidation-automations/:id/status` and `DELETE /api/liquidation-automations/:id` endpoints alongside `POST`, `PUT`, and `GET`.

## Acceptance criteria

- [ ] `LiquidationAutomation` schema includes `status` enum (`'draft'`, `'active'`, `'stopped'`, `'completed'`) synced with `isActive` boolean.
- [ ] Schema captures `createdBy` string (defaulting to creator name/email) and `emailTemplate.blocks`.
- [ ] `PATCH /api/liquidation-automations/:id/status` updates campaign status (`draft` <-> `active` <-> `stopped`) and triggers/reschedules Agenda jobs when active.
- [ ] `DELETE /api/liquidation-automations/:id` removes campaign automation records cleanly.
- [ ] `WorkflowService` and Redux `workflowSlice.ts` expose thunks for `patchLiquidationAutomationStatusThunk` and `deleteLiquidationAutomationThunk`.

## Blocked by

None - can start immediately
