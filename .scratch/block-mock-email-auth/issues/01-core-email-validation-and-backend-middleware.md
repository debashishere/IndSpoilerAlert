# 01 — Core Email Validation Engine & Backend Middleware Guardrails

**What to build:** Rejects any user authentication attempt or API request using mock or test email domain addresses (@example.com, @mock.com, @test.com, @invalid, @localhost, or domains containing 'mock') across the system backend.

**Blocked by:** None — can start immediately.

**Status:** completed

- [x] Implement `isValidRealEmail(email)` helper that checks RFC syntax and flags disallowed mock domain patterns
- [x] Update `authMiddleware.ts` to evaluate `user.email` against disallowed mock domain patterns and reject mock email tokens with `403 Forbidden`
- [x] Ensure non-mock emails pass backend authentication cleanly

