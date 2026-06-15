# 0087 — Open-Browsing Buyer Bid Submission & Verification-Linked Bidding

**What to build:** `BuyerBidModal` component linked to marketplace product cards. Permits open browsing for any visitor, but auto-populates credentials if a verified buyer is logged in, or prompts for email verification before final bid submission, auto-registering domain profiles via ADR 0006.

**Blocked by:** 0086 — Buyer Authentication & Email Verification System (Login / Logout)

**Status:** completed

- [x] Create `BuyerBidModal` handling case quantity input, bid price per case, and total bid calculation.
- [x] Auto-fill buyer details if logged in with a verified account; otherwise prompt for business email address and trigger an email verification link.
- [x] Implement backend `POST /api/v1/marketplace/bids` endpoint supporting ADR 0006 domain-derived buyer auto-registration for new business emails.
- [x] Dispatch bid submission notification to supplier Lot Operations Hub and trigger AI Bid Evaluator scoring.
- [x] Add unit test verifying bid submission flow for both authenticated verified buyers and new unauthenticated email buyers.
