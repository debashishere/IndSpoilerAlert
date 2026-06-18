# 02 — Centralized Email Template API & System Seed Defaults

**What to build:** Expands the backend Email Template domain (`emailTemplateController.ts`, `emailTemplateService.ts`, `DEFAULT_PLATFORM_TEMPLATES`) to provide default system templates (*Standard Liquidation Offer Sheet*, *Urgent Short-Dated Surplus Auction Alert*, *Food Bank Direct Donation Transfer Notice*) and an automated preprocessor compiler that compiles `data-token` UI components into responsive, inline-styled HTML tables at execution time.

**Blocked by:** 01 — Dynamic Token UI Component Pill Editor & Info Popover

**Status:** completed

- [x] `DEFAULT_PLATFORM_TEMPLATES` includes clearance, auction, and donation default email templates.
- [x] `compileTemplate` transforms `data-token="inventory_table"` and `data-token="header"` UI pill components into responsive HTML tables.
- [x] `GET /api/email-templates?supplierId=...` returns custom and default templates cleanly.
