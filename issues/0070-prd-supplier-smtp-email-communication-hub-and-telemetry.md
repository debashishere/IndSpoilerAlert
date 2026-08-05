# PRD: Supplier SMTP Integration, Central Email Communication Hub & Telemetry Architecture

## Problem Statement

Suppliers operating on the IndSpoiler Alert Inventory Platform currently lack the capability to connect their corporate SMTP servers (e.g. SendGrid, Microsoft 365, AWS SES) for outbound communications. Outbound B2B offer sheet emails dispatches lack dynamic real-time elements—such as live highest bid figures, expiration countdown timers, and friction-free 1-click bidding links—forcing buyers to navigate through traditional login screens. Additionally, sales teams lack a centralized Email Communication Hub to track recipient open telemetry (`Opened 4x`) or manage listing-scoped negotiation message threads with retail buyers.

## Solution

Deliver an end-to-end email communication, settings, and telemetry framework comprising:
1. **Centralized Platform Settings UI**: Dedicated workspace for Supplier credentials/login and custom Nodemailer SMTP server configuration (AES-256 encrypted at rest) with real-time connection verification testing.
2. **Dynamic Server-Rendered Email Assets**: Express routes generating real-time SVG countdown timers and live bid status badges embedded directly in email templates without relying on client-side JavaScript.
3. **Signed Buyer Quick-Bid Token & Modal**: Single-use cryptographically signed JWT deep links embedded in email CTA buttons allowing retail buyers to submit or update bids instantly in a streamlined, responsive modal without full portal authentication.
4. **Email Open Telemetry Pixel**: 1x1 transparent image tracking endpoint logging initial open timestamp, last open timestamp, and total open counts per recipient.
5. **Central Email Communication Hub**: Split-pane UI consolidating listing-scoped buyer threads, sent offer snapshots, open count badges, live bid updates, and an inline reply composer utilizing the supplier's configured Nodemailer SMTP server.

## User Stories

1. As a Supplier, I want a central Settings section in the application navigation, so that I can manage my supplier login credentials and platform preferences in one place.
2. As a Supplier, I want to enter my custom Nodemailer SMTP server details (host, port, SSL/TLS, username, password, sender name, sender email), so that all outbound emails to retail buyers originate from my corporate email identity.
3. As a Supplier, I want my SMTP password to be encrypted at rest using AES-256, so that corporate credentials are held securely in the system database.
4. As a Supplier, I want a "Test Connection & Send Test Email" button in the SMTP Settings form, so that I can immediately verify mail server connectivity before dispatching campaign emails.
5. As a Supplier, I want the system to fall back to the platform default Nodemailer SMTP server if I have not configured custom SMTP settings, so that email dispatches never fail due to missing configuration.
6. As a Retail Buyer, I want offer sheet emails to display an expiration countdown timer image, so that I am visually aware of the time remaining before a surplus lot bid window closes.
7. As a Retail Buyer, I want offer sheet emails to display a live bid status badge, so that I can see the current highest bid price per case and remaining cases directly inside my email client.
8. As a Retail Buyer, I want a prominent "Bid Now" button in offer emails, so that I can jump directly to a single-use Quick-Bid view pre-filled with my details and default bid amount.
9. As a Retail Buyer, I want to submit or adjust my bid in a lightweight modal without entering a password, so that I can complete transactions with zero friction on mobile or desktop devices.
10. As a Supplier, I want every dispatched email to include an invisible 1x1 tracking pixel, so that the platform automatically logs when a buyer opens an email.
11. As a Supplier, I want to track `firstOpenedAt`, `lastOpenedAt`, and `openCount` per dispatch, so that my sales team knows which buyers are actively engaging with offer sheets.
12. As a Supplier, I want a top-level "Email Communications" section with a split-pane layout, so that I can manage all buyer email threads efficiently.
13. As a Supplier, I want the thread list pane to show open count badges (e.g. `Opened 4x`), buyer company name, target listing ID, and last activity timestamp, so that I can prioritize high-intent buyers.
14. As a Supplier, I want the thread detail pane to display a chronological history of dispatched emails, buyer replies, open events, and bid updates, so that I have complete context during negotiations.
15. As a Supplier, I want an inline reply composer within the thread view, so that I can respond to buyer inquiries directly from the platform via my configured Nodemailer SMTP server.
16. As a Supplier, I want to view a Sent Dispatches & Telemetry sub-tab with high-level stats (Total Sent, Unique Opens, Open Rate %), so that I can analyze overall campaign email performance.

## Implementation Decisions

### Data Models & Schemas
- **`SupplierSmtpConfig`**: `{ supplierId, host, port, secure, user, encryptedPass, senderName, senderEmail, isVerified, updatedAt }`
- **`EmailThread`**: `{ threadId, supplierId, buyerEmail, listingId, campaignId, subject, status, openCount, firstOpenedAt, lastOpenedAt, createdAt, updatedAt }`
- **`EmailMessage`**: `{ messageId, threadId, senderType ('supplier' | 'buyer' | 'system'), body, sentAt, messageIdHeader }`
- **`EmailDispatchLog`**: `{ dispatchId, threadId, buyerEmail, listingId, firstOpenedAt, lastOpenedAt, openCount, userAgent, ipAddress }`
- **`QuickBidToken`**: `{ token, buyerEmail, listingId, defaultAmount, expiresAt, isUsed }`

