# 01: Sub-Routing, Ingestion Page Shell & Connector Transition Seam

**What to build:** An operator navigating the Ingestion workspace can click "Manage", "Connect", or the settings gear on any connector card to smoothly transition into a full-page integration management suite without side-drawer constraints. The active integration is deep-linkable and synchronized with URL query parameters (`?tab=ingestion&connector=google-sheets | zapier | doc-scanner`), preserving browser back/forward history. The full-page shell provides an institutional header, a return path (`← Back to Ingestion Pipeline`), and an inline cross-connector switcher tab bar to switch between connectors without navigating back to the parent pipeline.

**Blocked by:** None (can start immediately)

**Status:** completed

- [x] Ingestion workspace (`IngestionView.tsx`) detects `connector` query param and renders the dedicated full-page integration container when present.
- [x] Shared full-page shell includes breadcrumb return navigation (`← Back to Ingestion Pipeline`) and an inline cross-connector switcher bar (`[Google Sheets Sync]  [Zapier Webhooks]  [Image & Doc Scanner]`).
- [x] Connector cards in `IngestionHubConnectors.tsx` update their click handlers to trigger the direct full-page transition rather than opening the slide-over drawer.
- [x] Rapid CSV/Excel batch upload remains accessible in-place via the `UnifiedIngestionModal`.
- [x] Component and routing unit tests verify deep linking, cross-connector switching, and return navigation.
