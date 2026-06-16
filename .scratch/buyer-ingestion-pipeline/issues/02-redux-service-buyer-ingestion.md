# 02 — Redux Store & Service Integration for Live Buyer Ingestion

**What to build:** Service API functions and Redux state management to support uploading buyer CSV files, storing parsed preview results, and dispatching column-mapped confirmation requests to the backend buyer ingestion endpoint.

**Blocked by:** 01 — Core Backend Buyer Ingestion Pipeline & Duplicate Upsert Engine

**Status:** completed

- [x] Implement `uploadBuyerFile` and `confirmBuyerIngestion` API methods in `ingestionService.ts`.
- [x] Add `uploadBuyerThunk` and `confirmBuyerThunk` to `ingestionSlice.ts` to manage loading states, parsed column metadata, error messages, and success notifications.
- [x] Update `ingestionSlice` state with buyer parsed results and status messages.
- [x] Add frontend test coverage for buyer ingestion thunks and service calls in `ingestionSliceAndService.test.ts`.

