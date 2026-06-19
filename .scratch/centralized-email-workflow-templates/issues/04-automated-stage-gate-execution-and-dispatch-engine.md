# 04 — Automated Stage-Gate Workflow Execution & Dispatch Engine

**What to build:** Ensures end-to-end stage-gate liquidation execution (`liquidationController.ts`, `emailService.ts`) resolves attached `templateId` references, compiles dynamic headers and itemized lot tables for targeted buyer segments, and records email dispatch audit logs.

**Blocked by:** 03 — Workflow Studio Centralized Template Attachment & Live Device Viewport

**Status:** ready-for-agent

- [ ] Stage-gate workflow execution resolves attached `templateId` dynamically.
- [ ] Itemized lot tables and buyer custom variables compile cleanly into final dispatched email HTML.
- [ ] Email dispatch logs record successful campaign delivery to targeted buyers.
