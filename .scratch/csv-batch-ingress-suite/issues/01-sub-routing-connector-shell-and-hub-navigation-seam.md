# 01: Sub-Routing, Connector Shell 4th Tab & Hub Navigation Seam

**What to build:** An operator navigating the Ingestion workspace can click the "CSV / Excel Upload" card in the Ingestion Hub to smoothly transition into the full-page Integration Management Suite (`?tab=ingestion&connector=csv-upload`). The cross-connector switcher bar displays a 4th tab ("CSV / Excel Upload") with the `upload_file` icon alongside Google Sheets, Zapier, and Doc Scanner. Browser history (back/forward) and URL query parameters remain synchronized, and the return path (`← Back to Ingestion Pipeline`) cleanly resets the active connector. Renders the foundational container for `CsvExcelIntegrationView`.

**Blocked by:** None (can start immediately)

**Status:** completed

- [x] Extend `IngestionConnectorId` in `ingestion.types.ts` to include `'csv-upload'`.
- [x] Add the 4th tab definition to `CONNECTOR_TABS` in `IngestionConnectorShell.tsx` with ID `'csv-upload'`, label `'CSV / Excel Upload'`, and icon symbol `'upload_file'`.
- [x] Update `parseConnectorParam` and router rendering in `IngestionView.tsx` to mount `CsvExcelIntegrationView` when `connector === 'csv-upload'`.
- [x] Update the CSV / Excel Upload card in `IngestionHubConnectors.tsx` to trigger `onSelectConnector('csv-upload')`.
- [x] Component and unit tests verify deep linking to `?tab=ingestion&connector=csv-upload`, cross-connector tab switching, and return navigation.
