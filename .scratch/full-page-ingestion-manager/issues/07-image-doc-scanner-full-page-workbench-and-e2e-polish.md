# 07: Image & Doc Scanner Full-Page Workbench & E2E Polish

**What to build:** An operator can open and use the Image & Doc Scanner within the unified 4-quadrant full-page architecture (OCR upload dropzone, scanned documents roster, and extracted column field mapping). The entire full-page connector suite is polished across light and dark themes (honoring institutional styling and 4px/8pt optical density standards), and end-to-end integration tests verify smooth transitions between connector cards, deep-linked URLs, cross-connector tabs, and the rapid CSV modal.

**Blocked by:** 01: Sub-Routing, Ingestion Page Shell & Connector Transition Seam, 03: Google Sheets In-Situ Schema Mapper & Drawer Deprecation, 06: Zapier In-Situ Schema Mapper & Live Payload Audit Log

**Status:** completed

- [x] Delivers the full-page Image & Doc Scanner workbench adhering to the 4-quadrant standard.
- [x] Connectors switcher bar allows seamless switching between `Google Sheets Sync`, `Zapier Webhooks`, and `Image & Doc Scanner`.
- [x] Full multi-theme support (light and dark mode) matching the platform's institutional design tokens.
- [x] All connector cards in `IngestionHubConnectors.tsx` consistently reflect operational health and navigate to their respective full-page suites.
- [x] End-to-end integration tests verify switching between all connectors, URL query parameter updates, browser back/forward buttons, and rapid CSV modal upload.
