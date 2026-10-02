# 03: Live Connected Sheets Roster & Management Actions

**What to build:** An interactive Connected Sheets Roster table within the Google Sheets Configuration Drawer. The roster renders every actively syncing spreadsheet for the supplier, displaying the spreadsheet identifier/name, worksheet tab, lot count, relative sync time, and live health status badge (`Live`, `Syncing`, `Error`). Operators can trigger on-demand sync passes or disconnect individual spreadsheets directly from their row action menu.

**Blocked by:** 02: Streamlined Google Sheets Setup Hero & Redux Seam

**Status:** completed

- [x] Connected Sheets Roster table renders within `GoogleSheetsConfigDrawer.tsx` beneath the setup hero.
- [x] Empty state renders friendly onboarding instructions when no sheets are yet connected for the supplier.
- [x] Each connected sheet row displays: Spreadsheet ID/Title, Worksheet Tab, Synced Lot Count, Last Synced timestamp, and Status Badge (`Live` / `Syncing` / `Error`).
- [x] Disconnect action removes the spreadsheet from the roster via Redux thunk and backend `DELETE` endpoint with confirmation prompt.
- [x] Telemetry feedback and error banners surface if a sheet's sync reports validation failures or rate limit issues.
- [x] Integration tests verify roster rendering, empty states, and disconnect interactions.

