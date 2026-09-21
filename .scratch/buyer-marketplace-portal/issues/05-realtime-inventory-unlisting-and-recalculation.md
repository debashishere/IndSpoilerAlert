# 05 — Real-time Inventory Volume Recalculation and Automated Unlisting

Type: research
Status: resolved
Assignee: Antigravity
Blocked by: 04

## Question

How does the supplier award and counter-acceptance workflow in `LotOperationsHubView` / `offersService.ts` trigger volume decrements on `MarketplaceListing.availableQuantity`, and what guarantees exist in backend queries to ensure that listings with zero available quantity or expired shelf life are automatically excluded from public marketplace API responses?

## Answer

### 1. Supplier Award and Counter-Acceptance Workflows

Our investigation across `LotOperationsHubView`, `offersService.ts`, `inventoryService.ts`, and `portalController.ts` reveals two distinct paths for bid acceptance and inventory deduction in the codebase:

#### Path A: Dedicated Inventory Award Pipeline (`inventoryService.awardBid` / `awardBidByOfferId`)
- **API Entrypoint**: `POST /api/v1/supplier/bids/:id/award` (via `supplierRoutes.ts` → `inventoryController.awardBidByOfferId`).
- **Volume Recalculation**:
  1. Computes remaining volume: `remainingQty = Math.max(0, lot.availableQty - finalAwardedQty)`.
  2. Updates `SurplusInventoryLot`: `lot.availableQty = remainingQty; lot.latestSalesDate = new Date();`.
  3. Transitions lot status: `if (remainingQty <= 0) lot.status = 'sold'; else lot.status = 'active';`.
- **Marketplace Listing Projection & Unlisting**:
  ```typescript
  if (listing) {
    listing.availableQuantity = remainingQty;
    listing.status = remainingQty <= 0 ? 'closed' : 'published';
    await listing.save();
  }
  ```
- **Cascading Invariants**:
  - If `remainingQty <= 0`: Marks parent `Opportunity.status = 'completed'` and auto-rejects all other pending bids (`Offer.updateMany({ listingId: listing._id, _id: { $ne: offer._id }, status: 'pending' }, { status: 'rejected' })`).
  - If `remainingQty > 0`: Bulk rejects any pending bids whose requested quantity exceeds `remainingQty` (`Offer.updateMany({ listingId: listing._id, status: 'pending', quantity: { $gt: remainingQty } }, { status: 'rejected' })`).
  - Generates PO PDF (`po-${award._id}.pdf`), BOL freight shipment (`bol-${shipment._id}.pdf`), uploads both to S3, and dispatches an acceptance email via `sendEmailHelper`.
  - Verified in test suite: `backend/src/tests/realtime_inventory_recalculation.test.ts`.

#### Path B: Lot Trading Desk & Guest Negotiation Accept Pipeline (`offersService.acceptBid`)
- **API Entrypoints**:
  1. Supplier Workspace Trading Desk: `POST /api/bids/:id/accept` (triggered from `LotOperationsHubView` / `useLotBidsTradingDesk.ts` via `InventoryService.acceptBid(bidId, payload)`).
  2. Guest Negotiation Portal: `POST /api/portal/negotiation/:offerId/accept` (invoked when a buyer accepts the supplier's counter-proposal in `portalController.acceptCounterProposal`).
- **Volume Recalculation**:
  1. Determines requested quantity: `awardedQty = options?.awardedQuantity || offer.quantity;`.
  2. Compares against existing award to maintain idempotency: `deltaQty = awardedQty - (existingAward?.awardedQty || 0);`.
  3. Executes atomic decrement on `InventoryLot`:
     ```typescript
     const updatedLot = await InventoryLot.findOneAndUpdate(
       { _id: lot._id, availableQty: { $gte: deltaQty } },
       { $inc: { availableQty: -deltaQty } },
       { new: true }
     );
     ```
  4. Auto-transitions lot status: sets `updatedLot.status = 'sold'` if `availableQty <= 0`, or back to `'active'` if restored.
  5. Upserts `Award` record, updates `offer.status = 'fully_accepted' | 'partially_accepted'`, and sends deal settlement memo.
- **Rollback Mechanism (`rollbackAcceptedAwardIfAny`)**:
  - Restores `lot.availableQty += qtyToRestore` and sets `lot.status = 'active'` if a previously accepted offer is declined or reset.
- **Identified Gap / Asymmetry**:
  - While `offersService.acceptBid` accurately decrements `InventoryLot.availableQty`, it resolves `listing = await MarketplaceListing.findById(offer.listingId)` purely to find the underlying `lotId` / `opportunityId`.
  - It does **not** update `MarketplaceListing.availableQuantity` or `MarketplaceListing.status`.
  - Similarly, direct purchases via `marketplaceService.placeBid({ directPurchase: true })` decrement `lot.availableQty` and set `lot.status = 'sold'`, but also omit updating `MarketplaceListing.availableQuantity`.

---

### 2. Backend Query Guarantees for Public Marketplace Responses

Public marketplace listings are served via `GET /api/v1/marketplace/listings`, routed to `marketplaceController.getListings` and resolved by `marketplaceService.getMarketplaceListings(filters)`:

```typescript
const query: any = {
  status: { $in: ['published', 'active'] },
  availableQuantity: { $gt: 0 }
};
```

#### Guarantees Enforced Today:
1. **Zero-Volume Exclusion**:
   - The query filter `availableQuantity: { $gt: 0 }` guarantees that any listing whose `availableQuantity` drops to 0 is immediately excluded from all public buyer search facets and category feeds.
2. **Explicit Status Unlisting**:
   - Only records with `status: 'published'` or `status: 'active'` are returned. Listings transitioning to `'closed'` or `'unlisted'` are filtered out at the database index level.
3. **Private Stage Exclusivity**:
   - `publishLotToMarketplace(lotId)` explicitly validates that no active private liquidation stage (`AutomationRun`) holds exclusivity over the lot before allowing publication ([ADR 0034](../../docs/adr/0034-private-stage-exclusivity-and-marketplace-broadcast-policy.md)).

#### Gaps and Edge Cases to Guard:
1. **Shelf Life Expiration Filtering**:
   - `MarketplaceListing` stores `expiresAt: Date` (projected from `lot.expirationDate`) and `remainingShelfLife: number` (0 to 1 ratio).
   - However, `getMarketplaceListings()` currently lacks a timestamp filter for expired shelf life. If an inventory lot passes its expiration date and has not yet been manually unlisted or swept by a lifecycle job, it would remain queryable so long as `availableQuantity > 0`.
   - **Recommended Query Invariant**:
     ```typescript
     const query: any = {
       status: { $in: ['published', 'active'] },
       availableQuantity: { $gt: 0 },
       $or: [
         { expiresAt: { $exists: false } },
         { expiresAt: { $gt: new Date() } }
       ]
     };
     ```
2. **Synchronizing `offersService` with `MarketplaceListing`**:
   - Because `inventoryService.awardBid` updates `listing.availableQuantity` and `listing.status`, but `offersService.acceptBid` and `marketplaceService.placeBid(directPurchase)` only decrement `InventoryLot.availableQty`, any bid accepted through the Lot Trading Desk or Guest Portal currently relies on the underlying lot rather than updating the projected `MarketplaceListing`.
   - **Recommended Invariant**: Introduce a shared helper `syncMarketplaceListingVolume(lotId, availableQty)` called consistently across `inventoryService.awardBid`, `offersService.acceptBid`, `rollbackAcceptedAwardIfAny`, and `marketplaceService.placeBid` to maintain total volume consistency across both models.
