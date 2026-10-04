# Tabbed Compact Ingress Workbench and Deferred Schema Mapper

## Context
In the Full-Page Integration Management Suite, the `CSV & Excel Batch Ingress Suite` and `Image & Doc Scanner` workbenches previously stacked all four quadrants vertically on a single page (Header & Telemetry, Destination Target & Dropzone, Batch History Roster, and In-Situ Schema Field Mapper). This created severe vertical viewport congestion (>1500px scrolling height) and rendered the Schema Mapper by default before any source file was selected or uploaded. Furthermore, data type selection cards and dropzone containers were oversized with repetitive badge clutter.

## Decision
1. **Two-Tier Dedicated Subtabs**: Each ingress workbench features dedicated subtabs—`New Upload` (or `New Scan`) and `History`—decoupling active file ingestion from historical batch audit logs.
2. **Compact Vertical Ingress Rhythm**: The Data Type selector and Upload Dropzone are retained in a dedicated stacked vertical layout (no side-by-side split) but resized into sleek, ergonomic micro-containers (`h-11` target buttons, compact drag-and-drop box) conforming to the `/ux-v1` 4px/8pt grid.
3. **Deferred Schema Mapper Lifecycle**: The In-Situ Schema Field Mapper is completely hidden by default until a file is selected and parsed, or until an operator clicks `Re-stage` from the `History` subtab.
4. **Distraction-Free Viewport Economy**: Operators configure targets, drop files, and execute uploads within a single compact viewport without excessive scrolling.

## Consequences
- Eliminates visual clutter and vertical scroll fatigue in batch and document ingress workflows.
- Prevents premature schema mapping confusion by ensuring the mapper is only displayed when parsed column data is staged.
- Preserves full audit traceability via the dedicated `History` subtab with instant one-click re-staging.
