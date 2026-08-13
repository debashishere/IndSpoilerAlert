# 03 — Test Suite Updates & End-to-End Verification

**What to build:** Updates automated backend and frontend test suites to test with real email domains, and asserts that mock email authentication attempts fail with 403 Forbidden.

**Blocked by:** 01 — Core Email Validation Engine & Backend Middleware Guardrails, 02 — Frontend Real Email Validation & Real Google OAuth Authentication

**Status:** completed

- [x] Update backend `authMiddleware.test.ts` fixtures to use valid real email domains (`authtest@indspoileralert.com`)
- [x] Add explicit test cases verifying that mock email tokens (e.g., `authtest@example.com`) are rejected with `403 Forbidden`
- [x] Run test suite to verify zero regressions

