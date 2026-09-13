# 0109 — Slice 2: In-Situ Thread Bid Acceptance with Dynamic Token Re-Hydration

**What to build:**
Enable suppliers to accept negotiated proposals directly from the **Negotiation History Thread** inside `BidActionInspectorModal.tsx`:
- **Active Proposal Qualification**: Identify the **latest active proposal** from the buyer in `offer.messages` (where `msg.sender === 'buyer'` and `proposedPrice` or `proposedQuantity` is present). Any earlier buyer messages are superseded and marked read-only.
- **"Accept This Bid" CTA**: Render a distinct action button on this latest buyer message card:
  - Button text: e.g. `Accept Offer ($14.50/cs • 200 cs)` with an acceptance icon.
- **In-Situ Tab Transition**: Clicking "Accept This Bid" transitions the modal's `activeMode` smoothly to `'accept'` within the same window (no modal dismissal or full page navigation).
- **Dynamic Re-Hydration**:
  - Dynamically re-hydrates `awardedQuantity` to the message's `proposedQuantity` (defaulting to available if unspecified).
  - Sets active agreed unit price to `proposedPrice` (overriding the immutable baseline `bid.price` display).
  - Recalculates `settlementTotal` and updates all dynamic settlement tokens in the TipTap composer (`{{price_per_case}}`, `{{awarded_quantity}}`, `{{total_amount}}`).
- **Backend Acceptance Flexibility**:
  - Ensure backend `acceptBid` endpoint and `offersService.acceptBid` accept an optional `pricePerCase?: number` payload attribute.
  - When provided from a thread acceptance, persist this negotiated price onto the `Award` record and acceptance email rather than falling back to baseline `offer.price`.

**Blocked by:** None — can start immediately

**Status:** complete

- [x] Identify latest active incoming buyer bid in `renderNegotiationHistoryThread` and render "Accept This Bid" button.
- [x] Implement click handler that switches `activeMode` to `'accept'` in-situ.
- [x] Hydrate `awardedQuantity`, agreed unit price, settlement value, and TipTap token dictionary from the selected proposal.
- [x] Update frontend `InventoryService.acceptBid` and backend `offersService.acceptBid` to support custom negotiated `pricePerCase`.
- [x] Persist correct negotiated unit price and total amount on the generated `Award` record.
- [x] Add unit and integration tests verifying thread CTA rendering, tab transition, token re-hydration, and settlement submission.
