# 0023: Enterprise Email Template Engine and Workspace Architecture

## Context
As SpoilerAlert expands to support both automated stage-gate liquidation workflows and manual sales campaign broadcasts, suppliers need a high-grade, low-maintenance way to author, manage, and dispatch custom email templates without heavy third-party runtime dependencies or complex HTML coding.

## Decision
1. **Unified Email Campaign Workspace**:
   - Integrate the **Send Broadcast Email Section** directly into **Liquidation Automation Studio** (`/workflows`) as a dedicated sub-tab, consolidating ad-hoc campaign broadcasts and shared email template management.
2. **Handlebars + Juice Inliner Engine**:
   - Standardize on **Handlebars.js** for token interpolation (`{{buyer_name}}`, `{{inventory_table}}`, `{{quick_bid_link}}`).
   - Use **Juice** to inline CSS into standard HTML elements automatically, guaranteeing cross-client rendering support for Outlook, Gmail, and mobile email clients.
3. **Decoupled `templateId` Reference Model**:
   - Model email templates with a dedicated `EmailTemplate` schema (`backend/src/models/EmailTemplate.ts`).
   - Use a `templateId` parameter across broadcasts and automated stage-gate workflows, defaulting to `"default"` (loading platform baseline default templates) unless overridden by a custom supplier template reference.
4. **TipTap Visual Authoring UI**:
   - Provide a WYSIWYG editor using TipTap/BlockNote for intuitive visual editing with variable token chips.
5. **Smart Audience Targeting & 1-Click CTA Personalization**:
   - Support buyer segment filtering and inventory lot selection.
   - Dispatch engine dynamically generates recipient-unique 1-click Quick-Bid CTA tokens (`/bid?token=...`) and itemized lot tables during email generation.

## Consequences
- Keeps backend dependencies lightweight (`handlebars`, `juice`) while delivering bulletproof cross-client HTML output.
- Decouples template definition from workflow definitions via a clean `templateId` reference system with `"default"` fallback.
- Eliminates manual HTML table maintenance for sales representatives while ensuring high deliverability via Google OAuth2 / SendGrid transports.
