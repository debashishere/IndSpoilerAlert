# 04D — Authoritative Agreement PDF Generation & Executed Deal Dashboard

## Parent
[04 — Acceptance Action Flow with Logistics & Deal Tokens](./04-acceptance-action-and-settlement-email.md) | [ADR 0035](../0035-buyer-deal-settlement-portal-and-payment-gated-esign.md)

**What to build:** 
Authoritative agreement PDF compilation and streaming via `GET /api/deals/:dealId/pdf?token=:token` using `pdfkit`. The generated contract incorporates legal "As-Is, Where-Is" terms, title transfer upon DC pickup receipt, itemized lot quantities/pricing, DC dock pickup instructions, and the digital signature block with cryptographic audit certificate stamp. Persists the generated contract URL to `Award.poPdfUrl`. Delivers the Executed Revisit Dashboard for completed deals, rendering a verified execution seal, direct PDF contract download button, and DC warehouse pickup dock logistics instructions.

**Blocked by:** 04C — Dual-Mode Signature Capture & Legal Agreement Execution

**Status:** completed

- [x] Backend service generates an authoritative B2B agreement PDF using `pdfkit` featuring legal terms, itemized lot tables, and DC dock logistics.
- [x] PDF embeds the digital signature graphic, signer name, corporate title, timestamp, and cryptographic execution stamp, saving to `Award.poPdfUrl`.
- [x] Endpoint `GET /api/deals/:dealId/pdf` streams the generated PDF to authorized token holders or authenticated buyers/suppliers.
- [x] Portal route `/deal/:dealId` detects `Award.signatureStatus === 'executed'` and renders the completed Executed Deal Dashboard.
- [x] Executed Deal Dashboard provides verified digital seal, one-click PDF contract download button, and DC pickup dock logistics summary.
- [x] Automated tests verify PDF compilation, streaming response headers, and executed portal dashboard rendering.
