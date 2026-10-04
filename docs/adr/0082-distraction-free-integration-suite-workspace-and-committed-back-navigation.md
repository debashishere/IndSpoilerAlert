# Distraction-Free Integration Suite Workspace and Committed Back Navigation

## Context
When navigating into the Integration Management Suite (`?tab=ingestion&connector=...`) to configure external ingress channels (Google Sheets Sync, Zapier Webhooks, Doc Scanner, CSV/Excel Batch Upload), the global top navigation bar (`GlobalNavigationBar`) previously remained visible. This allowed operators to switch to other high-level tabs (e.g., Inventory, Marketplace, Analytics) mid-configuration, risking accidental workflow abandonment. Additionally, the Suite header's return button rendered duplicate directional arrows (a Lucide `<ArrowLeft />` SVG followed by a unicode `←` character), presenting visual inconsistency.

## Decision
We establish a focused, **Distraction-Free Integration Suite Workspace**:
1. When an integration connector is active (`activeConnector` is truthy in `IngestionView` / `?connector=...`), `SupplierWorkspace` completely hides the top `GlobalNavigationBar`.
2. Operators must explicitly commit the return action via the **Single-Arrow Return Anchor** in `IngestionConnectorShell` (`<ArrowLeft className="w-4 h-4" /> Back to Ingestion Pipeline`), which cleanly resets the active connector, synchronizes browser history, returns to the Ingestion pipeline, and restores the `GlobalNavigationBar`.
3. The duplicate unicode `←` symbol in the return button is eliminated, presenting a unified, single-arrow interactive element.

## Consequences
- Prevents accidental context-switching while operators stage sensitive spreadsheet connections, API credentials, or schema mappings.
- Enforces an intentional exit workflow where operators commit the return before navigating to other application workspaces.
- Standardizes return navigation across the suite with a clean, single-arrow UI.
- Preserves full browser history (`popstate`) synchronization with seamless navbar restoration.
