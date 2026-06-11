## Parent
ADR 0021-enforce-oauth-mailbox-integration

## What to build
Refactor the backend email service to strictly isolate the "Platform Default Mailer" (e.g., SendGrid/AWS SES or Ethereal in testing). The system must enforce that the platform default is only ever used for system-level alerts (like password resets). If the system attempts to dispatch a campaign or buyer communication, it must strictly use the OAuth Mailbox Integration. If the OAuth token is missing or invalid, the dispatch operation must explicitly fail and log an error, rather than falling back to spoofing the supplier's address via the platform mailer.

## Acceptance criteria
- [ ] Email service has distinct methods/channels for `sendSystemAlert` vs `sendCampaignEmail`.
- [ ] `sendCampaignEmail` strictly requires a valid OAuth token and fails if none is found.
- [ ] Unit tests verify that campaign dispatch throws an error instead of using the fallback mailer if OAuth is disconnected.

## Blocked by
- #0071
