# 02: Full-Page Google Sheets Telemetry, Credentials & Roster

**What to build:** An operator configuring or inspecting Google Sheets synchronization can open a spacious full-page view featuring Quadrants 1, 2, and 3: 1) live connection and throughput telemetry (connection status pill, latency, last sync, lot counts, and manual Sync Now trigger), 2) master ingress key and webhook endpoint credentials with an expandable Google Apps Script code viewer and copy action, and 3) the live Connected Sheets Roster table (spreadsheet title, tab, lot counts, status, per-sheet sync triggers, and disconnect actions).

**Blocked by:** 01: Sub-Routing, Ingestion Page Shell & Connector Transition Seam

**Status:** completed

- [x] Delivers the full-page Google Sheets view housing Quadrants 1, 2, and 3.
- [x] Quadrant 1 renders connection status pill (`Active Trigger`, `Syncing`, `Idle`), ping latency ms, last sync timestamp, total synchronized lots count, and "Sync Now" global action.
- [x] Quadrant 2 renders Ingress Webhook URL, supplier `X-Ingress-Key`, and expandable Google Apps Script code block with copy action.
- [x] Quadrant 3 renders the interactive Connected Sheets Roster table with per-sheet sync triggers, status badges, and sheet disconnection.
- [x] Frontend unit and component tests verify rendering, credentials copy, ping testing, and roster interactions.
