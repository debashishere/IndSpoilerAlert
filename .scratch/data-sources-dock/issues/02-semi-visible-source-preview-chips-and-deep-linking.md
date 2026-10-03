# 02: Interactive Semi-Visible Source Preview Chips with Live Status & Deep Linking

**What to build:** An operator looking at the Data Sources Dock can instantly see what data sources are supported via frosted, semi-visible preview chips (Google Sheets Sync, CSV / Excel Upload, Zapier Webhooks, Image & Doc Scanner). Each chip displays brand-accented category icons, status tags, and live telemetry (pulsing indicators for active Google Sheets auto-sync and live Zapier feeds). Clicking any preview chip directly transitions the operator into that specific connector view in the Integration Management Suite.

**Blocked by:** 01: Redesign Ingestion Hub into Data Sources Dock with Visual + Button

**Status:** completed

- [x] Four semi-visible preview chips are rendered alongside the `+` action button: Google Sheets, CSV / Excel Upload, Zapier Webhooks, and Image & Doc Scanner.
- [x] Chips use translucent frosted styling (`opacity-80 hover:opacity-100`) that lifts and highlights on hover.
- [x] Google Sheets chip reflects live connection state with a glowing pulse dot when `isConnected` is true and shows last synced status.
- [x] Zapier chip reflects live active feeds with a status pulse when `zapCount > 0`.
- [x] CSV / Excel Upload chip displays a batch ingress badge; Image & Doc Scanner chip displays an AI OCR badge.
- [x] Clicking any individual source chip directly invokes `onSelectConnector(connectorId)` with deep-linking to that connector's workspace in the Integration Management Suite.
- [x] Unit tests verify individual chip rendering, hover states, live pulse badges, and connector-specific click routing.

