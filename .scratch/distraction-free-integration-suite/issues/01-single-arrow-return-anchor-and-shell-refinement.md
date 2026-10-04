# 01: Single-Arrow Return Anchor & Ingestion Connector Shell Refinement

**What to build:** An operator navigating inside any view of the Integration Management Suite (Google Sheets, Zapier, Doc Scanner, CSV/Excel) sees a clean, modern single-arrow return button ("Back to Ingestion Pipeline" with a single SVG arrow icon) instead of the previous double-arrow presentation (`<ArrowLeft> ←`). Clicking this button cleanly triggers the return path, resetting the active connector and URL parameters to transition back to the main Ingestion Pipeline table.

**Blocked by:** None (can start immediately)

**Status:** complete

- [x] `IngestionConnectorShell` return button renders a single directional SVG arrow without duplicate unicode arrow glyphs (`←`).
- [x] The return button text cleanly displays `Back to Ingestion Pipeline` with high-density, accessible styling.
- [x] Clicking the return button invokes `onBack`, successfully clearing the active connector and target search parameters.
- [x] Unit and component test suites in `IngestionConnectorShell.test.tsx` and `DataSourcesDock.test.tsx` verify the single-arrow return UI and back navigation interactions.
