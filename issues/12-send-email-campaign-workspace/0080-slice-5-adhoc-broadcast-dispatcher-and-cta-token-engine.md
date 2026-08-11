# 0080: Slice 5 - End-to-End Ad-Hoc Email Broadcast Dispatcher and CTA Token Engine

## What to build

Implement the end-to-end campaign broadcast engine and full UI tab in Liquidation Automation Studio (`/workflows`). The backend dispatch service must validate OAuth Mailbox connection status, generate recipient-unique 1-click Quick-Bid CTA tokens (`/bid?token=...`), compile `{{inventory_table}}`, and dispatch emails via Nodemailer OAuth2 / SendGrid.

## Acceptance criteria

- [ ] REST API endpoint `POST /api/emails/dispatch-broadcast` created to trigger campaign dispatches.
- [ ] Strictly validates `SupplierOAuthMailbox.status === 'connected'` before dispatch, returning an explicit error if unauthenticated.
- [ ] Generates personalized 1-click Quick-Bid CTA Tokens (`/bid?token=...`) for each recipient during dispatch loop.
- [ ] Complete **"Send Broadcast Email"** sub-tab UI added to Liquidation Automation Studio (`/workflows`) with 1-click launch, pre-flight OAuth status banner, and delivery toasts.
- [ ] Creates Email Dispatch Log records tracking broadcast execution and recipient telemetry.
- [ ] End-to-end integration test suite verifying broadcast execution, CTA token creation, and dispatch audit logs.

## Blocked by

- 0077: Slice 2 - Handlebars Token Compiler and Juice CSS Inliner Engine
- 0079: Slice 4 - Smart Audience Targeting and Inventory Lot Selector
