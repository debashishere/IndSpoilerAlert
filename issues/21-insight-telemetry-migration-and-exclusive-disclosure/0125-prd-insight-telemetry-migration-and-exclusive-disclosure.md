# PRD: Insight Telemetry Migration and Exclusive Info Disclosure

## Overview
Migrate the operational telemetry cards (`Critical RSL (<14 Days)`, `Liquidation Velocity`, `Matched Buyer Network`) from the Ingestion tab to the Insight tab (`InventoryListView.tsx`). Consolidate these with the existing valuation metrics into a clean, 2-tier 7-element layout. Eliminate decorative icons across cards to achieve a minimalist design, and coordinate interactive "i" information description popovers so only one card is expanded at a time with outside-click dismissal.

## Goals & Objectives
1. **Consolidated Operational View**: Unify all 7 commercial, risk, and velocity metrics in a dedicated 2-tier telemetry grid on the Insight tab.
2. **Eliminate Metric Redundancy**: Replace the legacy `<10 Days` expiration card with the canonical `Critical RSL (<14 Days)` metric.
3. **Ergonomic Information Disclosure**: Enforce single-active exclusivity across "i" button description cards with outside-click and close-button dismissal.
4. **Minimalist Visual Polish**: Strip decorative status icons from cards, focusing visual attention on typography and data values.
5. **Clean Ingestion Separation**: Remove the telemetry bar from `IngestionView.tsx`, freeing vertical headspace for connectors and progressive pipeline workbenches.

## Slices Breakdown
- **0126 (Slice 1)**: Minimalist InsightCard with Controlled Exclusive Info Disclosure
- **0127 (Slice 2)**: Insight Hub Two-Tier Telemetry Grid with Single-Active Disclosure
- **0128 (Slice 3)**: Ingestion Tab Telemetry Retirement and Cross-Tab Regression Verification
