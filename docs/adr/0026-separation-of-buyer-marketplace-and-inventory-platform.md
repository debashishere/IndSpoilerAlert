# 0026: Separation of Buyer Marketplace from Supplier Inventory Platform

## Context
Originally, the **Buyer Marketplace** was implemented as an internal navigation view tab (`MarketplaceView.tsx`) embedded within the supplier-facing application shell (`App.tsx`). Both CPG suppliers (managing ingestion, yield optimization, and lot operations) and retail buyers (browsing surplus listings and placing bids) interacted through the same monolithic interface shell.

To scale the platform, improve security boundaries, and provide a dedicated, high-conversion landing page for secondary market retail buyers, the Buyer Marketplace must be architecturally separated from the Supplier Inventory Platform.

## Decision

1. **Application & Domain Boundary Split**:
   - **Public Buyer Marketplace (`marketplace.indspoileralert.com` / `/marketplace`)**: A standalone, public-facing portal with a dedicated product catalog landing page. Buyers can search, filter, and view active listings without logging in, and submit bids using email identification (ADR 0006).
   - **Supplier Inventory Platform (`app.indspoileralert.com` / `/app`)**: An authenticated B2B operational workspace where suppliers ingest messy data, run AI normalization, manage internal inventory lots, and construct automated stage-gate liquidation campaigns.

2. **Domain Isolation (Surplus Inventory Lot vs. Marketplace Listing)**:
   - **Surplus Inventory Lot**: An internal supplier entity stored in the Inventory Platform containing sensitive operational data (internal COGS, cost recovery targets, raw supplier notes, and draft markdown curves).
   - **Marketplace Listing**: A public projection entity published to the Buyer Marketplace. A Surplus Lot is only published as a Marketplace Listing when:
     - Compliance documents (COA / Batch Records) are verified.
     - The lot is attached to an active liquidation campaign or manually published.
     - Internal supplier notes, cost bases, and vendor details are sanitized.

3. **Frictionless Buyer Access & Bidding Flow**:
   - Buyers enjoy open catalog browsing on the public landing page.
   - Bidding operates via **Buyer Email Identification & Auto-Registration** (ADR 0006). When placing a bid, new buyer email domains trigger automatic background profile derivation, while returning buyers receive dynamic tokenized magic links for bid management.

4. **Unified API Engine & Real-Time Sync**:
   - Both frontend applications interface with a unified backend API using clean route namespaces (`/api/v1/marketplace/...` and `/api/v1/supplier/...`).
   - Bid awards or inventory volume updates in the Inventory Platform trigger automatic real-time volume recalculation and unlisting of sold-out listings on the public marketplace.

5. **Codebase Modularization**:
   - Structure frontend views into distinct modular namespaces (`src/views/marketplace/` vs `src/views/supplier/`) with independent application shells and routing contexts.

## Consequences
- **Security & Privacy**: Supplier-internal cost metrics, vendor details, and unverified inventory are strictly isolated from public buyers.
- **Conversion & UX**: Retail buyers get a streamlined, public e-commerce landing page optimized for browsing and fast bid submission without password friction.
- **Maintainability**: Clear separation of bounded contexts makes both the supplier workspace and buyer portal easier to test, extend, and deploy independently.
