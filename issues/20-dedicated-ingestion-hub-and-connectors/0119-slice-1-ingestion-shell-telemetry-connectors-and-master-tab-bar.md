# 0119: Slice 1 - Ingestion Shell, Telemetry Bar, Connectors Workbench & Master Tab Bar

**What to build:**
Deliver the foundational master shell for `IngestionView`, establishing the Stitch enterprise layout structure. It renders:
1. Header title and subtitle matching the design.
2. The 4-card operational **Telemetry Bar** displaying Active Portfolio Value, Critical RSL (<14 Days), Liquidation Velocity, and Matched Buyer Network, dynamically computing metrics from Redux stores (`inventoryList`, `salesRecords`, `buyers`) with fallback to design values.
3. The collapsible **Dedicated Ingestion Hub & Connectors** section featuring Zapier Webhooks, Google Sheets Sync, Image & Doc Scanner, CSV / Excel Upload, and + Add Integration cards with active/collapse toggle.
4. The master **Pipeline Switcher Bar** housing the 3 tabs (`inventory`, `sales`, `buyers`) with live badges, the master utility actions (*Buyer Lists*, *+ Add Buyer*), and the master *Toggle All* control.

**Blocked by:** None (can start immediately).

**Status:** completed

- [x] `IngestionTelemetryBar` component renders 4 KPI metric cards with Material Symbols and responsive grid.
- [x] Telemetry cards hydrate dynamically from Redux stores with clean fallbacks for empty state.
- [x] `IngestionHubConnectors` renders the 5 integration cards with collapse/expand toggling.
- [x] Pipeline Switcher Bar displays active tab state and accurate live dataset counts for Inventory, Sales, and Buyers.
- [x] Header action buttons (*Buyer Lists*, *+ Add Buyer*, and *Toggle All*) are present in the bar.
- [x] Switching tabs updates the active Redux `pipelineTab` without unmounting or resetting shared state.
- [x] Unit tests verify tab switching, connector collapsing, and telemetry hydration.
