# 0108 — Slice 1: Decline Offer Full Composer & Resilient Outbound Dispatch

**What to build:**
Upgrade the **Decline Offer** tab in `BidActionInspectorModal.tsx` into a 2-column split work surface matching the Accept and Counter modes:
- **Left Column (~38%)**:
  - Mandatory `Decline Reason` dropdown select (`DECLINE_REASONS`).
  - `Decline Rationale` textarea for supplier notes and audit trail.
  - Action buttons: "Cancel" and "Confirm Decline & Send Notice".
- **Right Column (~62%)**:
  - TipTap Email Builder (`WorkflowTipTapBodyEditor`) pre-loaded with the **Decline Notice Email Preset**.
  - Dynamic token values: `{{buyer_name}}`, `{{product_name}}`, `{{decline_reason}}`, `{{decline_rationale}}`, `{{lot_number}}`, `{{catalog_link}}`.
  - Token badges that dynamically evaluate as the supplier changes the reason or rationale.
  - Decline Notice template:
    `<p>Dear {{buyer_name}},</p><p>Thank you for your offer on <strong>{{product_name}}</strong> (Lot #{{lot_number}}). After review, we are unable to accept your offer.</p><p><strong>Reason:</strong> {{decline_reason}}</p><p><strong>Notes:</strong> {{decline_rationale}}</p><p>We invite you to explore other available inventory opportunities: <a href="{{catalog_link}}">Explore Available Surplus Inventory</a>.</p>`

On the backend:
- Extend `offersController.declineBid` and `offersService.declineBid` to accept `templateHtml?: string` and `emailSubject?: string`.
- Compile template and subject against context (`buyer_name`, `product_name`, `lot_number`, `decline_reason`, `decline_rationale`, `catalog_link`, `marketplace_link`).
- Log an `Activity` record (`type: 'Email'`) in the Lot CRM timeline with compiled subject and body.
- Sync outbound email message to the Emails Hub thread repository via `syncEmailToThread`.
- Resiliently dispatch outbound email via Google OAuth Mailbox with fallback to SMTP (`sendCampaignEmail` / `sendEmailHelper`).
- Return `emailDispatch: { dispatched: boolean; warning?: string }` telemetry to the caller without blocking decline execution if email encounters a transport warning.

**Blocked by:** None — can start immediately

**Status:** complete

- [x] Split `BidActionInspectorModal.tsx` Decline mode into a 2-column layout with TipTap composer on the right.
- [x] Implement live-evaluating dynamic token mapping for decline rationale, reason, buyer name, product title, and catalog link.
- [x] Update frontend `InventoryService.declineBid` and `LotOperationsHubView.tsx` to pass the compiled template HTML and subject.
- [x] Update backend `offersController.ts` and `offersService.ts:declineBid` to compile template and handle resilient dispatch via Google OAuth / SMTP fallback.
- [x] Log Activity record in Lot CRM and sync message into Emails Hub thread.
- [x] Add unit and integration tests verifying decline modal layout, token evaluation, and resilient email dispatch.
