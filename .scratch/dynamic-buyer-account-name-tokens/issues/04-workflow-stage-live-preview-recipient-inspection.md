# 04 — Workflow Stage Live Preview & Pre-Flight Recipient Inspection

**What to build:** Add a `"Preview Recipient Buyer"` dropdown to the stage email preview tab in `LiquidationAutomationStudio` and in the pre-flight launch audit modal, enabling sales representatives to select any buyer from the stage's target audience to inspect real-time dynamic token substitution (`{{buyer_name}}`) before launching.

**Blocked by:** #03 — Workflow Stage Template Attachment & Zero-Buyer Selection UI Restriction

**Status:** ready-for-agent

- [ ] Stage email preview includes a `"Preview Recipient Buyer"` dropdown populated with buyers matching the stage's target selection.
- [ ] Changing the selected recipient buyer instantly updates the email body/subject preview to display that buyer's company name in place of `{{buyer_name}}`.
- [ ] Pre-flight launch audit modal supports toggling preview recipients before final campaign launch.
