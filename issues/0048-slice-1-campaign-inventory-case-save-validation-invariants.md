# Issue 0048: Campaign Inventory & Case Save Validation Invariants

## What to build

Enforce strict campaign save invariants across the Liquidation Automation Studio. When a sales representative attempts to persist a campaign strategy as either a `Draft` or an `Active` campaign, the system must validate that at least 1 valid, available surplus inventory lot is matched/selected and the total selected cases across the campaign scope is at least 1. If 0 inventory lots or 0 cases are selected, the action must block with clear validation feedback.

## Acceptance criteria

- [ ] `handleSaveCampaign` validates that `matchedLots.length >= 1` and `totalMatchedCases >= 1` before issuing backend save requests.
- [ ] The validation applies to both `Draft` and `Active` campaign saving actions.
- [ ] Clear user alert/toast feedback is presented if zero inventory lots or zero cases are selected.
- [ ] Unit & integration tests verify that saving empty/zero-case campaigns is blocked with expected errors.

## Blocked by

None - can start immediately
