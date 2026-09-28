# PRD: Insight Sales & Clearing Live Analytics

## Overview
Connect all charts, telemetry indicators, and fulfillment leaderboards in the Insight hub's **Sales & Clearing** subtab (`SalesDataView.tsx`) to live backend data, completely replacing all mock and placeholder data. Implement a high-performance backend aggregation endpoint (`GET /api/analytics/sales`) backed by MongoDB pipelines across `Sale`, `InventoryLot`, `ProductMaster`, and `Buyer` models with Redis caching. Ensure authentic period-over-period (PoP) revenue velocity, dynamic multi-timeframe trajectory curves, COGS recovery yields, channel revenue shares, RSL decay scatter matrices with least-squares regression trendlines, and zero-state baselines without synthetic fallback points.

## Goals & Objectives
1. **Zero Mock or Placeholder Data**: Eliminate every hardcoded array, static SVG bezier curve, and synthetic delta badge from `SalesDataView.tsx`.
2. **Dedicated Server-Side Aggregation**: Implement `GET /api/analytics/sales` in `analyticsController` and `analyticsService` with supplier scoping, query filters (`timeframe`, `category`, `warehouse`), and Redis caching.
3. **Dynamic Visual Charts**: Replace static SVG geometries with dynamic path coordinates generated directly from live time-bucket coordinates, channel percentages, and RSL decay points.
4. **Authentic Velocity & Zero-State**: Compute dynamic period-over-period revenue growth (+/-%) and render graceful mathematical zero baselines (`$0.00`, flat coordinate axes, contextual in-situ guidance) when no transactions exist.
5. **Decoupled Redux State Seam**: Centralize analytical intelligence in `coreSlice` (`salesAnalytics`), keeping raw tabular ingestion payloads (`ingestionSlice`) cleanly separated.

## Slices Breakdown
- **0130 (Slice 1)**: Dedicated Sales Analytics Backend Seam & Telemetry KPI Bar
- **0131 (Slice 2)**: Dynamic Revenue & Volume Trajectory with Multi-Timeframe Filtering
- **0132 (Slice 3)**: COGS Recovery Yield & Sales Channel Revenue Distribution Charts
- **0133 (Slice 4)**: RSL Decay Scatter Matrix & Price Realization Trendline
- **0134 (Slice 5)**: Sales Channel & Fulfillment Leaderboards and Regression Suite
