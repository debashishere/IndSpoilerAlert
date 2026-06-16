# 01 — Core Backend Buyer Ingestion Pipeline & Duplicate Upsert Engine

**What to build:** End-to-end backend capability to confirm buyer document ingestion from parsed CSV/XLSX files. Enables mapping file columns to the Buyer model schema, performing case-insensitive email duplicate upserts (updating existing buyers or creating new ones), optionally linking newly imported buyer IDs to a target BuyerList, returning batch import metrics (`createdCount`, `updatedCount`), and verifying clean execution with test suites.

**Blocked by:** None — can start immediately

**Status:** completed

- [x] Implement `confirmBuyerIngestion` function in `ingestService.ts` to map columns, validate email formats, and upsert buyers into MongoDB.
- [x] Add `confirmBuyerIngest` controller method in `ingestController.ts` handling `POST /api/ingest/confirm-buyer`.
- [x] Register `POST /api/ingest/confirm-buyer` in `api.ts` router.
- [x] Support optional `buyerListId` param to automatically push imported buyer ObjectIds to a target `BuyerList`.
- [x] Add automated unit/integration tests to verify buyer upserts, duplicate email handling, and error cases.
