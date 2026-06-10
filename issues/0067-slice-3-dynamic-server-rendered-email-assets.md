## What to build

Build dynamic server-rendered SVG image generation endpoints for email templates. Offers emails can embed real-time SVG countdown timers and live bid status badges that recalculate current listing state dynamically upon image request without requiring inline JavaScript.

## Acceptance criteria

- [ ] Route `GET /api/email-assets/timer.svg?expiresAt=<ts>` dynamically renders a server-computed countdown SVG image.
- [ ] Route `GET /api/email-assets/bid-badge.svg?listingId=<id>` dynamically renders an SVG badge displaying current highest bid and remaining cases.
- [ ] Email template engine integrates dynamic asset tag builders for offer sheet dispatches.

## Blocked by

- [Issue #0065](file:///Users/debashisroy/Documents/SpoilerAlert/issues/0065-slice-1-centralized-platform-settings-and-supplier-smtp.md)
