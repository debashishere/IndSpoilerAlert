# 02: Auth & Security — Staging Real Auth Enforcement & OTP Email Dispatch (SEC-01, SEC-02)

**What to build:** Enforce real Firebase/JWT authentication in staging mode (disabling dev mock session fallback) and configure production-grade SMTP (SendGrid/AWS SES) for delivering buyer marketplace OTP verification emails.

**Blocked by:** None (can start immediately)

**Status:** completed

- [x] Ensure `VITE_USE_DEV_MOCK_AUTH=false` enforcement in `frontend/src/services/firebaseAuthService.ts` when running in staging.
- [x] Configure `backend/src/services/emailService.ts` to use staging SendGrid / AWS SES SMTP credentials instead of falling back to console logging.
- [x] Verify OTP email dispatch and verification flow for secondary buyers.

