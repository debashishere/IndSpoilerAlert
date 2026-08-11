# 0086 — Buyer Authentication & Email Verification System (Login / Logout)

**What to build:** Complete buyer authentication and email verification pipeline allowing buyers to log in/out of the platform, verify their business email via tokenized magic links/OTP, view verified status badges, and manage active session state.

**Blocked by:** 0085 — Public Buyer Landing Page & Catalog Search Grid

**Status:** completed

- [x] Implement backend auth endpoints `/api/v1/marketplace/auth/send-verification`, `/api/v1/marketplace/auth/verify-token`, and `/api/v1/marketplace/auth/session`.
- [x] Create `BuyerAuthModal` supporting Login, Register, and Email Verification token confirmation states.
- [x] Integrate buyer auth state into Redux `coreSlice` / `authSlice` to track logged-in buyer user profile and verification status.
- [x] Render buyer avatar/login button in `MarketplaceLayout` header with "My Bids", "Verified Buyer Status", and "Log Out" dropdown actions.
- [x] Add unit test verifying buyer registration, email verification token processing, and login/logout state transitions.
