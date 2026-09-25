# 01: Move Active Portfolio Value to Insight Tab & Add Metric Tooltips

**What to build:** Relocate the "Active Portfolio Value" KPI card from the Ingestion tab to the Insight tab so it sits side-by-side with "Total Inventory Value". Add informational tooltips (an "i" icon) to both cards that explain what the metrics signify (potential revenue vs. sunk cost) on hover. The layout of both telemetry bars must adjust gracefully to handle the new card count (3 cards in Ingestion, 5 cards in Insight).

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] The `CONTEXT.md` glossary is updated with definitions for "Active Portfolio Value" and "Total Inventory Value".
- [ ] The "Active Portfolio Value" card is removed from `IngestionTelemetryBar` and the layout is adjusted to a 3-column grid.
- [ ] The "Active Portfolio Value" card is added to `InventoryListView` before the "Total Inventory Value" card, using the shared `useIngestionTelemetry` hook.
- [ ] Both cards in the Insight tab have an information icon that displays their respective definitions in a tooltip on hover.
- [ ] The Insight telemetry bar layout is updated to comfortably fit 5 cards (e.g., fluid or 5-column grid).
