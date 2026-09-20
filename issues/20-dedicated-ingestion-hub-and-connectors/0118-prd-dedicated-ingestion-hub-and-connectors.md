# PRD: Dedicated Ingestion Hub & Connectors

## 1. Overview & Business Value
The Surplus Ingestion Pipeline is the entry gateway into Spoiler Alert's Enterprise Liquidation OS. This initiative replaces the legacy tab views with an enterprise ingestion experience designed from the Stitch design system (`docs/stitch/surplus-pipeline-dedicated-ingestion-hub.html`). It introduces real-time operational telemetry cards, multi-channel connector hubs, unified batch file intake with 3-way destination mapping, and progressive row inspection accordions across Inventory, Sales, and Buyer pipelines.

## 2. Key Architectural Decisions
- **ADR 0041**: Decoupled row selection from full page navigation. Inventory row clicks toggle an in-situ inspection drawer, and a dedicated "Open Operations Hub" CTA handles deep navigation.
- **ADR 0042**: Unified Surplus Data Ingestion Modal provides a 2-step destination & file upload flow, handing off to an in-situ Ingestion Mapping Window directly above the target pipeline table.
- **ADR 0043**: Buyer row expansion provides quick inspection of procurement officers, categories, and hubs, with a direct launcher to the full `BuyerDetailDrawer`.
- **ADR 0044**: Telemetry Bar KPIs dynamically calculate real metrics from active Redux stores with graceful Stitch design fallbacks.

## 3. High-Level Scope
1. **Telemetry Bar & Master Ingestion Shell**: 4 real-time KPI metrics and collapsible multi-source connector strip.
2. **Unified CSV / Excel Upload Modal**: Centralized modal with destination target picker (`inventory`, `sales`, `buyer`) and drag-and-drop intake.
3. **In-Situ Ingestion Mapping Window**: Reused column schema mapping interface mounting directly in the active tab above the table.
4. **Interactive Progressive Row Inspection**: Inline accordion drawers for all rows across Inventory, Sales, and Buyer pipelines.
5. **Master Global Accordion Toggle ("Toggle All")**: Synchronized batch drawer toggle across the active dataset.
6. **Preserved Integrations**: Seamless continuity for `onOpenLotHub`, `BuyerDetailDrawer`, `BuyerListManagerModal`, and regulatory compliance workflows.
