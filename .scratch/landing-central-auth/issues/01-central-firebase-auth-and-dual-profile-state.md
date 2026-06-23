# 01 — Central Firebase Auth & Dual-Profile State System

**What to build:** Central authentication system integrating Firebase Web SDK (with offline Dev Mock Auth fallback for instant testing). Manages a single user identity that maintains dual sub-profile flags (`profiles: { buyer: boolean, supplier: boolean }`). Attaches `Authorization: Bearer <id_token>` to Express API calls and persists user auth state across page reloads.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] Firebase Web SDK client integration initialized with config and Dev Mock Auth fallback mode
- [ ] Central Auth Context / hook (`useAuth`) exposing login, signup, logout, user identity, and active profiles
- [ ] Backend API authorization header sync (`Authorization: Bearer <id_token>`) sending Firebase ID token to Express endpoints
- [ ] User state structure supporting `buyerProfile` and `supplierProfile` status flags
