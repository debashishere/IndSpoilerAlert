## Parent
ADR 0021-enforce-oauth-mailbox-integration

## What to build
Implement the core backend infrastructure to support the OAuth Mailbox Integration, replacing the legacy manual SMTP model. Remove the manual `SupplierSmtpConfig` schema fields (host, port, user, pass) and replace it with an OAuth-based schema (e.g., storing `accessToken`, `refreshToken`, and connection `status`). Build the initial API endpoints required to start the OAuth flow and handle the success callback. Ensure the core email dispatcher can utilize the OAuth tokens for sending.

## Acceptance criteria
- [ ] Database schema is updated to remove manual SMTP fields and support OAuth tokens.
- [ ] `/api/oauth/start` endpoint is created to initiate the mailbox connection.
- [ ] `/api/oauth/callback` endpoint successfully processes the auth code and stores tokens.
- [ ] Email dispatch service is updated to send emails using the OAuth provider instead of a manual SMTP transport.

## Blocked by
None - can start immediately
