# 0107 — PRD: Bid Decline Email Trigger, In-Situ Thread Bid Acceptance & Buyer Negotiation Portal

**What to build:**
This epic upgrades the B2B surplus inventory bidding and negotiation lifecycle across both the supplier's operations hub and the external buyer communication experience:

1. **Decline Offer Full Composer & Resilient Outbound Dispatch**: Upgrades the Decline Offer tab in `BidActionInspectorModal.tsx` into a 2-column split work surface featuring a TipTap email composer pre-loaded with the Decline Notice template and `Decline Catalog Redirection` CTA link (`{{catalog_link}}`), backed by resilient OAuth/SMTP email dispatch, CRM timeline logging, and thread sync.
2. **In-Situ Thread Bid Acceptance with Dynamic Token Re-Hydration**: Adds an "Accept This Bid" action directly on the latest active incoming buyer proposal in the `Negotiation History Thread`, seamlessly transitioning the inspector into the Accept Offer tab within the same window and dynamically re-hydrating the acceptance quantity, price, settlement calculations, and TipTap dynamic settlement tokens (`{{price_per_case}}`, `{{awarded_quantity}}`, `{{total_amount}}`).
3. **Buyer Negotiation Portal & Outbound Counter Action CTAs**: Enriches outbound counter-offer emails with dynamic action CTA buttons (`Accept Counter-Offer` and `Propose New Terms / Re-bid`) backed by a secure HMAC `negotiationToken`. Provides a distraction-free guest portal (`/portal/negotiation/:offerId?token=...`) where buyers can review negotiation history and submit revised counter-bids, automatically reverting the offer status to `'pending'` with a "Buyer Countered" badge for the supplier.
4. **Buyer Counter Acceptance & Direct Deal Settlement Hand-off**: Enables buyers to accept supplier counter-proposals directly on the Buyer Negotiation Portal, atomically creating the `Award` record at agreed counter terms and immediately routing the buyer into the post-award Deal Settlement Portal (`/deal/:dealId?dealToken=...`) for payment confirmation and B2B E-signature execution.

**Blocked by:** None — can start immediately

**Status:** complete

- [x] Provide TipTap Email Composer with Decline Notice template in the Decline tab of `BidActionInspectorModal.tsx`.
- [x] Implement backend `declineBid` email compilation, resilient dispatch (Google OAuth + SMTP fallback), Lot CRM Activity logging, and Emails Hub thread sync.
- [x] Add "Accept This Bid" button to the latest active buyer message in the Negotiation History Thread, transitioning to the Accept Offer tab with dynamic token re-hydration.
- [x] Add HMAC `negotiationToken` generation and dynamic CTA tokens (`{{accept_counter_link}}`, `{{renegotiate_link}}`) to counter-offer emails.
- [x] Build dedicated `BuyerNegotiationPortalView` at `/portal/negotiation/:offerId` supporting both counter acceptance and revised bid submission.
- [x] Implement turn-taking state transition reverting offer to `'pending'` with "Buyer Countered" indicator upon buyer re-bid.
- [x] Connect buyer counter acceptance directly into post-award Deal Settlement Portal (`/deal/:dealId`) with Step 1 Payment and Step 2 E-Sign unlocked.
- [x] Comprehensive unit, integration, and E2E test coverage across all vertical slices.
