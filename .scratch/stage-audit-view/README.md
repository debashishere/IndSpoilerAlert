# Stage Audit View Documentation

This directory documents the specifications, design decisions, and implementation checklist for the Stage Audit panels in the Workflow Builder:

**Location**: Workflow Builder -> Runs & History -> Stage-Gate Execution Timeline & Escalation Trace -> STAGE AUDIT

## Issue Index

- [01 — Remove Raw Telemetry Tab & Tighten Audit Modal Tab Bar](./issues/01-remove-raw-telemetry-tab.md)
- [02 — Stage Card Expand Affordance](./issues/02-stage-card-expand-affordance.md)
- [03 — Config Summary & Audience Section](./issues/03-config-summary-and-audience-section.md)
- [04 — Liquidation Stage Audit: Pricing, Bids, Winning Bid & Allocated Lots](./issues/04-liquidation-stage-audit-content.md)
- [05 — Donation Stage Audit: Offer Window, Allocated Lots & Acceptance Outcome](./issues/05-donation-stage-audit-content.md)
- [06 — Landfill Stage Audit: Disposal Deadline, Allocated Lots & Pickup Status](./issues/06-landfill-stage-audit-content.md)
- [07 — Stage Email Preview Panel (All Stage Types)](./issues/07-stage-email-preview-panel.md)
- [08 — Stage Audit: Allocated Lots Pagination & Page Size (Max 30)](./issues/08-allocated-lots-pagination-and-page-size.md)

## Allocated Lots Section Pagination & Page Size Specs

The `StageAllocatedLotsSection` component is shared across all stage types (`liquidation`, `donation`, `landfill`) with:
- **Default Page Size**: 10 items
- **Page Size Options**: 5, 10, 20, 30 (strictly capped at max 30)
- **Interactive Controls**:
  - `stage-allocated-lots-page-info`: "Showing {start} to {end} of {total} lots"
  - `stage-allocated-lots-page-size-select`: Dropdown for page sizes
  - `stage-allocated-lots-page-prev` / `stage-allocated-lots-page-next`: Previous/Next page navigation
  - `stage-allocated-lots-page-btn-{page}`: Direct numeric page buttons
