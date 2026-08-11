## Parent
ADR 0021-enforce-oauth-mailbox-integration

## What to build
Implement the "Mailbox Authentication Soft Lock" UI state. Since OAuth tokens can expire or be revoked (e.g., if the user changes their Google Workspace password), the system must handle degraded states gracefully. If the API returns an `expired` status for the mailbox connection, the Liquidation Automation Studio should still permit read-only access so users can view historical campaign metrics. However, a sticky warning banner must be displayed, and all actionable buttons (like "Launch Campaign" or "Send Message") must be disabled until they re-authenticate via the banner.

## Acceptance criteria
- [ ] API accurately detects and reports an `expired` or `invalid` token status to the frontend.
- [ ] Liquidation Automation Studio renders a sticky, prominent warning banner if the token is expired.
- [ ] All actionable "Launch" and "Send" buttons are disabled while in the soft lock state.
- [ ] The banner contains a CTA to re-authenticate, which successfully clears the soft lock state upon completion.

## Blocked by
- #0072
