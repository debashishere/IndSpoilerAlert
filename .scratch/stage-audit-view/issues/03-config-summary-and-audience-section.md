# 03 — Read-Only Stage Config Summary & Audience Section (All Stage Types)

**What to build:** Inside the expanded Stage Audit accordion panel, two sections render for every stage type. First, a **Config Summary** section showing the stage name, stage type badge (color-coded: green for Liquidation, blue/primary for Donation, amber for Landfill), execution window, and auto-execute flag — all as read-only labeled field rows. Second, an **Audience Targeting** section showing the segment or buyer list name as a header badge with a partner count, plus an expandable list of individual contact rows (Name, Email, tier badge) sourced from the `allBuyers` prop. Both sections use the LiquidationAutomationStudio visual language: small uppercased colored labels with a leading dot icon (e.g. `⬤ AUDIENCE TARGETING`), with read-only display values instead of inputs.

**Blocked by:** 02 — Stage Card Expand Affordance

**Status:** completed

- [x] Config Summary section renders with the `⬤ STAGE CONFIGURATION` label style
- [x] Stage type badge is color-coded per type (green/Liquidation, primary-blue/Donation, amber/Landfill)
- [x] Execution window is displayed using the existing `formatExecutionWindow` utility
- [x] Auto-execute flag renders as a readable badge ("Auto-Execute On" / "Manual Approval")
- [x] Audience Targeting section renders with the `⬤ AUDIENCE TARGETING` label style
- [x] Segment/list name and partner count render as a header badge
- [x] Individual contact rows (Name, Email, Tier) are expandable below the header badge
- [x] Contact rows are sourced from `allBuyers` prop, matched by buyer IDs from the stage config
- [x] Both sections render identically for Liquidation, Donation, and Landfill stage types
- [x] Section dividers (border lines) separate Config Summary, Audience, and the empty area reserved for type-specific content
