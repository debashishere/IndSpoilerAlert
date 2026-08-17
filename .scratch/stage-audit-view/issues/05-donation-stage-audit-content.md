# 05 — Donation Stage Audit: Offer Window, Allocated Lots & Acceptance Outcome

**What to build:** For Donation-type stages, the expanded audit panel gains three sections below Config Summary and Audience — replacing the pricing and bids sections entirely. An **Offer Expiration Window** section shows the configured offer duration alongside the actual acceptance timestamp: if the donation was accepted, it shows "Accepted in Xh Ym"; if the stage escalated, it shows "Expired — escalated to next stage". An **Allocated Lots** section lists the lot IDs and case quantities donated in this stage. An **Acceptance / Rejection Outcome** section shows a status badge (Accepted / Declined / Escalated) and the accepting partner's name if the offer was taken.

**Blocked by:** 03 — Read-Only Stage Config Summary & Audience Section

**Status:** complete

- [x] `⬤ OFFER EXPIRATION WINDOW` section renders configured duration using `formatExecutionWindow`
- [x] If resolved: actual acceptance timestamp is shown and elapsed time is computed and displayed
- [x] If escalated/expired: "Expired — escalated to next stage" label is shown in amber
- [x] `⬤ ALLOCATED LOTS` section lists lot identifiers and case counts assigned to this donation stage
- [x] Allocated Lots table supports pagination with page size selector (options: 5, 10, 20, 30 max) and page navigation controls
- [x] `⬤ ACCEPTANCE OUTCOME` section renders a status badge: Accepted (green) / Declined (red) / Escalated (amber)
- [x] Accepted outcome shows the accepting partner's name alongside the badge
- [x] No Pricing & Timing section and no Bids & Offers Ledger render for Donation stages
- [x] Sections only render for Donation-type stages
