# ADR 0034: Private Stage Exclusivity & Marketplace Broadcast Policy

- **Status**: Approved
- **Date**: 2026-08-18
- **Authors**: Antigravity AI & SpoilerAlert Engineering Team
- **Deciders**: Lead Architect, Full-Stack Engineers

---

## 1. Context & Problem Statement

When executing **Stage-Gate Liquidation Workflows**, suppliers target distinct tiers of buyers (e.g., *Tier 1 Primary Wholesalers*, *Secondary Closeout Liquidators*, or custom partner lists) across progressive escalation stages.

A critical policy ambiguity existed regarding inventory visibility on the **Public Buyer Marketplace**:
1. When a liquidation stage executes and dispatches private offer emails with 1-click bid links (`{{quick_bid_link}}`) to customized buyers, should the underlying inventory lots simultaneously be published to the public marketplace?
2. If published publicly during a private stage, public buyers could place competing bids and claim inventory promised to private buyers, eroding buyer relationship trust and triggering allocation race conditions.
3. Conversely, if private stages fail to achieve 100% sell-through, how and when should unawarded inventory transition to the public marketplace as a final commercial clearance step before philanthropic donation or terminal disposal?

---

## 2. Decision & Architectural Specifications

We establish a formal **Private Stage Exclusivity & Marketplace Broadcast Policy**:

### 2.1 Private Stage Exclusivity Window
- **Strict Isolation**: When a workflow stage targets a specific/customized buyer list (`customBuyers`, `buyerListId`, or private tier segment), the evaluated inventory lots remain **strictly unlisted** on the public marketplace.
- **Private 1-Click Bidding**: Bids during this window can only be submitted via tokenized, encrypted 1-click buyer action links (`{{quick_bid_link}}`) dispatched directly to the targeted recipients.

### 2.2 Stage Balance Carry-Forward
- If a private buyer places a bid on a **partial quantity** of a lot (e.g., 300 out of 500 cases) and is awarded, the remaining balance (200 cases) remains active and exclusive to other targeted buyers in that stage until the stage response window (`waitHours`) expires.
- When the window closes, any remaining unawarded balance automatically carries forward into downstream stages or the fallback broadcast.

### 2.3 Marketplace Broadcast Fallback
- Remaining unsold inventory only transitions to the public marketplace if:
  1. A subsequent workflow stage is explicitly configured to target `"All Buyers / Public Marketplace"`, **or**
  2. The workflow fallback rule is explicitly configured to `"Marketplace Broadcast"` (`rules.onFallback === 'marketplace_broadcast'`).
- If downstream stages are set to Donation or Landfill instead, inventory cascades directly to those partner channels without public marketplace exposure.

### 2.4 Compliance Hold Gate
- Per FDA regulatory compliance invariants ([ADR 0026](file:///Users/debashisroy/Documents/SpoilerAlert/docs/adr/0026-separation-of-buyer-marketplace-and-inventory-platform.md)), FDA-regulated products require a verified Certificate of Analysis (COA) or Batch Record prior to public marketplace listing.
- When a **Marketplace Broadcast** triggers:
  - Compliant lots with verified COAs publish immediately to the active `MarketplaceListing` catalog.
  - Unverified lots enter a `compliance_hold` state, generating an urgent supplier task/alert to verify documents rather than blocking compliant lots in the batch.

### 2.5 Unlisted Award & Offer Processing
- Private liquidation stage bids bypass public marketplace listing creation entirely.
- The `Award` and `Offer` data contracts allow `listingId` to be optional, associating private bids directly with `lotId` and `runId`.
- The transactional `awardBid()` service processes awards for unlisted lots cleanly, updating lot quantities, issuing purchase orders and bills of lading, and notifying buyers without requiring an active `MarketplaceListing`.

### 2.6 Active Private Stage Publication Guard
- Manual or scheduled attempts to publish a lot via `publishLotToMarketplace()` must fail if the lot is under active private liquidation stage execution (`evaluating`, `partially_awarded`, `escalating`).
- Publication is only permitted once all private stages complete, or when a stage specifically targets `"All Buyers / Public Marketplace"`.

---

## 3. Consequences

### Positive
- **Tiered Partner Trust**: Protects early-look commercial exclusivity and negotiated pricing for preferred private buyers.
- **Zero Race Conditions**: Eliminates inventory allocation collisions between private email recipients and public catalog browsers.
- **Controlled Liquidity**: Allows suppliers to balance private relationship retention with open marketplace liquidity.
- **Regulatory Integrity**: Ensures no non-compliant FDA-regulated goods are inadvertently published to the public portal.

### Neutral / Implementation Requirements
- Implement `marketplace_broadcast` fallback handler in `agendaService.ts`.
- Introduce `compliance_hold` status filter in `publishLotToMarketplace` and workflow execution logs.
- Add UI controls for "Marketplace Broadcast" fallback in `LiquidationAutomationStudio.tsx`.
- Relax `listingId` validation on `Award` and `Offer` models to support unlisted private bids.
- Enforce active private stage publication check in `publishLotToMarketplace()`.
