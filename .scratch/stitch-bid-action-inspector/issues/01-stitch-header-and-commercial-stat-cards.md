# 01: Stitch Header, 4-Column Commercial Stat Cards & Test Baseline

**What to build:** 
The foundational Stitch design container and navigation header for the Bid Action Inspector modal, coupled with the four-column commercial summary cards. From the supplier's perspective, clicking a bid row opens a clean, institutional modal with ambient slate glassmorphic backdrops, immediate Lot #, SKU, and status pills, and four key metric cards:
1. **Buyer Organization**: Company name, verified badge, and direct email link.
2. **Unit Offer**: Large emerald rate per case, dual-figure comparison with initial bid and reserve floor, and settled pill when negotiated terms exist.
3. **Volume Requested**: Volume cases requested, percentage of lot allocation pill, and full clearing vs partial indicator.
4. **Gross Recovery**: Computed gross recovery with net clearing estimation factoring standard platform fees.

All baseline test contracts and DOM accessibility queries in `BidActionInspectorModal.test.tsx` and `BidDeclineAndInspectorIntegration.test.tsx` remain satisfied and green.

**Blocked by:** None (can start immediately).

**Status:** completed

- [x] Modal shell renders with Stitch dimensions (`max-w-[1100px]`, `rounded-2xl`, soft slate borders and backdrop blur).
- [x] Header renders Lot #, SKU, live lifecycle status badge, product title, preview email action, and close control.
- [x] 4-column summary grid displays Buyer Organization, Unit Offer, Volume Requested, and Gross Recovery with dynamic platform data.
- [x] Dual-figure pricing displays Settled badge and initial bid subtitle when negotiated terms are present.
- [x] State-aware banners appear for decided bids (Accepted settlement link or Declined re-open override).
- [x] All 35 existing unit tests in `BidActionInspectorModal.test.tsx` and 6 integration tests in `BidDeclineAndInspectorIntegration.test.tsx` pass without regressions.
