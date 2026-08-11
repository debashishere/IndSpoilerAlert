## What to build

Implement a cryptographically signed Quick-Bid single-use token mechanism and responsive modal interface. Retail buyers clicking a "Bid Now" CTA button in an offer email can submit or adjust bid offers in 1-click without full portal re-authentication.

## Acceptance criteria

- [ ] Cryptographically signed JWT Quick-Bid tokens generated and embedded in email CTA links.
- [ ] API endpoints `GET /api/bids/quick-bid-info?token=<jwt>` and `POST /api/bids/quick-submit` validate token and process bid submissions.
- [ ] Responsive Buyer Quick-Bid Modal renders current listing details, price per case input, quantity selection, and instant bid submission button.

## Blocked by

- [Issue #0067](file:///Users/debashisroy/Documents/IndSpoilerAlert/issues/0067-slice-3-dynamic-server-rendered-email-assets.md)
