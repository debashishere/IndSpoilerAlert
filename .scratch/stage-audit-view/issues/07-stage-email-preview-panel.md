# 07 — Stage Email Preview Panel (All Stage Types)

**What to build:** An Email Preview section is added as the final section in every expanded Stage Audit panel, for all three stage types. The section renders the stage's configured `emailBodyHtml` in an inline sandboxed iframe with dynamic tokens resolved to their actual run-time values from the execution record where available, or to clearly labeled placeholder values where not (e.g. `{{buyer_name}}` → actual buyer name, or `[Buyer Name]` if unavailable). The email subject is shown above the preview as a read-only field. The aesthetic mirrors the Live Device Preview from the Workflow Email Builder — a contained frame with a light background and subtle border, not a raw code block.

**Blocked by:** 04 — Liquidation Stage Audit, 05 — Donation Stage Audit, 06 — Landfill Stage Audit

**Status:** complete

- [x] `⬤ EMAIL PREVIEW` section renders as the last section in every stage type's expanded audit panel
- [x] Email subject is shown as a read-only labeled field above the preview frame
- [x] `emailBodyHtml` is rendered in a sandboxed inline iframe (or equivalent safe container)
- [x] Liquidation tokens resolved: `{{buyer_name}}`, `{{current_stage_discount}}`, `{{inventory_table}}`, `{{response_deadline}}`
- [x] Donation tokens resolved: `{{partner_name}}`, `{{offer_expiration_time}}`, `{{inventory_table}}`
- [x] Landfill tokens resolved: `{{partner_name}}`, `{{disposal_deadline}}`, `{{inventory_table}}`
- [x] Unresolvable tokens fall back to a clearly bracketed placeholder (e.g. `[Buyer Name]`) rather than the raw token string
- [x] If no email was configured for the stage, the section shows an "No email configured for this stage" empty state
- [x] Preview frame is sized appropriately (not full viewport height) and scrollable if content overflows
