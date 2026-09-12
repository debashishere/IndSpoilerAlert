# ADR 0035: Buyer Deal Settlement Portal, Payment Gate & E-Sign Agreement Flow

- **Status**: Approved
- **Date**: 2026-09-10
- **Authors**: Antigravity AI & SpoilerAlert Engineering Team
- **Deciders**: Lead Architect, Full-Stack Engineers

---

## 1. Context & Problem Statement

In [Issue 04](file:///Users/debashisroy/Documents/SpoilerAlert/.scratch/bid-and-offer-management/issues/04-acceptance-action-and-settlement-email.md), when a supplier accepts a buyer's offer in the Bid Action Inspector, the system deducts available lot inventory, records an `Award`, generates a cryptographic `dealToken`, and dispatches an acceptance email containing settlement links (`/deal/:dealId?token=:dealToken`).

To complete the transaction lifecycle as part of [Issue 04 (Sub-Tickets 04A–04D)](./issues/04-acceptance-action-and-settlement-email.md), the platform requires a dedicated post-award settlement experience for the buyer. Key engineering and domain challenges addressed:
1. **Frictionless External Access vs. Security**: External liquidators frequently access settlement links from mobile or guest browsers without an active platform session. Access must be secure yet frictionless.
2. **Financial Safeguard (Payment Gate)**: In commercial surplus asset liquidation, legal execution of transfer agreements must strictly require confirmed payment receipt.
3. **Legal E-Sign & Audit Integrity**: The digital agreement execution must capture tamper-evident audit records (signer identity, corporate title, timestamp, IP, signature artifact) and provide an authoritative executed PDF.
4. **Operations Handoff**: Once paid and signed, inventory must immediately flow to warehouse operations for dock pickup without manual duplicate data entry.

---

## 2. Decision & Architectural Specifications

### 2.1 Hybrid Deal Token Authorization
- The Deal Settlement Portal (`/deal/:dealId`) is secured via a dual-mode access model:
  - **Cryptographic Guest Access**: A valid HMAC-signed `dealToken` parameter grants immediate guest access to review lot details, clear payment, and digitally sign without requiring account login.
  - **Session Cross-Verification**: If an active buyer JWT session is present, the portal validates that the logged-in user matches `Award.buyerId`. Supplier administrator sessions are granted inspection/preview privileges.
  - Requests missing a valid token and lacking an authorized session are rejected with HTTP 403.

### 2.2 Payment-Gated Settlement State Machine
- Settlement executes across a strict two-step progression:
  - **Step 1 (Payment Gate)**: Presents total deal value, payment simulation instructions, and a scan-to-pay QR code.
  - Clicking **"Pay Now (Simulate Payment Confirmation)"** invokes `POST /api/deals/:dealId/confirm-payment`, immediately persisting `Award.paymentStatus = 'confirmed'` in the database and logging a Payment Received event in the Lot CRM timeline.
  - Progress is durable: reloading the browser preserves the confirmed payment state and unlocks Step 2.
  - **Step 2 (Agreement & E-Sign)**: Strictly locked behind Step 1. The backend endpoint `POST /api/deals/:dealId/sign` rejects execution requests with HTTP 400/403 if `Award.paymentStatus !== 'confirmed'`.

### 2.3 Dual-Mode Signature Capture & Legal Audit Record
- Step 2 renders the formal **B2B Surplus Asset Purchase Agreement** containing commercial terms, DC pickup location, and dock operating hours.
- The signature pad provides two input modalities:
  - **Draw**: Interactive HTML5 canvas for touch, stylus, and mouse input, exporting a PNG data URL.
  - **Type**: Formatted legal name rendered in an authentic cursive signature script.
- Mandatory legal execution attributes:
  - Full Signer Name, Corporate Title, and Authorization Checkbox.
- Submitting the signature records an **Execution Audit Record** encapsulating signer name, title, signature data, execution timestamp, client IP, user agent, and an immutable certificate hash.

### 2.4 Authoritative Backend Agreement PDF (`pdfkit`)
- The backend serves `GET /api/deals/:dealId/pdf?token=:dealToken`, generating an authoritative, professional PDF contract using `pdfkit`.
- Incorporates formal legal clauses ("As-Is, Where-Is", title transfer upon DC pickup receipt, non-returnable salvage terms), itemized lot quantities and pricing, DC dock instructions, and the embedded digital signature block with the cryptographic audit stamp.
- Saved to `Award.poPdfUrl` for long-term document archiving.

### 2.5 Downstream Fulfillment Provisioning
- Upon successful agreement execution (`Award.signatureStatus = 'executed'`), the system:
  1. Auto-instantiates a linked `Shipment` record in `status: 'scheduled'` with carrier `"Buyer Arranged Freight (FOB Origin)"` and pickup depot pre-populated from the lot's DC location.
  2. Logs an "Agreement Executed" activity event into the Lot CRM timeline.
  3. Appends a contract execution confirmation message to the `Offer.messages` ledger.

### 2.6 Portal Presentation & Deep Linking
- Renders as a dedicated, full-screen standalone portal omitting internal supplier sidebars, header navigation, and inventory management controls.
- Handles deep links: URLs with `#payment` automatically anchor to Step 1 (or Step 2 if payment has already cleared).
- **Executed Revisit State**: Returning to an already executed deal renders a completed dashboard displaying the verified execution seal, direct agreement PDF download button, and DC pickup dock logistics instructions.

---

## 3. API Contract Specifications

- `GET  /api/deals/:dealId?token=:token` — Retrieves deal, lot, DC depot, and settlement progress.
- `POST /api/deals/:dealId/confirm-payment?token=:token` — Confirms payment receipt and unlocks Step 2.
- `POST /api/deals/:dealId/sign?token=:token` — Validates payment gate, executes agreement, captures audit trail, provisions shipment.
- `GET  /api/deals/:dealId/pdf?token=:token` — Compiles and streams the executed agreement PDF.

---

## 4. Consequences

### Positive
- **Guaranteed Payment Before Legal Release**: Enforces zero risk of contract execution without verified financial clearance.
- **Frictionless External Execution**: Liquidators can finalize transactions in seconds from an email link without registration friction.
- **Legal Enforceability**: Comprehensive audit trail with IP address, timestamp, title, and signature mark satisfies ESIGN and UETA compliance requirements.
- **Immediate Operations Flow**: Warehouse dock teams receive scheduled pickup shipments automatically without manual intervention.

### Negative / Trade-offs
- Payment clearance in this milestone uses simulated confirmation; production integration will bind to real-time ACH / wire webhook listeners.
