# 09: Marketplace Ingress — Standalone Marketplace Routing & CORS (SEC-03)

**What to build:** Configure standalone domain ingress (`marketplace.inventoryflowing.com`), Nginx/Cloudflare path routing (`/marketplace`), and CORS headers for the public buyer marketplace portal.

**Blocked by:** 02: Auth & Security — Staging Real Auth Enforcement & OTP Email Dispatch (SEC-01, SEC-02)

**Status:** completed

- [x] Configure Nginx / Cloudflare domain routing for `StandaloneMarketplacePortal.tsx`.
- [x] Ensure proper CORS headers in backend routes to accept public buyer portal requests.
- [x] Verify full buyer browsing, authentication, and bidding journey on standalone domain.
