# 04: Dual-State Dynamic Connector Card and Sync Now Dispatch

**What to build:** An upgrade to the "Google Sheets Sync" connector card in the Ingestion Hub, transitioning it from a static placeholder to a live, reactive dual-state component that reflects current sync health, triggers on-demand sync dispatch, and opens the configuration drawer.

**Blocked by:** 03: Google Sheets Configuration Drawer and Handshake Mapping

**Status:** completed

- [x] Extend `ingestionSlice.ts` to manage Google Sheets sync state (`connectionStatus`, `lastSyncedAt`, `syncedLotCount`, `isSyncing`, `error`).
- [x] Implement backend endpoint `POST /api/v1/ingestion/google-sheets/sync-now` to execute an immediate on-demand synchronization pass.
- [x] Upgrade Card 2 in `IngestionHubConnectors.tsx` to toggle between State 1 (*Unconnected*: "Connect Sheets" button) and State 2 (*Connected*: emerald pulsating badge `"Active Trigger • Auto-Sync"`, live `"Last synced: Xm ago"`, and total synced lots).
- [x] Add primary action button **"Sync Now"** in State 2 triggering immediate sync with spinner animation and toast feedback.
- [x] Add secondary gear/settings icon on the card opening the `GoogleSheetsConfigDrawer` for reconfiguration.
- [x] Add unit tests verifying card state toggling, click events, Redux state binding, and on-demand sync dispatch.

