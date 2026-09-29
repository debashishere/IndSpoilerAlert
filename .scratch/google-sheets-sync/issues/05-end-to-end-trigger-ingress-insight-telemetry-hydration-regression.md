# 05: End-to-End Trigger Ingress, Insight Telemetry Hydration and Regression Suite

**What to build:** An end-to-end integration and regression test harness verifying that sheet edits pushed via the Google Apps Script trigger correctly update the database, refresh the Ingestion lot grid, and automatically recompute Insight Hub telemetry metrics and COGS recovery analytics.

**Blocked by:** 04: Dual-State Dynamic Connector Card and Sync Now Dispatch

**Status:** completed

- [x] Create an end-to-end integration test simulating Google Apps Script webhook trigger payload pushes with both novel lots and quantity drift updates on existing lots.
- [x] Assert that inventory lots appear in the Ingestion pipeline table with appropriate FEFO badges and RSL countdowns.
- [x] Verify that live Ingestion Telemetry Bar metrics (`Active Portfolio Value`, `Critical RSL Lots`) recalculate immediately upon sheet sync completion.
- [x] Verify that Insight Hub panels (`SummaryMetrics`, `COGSRecoveryDashboard`, and `CrossPlatformOperationsPanel`) reflect newly synced lot values and clearance velocity.
- [x] Verify error handling and graceful degradation when the webhook receives malformed rows, duplicate SKUs with divergent dates, or missing required headers.
- [x] Run full test suites across frontend and backend to guarantee zero regressions.
