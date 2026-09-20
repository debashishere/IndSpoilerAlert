# Dynamic Ingestion Telemetry and Connector Action Matrix

## Context
The redesigned Ingestion Tab features a top Telemetry Bar with 4 enterprise KPIs (Active Portfolio Value, Critical RSL <14 Days, Liquidation Velocity, Matched Buyer Network) and an Ingestion Hub & Connectors strip with 5 multi-channel integration cards.

## Decision
1. **Telemetry Bar Hydration**: Dynamically calculate operational KPI metrics from active Redux stores (`inventoryList`, `salesRecords`, `buyers`), providing graceful design fallbacks when datasets are empty.
2. **Connector Execution**: 
   - "CSV / Excel Upload" acts as the primary active connector, opening the Unified Surplus Data Ingestion Modal with 3-way destination routing (`Inventory`, `Sales`, `Buyer`).
   - "Zapier Webhooks", "Google Sheets Sync", "Image & Doc Scanner", and "Add Integration" deliver informative interactive feedback (webhook endpoints, OAuth prompts, OCR documentation) while maintaining UI continuity.

## Rationale
Ensures the Ingestion Hub operates with real production data when populated while remaining visually complete and resilient in demo/fresh environments.
