# 02 — Frontend Real Email Validation & Real Google OAuth Authentication

**What to build:** Prevents users from authenticating or registering on the frontend with mock email addresses, displaying user-friendly validation errors, and configuring real Google OAuth / Firebase login.

**Blocked by:** 01 — Core Email Validation Engine & Backend Middleware Guardrails

**Status:** completed

- [x] Add real email domain validation to `loginWithEmail` and `signupWithEmail` in `firebaseAuthService.ts` and UI forms
- [x] Add email validation check post Google OAuth (`signInWithGoogle`) to reject Google accounts with mock domain emails
- [x] Configure `frontend/.env` settings to enable real Firebase/Google OAuth login (`VITE_USE_DEV_MOCK_AUTH=false`)

