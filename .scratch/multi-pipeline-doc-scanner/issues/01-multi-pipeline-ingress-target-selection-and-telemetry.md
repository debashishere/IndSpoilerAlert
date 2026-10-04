# 01: Multi-Pipeline Ingress Target Selection and Telemetry

**What to build:** An operator entering the Image & Doc Scanner workbench can select an upstream destination pipeline target (Inventory Data, Sales Data, or Buyer Data) before staging a file. The active target updates in the health telemetry header in real-time, matching the standard CSV/Excel Ingress Suite, and honors initial target context passed from parent views or URL query parameters.

**Blocked by:** None (can start immediately)

**Status:** completed

- [x] Quadrant 2 renders a 3-card Destination Pipeline Target selector for Inventory, Sales, and Buyer data with icons, descriptions, and radio controls.
- [x] Clicking any target card updates the active target state and reflects in Quadrant 1's "Active Pipeline Target" telemetry card.
- [x] Accepts `initialTarget` via props and URL parameters to pre-select the active target when navigating from specific pipelines.
- [x] Unit tests verify default target initialization, prop overrides, and interactive switching across all 3 pipeline targets.
