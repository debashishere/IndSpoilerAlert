# PRD: Insight Cross-Platform Operations Live Analytics

## Overview
Connect all operational telemetry indicators, SLA compliance gauges, and visual trendline charts in the Insight hub's **Cross-Platform Operations** subtab (`CrossPlatformOperationsPanel.tsx`) to authentic live backend data, completely replacing all mock and placeholder data (`18 Outbound`, `94.2%`, `< 2.4 Hours`, `12 Runs`, `98.5%`). Implement a dedicated, high-performance server-side aggregation endpoint (`GET /api/analytics/operations`) querying `InventoryLot`, `Buyer`, `EmailDispatchLog`/`EmailThread`, `LiquidationAutomation`/`AutomationRun`, and `ColdChainLog`/`Shipment` with multi-timeframe scoping (`7D`, `30D`, `90D`, `YTD`) and Redis caching. Deliver a responsive SVG dual-chart visual workbench featuring a **Cross-Service Pipeline Velocity Trendline** and a **Platform SLA & Operational Yield Distribution** chart, maintaining strict mathematical zero baselines without synthetic fallback points.

## Goals & Objectives
1. **Zero Mock or Placeholder Data**: Eliminate every hardcoded number, fallback fallback constant, and static string (`|| 18`, `94.2%`, `< 2.4 Hours`, `|| 12`, `98.5%`) from `CrossPlatformOperationsPanel.tsx`.
2. **Dedicated Server-Side Aggregation**: Implement `GET /api/analytics/operations` in `analyticsController` and `analyticsService` with supplier scoping, query filters (`timeframe`, `supplierId`), and Redis caching.
3. **Multi-Timeframe Controls**: Provide an institutional pill-style timeframe selector (`7D`, `30D` [default], `90D`, `YTD`) that dynamically scopes all 4 operational metric cards and coordinated charts.
4. **Dynamic Dual-Chart Visual Workbench**:
   - **Cross-Service Pipeline Velocity Trendline**: Responsive multi-series SVG area/line chart tracking daily/weekly throughput across Ingestion lots, Workflow execution runs, and Buyer dispatch volume.
   - **Platform SLA & Operational Yield Distribution**: Comparative visual gauges and response turnaround distributions tracking real Workflow completion yield %, Buyer response velocity turnaround buckets, and Cold-Chain HACCP dock compliance SLA.
5. **Authentic Mathematical Zero-State**: Render true zero baselines (`0 Lots`, `0 Outbound`, `0.0 hrs`, `0%`, flat coordinate axes, and contextual guidance) when no records exist.
6. **Decoupled Redux State Seam**: Centralize operational intelligence in `coreSlice` (`operationsAnalytics`, `operationsAnalyticsLoading`, `fetchOperationsAnalyticsThunk`).

## Slices Breakdown
- **0136 (Slice 1)**: Dedicated Operations Analytics Backend Seam & Real-Time Operational Telemetry Cards
- **0137 (Slice 2)**: Cross-Service Pipeline Velocity & Throughput Trendline Chart
- **0138 (Slice 3)**: Platform SLA & Operational Yield Distribution Chart
- **0139 (Slice 4)**: Cross-Platform Operations End-to-End Regression Suite & Zero-Mock Verification
