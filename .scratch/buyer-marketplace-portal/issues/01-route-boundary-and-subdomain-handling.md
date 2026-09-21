# 01 — Route Boundary and Subdomain Handling for Standalone Marketplace

Type: research
Status: resolved
Blocked by: none

## Question

How should the top-level routing in `frontend/src/App.tsx` be restructured to detect `/marketplace/*` (and `marketplace.*` subdomains), completely bypassing the Firebase supplier authentication gate (`PublicLandingPage`) and rendering `MarketplaceLayout` + `MarketplaceLandingView` in isolation, while preserving `/app/*` and `/` for the authenticated supplier workspace?

## Answer

Introduce a pure route triage function (`resolveAppRoute(pathname, hostname, search)`) at the top of `App.tsx` evaluated **before** any Firebase supplier auth gates (`isLoading` and `PublicLandingPage`):

1. **Route Matching Logic**:
   - Matches `/deal/:id` or `/portal/deal/:id` -> renders `DealSettlementPortalView` directly.
   - Matches `/portal/negotiation/:id` -> renders `BuyerNegotiationPortalView` directly.
   - Matches `/marketplace/*`, `/bid/*`, or host starting with `marketplace.` -> renders `StandaloneMarketplacePortal` directly (`MarketplaceLayout` + `MarketplaceLandingView` + `QuickBidModal`). Completely bypasses Firebase loading, supplier `PublicLandingPage`, Redux supplier polling, and `<GlobalNavigationBar>`.
   - Defaults (`/app/*` or `/` on non-marketplace host) -> delegates to `SupplierWorkspace` which retains the Firebase supplier auth gate, Redux initialization, and tab routing.

2. **Component Seam**:
   - Extract supplier workspace state, hooks, and tabs into `SupplierWorkspace`.
   - Mount `StandaloneMarketplacePortal` as an isolated root component wrapped only in `MarketplaceLayout`.
   - Support popstate listeners so back/forward navigation between marketplace and supplier views works seamlessly.

