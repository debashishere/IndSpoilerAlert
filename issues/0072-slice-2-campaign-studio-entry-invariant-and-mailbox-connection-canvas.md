## Parent
ADR 0021-enforce-oauth-mailbox-integration

## What to build
Enforce the "Campaign Studio Entry Invariant" on the frontend. When a supplier navigates to the Liquidation Automation Studio, the UI must check the backend for a connected OAuth Mailbox status. If no valid mailbox is connected, block access to the builder and render the "Mailbox Connection Canvas"—a friendly empty state screen. This canvas must include a "Connect Mailbox" button that triggers the OAuth flow in a popup and dynamically unlocks the studio upon success without a full page refresh.

## Acceptance criteria
- [ ] API provides a way to fetch the supplier's current OAuth Mailbox status on load.
- [ ] Liquidation Automation Studio route intercepts unauthenticated users.
- [ ] Mailbox Connection Canvas is rendered with a clear value proposition and CTA.
- [ ] Clicking the CTA launches the OAuth popup.
- [ ] Successful authentication closes the popup and immediately re-renders the active Studio workspace.

## Blocked by
- #0071
