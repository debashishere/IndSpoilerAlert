# Issue 0051: Campaign Edit State & Live Impact Re-Hydration

## What to build

Ensure full bidirectional state re-hydration when editing saved campaigns from the Saved Campaigns workspace. Fetching an existing campaign strategy must re-populate all saved inventory filters (`category`, `maxRsl`, `minCases`, `explicitLotIds`, `excludedLotIds`), stage audience targets, pricing rules, trigger schedule, email builder blocks, and donation configs into the studio state without default fallback resets, immediately updating the Live Impact & Allocation Panel.

## Acceptance criteria

- [ ] `fetchEditingCampaign` effect re-populates exact saved values for `maxRsl` and `minCases` without falling back to default resets (such as 0.20 or 10).
- [ ] Saved `explicitLotIds` and `excludedLotIds` update the matched inventory lot selection immediately upon load.
- [ ] Live Impact & Allocation Panel updates dynamically to reflect re-hydrated lot counts, total cases, and COGS recovery value.
- [ ] End-to-end integration tests verify editing a campaign, modifying parameters, and saving via `PUT /api/liquidation-automations/:id`.

## Blocked by

- [Issue 0048](file:///Users/debashisroy/Documents/SpoilerAlert/issues/0048-slice-1-campaign-inventory-case-save-validation-invariants.md)
