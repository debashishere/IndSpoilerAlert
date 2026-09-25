# 02: Add Cross-Platform Operations subtab to Insight Hub

**What to build:** A 4th subtab ("Cross-Platform Operations") in the Insight Hub that gives leadership a single-pane-of-glass view of operational telemetry aggregated from across the platform — without navigating to Ingestion, Inbox, Workflows, or Logistics individually.

The panel renders 4 institutional telemetry summary cards:

1. **Ingestion Pipeline Velocity** — active portfolio value, distressed COGS %, critical RSL lot count, liquidation velocity (sourced from the same data `useIngestionTelemetry` computes).
2. **Buyer Comms Engagement** — active conversation count, outbound dispatch volume, engagement rate, response velocity.
3. **Workflow Campaign Yield** — active/stopped/draft campaign counts, total lots and cases in scope, execution success rate.
4. **Cold Chain & Compliance** — temperature compliance readings, FSMA 204 audit status, dock scheduling SLA (placeholder with "Coming Soon" badge since `SHOW_FREIGHT_LOGISTICS` is still `false`).

Each card is read-only — an aggregate snapshot, not an interactive workbench. Cards link contextually to their source surfaces (e.g. clicking Ingestion card navigates to the Ingestion tab).

The subtab switcher bar now shows all 4 final pills: "Recovery & Sustainability", "Current Bidding Data", "Sales & Clearing", "Cross-Platform Operations".

**Blocked by:** 01: Replace static Insight charts with live Recovery & Sustainability panel

**Status:** done

- [x] `'operations'` added to the subtab state type in `InventoryListView`
- [x] 4th pill "Cross-Platform Operations" added to the switcher bar with appropriate icon and count badge
- [x] Operations panel renders 4 telemetry summary cards with institutional styling matching the Insight Hub design language
- [x] Ingestion, Comms, and Workflow cards pull real aggregate data from existing Redux state or hooks
- [x] Cold Chain card renders as a graceful "Coming Soon" placeholder (SHOW_FREIGHT_LOGISTICS is still false)
- [x] New test verifies the Operations subtab renders all 4 card titles when selected
- [x] Full Vitest suite passes with zero regressions
