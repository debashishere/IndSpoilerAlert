# ADR 0028: Relocate Inventory & Buyer Data Lists to Ingestion Pipeline & Transition Inventory Tab to Charts

## Status
Accepted

## Context
Previously, raw data table lists—including the Inventory Data List and Buyer Data List—were accessible across both the Inventory Tab (`/inventory`) and the Surplus Ingestion Pipeline (`/ingestion`). Displaying raw data tables in both views created interface duplication, redundancy, and confusion regarding where data ingestion vs. operational analytics occurred.

Furthermore, supply chain executives and sales managers using the Inventory Tab require high-level visual decision intelligence, risk trajectories, and performance metrics rather than raw spreadsheet table grids.

## Decision
1. **Centralize Raw Data Lists in Ingestion Pipeline**: Relocate all raw data table lists—specifically the **Inventory Data List** (`InventoryRegistryPanel`) and **Buyer Data List** (`BuyerRegistryPanel`)—exclusively to the **Surplus Ingestion Pipeline** (`IngestionView`). The Ingestion Pipeline is the single authoritative workspace for uploading, mapping, validating, and managing raw inventory, sales, and buyer registry data.
2. **Transition Inventory Tab to Visual Analytics Charts**: Replace the raw Inventory Data list table in the Inventory Tab (`InventoryListView`) with a visual analytics dashboard consisting of high-impact visual performance charts (COGS Expiration Risk Trajectory, RSL & Category Breakdown, Landfill Diversion Velocity, and Buyer Bidding Heatmap).
3. **Mark Advanced Interactive Charts as "Coming Soon"**: Render visual placeholder charts in the Inventory Tab with prominent **"Coming Soon"** badges and banners, signaling the upcoming release of real-time AI yield forecasting, dynamic RSL trendlines, and interactive data filtering.

## Consequences
- **Architectural Clarity**: Establishes a strict separation of concerns—Ingestion Pipeline handles raw data imports and entity list management, while the Inventory Tab focuses on high-level operational decision intelligence and visual analytics.
- **Improved UX**: Eliminates redundant table controls and provides users with immediate visual insights and upcoming chart previews.
