# 02: Cross-Service Pipeline Velocity & Throughput Trendline Chart

**What to build:** Users viewing Insight → Cross-Platform Operations see a responsive, multi-series SVG visual trendline charting daily or weekly historical throughput across Ingested lots, Workflow execution runs, and Outbound buyer dispatches. Users can hover over points to inspect exact counts and toggle series visibility in an interactive legend, with authentic flat-zero baseline rendering when empty.

**Blocked by:** 01: Dedicated Operations Analytics Backend Seam & Real-Time Operational Telemetry Cards

**Status:** completed

- [x] Extend `GET /api/analytics/operations` to return time-bucketed coordinate points for the active timeframe window.
- [x] Build and render the responsive SVG `CrossServicePipelineVelocityChart` in `CrossPlatformOperationsPanel.tsx` beneath the KPI cards.
- [x] Plot three coordinated curves with hover tooltips and dynamic scaling: Ingestion Lots (Blue), Workflow Runs (Violet), and Buyer Dispatches (Emerald).
- [x] Provide interactive legend controls to toggle channel visibility.
- [x] Render flat-zero baseline axes and guidance when no events exist in the active timeframe.
- [x] Pass component tests for SVG path rendering and timeframe updates.
