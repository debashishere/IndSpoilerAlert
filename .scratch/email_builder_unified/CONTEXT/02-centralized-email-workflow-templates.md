# 02 — Centralized Email & Workflow Templates Specifications

## Overview
Centralized Email Templates establish a single, re-usable template model and API across both standalone template management and workflow stage-gate campaign dispatches.

## Key Specifications & Features

### 1. Dynamic Token UI Component Pill Editor & Info Popover
- Upgrades `TipTapTemplateEditor.tsx` to render dynamic variables (`Header`, `Inventory Table`, `Buyer Name`, `Expiry Date`, `Discount %`, `Quick Bid Link`) as visual UI component pills instead of raw text `{{token}}` syntax.
- Clicking any UI pill or clicking the toolbar **Info ℹ️** button opens `activeTokenInfoModal`.
- Modal displays:
  - *Token Label & Name*
  - *Description & Purpose*
  - *Injected Data Fields*
  - *Sample Runtime Output*
- Toolbar includes quick-click insertion controls: `[ 🏷️ Insert Dynamic Header ]` and `[ 📊 Insert Dynamic Inventory Table ]`.

### 2. Centralized Email Template API & Database Defaults (`/api/email-templates`)
- Backend endpoints (`EmailTemplate` model & `emailTemplateController`):
  - `GET /api/email-templates` — Fetch all templates for supplier.
  - `GET /api/email-templates/:id` — Fetch specific template.
  - `POST /api/email-templates` — Create new template.
  - `PUT /api/email-templates/:id` — Update existing template.
  - `DELETE /api/email-templates/:id` — Remove template.
  - `POST /api/email-templates/seed` — Seed default B2B presets.

### 3. Workflow Studio Template Attachment
- Integrates centralized templates into Section 4 of `LiquidationAutomationStudio.tsx`.
- Removing hardcoded inline HTML editors in favor of selecting registered template IDs or customization via `TipTapTemplateEditor`.
- Auto-syncs chosen template with workflow stage parameters.

### 4. Automated Stage-Gate Execution & Dispatch Engine
- At stage execution time, the automation engine (`emailService.ts` & `email_compiler.ts`):
  - Fetches the attached `EmailTemplate`.
  - Compiles Handlebars dynamic tokens against matched surplus inventory lots and target buyer account properties.
  - Inlines CSS via `juice`.
  - Dispatches email via configured supplier SMTP or OAuth Mailbox channel.
  - Logs execution in `EmailDispatchLog`.
