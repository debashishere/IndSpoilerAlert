# 0109 — Slice 2: Negotiation History Migration to Timeline Tab

**What to build:**
Negotiation History Thread has been removed from modal action tabs (Accept Offer, Negotiate, Decline) and consolidated into the dedicated Timeline Tab:
- All negotiation messages, buyer bids, supplier counter-offers, and timestamps are recorded in the Timeline activity feed.
- Action tabs remain streamlined and focused on parameters and outbound communication.
- **Dynamic Re-Hydration**:
  - Dynamically re-hydrates `awardedQuantity` to the message's `proposedQuantity` (defaulting to available if unspecified).
  - Sets active agreed unit price to `proposedPrice` (overriding the immutable baseline `bid.price` display).
  - Recalculates `settlementTotal` and updates all dynamic settlement tokens in the TipTap composer (`{{price_per_case}}`, `{{awarded_quantity}}`, `{{total_amount}}`).
- **Backend Acceptance Flexibility**:
  - Ensure backend `acceptBid` endpoint and `offersService.acceptBid` accept an optional `pricePerCase?: number` payload attribute.
  - When provided from a thread acceptance, persist this negotiated price onto the `Award` record and acceptance email rather than falling back to baseline `offer.price`.

**Blocked by:** None — can start immediately

**Status:** complete

- [x] Consolidate negotiation history in dedicated Timeline tab with lifecycle audit trail and category filtering.
- [x] Remove Negotiation History Thread from action tabs (Accept Offer, Negotiate, Decline).
- [x] Update unit and integration tests to verify Negotiation History Thread is removed from action tabs and accessible in Timeline tab.