### API Contracts
- `GET /api/settings/smtp` – Retrieve configured SMTP settings (passwords masked).
- `POST /api/settings/smtp` – Save/update supplier SMTP credentials (encrypted with AES-256-GCM).
- `POST /api/settings/smtp/test` – Test Nodemailer transport connection and dispatch test email.
- `GET /api/tracking/pixel.png?dispatchId=<id>` – Returns 1x1 transparent PNG/GIF and increments open telemetry metrics.
- `GET /api/email-assets/timer.svg?expiresAt=<ts>` – Server-rendered SVG countdown timer image.
- `GET /api/email-assets/bid-badge.svg?listingId=<id>` – Server-rendered SVG live bid badge image.
- `GET /api/bids/quick-bid-info?token=<jwt>` – Decodes single-use token and returns listing/bid payload.
- `POST /api/bids/quick-submit` – Submits bid from email CTA page and updates listing & thread state.
- `GET /api/email-threads` – Returns list of buyer threads with open count badges.
- `GET /api/email-threads/:threadId` – Returns detailed thread message history and telemetry events.
- `POST /api/email-threads/:threadId/reply` – Sends reply email via Nodemailer SMTP.

### UI Component Architecture
- **`CentralSettingsView`**: Modern tabbed settings workspace containing Supplier Credentials Login and SMTP Server Configuration forms with real-time test connection feedback.
- **`EmailCommunicationHub`**: Top-level section with split-pane layout:
  - Left: Scrollable thread list with open count badges (`Opened 3x`), listing tags, and last activity timestamps.
  - Right: Chronological message timeline with sent email cards, live bid badge, pixel open telemetry events, and rich reply composer.
- **`QuickBidModal`**: Standalone mobile-responsive single-use CTA view for instant buyer bid submissions.

## Testing Decisions

### Seams & Principles
- **Testing Principle**: Test external behavior and API contracts, avoiding coupling to internal private state.
- **Seam 1 (SMTP & Settings Integration Seam)**: Test `POST /api/settings/smtp` and `POST /api/settings/smtp/test` using Nodemailer JSON/Ethereal test accounts to verify credential validation, AES-256 encryption, and error handling.
- **Seam 2 (Dynamic SVG & Telemetry Endpoint Seam)**: Test direct HTTP responses for `/api/email-assets/timer.svg`, `/api/email-assets/bid-badge.svg`, and `/api/tracking/pixel.png`, verifying `Content-Type` headers, valid SVG markup, and DB telemetry side-effects (`openCount`, `lastOpenedAt`).
- **Seam 3 (Quick-Bid Token Auth & Mutation Seam)**: Test JWT token generation, `/api/bids/quick-bid-info` decoding, and `POST /api/bids/quick-submit` bid processing to confirm single-use invariants and state updates.
- **Seam 4 (Frontend Email Hub UI & Redux State Seam)**: Test `EmailCommunicationHub` split-pane rendering, open badge updates, and Nodemailer reply dispatch flows across Redux service state.

## Out of Scope

1. **HTTP Connection Streaming Read Duration**: Tracking exact connection open seconds via chunked HTTP stream is deferred to a future phase; current implementation tracks initial open timestamp, last open timestamp, and total open count.
2. **Google/Microsoft OAuth 2.0 SMTP Flow**: Third-party OAuth2 consent screen flows for SMTP are deferred; standard password/app-password SMTP authentication is supported.
3. **Theme Customization Settings**: Custom color themes in the Central Settings module are out of scope for this phase.

## Further Notes

- Glossary updated in [`docs/CONTEXT.md`](file:///Users/debashisroy/Documents/IndSpoilerAlert/docs/CONTEXT.md).
- ADR accepted in [`docs/adr/0020-supplier-smtp-email-communication-hub-and-telemetry.md`](file:///Users/debashisroy/Documents/IndSpoilerAlert/docs/adr/0020-supplier-smtp-email-communication-hub-and-telemetry.md).
- Vertical slice issues published:
  - [Issue #0065: Settings & Supplier SMTP Management](file:///Users/debashisroy/Documents/IndSpoilerAlert/issues/0065-slice-1-centralized-platform-settings-and-supplier-smtp.md)
  - [Issue #0066: Email Telemetry Pixel & Dispatches Log](file:///Users/debashisroy/Documents/IndSpoilerAlert/issues/0066-slice-2-email-open-telemetry-pixel-and-dispatches-log.md)
  - [Issue #0067: Dynamic Server-Rendered Email Assets](file:///Users/debashisroy/Documents/IndSpoilerAlert/issues/0067-slice-3-dynamic-server-rendered-email-assets.md)
  - [Issue #0068: Signed Quick-Bid Token & Modal](file:///Users/debashisroy/Documents/IndSpoilerAlert/issues/0068-slice-4-signed-buyer-quick-bid-token-and-modal.md)
  - [Issue #0069: Listing-Scoped Email Communication Hub](file:///Users/debashisroy/Documents/IndSpoilerAlert/issues/0069-slice-5-listing-scoped-email-communication-hub.md)
