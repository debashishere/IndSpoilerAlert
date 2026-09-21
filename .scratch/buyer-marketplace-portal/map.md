# Wayfinder Map: Standalone Public Buyer Marketplace Portal

## Destination

A full in-place codebase decoupling of the Public Buyer Marketplace into an independent, standalone web portal (`/marketplace/*` and `marketplace.inventoryflowing.com`) completely detached from the authenticated Supplier Platform shell, featuring isolated layouts, clean routing boundaries, sanitized public listing projections, and friction-free buyer bidding.

## Notes

- Domain: CPG surplus inventory liquidation, B2B wholesale marketplace, stage-gate escalation.
- Core vocabulary: [CONTEXT.md](../../CONTEXT.md) (specifically `Standalone Public Buyer Marketplace Portal`, `Public Marketplace Launcher`, `MarketplaceListing`, `SurplusInventoryLot`).
- Reference ADRs: [ADR 0026](../../docs/adr/0026-separation-of-buyer-marketplace-and-inventory-platform.md), [ADR 0006](../../docs/adr/0006-buyer-email-identification-auto-registration.md), [ADR 0034](../../docs/adr/0034-private-stage-exclusivity-and-marketplace-broadcast-policy.md).
- Architectural Decisions Agreed in Charting:
  1. Path & Subdomain Aware Route Split in single Vite SPA (`/marketplace/*` vs `/app/*` or `/`).
  2. Public visitors to `/marketplace` bypass the Firebase supplier login gate completely.
  3. Supplier Global Navigation Bar removes `marketplace` tab and gains a "Public Marketplace ↗" launcher.
  4. Frictionless open catalog browsing with OTP/magic-link email verification upon bid placement.
- Tracker: Local Markdown tracker (`.scratch/buyer-marketplace-portal/`).

## Decisions so far

- [01 — Route Boundary and Subdomain Handling for Standalone Marketplace](issues/01-route-boundary-and-subdomain-handling.md): Top-level pure route triage (`resolveAppRoute`) in `App.tsx` intercepts `/marketplace/*`, `/bid/*`, and `marketplace.*` before any Firebase supplier auth gates, isolating `MarketplaceLayout` from supplier state and navigation chrome.
- [02 — Supplier Navigation Bar Refactor and Public Marketplace Launcher](issues/02-supplier-navigation-bar-refactor.md): Removed embedded `marketplace` tab from primary navigation; introduced "Public Marketplace ↗" external portal launcher across desktop bar, user control menu, and mobile drawer.
- [03 — Public Marketplace State and Bundle Isolation](issues/03-public-marketplace-state-and-bundle-isolation.md): Identified supplier state coupling vectors in Redux/Firebase and established isolated `MarketplacePortalApp.tsx` entry architecture with dedicated `marketplaceStore`, zero Firebase auth wrapper, and dynamic bundle splitting.
- [04 — Buyer Bidding OTP Verification Flow and API Parity](issues/04-buyer-bidding-otp-flow-and-api-parity.md): Specified backend auth and bidding endpoint contracts, mapped `BuyerBidModal` state transitions, and designed `localStorage` session token persistence with mount rehydration (`checkBuyerSessionThunk`) to eliminate repeated OTP verification across multiple bids.
- [05 — Real-time Inventory Volume Recalculation and Automated Unlisting](issues/05-realtime-inventory-unlisting-and-recalculation.md): Analyzed dual inventory deduction paths (`inventoryService.awardBid` vs `offersService.acceptBid`), identified backend query guarantees (`availableQuantity: { $gt: 0 }`, status filters, private stage exclusivity), and pinpointed gaps in shelf-life expiration queries and cross-service listing volume synchronization.

## Not yet specified

<!-- see "Fog of war": in-scope fog you can't ticket yet; graduates as the frontier advances -->
- Standalone SEO metadata and social graph tags specifically for public marketplace listings (`/marketplace/listing/:id`).
- Real-time WebSocket or Server-Sent Events push for live bid activity on public listings.
- Supplier configuration toggle to enable/disable public marketplace syndication per inventory lot.

## Out of scope

- Dedicated buyer authenticated account management dashboard (saved payment methods, full order ledger, saved search subscriptions).
- International multi-currency conversion and international freight tax calculation.
- Native mobile applications (iOS/Android) for marketplace browsing.
