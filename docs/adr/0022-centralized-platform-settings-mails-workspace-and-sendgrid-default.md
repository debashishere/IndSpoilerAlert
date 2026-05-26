# 0022: Centralized Platform Settings Mails Workspace and SendGrid Default Integration

## Context
Previously, email thread communications were housed under a standalone top-level `email-comms` navigation tab, while supplier settings were located in `settings`. This caused UI fragmentation, cluttered views, and disconnected supplier management workflows. Additionally, outbound email dispatch required clarifying the production delivery strategy.

## Decision
1. **Consolidate Email Communications into Central Platform Settings**:
   - Completely remove the top-level `/email-comms` tab from main navigation.
   - Embed the listing-scoped buyer thread inbox directly into **Central Platform Settings** as a primary sub-tab named **Mails** (`mails`).
2. **Structure Settings Sub-Navigation**:
   - **Mails (`mails`)**: Central workspace for listing-scoped buyer threads, open telemetry tracking, dynamic SVG status badges, and buyer reply dispatches.
   - **Mailbox & Identity (`mailbox`)**: OAuth Mailbox connection (Google Workspace / Outlook), SendGrid Free Tier default status, and optional custom server parameters.
   - **Supplier Profile (`profile`)**: Active supplier credentials and sender identity.
   - **Platform Preferences (`preferences`)**: System operational defaults, thread archiving, and Quick-Bid token generation.
3. **Adopt SendGrid Free Tier as Default Production Mailer**:
   - Standardize on **SendGrid Free Tier** as the zero-config platform default mailer for all outbound emails and buyer thread replies, eliminating complex manual email setups for suppliers while supporting 1-click OAuth mailbox connections.

## Consequences
- Eliminates top-level navigation clutter and unifies email management and mailbox settings into a single intuitive space.
- Simplifies production onboarding by providing immediate zero-config outbound delivery via SendGrid Free Tier.
- Backed by real MongoDB/Express endpoints and complete integration unit tests.
