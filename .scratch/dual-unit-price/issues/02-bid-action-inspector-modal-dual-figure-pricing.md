# 02: Bid Action Inspector Modal Dual-Figure Pricing & Settlement Banner

**What to build:** Update the Bid Action Inspector modal (`BidActionInspectorModal`) so that for accepted/awarded bids, both the initial offer price baseline and the negotiated settled price are clearly presented across header cards and the post-award settlement banner.

**Blocked by:** 01: Core Final Price Data Pipeline & Operation Hub Bid List Dual-Figure Presentation (#1)

**Status:** completed

- [x] In the top summary cards, when an offer is accepted with negotiated terms, the "Unit Offer" card displays the prominent settled price (e.g. `$30.00 /case`) with a green `Settled` badge, and an `Initial Bid: $29.00 /case` subtitle.
- [x] In the top summary cards, the "Gross Recovery" card computes total recovery using the final settled rate and awarded quantity.
- [x] In the "Offer Accepted & Deal Settlement Active" banner, clearly display both figures: *"This offer has been awarded for {cases} cases to {buyerCompany} at ${finalPrice}/case (negotiated from initial bid of ${initialPrice}/case). Total settlement value: ${totalValue}."*
- [x] If an offer is accepted without negotiation at its original bid price, cleanly display the unit price without unnecessary delta messaging.
- [x] Automated tests verify header card rendering, gross recovery calculation, and settlement banner copy for negotiated vs standard awards.
