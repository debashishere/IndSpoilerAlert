# ADR 0081: Multi-Pipeline Document & Image Scanner Integration Suite

## Status
Accepted

## Context
Warehouse operators frequently receive physical and digital manifests, bills of lading, and paper invoices in various unstructured formats (PDF, JPG, PNG). Previously, the Image & Doc Scanner workbench (`DocScannerIntegrationView.tsx`) was an isolated, single-pipeline inventory scanner operating strictly in template configuration mode. This caused two primary friction points:
1. Manifests and records destined for the Sales Clearing pipeline or the Buyer Directory could not be ingested through the document scanner without manual re-entry or external conversion.
2. The scanner lacked an in-situ commit handshake: scanned tables had to be saved only as templates, requiring operators to hop between different screens to actually commit records into the database.

## Decision
We expand the Image & Doc Scanner into a polymorphic, multi-pipeline ingress suite conforming to the canonical Four-Quadrant architecture (ADR 0071):
1. **Quadrant 1 (Header & Health Telemetry)**: Displays real-time operational status, extraction engine latency, supported document formats, and the active destination pipeline target badge.
2. **Quadrant 2 (Multi-Pipeline Target Intake & AI OCR Extraction)**:
   - Surfaces a 3-card Destination Pipeline Target selector (`inventory` | `sales` | `buyers`) with dedicated icons and descriptions.
   - Accepts an `initialTarget` prop and browser URL `?target=` parameter for seamless deep-linking.
   - Dropzone accepts PDF manifests and high-resolution image formats (PNG, JPG, JPEG) up to 50MB.
   - Dynamically dispatches OCR extraction to the pipeline-specific backend thunk (`uploadInventoryThunk`, `uploadSalesThunk`, or `uploadBuyerThunk`).
3. **Quadrant 3 (Scanned Documents Roster & Lineage)**:
   - Tracks document lineage with distinct pipeline target badges (blue for Inventory, emerald for Sales, purple for Buyers).
   - Selecting "Map Schema" / "Re-stage" auto-switches the active workbench target and hydrates the corresponding Redux slice (`inventoryParsedResult`, `salesParsedResult`, or `buyerParsedResult`).
4. **Quadrant 4 (In-Situ Schema Field Mapper & Commit Handshake)**:
   - Binds `GridMapperTable` in `mode="import"` matching the active pipeline target.
   - Direct database commit handshake displays an emerald success completion banner with imported record count and generated record IDs.
   - Provides CTAs to "Scan Another Document" (resetting staging state) or "View in Pipeline Table →" (navigating to the target pipeline view).

## Consequences
### Positive
- **Unified Operator Flow**: Warehouse staff can ingest inventory manifests, sales clearing logs, and buyer intake lists from a single interface.
- **Idempotent Commit Handshake**: Direct database import eliminates intermediate screen hopping.
- **Lineage Transparency**: Every parsed document preserves its intended target pipeline.

### Negative / Trade-offs
- Multiple upload thunks must be maintained in sync with backend schema endpoints.
- 50MB file size limit and OCR processing latency require responsive loading states and inline error handling.
