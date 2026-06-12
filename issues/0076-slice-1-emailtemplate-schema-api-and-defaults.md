# 0076: Slice 1 - EmailTemplate Schema, REST API CRUD, and Baseline Defaults

## What to build

Implement a Mongoose `EmailTemplate` model and corresponding REST API endpoints for managing supplier email templates. The backend must support CRUD operations for custom templates while seamlessly resolving `"default"` to platform baseline offer-sheet templates. In the frontend, integrate a template selector dropdown inside Liquidation Automation Studio (`/workflows`).

## Acceptance criteria

- [ ] Mongoose `EmailTemplate` model defined with fields: `supplierId`, `name`, `templateId`, `subject`, `bodyHtml`, `availableTokens`, `category`, `createdAt`.
- [ ] REST API endpoints created for `GET /api/email-templates`, `POST /api/email-templates`, `PUT /api/email-templates/:id`, and `DELETE /api/email-templates/:id`.
- [ ] Querying `templateId: "default"` returns platform baseline default templates without requiring a custom database document.
- [ ] Template selector component integrated into Liquidation Automation Studio in the frontend.
- [ ] Backend integration tests written for template CRUD and `"default"` fallback resolution.

## Blocked by

None - can start immediately.
