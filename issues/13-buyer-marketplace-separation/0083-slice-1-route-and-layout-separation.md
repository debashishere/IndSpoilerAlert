# 0083 — Route & Layout Separation (Supplier App vs Public Buyer Marketplace)

**What to build:** Top-level routing split separating authenticated supplier workspace routes (`/app/*`) from public buyer marketplace routes (`/marketplace/*`), with distinct application layouts (`SupplierLayout` with collapsible sidebar vs `MarketplaceLayout` with hero navbar and buyer authentication header controls), and Express API route namespacing (`/api/v1/supplier` vs `/api/v1/marketplace`).

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] Define top-level routing context in `App.tsx` switching between `SupplierLayout` and `MarketplaceLayout` based on URL path.
- [ ] Implement `MarketplaceLayout` shell with top header, logo branding (`InventoryFlowing`), catalog navigation link, and Buyer Login/Register action buttons.
- [ ] Establish backend Express route namespaces for `/api/v1/supplier` (authenticated supplier endpoints) and `/api/v1/marketplace` (public marketplace catalog and buyer endpoints).
- [ ] Add unit test verifying layout rendering and routing transitions for supplier vs buyer routes.
