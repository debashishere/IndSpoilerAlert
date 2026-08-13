# 02 — Central Auth Modal Google Button & Role Integration

**What to build:** Add a styled "Continue with Google" button with an "OR" divider to both the **"Sign In to Platform"** (login) and **"Create Central Account"** (signup) views of `CentralAuthModal.tsx`. When clicked, it invokes `loginWithGoogle`: passing the selected `CPG Supplier` and `Retail Buyer` profile check states when in Signup mode, or logging in with existing user profiles when in Login mode.

**Blocked by:** 01 — Firebase Google Auth Service & Context Integration

**Status:** completed

- [x] "Continue with Google" button is rendered on both Login ("Sign In to Platform") and Signup ("Create Central Account") modes of `CentralAuthModal.tsx`.
- [x] Visual "OR" divider separates Google SSO from standard email/password fields.
- [x] Clicking "Continue with Google" in Signup mode passes current `isSupplier` and `isBuyer` selection states to `loginWithGoogle`.
- [x] Clicking "Continue with Google" in Login mode authenticates the user and logs them in with their central account session.
- [x] Loading and disabled states are properly indicated during active authentication.
