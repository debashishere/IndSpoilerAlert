# 7. Asynchronous Ingestion Webhook Callback

We have decided to decouple the asynchronous file ingestion pipeline by having the background Python worker notify the Node.js Express server via a webhook callback (`POST /api/ingest/callback`) once document parsing is completed, rather than writing directly to MongoDB.

## Context

Processing unstructured files (PDFs/CSVs) via Docling is CPU and memory intensive, requiring an asynchronous background worker (FastAPI BackgroundTasks or similar) to prevent Node.js or FastAPI HTTP timeouts.

When deciding how to save the parsed results (`rawGrid` and metadata) back to MongoDB:
- **Option 1 (Direct Writes)**: Write directly from the Python worker to MongoDB using `pymongo`. This would require managing Mongo credentials in the Python container and replicating schema logic or structure.
- **Option 2 (Webhook Callback)**: Keep the Python sidecar stateless. The worker receives a job with an S3 URI, parses the file, and posts the results back to Express. Express then manages the MongoDB update and schema rules.

## Decision

We chose **Option 2 (Webhook Callback)**. The Python sidecar will remain stateless for file ingestion, delegating database persistence and schema validation to the Express application.

## Consequences

- The Python sidecar does not need to connect to MongoDB, preserving its role as a CPU-bound utility sidecar.
- We must implement a secure, private callback endpoint on the Express server (`POST /api/ingest/callback`).
