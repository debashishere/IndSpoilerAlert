# 04 — Acceptance Action Flow with Logistics & Deal Tokens

**What to build:** 
Complete the `[✓ Accept Offer]` action inside the Bid Action Inspector. Resolves inventory distribution center pickup address and warehouse dock operating hours, updates bid status to `fully_accepted` (or `partially_accepted` if partial allocation), deducts available lot quantity, and auto-populates the comprehensive Acceptance & Deal Memo template into the TipTap Email Builder. Dispatches the acceptance email to the buyer containing inventory line items, pickup instructions, payment link, and deal document token link.

**Blocked by:** 03E — Resilient Google OAuth Mailbox Dispatch, Lot CRM Activity & Emails Hub Sync

**Status:** done

- [x] In `[✓ Accept Offer]` mode, automatically loads the Distribution Center pickup address and operating hours (e.g. 08:00 AM - 04:30 PM CST) associated with the lot, allowing supplier review/edits.
- [x] Auto-populates the Acceptance & Settlement email template in TipTap with merged tokens: `{{product_name}}`, `{{sku}}`, `{{awarded_quantity}}`, `{{price_per_case}}`, `{{total_amount}}`, `{{pickup_location}}`, `{{pickup_hours}}`, `{{payment_link}}`, and `{{deal_document_link}}`.
- [x] Backend endpoint `POST /api/bids/:id/accept` records the award, locks inventory allocation, creates a Deal Settlement session token, and triggers Google OAuth email dispatch to the buyer.
- [x] Logs acceptance event, deal value, and outbound notification to the Lot CRM Activity timeline and Emails Hub thread.
- [x] Inspector UI updates seamlessly to reflect accepted status with options to view the deal or resend settlement communications.

## Sub-Tickets (Buyer Deal Settlement & E-Sign Flow)
Specified in detail by [ADR 0035: Buyer Deal Settlement Portal, Payment Gate & E-Sign Agreement Flow](../0035-buyer-deal-settlement-portal-and-payment-gated-esign.md):
- [x] [04A — Standalone Portal Route & Hybrid Deal Authorization](./04a-standalone-portal-route-and-hybrid-deal-authorization.md)
- [x] [04B — Payment Gate & Settlement State Machine](./04b-payment-gate-and-settlement-state-machine.md)
- [x] [04C — Dual-Mode Signature Capture & Legal Agreement Execution](./04c-dual-mode-signature-capture-and-legal-agreement-execution.md)
- [x] [04D — Authoritative Agreement PDF Generation & Executed Deal Dashboard](./04d-authoritative-agreement-pdf-and-executed-deal-dashboard.md)
