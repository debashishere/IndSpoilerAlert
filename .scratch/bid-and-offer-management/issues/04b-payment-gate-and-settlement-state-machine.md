# 04B — Payment Gate & Settlement State Machine

## Parent
[04 — Acceptance Action Flow with Logistics & Deal Tokens](./04-acceptance-action-and-settlement-email.md) | [ADR 0035](../0035-buyer-deal-settlement-portal-and-payment-gated-esign.md)

**What to build:** 
Step 1 (Payment Gate) of the settlement portal and the underlying settlement state machine. Displays total deal value, wire/ACH simulation instructions, scan-to-pay QR code, and an interactive "Pay Now (Simulate Payment Confirmation)" button. Submitting calls `POST /api/deals/:dealId/confirm-payment?token=:token`, persisting `Award.paymentStatus = 'confirmed'` in the database and logging a Payment Received event in the Lot CRM timeline. Preserves state durably so reloading the browser maintains payment clearance and unlocks Step 2. Supports deep linking to `#payment`.

**Blocked by:** 04A — Standalone Portal Route & Hybrid Deal Authorization

**Status:** completed

- [x] Step 1 (Payment Gate) UI presents the total deal value, wire/payment simulation instructions, and scan-to-pay QR code graphic.
- [x] Clicking "Pay Now (Simulate Payment Confirmation)" dispatches `POST /api/deals/:dealId/confirm-payment` with token or session authorization.
- [x] Backend updates `Award.paymentStatus = 'confirmed'` and appends a Payment Received activity log entry to the Lot CRM timeline.
- [x] Portal settlement state machine preserves confirmed payment state durably across page reloads and transitions UI to unlock Step 2.
- [x] URLs with `#payment` anchor automatically focus Step 1 (or Step 2 if payment is already confirmed).
- [x] Automated integration tests verify payment confirmation persistence, CRM event logging, and state reload continuity.
