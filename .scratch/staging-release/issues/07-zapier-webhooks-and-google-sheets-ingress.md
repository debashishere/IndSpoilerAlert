# 07: Ingestion Connectors — Zapier Webhooks & Google Sheets OAuth Ingress (UI-03, UI-04)

**What to build:** Add configuration modal for Zapier webhook endpoints generating unique supplier ingress URLs (`/api/v1/ingestion/zapier`) and wire Google OAuth service account background polling for automated Google Sheets ingestion.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Build webhook configuration popover drawer in `IngestionHubConnectors.tsx` for generating supplier ingress URLs.
- [ ] Implement backend route `/api/v1/ingestion/zapier` to accept incoming external payloads.
- [ ] Configure Google OAuth service account flow for background spreadsheet hydration from Google Sheets.
