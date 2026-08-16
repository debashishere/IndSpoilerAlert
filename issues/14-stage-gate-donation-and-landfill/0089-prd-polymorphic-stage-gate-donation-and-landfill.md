# 0089 — PRD: Polymorphic Stage-Gate Escalation Timeline for Donation & Landfill

**What to build:**
Enable suppliers using the Liquidation Automation Studio to configure and escalate inventory into dedicated **Donation** (food banks, charities) and **Landfill / Bio-waste Disposal** stages directly within the Stage-Gate Escalation Timeline, reusing existing buyer/partner registry components and providing granular lot subsetting.

**Blocked by:** None — can start immediately.

**Status:** done

- [x] Stage Type switcher (`[ Liquidation | Donate | Landfill ]`) replacing static token indicator on stage title bars.
- [x] Dedicated timing panels: Offer Expiration Window for Donation, Disposal & Removal Deadline date picker for Landfill.
- [x] Granular per-stage inventory allocation (`allocatedLotIds?: string[]`) to partition master lot pool across distinct recipients.
- [x] Context-aware stage email defaults and dynamic token resolution (`{{current_stage_discount}}`, `{{expiry_hours}}`, `{{disposal_deadline}}`, `{{inventory_table}}`).
- [x] Stage-type validation guardrails enforcing required fields per stage type before saving/launching workflows.
