# 0110 — Slice 3: Buyer Negotiation Portal & Outbound Counter Action CTAs

**What to build:**
Enable external buyers receiving a counter-offer email to inspect the negotiation context and submit a revised counter-bid via a dedicated guest portal:
- **HMAC Negotiation Token & Dynamic CTA Tokens**:
  - In `offersService.renegotiateBid`, generate a cryptographically signed HMAC token:
    `negotiationToken = ${rawToken}.${hmac(secret, rawToken:offerId)}` (or persist on `Offer`).
  - Provide dynamic tokens in counter template: `{{accept_counter_link}}` and `{{renegotiate_link}}` pointing to `/portal/negotiation/:offerId?token=${negotiationToken}`.
  - Update `DEFAULT_COUNTER_MESSAGE` and outbound counter email layout to include prominent CTA buttons:
    1. **Accept Counter-Offer** (`[$X.XX/cs • Y cases]`)
    2. **Propose New Terms / Re-bid**
- **Backend Negotiation Endpoints**:
  - `GET /api/portal/negotiation/:offerId?token=...`: Validates HMAC token; returns offer state, latest supplier proposal, product/lot details, and message transcript.
  - `POST /api/portal/negotiation/:offerId/re-bid?token=...`: Validates HMAC token; accepts `{ proposedPrice, proposedQuantity, message }`.
    - Pushes `{ sender: 'buyer', content: message, proposedPrice, proposedQuantity, timestamp: new Date() }` to `offer.messages`.
    - Updates `offer.status = 'pending'`.
    - Creates `Activity` note in Lot CRM timeline.
    - Syncs message to Emails Hub thread.
- **Frontend `BuyerNegotiationPortalView.tsx`**:
  - Distraction-free external buyer view (omitting supplier admin sidebars and chrome) routed at `/portal/negotiation/:offerId` in `App.tsx`.
  - Visual summary of the lot, latest supplier counter proposal, and interactive chronological message thread.
  - Interactive "Submit Revised Offer" modal / form allowing buyer to adjust price/cs and quantity and send back.
- **Supplier Workspace Turn-Taking Indicator**:
  - In `LotOperationsHubView.tsx` and `BidActionInspectorModal.tsx`, display a prominent **"Buyer Countered"** badge when the latest message in an offer is buyer-originated.

**Blocked by:** None — can start immediately

**Status:** complete

- [x] Implement HMAC token generation and verification for buyer negotiation sessions.
- [x] Embed `{{accept_counter_link}}` and `{{renegotiate_link}}` CTAs in counter negotiation email template.
- [x] Build backend routes `GET /api/portal/negotiation/:offerId` and `POST /api/portal/negotiation/:offerId/re-bid`.
- [x] Build standalone `BuyerNegotiationPortalView.tsx` with responsive proposal card, message thread, and re-bid submission form.
- [x] Implement turn-taking state logic reverting offer to `'pending'` and surfacing "Buyer Countered" badge in supplier view.
- [x] Add unit and integration tests verifying token verification, portal rendering, re-bid submission, and supplier badge display.
