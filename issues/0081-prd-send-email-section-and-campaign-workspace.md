## Problem Statement

Sales representatives currently lack an integrated, enterprise-grade tool within IndSpoilerAlert to manually compose and send ad-hoc email campaign broadcasts to targeted retail buyers. Furthermore, custom email templates are embedded inside individual liquidation workflow configurations, forcing sales reps to duplicate template text. Hand-coding HTML emails frequently leads to broken layouts in Microsoft Outlook and mobile mail clients, while managing email deliverability across external tools creates workflow friction and risks domain reputation.

## Solution

We are introducing the **Send Email Section & Email Campaign Workspace** integrated directly into **Liquidation Automation Studio** (`/workflows`). Sales representatives can visually author custom templates using a TipTap WYSIWYG editor with dynamic variable tokens (`{{buyer_name}}`, `{{inventory_table}}`, `{{quick_bid_link}}`). Templates are compiled on the server using Handlebars.js and Juice CSS inlining for 100% email client rendering compatibility. Sales reps can select target buyer segments, attach surplus inventory lots, preview live recipient renders across Desktop and Mobile views, and dispatch 1-click personalized Quick-Bid emails directly through their authenticated Google OAuth2 / SendGrid mailbox.

## User Stories

1. As a sales representative, I want to compose ad-hoc email campaign broadcasts from within the platform, so that I can quickly reach buyers without exporting CSVs to external email tools.
2. As a sales representative, I want to author custom email templates visually using a WYSIWYG editor, so that I don't need to write manual HTML or CSS code.
3. As a sales representative, I want to insert dynamic variable token chips (such as `{{buyer_name}}`, `{{inventory_table}}`, and `{{quick_bid_link}}`), so that every recipient receives a personalized email payload.
4. As a sales representative, I want to save custom email templates to a central template library with a unique `templateId`, so that I can reuse them across multiple broadcasts and automated stage-gate workflows.
5. As a sales representative, I want to fall back to a `"default"` platform template when I don't specify a custom template, so that I can send campaigns instantly with zero setup.
6. As a sales representative, I want to target buyers by selecting pre-defined Buyer Segments (e.g. *Short-Dated Grocers*), so that I can reach relevant liquidators efficiently.
7. As a sales representative, I want to select specific individual buyer accounts, so that I can run targeted private liquidation offers.
8. As a sales representative, I want to attach active Surplus Inventory Lots to my email broadcast, so that recipient emails automatically include itemized product tables with shelf-life details.
9. As a sales representative, I want to preview how my email will look on both Desktop and Mobile devices before sending, so that I can verify formatting and layout quality.
10. As a sales representative, I want a pre-flight broadcast preview showing resolved recipient counts and case totals, so that I can confirm my campaign scope before dispatching.
11. As a retail buyer, I want every broadcast email to include a personalized 1-click Quick-Bid CTA link, so that I can place bids immediately without needing to log in or enter credentials.
12. As a retail buyer, I want received emails to render cleanly in Microsoft Outlook, Gmail, and mobile mail apps, so that I can easily read lot details and prices on any device.
13. As a platform administrator, I want email template CSS to be automatically inlined on the server using `juice`, so that styles are preserved across restrictive B2B email clients.
14. As a platform administrator, I want campaign dispatches to enforce a connected Google OAuth2 mailbox, so that emails originate from verified supplier domains and comply with SPF/DMARC policies.
15. As a platform administrator, I want every broadcast dispatch to generate an Email Dispatch Log entry, so that campaign history and delivery telemetry are fully auditable.

## Implementation Decisions

- **Centralized UI Placement**: Add a primary sub-tab **"Send Broadcast Email"** (or **"Email Studio"**) inside Liquidation Automation Studio (`/workflows`).
- **`EmailTemplate` Mongoose Schema**: Create a dedicated Mongoose schema (`supplierId`, `name`, `templateId`, `subject`, `bodyHtml`, `availableTokens`, `category`, `createdAt`).
- **Decoupled `templateId` Reference System**: Workflows and broadcasts pass a `templateId` parameter, resolving to `"default"` for platform baseline templates unless a custom template reference is supplied.
- **Handlebars + Juice Compilation Engine**: Create a backend compilation service (`emailTemplateService.compileTemplate`) that executes Handlebars token substitution and runs `juice` CSS inlining.
- **TipTap WYSIWYG React Editor**: Implement a visual editor with custom Token Chip extensions for 1-click token insertion.
- **Smart Audience & CTA Token Generator**: Implement audience resolution and recipient-unique Quick-Bid CTA token generation (`/bid?token=...`) during campaign dispatch.

## Testing Decisions

- **Testing Philosophy**: Tests must focus strictly on external behavior, API contracts, and integration boundaries, avoiding coupling to internal implementation details.
- **Backend API & Service Seam**: REST API tests against `/api/email-templates`, `/api/emails/broadcast-preview`, and `/api/emails/dispatch-broadcast` using Supertest and MongoDB Memory Server, testing end-to-end payload transformation, Handlebars token substitution, Juice CSS inlining, OAuth mailbox validation, and email dispatch log creation.
- **Frontend Component & Integration Seam**: React Testing Library / Vitest tests for the TipTap Editor, Token Chip insertion, live device preview synchronization, and broadcast launch controls.
- **Prior Art**: Prior testing patterns can be found in `backend/src/tests/oauth_mailbox.test.ts`, `backend/src/tests/email_telemetry.test.ts`, and `frontend/src/test/SettingsView.test.tsx`.

## Out of Scope

- Drag-and-drop HTML email template builders with raw CSS grid positioning.
- Supporting raw HTML code editing mode in the visual UI.
- Multi-tenant shared global template marketplaces between different supplier companies.

## Further Notes

- Reference ADR: `0023-enterprise-email-template-engine-and-workspace.md`
- Domain Glossary: `docs/CONTEXT.md` (`Email Campaign Workspace`, `Ad-Hoc Email Broadcast`, `Email Template Reference (templateId)`, `Template Variable Token`, `Smart Audience Targeting`, `Personalized Quick-Bid CTA Token`).
- Child Slices: Issues `0076`, `0077`, `0078`, `0079`, and `0080`.
