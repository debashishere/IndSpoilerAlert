# 0084 — Marketplace Listing Projection & Publication Invariants

**What to build:** `MarketplaceListing` backend projection model and publication workflow that extracts public listings from internal `SurplusInventoryLot` entities, sanitizing internal supplier COGS, margins, and private notes, and enforcing COA compliance document verification prior to publication.

**Blocked by:** 0083 — Route & Layout Separation (Supplier App vs Public Buyer Marketplace)

**Status:** ready-for-agent

- [ ] Create `MarketplaceListing` database schema and projection transformer function that strips internal COGS, vendor cost recovery targets, and private supplier notes.
- [ ] Implement publication invariant check preventing an inventory lot from being published to the public marketplace if required compliance records (COA / Batch Record) are unverified.
- [ ] Provide backend API endpoint `POST /api/v1/supplier/lots/:id/publish-marketplace` and supplier UI action button in `LotOperationsHubView`.
- [ ] Add unit test verifying that published listings contain sanitized public fields and reject unverified compliance lots.
