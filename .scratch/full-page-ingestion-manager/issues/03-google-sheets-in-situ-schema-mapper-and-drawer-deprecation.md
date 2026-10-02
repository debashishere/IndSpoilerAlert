# 03: Google Sheets In-Situ Schema Mapper & Drawer Deprecation

**What to build:** An operator inspecting a connected spreadsheet can click "Edit Mapping" in the Connected Sheets Roster to open an in-situ schema field mapper workbench (`GridMapperTable`) directly on the full page. The operator can preview sheet sample rows, customize column bindings per sheet, and save templates with real-time feedback. Retires the legacy slide-over `GoogleSheetsConfigDrawer` completely from the codebase.

**Blocked by:** 02: Full-Page Google Sheets Telemetry, Credentials & Roster

**Status:** completed

- [x] Delivers Quadrant 4 in the full-page Google Sheets view: in-situ schema field mapping interface (`GridMapperTable`) for per-sheet template configuration.
- [x] Connects sample row hydration and save mapping actions (`saveGoogleSheetsMappingThunk`, `updateInventoryMapping`) within the full-page layout.
- [x] Deprecates and removes `GoogleSheetsConfigDrawer.tsx` references across the Ingestion workspace.
- [x] Frontend unit and component tests verify mapping preview, column reassignment, and save operations.
