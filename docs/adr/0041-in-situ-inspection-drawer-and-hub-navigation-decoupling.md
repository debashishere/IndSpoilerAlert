# In-Situ Inspection Drawer and Lot Operations Hub Navigation Decoupling

## Context
Previously, clicking anywhere on an inventory lot row in `InventoryTable` immediately triggered `onOpenLotHub(lot)`, navigating the user away from the Ingestion pipeline to the Lot Operations Hub. The new enterprise design introduces progressive disclosure via expandable row inspection workbenches across all three pipelines (Inventory, Sales, and Buyers).

## Decision
We decouple row selection from page navigation:
1. Clicking a lot row expands or collapses the inline **Progressive Row Inspection Drawer** directly underneath the row, surfacing cold-chain telemetry, FEFO lifecycle milestones, valuation margins, and batch operations.
2. Full navigation to the **Lot Operations Hub** (`onOpenLotHub(lot)`) is housed as a dedicated, explicit action button inside the expanded drawer's batch operations block, preserving in-situ workflow continuity while retaining direct access to deeper lot management.

## Rationale
This prevents unwanted context-switching and jarring page navigation when users simply want to inspect SKU telemetry or FEFO shelf-life metrics in the pipeline overview.
