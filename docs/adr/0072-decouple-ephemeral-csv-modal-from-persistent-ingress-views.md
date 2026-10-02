# Decouple Ephemeral CSV Modal from Persistent Ingress Views

While automated integration channels (Google Sheets, Zapier, Doc Scanner) require dedicated full-page configuration views, continuous webhook telemetry, and per-origin mapping rosters, manual CSV/Excel uploads are ad-hoc and transactional. To prevent navigation friction for operators performing rapid routine file drops, CSV ingestion remains an in-place modal workflow (`UnifiedIngestionModal`) while executing through the exact same backend batch ingestion engine (`ingestService.processBatch`) and reconciliation contracts.
