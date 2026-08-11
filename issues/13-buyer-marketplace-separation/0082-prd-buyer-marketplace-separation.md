# PRD 0082: Buyer Marketplace Separation & Buyer Authentication

## 1. Overview & Objective
Architecturally separate the **Buyer Marketplace** from the **Supplier Inventory Platform** under the **InventoryFlowing** brand. 

This PRD establishes two distinct application contexts:
- **Authenticated Supplier Inventory Platform (`app.inventoryflowing.com`)**: B2B operational portal for CPG suppliers to ingest messy data, run AI normalization, manage internal lots, and launch automated liquidation stage-gate campaigns.
- **Public Buyer Marketplace (`marketplace.inventoryflowing.com`)**: Standalone public portal with an open product landing page, catalog search/filter, email verification, buyer login/logout, and frictionless bidding.

## 2. Key Bounded Context Invariants
1. **Surplus Inventory Lot vs. Marketplace Listing**:
   - `SurplusInventoryLot`: Internal supplier entity containing sensitive cost metrics (internal COGS, target margins, raw vendor notes). *Never visible to public buyers.*
   - `MarketplaceListing`: Public projection entity. Lots are published as listings only when COA compliance records are verified and internal cost metrics are sanitized.
2. **Frictionless Browsing + Email Verification**:
   - Unauthenticated visitors can browse active listings on the public landing page.
   - Bidding and buyer profile management require email verification (magic link/OTP token) and optional buyer login/logout session state.
3. **Real-Time Recalculation**:
   - Accepting or partial-awarding bids in the supplier workspace recalculates remaining lot volume in real time and automatically unlists sold-out items from the public marketplace grid.

## 3. Tracer-Bullet Tickets
- **0083**: Route & Layout Separation (Supplier App vs Public Buyer Marketplace)
- **0084**: Marketplace Listing Projection & Publication Invariants
- **0085**: Public Buyer Landing Page & Catalog Search Grid
- **0086**: Buyer Authentication & Email Verification System (Login / Logout)
- **0087**: Open-Browsing Buyer Bid Submission & Verification-Linked Bidding
- **0088**: Real-Time Inventory Volume Recalculation & Automated Unlisting
