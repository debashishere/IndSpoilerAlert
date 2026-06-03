# Issue #30: Optimized Batch Dispatch Engine & Email Preview API

> **State:** `ready-for-agent`
> **Category:** `enhancement`

## Parent

- Issue #22

## What to build

Implement the optimized $O(N+M)$ dispatch workflow engine and the email preview endpoint.

1. **Implement `executeWorkflowDispatch`**:
   * Fetch all matching inventory lots ($N$) based on the template's `inventoryFilters` (category, max RSL, warehouse, explicit lot inclusion/exclusion arrays).
   * **Empty State Gate**: If 0 matching lots are found, do not send any emails. Log a run as `failed` with error details, and notify the supplier.
   * Render the dynamic `{{inventory_table}}` HTML block once for the matching lots.
   * Filter and retrieve eligible secondary-market buyers ($M$).
   * Query the **Demand Matching Engine** sidecar service to score and rank the top buyers for this inventory batch. Select the top matched subset of buyers (size $B$, where $B \ll M$).
   * Loop through the top buyers, substitute template placeholders (`{{contact_name}}`, `{{buyer_company}}`), and send dispatch notifications.
   * Save the `AutomationRun` record in `evaluating` status, recording snapshot inventory lot IDs and target buyer IDs.
2. **Build Preview API**:
   * Implement `POST /api/liquidation-automations/preview-email`.
   * Evaluate the filters: if they match 0 items, return a warning flag `matchesZeroLots: true` and an empty placeholder table message.
   * Otherwise, return the rendered HTML/text preview of the email with the inventory table populated.

## Acceptance criteria

- [ ] Dispatch logic resolves within $O(N+M)$ performance bounds and avoids nested database loops per buyer.
- [ ] Preview API returns correctly formatted HTML tables with actual/mock variables.
- [ ] Warning flag is returned by the preview API when filters match 0 active lots.
- [ ] Integration tests verify the dispatch process and mock email triggers.

## Blocked by

- Issue #29
