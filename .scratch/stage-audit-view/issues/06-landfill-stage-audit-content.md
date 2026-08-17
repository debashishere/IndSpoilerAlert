# 06 — Landfill Stage Audit: Disposal Deadline, Allocated Lots & Pickup Status

**What to build:** For Landfill-type stages, the expanded audit panel gains three sections below Config Summary and Audience — replacing pricing and bids entirely. A **Disposal & Removal Deadline** section shows the configured cutoff date alongside a status label: "Scheduled" (deadline is upcoming), "Overdue" (deadline has passed without confirmed pickup), or "Completed" (pickup confirmed). An **Allocated Lots** section lists the lot IDs and case quantities assigned for disposal. A **Pickup / Execution Status** section shows a final outcome badge (Pickup Confirmed / Pending / Overdue) and the disposal partner's name if confirmed.

**Blocked by:** 03 — Read-Only Stage Config Summary & Audience Section

**Status:** complete

- [x] `⬤ DISPOSAL & REMOVAL DEADLINE` section renders the configured `disposalDeadline` date in a human-readable format
- [x] Status label adapts: "Scheduled" if deadline is future, "Overdue" (amber) if deadline is past, "Completed" (green) if pickup confirmed
- [x] `⬤ ALLOCATED LOTS` section lists lot identifiers and case counts assigned to this landfill stage
- [x] Allocated Lots table supports pagination with page size selector (options: 5, 10, 20, 30 max) and page navigation controls
- [x] `⬤ PICKUP / EXECUTION STATUS` section renders an outcome badge: Pickup Confirmed (green) / Pending (blue) / Overdue (amber/red)
- [x] Confirmed pickup shows the disposal partner's name alongside the badge
- [x] No Pricing & Timing section and no Bids & Offers Ledger render for Landfill stages
- [x] Sections only render for Landfill-type stages
