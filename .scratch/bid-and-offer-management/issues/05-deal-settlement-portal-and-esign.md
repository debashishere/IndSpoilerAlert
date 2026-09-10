# 05 — Buyer Deal Settlement Portal with Payment Gate & E-Sign Agreement

**What to build:** 
A dedicated web interface for the buyer accessible via the settlement link from the acceptance email (`/deal/:dealId` or token link). Delivers a two-step settlement flow: Step 1 displays a payment summary with placeholder amount, a placeholder QR code, and a "Pay Now" trigger button. Step 2 enforces the Payment-Gated E-Sign safeguard: once payment is confirmed, unlocks the formal "B2B Surplus Asset Purchase Agreement", allows the buyer to digitally sign via an interactive signature canvas, timestamps legal execution, and provides agreement PDF download.

**Blocked by:** 04 — Acceptance Action Flow with Logistics & Deal Tokens

**Status:** ready-for-agent

- [ ] Standalone, responsive Deal Settlement Portal route (`/deal/:dealId` or `/portal/deal/:dealId`) loads transaction details, lot/product information, DC pickup depot, and pickup dock hours.
- [ ] Step 1 (Payment Gate) presents the placeholder total payment amount, a placeholder scan-to-pay QR code, and an interactive "Pay Now (Simulate Payment Confirmation)" button.
- [ ] Step 2 (Agreement & E-Sign) remains strictly locked and visualizes a locked banner until Step 1 payment confirmation succeeds.
- [ ] Upon clicking "Pay Now", payment transitions to `confirmed`, unlocking the B2B Surplus Asset Purchase Agreement.
- [ ] Interactive signature pad supports drawing a digital signature or typing legal name with authorization acknowledgment checkbox.
- [ ] Submitting the signature marks the deal contract as `EXECUTED`, generates an immutable audit record, and enables downloading the finalized executed agreement PDF.
- [ ] Updates the backend deal status and triggers an executed notification in the Lot CRM timeline.
