# ADR 0036: Multi-Lot Workflow Orchestration & Atomic Offer Granularity

- **Status**: Approved
- **Date**: 2026-09-16
- **Authors**: Antigravity AI & SpoilerAlert Engineering Team
- **Deciders**: Lead Architect, Full-Stack Engineers

---

## 1. Context & Problem Statement

In the InventoryFlowing liquidation engine, suppliers execute **Stage-Gate Liquidation Workflows** targeting distressed or surplus inventory. Workflows frequently select and evaluate **multiple inventory lots** concurrently (`snapshotInventoryIds: [lot1, lot2, ...]`), which may encompass disparate SKUs, case volumes, remaining shelf lives (RSL), and warehouse distribution centers.

Two fundamental architectural challenges arose:

1. **Foreign Key Cross-Contamination (`Offer.listingId` vs. `lotId`)**:
   During private liquidation stages, no public `MarketplaceListing` document exists yet. Automated notifications previously passed `primaryLot._id` into `QuickBidToken.listingId` as a fallback. When the buyer submitted their bid, `Offer.create()` persisted an `InventoryLot` ObjectId into `Offer.listingId`. Downstream operations (e.g. `sendMessage` negotiation, settlement PO generation) querying `MarketplaceListing.findById(offer.listingId)` crashed with HTTP 500 errors or failed joins.

2. **Granularity Discrepancy (Campaign vs. Transaction)**:
   An `AutomationRun` coordinates a liquidation campaign across **multiple lots**, whereas the `Offer` and `Award` schemas model a **single lot reference** (`lotId`). How does the system handle workflows with multiple lots selected, and why is `Offer` kept at a 1:1 lot granularity?

---

## 2. Decision & Architectural Specifications

We formally establish the **Multi-Lot Orchestration & Atomic Offer Granularity Architecture**:

### 2.1 Strict Reference Invariant on `Offer.listingId`
- **Rule**: `Offer.listingId` (and `Award.listingId`) is **strictly null/undefined** unless an authentic document exists in the `MarketplaceListing` collection.
- **Validation Gate**: Before saving an offer in `quickBidRoutes.ts`, verify document existence:
  ```typescript
  let verifiedListingId: mongoose.Types.ObjectId | undefined = undefined;
  if (tokenDoc.listingId && mongoose.isValidObjectId(tokenDoc.listingId)) {
    const listingExists = await MarketplaceListing.exists({ _id: tokenDoc.listingId });
    if (listingExists) {
      verifiedListingId = new mongoose.Types.ObjectId(tokenDoc.listingId);
    }
  }
  ```
- **Service Decoupling**: Downstream services (e.g. `offersService.ts:sendMessage`) must never assume `offer.listingId` is present. They must resolve the lot using `resolveLotForOffer(offer, false)` which prioritizes `offer.lotId` before attempting listing lookups.

### 2.2 Orchestration Scope vs. Transactional Scope
The system explicitly separates workflow orchestration from financial/logistical commitment:

| Dimension | Campaign Scope (`AutomationRun`) | Transaction Scope (`Offer` & `Award`) |
| :--- | :--- | :--- |
| **Multiplicity** | **1 : N Lots** (`snapshotInventoryIds: [lot1, lot2, ...]`) | **1 : 1 Lot** (`lotId: ObjectId`) |
| **Domain Role** | Macro campaign orchestration: stage timers, escalation rules, buyer tier targeting, multi-lot email digest tables. | Micro commercial contract: price per case, bid cases, counter-offers, legal agreement execution. |
| **State Machine** | `dispatched` → `evaluating` → `partially_awarded` → `awarded` / `fallback_executed` | `pending` → `countered` → `partially_accepted` → `fully_accepted` / `rejected` |

### 2.3 Rationale for Retaining Single-Lot (`lotId`) Offer Granularity
`Offer` remains strictly atomic (1:1 with `InventoryLot`) due to physical and commercial operational constraints in B2B supply chains:
1. **Physical DC & Logistics Isolation**: Different lots often reside in different physical Distribution Centers (e.g. refrigerated/cold storage in Chicago vs ambient dry storage in Dallas). Combining them into a single offer breaks warehouse dock scheduling, pickup manifests, and Bill of Lading (BOL) issuance.
2. **Heterogeneous Unit Economics**: Individual lots carry distinct SKUs, unit costs, standard wholesale prices, and expiration horizons. Buyers evaluate and submit bids at the unit/case level per SKU, not as an undifferentiated aggregate.
3. **Independent Negotiation & Settlement**: Suppliers must be able to counter-offer, accept, or reject bids on specific lots independently without voiding bids on others.

### 2.4 Multi-Lot Partial Award & Balance Carry-Forward
- When a buyer submits a winning bid on Lot A:
  1. `awardBid()` decrements available stock on Lot A and tracks `awardedQty` in `stageExecution.lotsOffered`.
  2. The system checks all lots in `activeRun.snapshotInventoryIds`:
     - If any lots remain unsold (`availableQty > 0`), the run status transitions to **`partially_awarded`**.
     - When the stage response window (`waitHours`) expires, `executeWorkflowStage()` recalculates remaining unsold lots and carries them forward into the next escalation stage (e.g. Tier 2 wholesale → discount brokers → donation/landfill).
  3. Only when **all lots** in `snapshotInventoryIds` reach zero available quantity does the `AutomationRun` transition to **`awarded`**, canceling any pending Agenda jobs.

### 2.5 Multi-Lot Bidding Interaction Pattern
- In workflow notification emails, the `inventory_table` merge token renders an itemized manifest of all evaluated lots.
- Quick-bid actions are tokenized per lot (`generateQuickBidToken({ lotId: item.lotId, runId })`), generating an independent `Offer` document per lot bid. All offers created under the same campaign reference the shared `runId`.

---

## 3. Consequences

### Positive
- **Relational Integrity**: `Offer.listingId` strictly references `MarketplaceListing`, eliminating null dereferences, broken Mongoose `.populate()`, and 500 errors.
- **Logistical Precision**: PO PDFs and pickup instructions remain accurate to the specific warehouse DC, temperature class, and SKU batch.
- **Modular Escalation**: Unsold lots carry forward seamlessly between liquidation stages without blocking awarded lots.
- **Independent Counter-Offers**: Buyer and supplier can negotiate individual lots without stalling the remainder of the liquidation batch.

### Implementation Checklist
- [x] Verified `MarketplaceListing.exists()` check before storing `Offer.listingId` in `quickBidRoutes.ts`.
- [x] Protected `tokenDoc.lotId` and `tokenDoc.runId` ObjectId casts with `mongoose.isValidObjectId()`.
- [x] Updated `offersService.ts:sendMessage` to resolve lots via `resolveLotForOffer()` without requiring `listingId`.
- [x] Confirmed partial award status checks and carry-forward mechanics in `inventoryService.ts` and `agendaService.ts`.
