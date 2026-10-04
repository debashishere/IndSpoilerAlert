# 03: Scanned Documents Roster Target Lineage and Re-staging

**What to build:** The Scanned Documents Roster in Quadrant 3 itemizes historical and newly parsed document items alongside their designated pipeline target (`Inventory Data`, `Sales Data`, or `Buyer Data`) using distinct colored status badges. Selecting any document via "Map Schema" / "Re-stage" auto-switches the workbench's active target and loads its extracted tabular grid and suggested mappings into the corresponding Redux slice.

**Blocked by:** 02: Multi-Pipeline OCR Upload Dispatch and Image Ingress

**Status:** completed

- [x] Scanned document items store their `target` (`inventory` | `sales` | `buyers`) in state.
- [x] Quadrant 3 table renders a "Target" column with distinct colored status badges for Inventory (blue), Sales (emerald), and Buyers (purple).
- [x] Clicking "Map Schema" on a document row switches the workbench active target to that document's target.
- [x] Loads the selected document's parsed grid, headers, and suggested mappings into `setInventoryParsedResult`, `setSalesParsedResult`, or `setBuyerParsedResult` accordingly.
- [x] Unit tests verify target switching and Redux parsed result hydration upon re-staging historical roster items.

