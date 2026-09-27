# 0127: Slice 2 - Insight Hub Two-Tier Telemetry Grid with Single-Active Disclosure

## Parent
[0125-prd-insight-telemetry-migration-and-exclusive-disclosure.md](file:///Users/debashisroy/Documents/SpoilerAlert/issues/21-insight-telemetry-migration-and-exclusive-disclosure/0125-prd-insight-telemetry-migration-and-exclusive-disclosure.md)

## What to build
Consolidate the platform's operational and financial telemetry into a unified 7-element, two-tier layout inside the Insight tab (`InventoryListView.tsx`). Migrate the 3 velocity and network metrics (`Critical RSL (<14 Days)`, `Liquidation Velocity`, `Matched Buyer Network`) from `useIngestionTelemetry` into a second row positioned directly beneath the valuation metrics, replacing the redundant legacy `<10 Days` expiration card. Coordinate the info popovers across all 7 cards so that opening one card's information automatically closes any other currently expanded card.

## Acceptance criteria
- [x] Row 1 renders the 4 Valuation & Financial Performance cards: `Active Portfolio Value`, `Total Inventory Value`, `Revenue Secured`, and `Landfill Diversion Rate`.
- [x] Row 2 renders the 3 Operational Flow & Buyer Liquidity cards: `Critical RSL (<14 Days)`, `Liquidation Velocity`, and `Matched Buyer Network`.
- [x] The legacy `Critical Expirations` (<10 Days) card is deprecated and replaced by the canonical `Critical RSL (<14 Days)` card.
- [x] `InventoryListView` manages an exclusive active disclosure state (`activeInfoCardId: string | null`) ensuring only one card's info description is expanded at a time across the entire grid.
- [x] Clicking the `"i"` button on any card closes any currently open card and expands the selected one.
- [x] Integration tests verify the 7-metric layout, dynamic values, and mutually exclusive info disclosure behavior.

## Blocked by
- [0126: Slice 1 - Minimalist InsightCard with Controlled Exclusive Info Disclosure](file:///Users/debashisroy/Documents/SpoilerAlert/issues/21-insight-telemetry-migration-and-exclusive-disclosure/0126-slice-1-minimalist-insight-card-with-exclusive-disclosure.md)
