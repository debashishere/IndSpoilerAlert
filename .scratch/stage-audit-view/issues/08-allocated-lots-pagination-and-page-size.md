# 08 — Stage Audit: Allocated Lots Pagination & Page Size (Max 30)

**What to build:** In the Workflow Builder -> Runs & History -> Stage-Gate Execution Timeline & Escalation Trace -> Stage Audit -> `⬤ ALLOCATED LOTS` section (applicable across Liquidation, Donation, and Landfill stage types), implement interactive pagination controls with configurable page sizes capped at a maximum of 30 items per page.

**Blocked by:** 04 — Liquidation Stage Audit, 05 — Donation Stage Audit, 06 — Landfill Stage Audit

**Status:** complete

## Specification

1. **Allocated Lots Table Pagination**:
   - Default page size: `10` items per page.
   - Configurable page size options via dropdown: `5`, `10`, `20`, `30 (max)`.
   - Hard clamp enforcing maximum page size `Math.min(30, pageSize)`.
   - Dynamic page calculation: `totalPages = Math.max(1, Math.ceil(totalLots / pageSize))`.

2. **Pagination Controls & Information**:
   - Display summary: `Showing {startIndex} to {endIndex} of {totalLots} lots` with test ID `stage-allocated-lots-page-info`.
   - Previous (`Prev`) button with test ID `stage-allocated-lots-page-prev`, disabled on page 1.
   - Next (`Next`) button with test ID `stage-allocated-lots-page-next`, disabled on the last page.
   - Numbered page buttons with test ID `stage-allocated-lots-page-btn-{page}`, indicating active page status.
   - Page size dropdown selector with test ID `stage-allocated-lots-page-size-select`.

3. **Polymorphic Stage Compatibility**:
   - Shared `StageAllocatedLotsSection` component extracted and utilized uniformly across Liquidation, Donation, and Landfill stage types.
   - Retains empty state display when 0 lots are allocated (`stage-lots-empty`), cleanly hiding pagination controls.

## Acceptance Criteria

- [x] `⬤ ALLOCATED LOTS` table supports pagination with default page size of 10.
- [x] Page size dropdown allows choosing 5, 10, 20, or 30 (max).
- [x] Page size is strictly capped at a maximum of 30.
- [x] "Showing X to Y of Z lots" counter updates accurately on page and page size changes.
- [x] Previous and Next buttons navigate pages with boundary disabled states.
- [x] Individual page number buttons jump directly to target page.
- [x] Polymorphic compatibility: identical pagination functionality in Liquidation, Donation, and Landfill stage audit views.
- [x] Empty state ("No specific inventory lots allocated to this stage.") maintained when 0 lots allocated.
- [x] Automated unit and integration tests written and passing in `frontend/src/test/StageAllocatedLotsPagination.test.tsx`.
