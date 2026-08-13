# 01 — Firebase Google Auth Service & Context Integration

**What to build:** Expose Google authentication capabilities across `firebaseAuthService.ts` and `AuthContext.tsx` using the Firebase JS SDK (`GoogleAuthProvider` and `signInWithPopup`). When triggered, it initiates Google OAuth, retrieves the authenticated user's ID token and metadata (`email`, `displayName`, `photoURL`), binds their dual-profile roles (`buyer` and `supplier`), and updates the application's global authentication state.

**Blocked by:** None — can start immediately.

**Status:** completed

- [x] `firebaseAuthService.ts` includes `signInWithGoogle(profiles?: UserProfiles): Promise<AuthUser>` utilizing `GoogleAuthProvider` and `signInWithPopup`.
- [x] `AuthContext.tsx` exposes `loginWithGoogle: (profiles?: UserProfiles) => Promise<AuthUser>` in `AuthContextType` and `AuthProvider`.
- [x] User credentials, ID token, display name, photo URL, and profile roles are persisted and updated in session storage / state.
- [x] Gracefully handles popup closure (`auth/popup-closed-by-user`) without crashing or leaving orphaned loading states.

