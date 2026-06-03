# Issue #31: Event-Driven Resolution Engine (Race vs. Timeout)

> **State:** `ready-for-agent`
> **Category:** `enhancement`

## Parent

- Issue #22

## What to build

Implement the event-driven "Race vs. Timeout" state machine for workflow evaluations.

1. **Schedule Fallback Job on Dispatch**:
   * During workflow execution, schedule a one-shot job `execute-workflow-fallback` in Agenda set to trigger exactly `rules.evaluationWindowHours` into the future.
   * Save the job's unique identifier as `fallbackJobId` on the `AutomationRun` record.
2. **Listen to Bid Events (The Success Path)**:
   * Hook into the marketplace bidding controller (when bids are submitted via `POST /api/marketplace/listing/:id/bids`).
   * If a bid is submitted for a listing that is part of an active `AutomationRun` and meets the safety guard rails (`rules.minimumBidFloorPrice` and/or `rules.minimumYieldRecoveryPercent`), trigger the Success Path:
     * Cancel the scheduled fallback job in Agenda using `fallbackJobId`.
     * Update the `AutomationRun` status to `'awarded'`.
     * Execute the Success Path action: either `auto_award` (immediately create `Award`, `Purchase Order`, `Bill of Lading` documents) or `hold_confirmation` (notify sales rep for confirmation).
3. **Execute Timeout (The Fallback Path)**:
   * Implement the `execute-workflow-fallback` Agenda job.
   * On timeout execution, verify that the `AutomationRun` is still in `evaluating` status.
   * Update the status to `'fallback_executed'`.
   * Execute the Fallback Path action: `auto_donate` (divert stock to food banks), `yield_markdown_retry` (apply a steeper discount using Dynamic Yield Optimization, update template parameters, and trigger another sequence run), or `escalate_review` (manual dashboard warning).

## Acceptance criteria

- [ ] Successful bid matching guards cancels the Agenda timeout job and triggers the auto-award flow.
- [ ] Timeout job fires and transitions the run to fallback execution if no bid is received.
- [ ] Safety floor guards prevent bids under minimum thresholds from triggering the success path.
- [ ] Integration tests verify the end-to-end race condition outcomes (Scenario A: Bid wins race, Scenario B: Timeout wins race).

## Blocked by

- Issue #30
