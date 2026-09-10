# 03A — Backend Re-negotiate State Machine & Negotiation History Thread

**What to build:** 
Backend service and endpoint `POST /api/bids/:id/renegotiate` (with `/api/offers/:id/renegotiate` alias) that transitions an offer's lifecycle state to `countered`. Implements Baseline Bid Preservation so that the buyer's original submitted price and volume on the root offer entity remain immutable, while supplier counter terms are appended to the offer's message ledger with timestamp and proposed commercial parameters. Delivers the interactive Negotiation History Thread component inside the Bid Action Inspector modal to render previous bids, supplier counter proposals, system notices, and timestamps in chronological order.

**Blocked by:** 02 — Bid Action Inspector with Mode-Driven Actions & Decline Flow

**Status:** completed

- [x] Endpoint `POST /api/bids/:id/renegotiate` (and `/api/offers/:id/renegotiate`) accepts counter terms (`counterPrice`, `counterQuantity`, `messageText`).
- [x] Enforces Baseline Bid Preservation: root `offer.price` and `offer.quantity` remain unmodified as the original buyer baseline, while a new message is appended to `offer.messages` with `sender: 'supplier'`, `proposedPrice`, `proposedQuantity`, and `timestamp`.
- [x] Updates `offer.status` to `countered` and saves the updated offer document.
- [x] Returns 400 Bad Request if `counterPrice` is missing, <= 0, or if `counterQuantity` is not a positive integer.
- [x] In `BidActionInspectorModal`, renders the chronological Negotiation History Thread displaying buyer bids, supplier counter-offers, system notices, and timestamps.
- [x] Includes automated integration tests verifying endpoint status transitions, root field immutability, and thread query rendering.
