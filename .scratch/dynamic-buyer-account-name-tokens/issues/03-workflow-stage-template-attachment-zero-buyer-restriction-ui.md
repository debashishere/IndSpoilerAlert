# 03 — Workflow Stage Template Attachment & Zero-Buyer Selection UI Restriction

**What to build:** In `LiquidationAutomationStudio`, allow attaching a saved email template to a workflow stage, automatically binding embedded `{{buyer_name}}` token chips to that stage's buyer selection dropdown (`buyerSegment` or `customBuyers`), and displaying a blocking UI error banner whenever an empty buyer segment or list is selected.

**Blocked by:** #01 — Backend Dynamic Compiler, Zero-Buyer Guardrail & Recipient Audit Log, #02 — Standalone Template Editor "Buyer Account Name" Token Chip

**Status:** completed

- [x] Attaching a saved email template to a workflow stage automatically binds embedded `{{buyer_name}}` tokens to the stage's target buyer selection.
- [x] Selecting a buyer segment or custom list with 0 buyers displays an immediate blocking UI error message.
- [x] Saving or launching a workflow is restricted until at least 1 valid buyer is attached to each stage.
