# 0111 — Slice 4: Buyer Counter Acceptance & Direct Deal Settlement Hand-off

**What to build:**
Enable buyers to accept the supplier's active counter-proposal directly within the **Buyer Negotiation Portal**, seamlessly transitioning them into the post-award **Deal Settlement Portal**:
- **Backend Counter Acceptance Endpoint**:
  - `POST /api/portal/negotiation/:offerId/accept?token=...`:
    - Validates cryptographic `negotiationToken`.
    - Retrieves the latest supplier counter-proposal from `offer.messages` (extracting `proposedPrice` and `proposedQuantity`).
    - Transitions offer status to `'fully_accepted'` (or `'partially_accepted'`).
    - Atomically creates or updates an `Award` record with `price = counterPrice`, `awardedQty = counterQuantity`, and generates an HMAC `dealToken`.
    - Logs an `Activity` record in the Lot CRM timeline ("Buyer Accepted Counter-Offer").
    - Updates thread in Emails Hub.
    - Resiliently dispatches award settlement memo email to buyer with permanent receipt and payment link.
    - Returns `{ success: true, dealId: award._id, dealToken }`.
- **Frontend Portal Direct Settlement Hand-off**:
  - In `BuyerNegotiationPortalView.tsx`, clicking the prominent **"Accept Counter-Offer"** button triggers the acceptance endpoint with confirmation feedback.
  - Upon response, smoothly redirects the buyer's browser to `/deal/:dealId?dealToken=${dealToken}`.
  - Automatically loads `DealSettlementPortalView`, unlocking Step 1 (Payment Confirmation) and Step 2 (E-Signature B2B Agreement) for immediate legal execution.

**Blocked by:** `issues/18-bid-decline-and-buyer-negotiation-portal/0110-slice-3-buyer-negotiation-portal-and-counter-action-ctas.md`

**Status:** complete

- [x] Implement backend `POST /api/portal/negotiation/:offerId/accept` with token authentication.
- [x] Convert latest supplier counter parameters into an `Award` record and transition offer status to accepted.
- [x] Issue post-award `dealToken` and dispatch settlement receipt email.
- [x] Connect "Accept Counter-Offer" button in `BuyerNegotiationPortalView.tsx` to call acceptance endpoint.
- [x] Seamlessly redirect buyer from the negotiation portal into `DealSettlementPortalView` with pre-filled deal context.
- [x] Add end-to-end integration tests verifying buyer acceptance, award creation, and settlement portal clearance.
