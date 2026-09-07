# 06 — Marketplace Test Data Purge & Workflow Bid Card Lifecycle

**What was done:** Erased 82+ mock test marketplace listings and quick-bid tokens from the buyer marketplace database, removed the auto-projection fallback logic that automatically synthesized listings on empty queries, and ensured Bid Cards are produced exclusively through workflow execution (e.g. `marketplace_broadcast` fallback or public broadcast stages).

**Blocked by:** 05 — End-to-End Test Suite & Policy Verification

**Status:** complete

## Key Resolutions

1. **Auto-Projection Fallback Removal:**
   - In `marketplaceService.ts` (`getMarketplaceListings`), removed the fallback query that previously auto-created `MarketplaceListing` records for all active inventory lots whenever the catalog was empty.
   - The marketplace now displays 0 listings initially until lots are legitimately published through workflow execution or explicit supplier actions.

2. **Seeder Mock Data Clean-up:**
   - Updated `seeder.ts` to remove hardcoded `published` marketplace listings and test offers on start/reset.

3. **Database Test Data Purge:**
   - Deleted all 86 test `marketplacelistings` and 93 test `quickbidtokens` from the active MongoDB database.
   - Active marketplace listings count confirmed at 0.

4. **Enriched Bid Card Projection:**
   - Updated `publishLotToMarketplace` and `projectToMarketplaceListing` to populate complete metadata on workflow broadcast:
     - Title, description, SKU, and category
     - Warehouse region and geolocation
     - Urgency-based Remaining Shelf Life (RSL %) decay curves
     - Discount tiering (`steep` vs `moderate`)
     - Floor pricing & starting prices
     - Verified COA compliance badges
     - Allergens & certification tags
   - Fixed `ComplianceDocument` model schema registration across `InventoryLot.ts`, `marketplaceService.ts`, and `agendaService.ts`.

5. **Verification & Regression Testing:**
   - Verified that running an automation workflow with `onFallback: 'marketplace_broadcast'` successfully publishes compliant surplus lots as rich Bid Cards to the Buyer Marketplace.
   - Backend test suites passed (`e2e_marketplace_exclusivity_and_broadcast.test.ts`, `private_stage_exclusivity_and_quick_bid.test.ts`, `marketplace.test.ts`).
   - Frontend Vitest suite passed (97 test files, 534 tests).
