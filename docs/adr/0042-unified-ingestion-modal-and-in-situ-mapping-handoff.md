# Unified Ingestion Modal and In-Situ Mapping Handoff

## Context
Data ingestion was previously split across three separate per-tab upload dropzones with bespoke file inputs and modals. The new design consolidates batch file entry into a Unified Surplus Data Ingestion Modal located within the Dedicated Ingestion Hub & Connectors.

## Decision
1. When a user selects a destination pipeline (`Inventory Data`, `Sales Data`, or `Buyer Data`) and submits a CSV or Excel spreadsheet via the Unified Surplus Data Ingestion Modal, the modal dismisses immediately.
2. The UI automatically transitions the active tab to the chosen destination pipeline.
3. The parsed spreadsheet column schema and raw preview rows are mounted in-situ as the **Ingestion Mapping Window** directly above that pipeline's table.
4. Once the user reviews column mappings and clicks "Confirm & Import", the mapping window closes, committing records to Redux and refreshing the dataset.

## Rationale
This avoids cramming large multi-column mapping grids inside constrained modal overlays, provides maximum horizontal viewing space for raw data validation, and keeps the user anchored directly within the target pipeline registry.
