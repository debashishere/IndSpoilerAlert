## Problem Statement

The previous email architecture relied on suppliers manually configuring SMTP settings (host, port, credentials) to dispatch liquidation campaigns. This process was highly technical, brittle, and caused significant onboarding friction. Additionally, if a supplier failed to configure their email, the system risked falling back to a generic platform mailer, which could spoof the supplier's identity and violate DMARC/SPF policies, reducing email deliverability.

## Solution

We are replacing the manual SMTP configuration with a modern **OAuth Mailbox Integration** (e.g., via Nylas). Suppliers will connect their corporate email accounts (Google Workspace, Microsoft 365) via a seamless OAuth popup. To ensure all campaigns have a valid sender, we are introducing a **Campaign Studio Entry Invariant** (a hard gate) that requires email connection before accessing the Liquidation Automation Studio. The **Platform Default Mailer** will be strictly isolated for system-level notifications only.

## User Stories

1. As a supplier, I want to connect my corporate email account via a secure OAuth popup, so that I don't have to manually enter complex SMTP hosts and passwords.
2. As a supplier, I want my liquidation campaigns to be sent directly from my own outbox, so that buyers recognize the sender and my domain reputation is preserved.
3. As a supplier without a connected email, I want to see a clear empty-state screen (Mailbox Connection Canvas) when I try to build a campaign, so that I understand the value proposition of connecting my mailbox before proceeding.
4. As a supplier with an expired email connection, I want to retain read-only access to my historical campaign metrics, so that I can review past performance without being completely locked out.
5. As a supplier with an expired email connection, I want to see a persistent warning banner prompting me to re-authenticate, so that I know why my launch and send buttons are disabled.
6. As a buyer, I want to receive offers originating directly from the supplier's verified email domain, so that I can safely reply and negotiate without triggering spam filters.
7. As a platform administrator, I want system-level notifications (e.g., password resets) to use the Platform Default Mailer, so that platform integrity is maintained independently of supplier mailbox status.
8. As a platform administrator, I want campaign dispatch jobs to explicitly fail if an OAuth token is missing, so that the system never spoofs a supplier's identity using the fallback mailer.

## Implementation Decisions

- **OAuth Mailbox Integration Model**: We will deprecate the manual `SupplierSmtpConfig` schema and replace it with a token-based authentication schema to store `accessToken`, `refreshToken`, and `status`.
- **Campaign Studio Entry Invariant**: Access to the Liquidation Automation Studio will be protected by a hard gate. If a valid mailbox is not detected, the UI will render the **Mailbox Connection Canvas**.
- **Mailbox Connection Canvas**: This dedicated empty-state UI will house the primary OAuth trigger button. It will launch a popup window to complete authentication without redirecting the user away from their current session context.
- **Platform Default Mailer Isolation**: The backend email dispatch service will strictly separate `sendSystemAlert` and `sendCampaignEmail`. The latter will enforce the presence of an OAuth token and will not fall back to the Platform Default Mailer.
- **Mailbox Authentication Soft Lock**: If an OAuth token is marked as expired or invalid (e.g., due to a password change), the UI will degrade gracefully. The supplier will enter a soft lock state: read-only access to the studio is preserved, a sticky warning banner is displayed, and actionable buttons ("Launch", "Send") are disabled.

## Testing Decisions

- Tests should focus on external behaviors and integration boundaries rather than internal implementation details.
- **External API Seam (Backend)**: The external OAuth provider (Nylas/Google) will be mocked at the HTTP request boundary. Tests will verify that the Email Dispatch Service accurately includes the mocked tokens in dispatch payloads.
- **Database Boundary Seam (Backend)**: Tests will inject scenarios where the OAuth token is missing from the database to assert that `sendCampaignEmail` throws an explicit error instead of using the Platform Default Mailer.
- **UI API Seam (Frontend)**: The `/api/oauth/status` endpoint will be mocked on the frontend to simulate `connected`, `missing`, and `expired` states. This will verify the rendering of the Mailbox Connection Canvas and the Mailbox Authentication Soft Lock banner without triggering real browser popups.
- Prior art for testing API seams and UI state mocking can be found in the existing `Sales Reconciliation` and `Dynamic Faceted Navigation` test suites.

## Out of Scope

- Supporting manual SMTP configuration as an "Advanced" option for legacy on-premise mail servers.
- Migrating existing legacy SMTP configurations to OAuth (users will simply be prompted to authenticate via the new flow).
- Multi-mailbox routing (e.g., separating transactional vs. marketing dispatch for a single supplier).

## Further Notes

- Reference ADR: `0021-enforce-oauth-mailbox-integration.md`
- Ensure that the OAuth popup flow gracefully handles popup blockers by providing a clear manual trigger fallback if the window fails to open.
