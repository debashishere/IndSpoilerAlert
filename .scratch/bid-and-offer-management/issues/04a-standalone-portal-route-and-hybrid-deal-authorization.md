# 04A — Standalone Portal Route & Hybrid Deal Authorization

## Parent
[04 — Acceptance Action Flow with Logistics & Deal Tokens](./04-acceptance-action-and-settlement-email.md) | [ADR 0035](../0035-buyer-deal-settlement-portal-and-payment-gated-esign.md)

**What to build:** 
A dedicated, distraction-free external web portal route at `/deal/:dealId` (accessible via settlement links generated in parent ticket 04, e.g. `/deal/:dealId?token=:dealToken`) with dual-mode access security. Cryptographic Guest Access allows external buyers/liquidators to view lot settlement details without logging in when a valid HMAC-signed `dealToken` parameter is supplied. Authenticated session access verifies buyer identity against `Award.buyerId` or grants inspection privileges to supplier admins. Requests lacking a valid token and matching session are rejected with HTTP 403. Renders the standalone portal view (omitting supplier navigation and sidebars) with the deal summary, awarded lot quantities, unit and total price, and warehouse DC pickup location and dock hours.

**Blocked by:** 04 — Acceptance Action Flow with Logistics & Deal Tokens

**Status:** done

- [x] Route `/deal/:dealId` renders a full-screen standalone portal shell omitting internal supplier navigation headers and sidebar controls.
- [x] Backend endpoint `GET /api/deals/:dealId` verifies HMAC `dealToken` query parameter or active session credentials (`Award.buyerId` or supplier admin).
- [x] Requests with invalid/missing tokens and no authorized session are rejected with HTTP 403 Forbidden and display a clear access-denied state.
- [x] Portal displays awarded deal summary: product name, SKU, awarded quantity, unit price, total amount, DC pickup address, and warehouse dock hours.
- [x] Automated integration tests cover authorized guest access via token, authorized buyer session access, and 403 rejection for unauthorized requests.
