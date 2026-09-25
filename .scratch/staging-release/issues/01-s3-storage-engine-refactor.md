# 01: Core Storage — S3 / LocalStack Multer Storage Refactor (BE-03)

**What to build:** Refactor file upload handling across the platform so uploads stream directly to an S3 or LocalStack S3 bucket instead of writing to local disk (`uploads/`), enabling stateless multi-instance staging deployments.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Refactor Multer middleware in `backend/src/routes/api.ts` to stream uploaded files to AWS S3 / LocalStack.
- [ ] Support staging environment variables for `AWS_S3_BUCKET`, `AWS_REGION`, and optional LocalStack endpoint.
- [ ] Verify file upload and retrieval flow end-to-end without local disk persistence.
