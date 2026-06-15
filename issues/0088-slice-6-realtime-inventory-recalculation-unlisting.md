# 0088 — Real-Time Inventory Volume Recalculation & Automated Unlisting

**What to build:** Event-driven inventory volume recalculation pipeline. When a supplier awards a bid (or partial award) in the supplier workspace, remaining lot volume is immediately updated across both platforms, automatically marking fully awarded items as `Liquidated / Sold Out` on the public buyer landing page.

**Blocked by:** 0087 — Open-Browsing Buyer Bid Submission & Verification-Linked Bidding

**Status:** completed

- [x] Implement backend inventory listener/hook triggered upon bid award execution in the supplier workspace (`POST /api/v1/supplier/bids/:id/award`).
- [x] Recalculate remaining case volume on the associated `SurplusInventoryLot` and project the update to `MarketplaceListing`.
- [x] Automatically update marketplace listing status badge to `Sold Out` or remove from active search facets when remaining volume drops to 0.
- [x] Generate PO PDF and BOL freight records, notifying the winning verified buyer via email.
- [x] Add end-to-end integration test verifying real-time volume deduction and public marketplace unlisting upon supplier bid award.
