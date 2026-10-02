# 02: Streamlined Google Sheets Setup Hero & Redux Seam

**What to build:** Clean up the Google Sheets Configuration Drawer by eliminating obsolete and misleading inputs (Google Workspace OAuth delegation cards and manual spreadsheet ID / URL coordinate text fields). Replace them with a prominent, focused Master Apps Script Setup Hero with a 1-click clipboard copy button, clear 3-step setup instructions, and reactive Redux state bindings to fetch and store the supplier's master script and connected sheets roster.

**Blocked by:** 01: Master Ingress Key & Dynamic Multi-Sheet Backend Seam

**Status:** completed

- [x] Obsolete Google Workspace OAuth cards (`/api/oauth/start`) and manual spreadsheet ID / URL coordinate inputs are purged from `GoogleSheetsConfigDrawer.tsx`.
- [x] Master Apps Script Setup Guide renders as the primary setup hero with active webhook endpoint URL, master ingress key, and 1-click clipboard copy action with toast/icon feedback.
- [x] Clear 3-step instructions explain: (1) Open Google Sheet > Extensions > Apps Script, (2) Paste & Save (💾), (3) Click `SpoilerAlert OS ⚡ > Sync to Platform Now`.
- [x] Local development helper callout informs operators about public webhook tunnel requirements (e.g. ngrok) when running on localhost.
- [x] Redux slice (`ingestionSlice.ts`) and API service (`googleSheetsSyncService.ts`) are extended with thunks and state to fetch the multi-sheet roster and master script.
- [x] Frontend unit tests for drawer rendering and Redux actions pass green.
