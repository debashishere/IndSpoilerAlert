# 04 — Liquidation Stage Audit: Pricing, Bids, Winning Bid & Allocated Lots

**What to build:** For Liquidation-type stages, the expanded audit panel gains three additional sections below Config Summary and Audience. A **Pricing & Timing** section shows the pricing rule type (AI Yield / Fixed Markdown / Minimum Bid Floor), discount value, and response window as read-only fields. A **Bids & Offers Ledger** section shows all bids scoped to this stage — buyer name, bid per case, quantity, total offer, and status — with the winning bid row highlighted in green with a ★ marker. An **Allocated Lots** section lists the lot IDs and quantities assigned to this stage. For active (live) liquidation stages, the Bids section shows bids received so far with no winning bid highlight, and the winning bid row is omitted entirely since the stage is unresolved.

**Blocked by:** 03 — Read-Only Stage Config Summary & Audience Section

**Status:** complete

- [x] `⬤ PRICING & TIMING` section renders with read-only pricing rule, discount value, and response window
- [x] Pricing rule label adapts to the configured `discountType` (AI Yield Optimizer / Fixed Markdown % / Min Bid Floor $)
- [x] `⬤ BIDS & OFFERS LEDGER` section renders a table of bids scoped to this stage's inventory lots
- [x] Bids table columns: Buyer Name, Bid/Case, Quantity, Total Offer, Status
- [x] Winning bid row is highlighted with green background and ★ marker for completed/awarded stages
- [x] Active stages show bids received so far with no winning bid highlight
- [x] `⬤ ALLOCATED LOTS` section lists lot identifiers and case counts assigned to this stage
- [x] Allocated Lots table supports pagination with page size selector (options: 5, 10, 20, 30 max) and page navigation controls
- [x] Sections do not render for Donation or Landfill stage types
- [x] If no bids were received, the ledger shows an appropriate empty state message
