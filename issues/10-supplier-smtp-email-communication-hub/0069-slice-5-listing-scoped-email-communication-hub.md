## What to build

Build the central Email Communication Hub UI and thread management engine. Provides a split-pane thread inbox organizing conversation histories by supplier, buyer, and listing, displaying open count badges, sent offer snapshots, live bid updates, and an inline reply composer that dispatches emails via Nodemailer SMTP.

## Acceptance criteria

- [ ] Top-level "Email Communications" navigation section and split-pane Thread Inbox UI built.
- [ ] Left pane displays buyer conversation list with open count badges (`Opened 3x`), listing context tag, and last message timestamp.
- [ ] Right pane renders full chronological message history, sent email cards, live bid badge, pixel open history, and rich reply composer.
- [ ] Backend endpoints `GET /api/email-threads`, `GET /api/email-threads/:id`, and `POST /api/email-threads/:id/reply` manage message dispatching via configured supplier SMTP.

## Blocked by

- [Issue #0065](file:///Users/debashisroy/Documents/IndSpoilerAlert/issues/0065-slice-1-centralized-platform-settings-and-supplier-smtp.md)
- [Issue #0066](file:///Users/debashisroy/Documents/IndSpoilerAlert/issues/0066-slice-2-email-open-telemetry-pixel-and-dispatches-log.md)
- [Issue #0068](file:///Users/debashisroy/Documents/IndSpoilerAlert/issues/0068-slice-4-signed-buyer-quick-bid-token-and-modal.md)
