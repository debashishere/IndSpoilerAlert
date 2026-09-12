# 04C — Dual-Mode Signature Capture & Legal Agreement Execution

## Parent
[04 — Acceptance Action Flow with Logistics & Deal Tokens](./04-acceptance-action-and-settlement-email.md) | [ADR 0035](../0035-buyer-deal-settlement-portal-and-payment-gated-esign.md)

**What to build:** 
Step 2 (Agreement & E-Sign) of the settlement portal. Enforces a strict payment gate: backend `POST /api/deals/:dealId/sign` and frontend UI both block signing if `Award.paymentStatus !== 'confirmed'`. Renders the formal B2B Surplus Asset Purchase Agreement containing commercial terms, non-returnable salvage clauses, and DC dock logistics. Features a dual-mode interactive signature pad (Draw on canvas with touch/mouse or Type cursive legal script) with signer name, corporate title, and authorization checkbox. Submitting captures an immutable execution audit record, transitions `Award.signatureStatus = 'executed'`, automatically provisions a downstream `Shipment` in `status: 'scheduled'` with carrier `"Buyer Arranged Freight (FOB Origin)"`, logs an Agreement Executed event to the Lot CRM timeline, and appends a confirmation message to `Offer.messages`.

**Blocked by:** 04B — Payment Gate & Settlement State Machine

**Status:** completed

- [x] Step 2 renders a locked banner and disables signature submission whenever `Award.paymentStatus !== 'confirmed'`.
- [x] Step 2 displays the formal B2B Surplus Asset Purchase Agreement including commercial terms, DC pickup location, and dock operating hours.
- [x] Interactive dual-mode signature pad supports Draw (HTML5 canvas touch/mouse exporting PNG data URL) and Type (cursive script rendering of signer name).
- [x] Collects mandatory legal execution inputs: full signer name, corporate title, and legal authorization confirmation checkbox.
- [x] Backend endpoint `POST /api/deals/:dealId/sign` strictly validates that payment is confirmed before accepting signature.
- [x] On signing, records execution audit trail (signer name, title, timestamp, client IP, user agent, signature data), updates `Award.signatureStatus = 'executed'`, and auto-creates a linked `Shipment` record (`status: 'scheduled'`, carrier `"Buyer Arranged Freight (FOB Origin)"`).
- [x] Appends an Agreement Executed activity entry to the Lot CRM timeline and posts a contract execution confirmation message to `Offer.messages`.
- [x] Automated tests verify payment-gate enforcement, signature execution endpoint, audit payload, and downstream shipment creation.
