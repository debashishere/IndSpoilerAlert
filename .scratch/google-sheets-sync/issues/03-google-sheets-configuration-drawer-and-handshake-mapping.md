# 03: Google Sheets Configuration Drawer and Handshake Mapping

**What to build:** A slide-over configuration drawer in the Ingestion Tab that guides the supplier through connecting Google Sheets, fetching sample rows for column verification in the GridMapperTable, and copying their personalized Google Apps Script trigger.

**Blocked by:** 02: Google Apps Script Generator and Test Ping API

**Status:** completed

- [x] Build `GoogleSheetsConfigDrawer.tsx` slide-over component with clean light/dark theme styling adhering to platform 4px/8pt optical density standards.
- [x] Surface Google OAuth connection status, connected account email, and spreadsheet ID / worksheet tab input fields.
- [x] Provide a 1-click **"Copy Google Apps Script"** snippet box with clear step-by-step instructions for pasting into Google Sheets (*Extensions > Apps Script*).
- [x] Add an interactive **"Test Connection Ping"** button that dispatches a test handshake to the backend and renders visual confirmation with latency telemetry.
- [x] Implement an initial handshake action that fetches sample rows from the spreadsheet and mounts them into `GridMapperTable` for human-confirmed column mapping saved to `SupplierTemplate`.
- [x] Add component unit tests covering drawer opening/closing, copy-to-clipboard interactions, test ping status transitions, and column mapping handoff.
