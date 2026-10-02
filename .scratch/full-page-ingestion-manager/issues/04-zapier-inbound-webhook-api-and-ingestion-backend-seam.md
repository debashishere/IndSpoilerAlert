# 04: Zapier Inbound Webhook API & Ingestion Backend Seam

**What to build:** An enterprise supplier can ingest surplus inventory lots directly from Zapier webhooks. The backend provides authenticated endpoints to receive webhook payloads with cryptographic supplier token verification, auto-registers Zap channels/feeds, logs incoming payload deliveries, and routes normalized data into the centralized `ingestService.processBatch` reconciliation engine. Endpoints are also exposed to list configured Zaps, run test pings, adjust field mappings, and disconnect feeds.

**Blocked by:** None (can start immediately)

**Status:** completed

- [x] Backend routes and controllers implemented under `/api/v1/ingestion/zapier/`:
  - `POST /api/v1/ingestion/zapier/webhook`: Ingests single lot or array payloads with `X-Ingress-Key` cryptographic verification.
  - `GET /api/v1/ingestion/zapier/roster`: Returns registered Zap feeds, lot counts, health status, and recent payload delivery logs.
  - `POST /api/v1/ingestion/zapier/test-ping`: Verifies webhook connectivity and returns round-trip latency.
  - `POST /api/v1/ingestion/zapier/mapping`: Saves per-zap custom key-to-canonical-lot field mappings.
  - `DELETE /api/v1/ingestion/zapier/disconnect`: Disconnects or archives a Zap feed.
- [x] Inbound Zapier JSON payloads are normalized into standardized `IngestionBatch` contracts and processed through `ingestService.processBatch` with idempotent reconciliation.
- [x] Zapier integration state and recent delivery audit logs (last 10 deliveries with HTTP status, latency, and sample payload) are persisted in MongoDB.
- [x] Comprehensive backend integration tests cover token authentication, payload batch normalization, and error handling.

