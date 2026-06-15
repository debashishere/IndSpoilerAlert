# 0085 — Public Buyer Landing Page & Catalog Search Grid

**What to build:** Public `MarketplaceLandingView` in `src/views/marketplace/` featuring a high-converting hero banner, active listing catalog grid with Remaining Shelf Life (RSL %) urgency indicators, search and dynamic facet filtering (by category, warehouse region, discount tier), and detailed product view modal.

**Blocked by:** 0084 — Marketplace Listing Projection & Publication Invariants

**Status:** completed

- [x] Create `MarketplaceLandingView` component under `src/views/marketplace/` rendered inside `MarketplaceLayout`.
- [x] Implement listing catalog grid with product image preview, title, quantity available, floor/discount price, and RSL % badge.
- [x] Integrate public search bar and dynamic facet filters querying `/api/v1/marketplace/listings`.
- [x] Add listing detail slide-over drawer displaying full product specs, allergen/certifications badges, and "Place Bid" trigger CTA.
- [x] Write unit test verifying public catalog browsing and search filtering without authentication.
