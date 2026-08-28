# Implementation Audit & Gap Analysis Report
## Ticket: [01 — Private Stage Exclusivity Enforcement & Quick Bid Routing](file:///Users/debashisroy/Documents/SpoilerAlert/.scratch/marketplace-broadcast-and-exclusivity/issues/01-private-stage-exclusivity-and-quick-bid-routing.md)

**Date**: September 7, 2026  
**Target Policy**: [ADR 0034: Private Stage Exclusivity & Marketplace Broadcast Policy](file:///Users/debashisroy/Documents/SpoilerAlert/docs/adr/0034-private-stage-exclusivity-and-marketplace-broadcast-policy.md)  
**Status Evaluated**: `complete` (with critical gaps identified below)

---

## Executive Summary

The implementation of **Issue 01** establishes the core foundational mechanics for private stage exclusivity, 1-click tokenized email links, account mismatch gating, and public marketplace search isolation. The automated unit and integration tests (`private_stage_exclusivity_and_quick_bid.test.ts`, `QuickBidModalAuthMismatch.test.tsx`, `e2e_marketplace_exclusivity_and_broadcast.test.ts`) currently **pass (100%)**.

However, a deep codebase inspection reveals **critical architectural disconnects, unhandled race/conflict conditions, and dead-end data flows** that prevent private quick bids from functioning end-to-end in production. Most notably:
1. **Dead-End Bidding Pipeline**: Quick bids recorded via `/api/bids/quick-submit` are appended to `AutomationRun.buyerOffers`, but **no system component ever reads, evaluates, or awards them**.
2. **`awardBid()` Incompatibility**: The underlying award engine in [`inventoryService.ts`](file:///Users/debashisroy/Documents/SpoilerAlert/backend/src/services/inventoryService.ts) throws an error (`"Listing not found"`) if no `MarketplaceListing` exists, making it impossible to award private stage bids without public listings.
3. **Missing Active Stage Exclusivity Lock**: [`publishLotToMarketplace()`](file:///Users/debashisroy/Documents/SpoilerAlert/backend/src/services/marketplaceService.ts#L365-L412) does not verify whether a lot is actively locked in a private liquidation stage before creating a public listing.
4. **Auth Gating & UX Loophole**: In [`QuickBidModal.tsx`](file:///Users/debashisroy/Documents/SpoilerAlert/frontend/src/components/QuickBidModal.tsx), clicking "Switch Account" simply logs out the current user and immediately renders the bid form as an unauthenticated guest instead of enforcing login as the designated recipient.

---

## 1. Acceptance Criteria Verification Matrix

| Acceptance Criterion | Implementation Status | Verdict | Core Finding / Gap |
| :--- | :--- | :--- | :--- |
| **1. Private stage does NOT create/activate public `MarketplaceListing`** | [`agendaService.ts`](file:///Users/debashisroy/Documents/SpoilerAlert/backend/src/services/agendaService.ts) | ⚠️ **Partial** | Stage execution avoids creating listings, but does not unlist existing listings or block manual publication via `POST /api/v1/supplier/lots/:id/publish-marketplace`. |
| **2. Direct email dispatches include tokenized `{{quick_bid_link}}`** | [`agendaService.ts`](file:///Users/debashisroy/Documents/SpoilerAlert/backend/src/services/agendaService.ts#L353-L366), [`quickBidRoutes.ts`](file:///Users/debashisroy/Documents/SpoilerAlert/backend/src/routes/quickBidRoutes.ts) | ⚠️ **Partial** | Multi-lot workflows only tokenize the primary lot (`lots[0]`); tokens fail silently to public untokenized URLs; token HMAC signature is never verified. |
| **3. Bids received are scoped strictly to workflow run and stage** | [`quickBidRoutes.ts`](file:///Users/debashisroy/Documents/SpoilerAlert/backend/src/routes/quickBidRoutes.ts#L203-L221) | ❌ **Critical Gap** | Bids are pushed to `run.buyerOffers` but never processed; no `Offer` or `Activity` records are generated; no auto-award checks occur. |
| **4. Tests verify lots do not appear in public marketplace search** | [`private_stage_exclusivity_and_quick_bid.test.ts`](file:///Users/debashisroy/Documents/SpoilerAlert/backend/src/tests/private_stage_exclusivity_and_quick_bid.test.ts) | ✅ **Met** | Integration tests successfully assert `MarketplaceListing.find({})` and `GET /api/v1/marketplace/listings` return 0 records. |
| **5. Account Mismatch & Auth Gating** | [`QuickBidModal.tsx`](file:///Users/debashisroy/Documents/SpoilerAlert/frontend/src/components/QuickBidModal.tsx), [`quickBidRoutes.ts`](file:///Users/debashisroy/Documents/SpoilerAlert/backend/src/routes/quickBidRoutes.ts#L191-L197) | ⚠️ **Partial** | Mismatch detection and 403 responses work, but frontend "Switch Account" immediately bypasses the screen upon logout; unauthenticated callers can submit directly. |

---

## 2. Deep-Dive Findings & Discovered Issues

### Issue A (Critical): Quick Bids are a "Dead-End" Pipeline (Bids are never evaluated or awarded)
* **Location**: [`backend/src/routes/quickBidRoutes.ts:204-221`](file:///Users/debashisroy/Documents/SpoilerAlert/backend/src/routes/quickBidRoutes.ts#L204-L221)
* **What happens**:
  When a buyer submits a bid via `/api/bids/quick-submit`, the route pushes an object into `run.buyerOffers`:
  ```typescript
  run.buyerOffers.push({
    buyerEmail: tokenDoc.buyerEmail,
    stageIndex: tokenDoc.stageIndex ?? 0,
    lotId: tokenDoc.lotId || tokenDoc.listingId,
    offeredPrice: Number(amount),
    offeredCases: Number(cases),
    submittedAt: new Date()
  });
  await run.save();
  ```
* **The Bug**:
  A global search across the repository confirms that **`buyerOffers` is never read, displayed, or evaluated by any service, worker, or UI view**.
  - In public bidding ([`marketplaceService.placeBid`](file:///Users/debashisroy/Documents/SpoilerAlert/backend/src/services/marketplaceService.ts#L268-L270)), bids trigger [`checkBidAgainstActiveWorkflows`](file:///Users/debashisroy/Documents/SpoilerAlert/backend/src/services/agendaService.ts#L966-L1007) to test against price floors and auto-award.
  - In `quick-submit`, `checkBidAgainstActiveWorkflows` is **never invoked**.
  - As a result, private buyers submit bids that sit dormant in MongoDB while the stage timer counts down and expires into the next stage or landfill/donation fallback.

---

### Issue B (Critical): Inability of `awardBid()` to Award Private Stage Bids
* **Location**: [`backend/src/services/inventoryService.ts:365-373`](file:///Users/debashisroy/Documents/SpoilerAlert/backend/src/services/inventoryService.ts#L365-L373)
* **What happens**:
  The core transaction engine for awards strictly requires both an `Opportunity` and a `MarketplaceListing`:
  ```typescript
  const opportunity = await Opportunity.findOne({ lotId: lot._id });
  if (!opportunity) throw new Error('Opportunity not found.');

  const listing = await MarketplaceListing.findOne({ opportunityId: opportunity._id });
  if (!listing) throw new Error('Listing not found.');
  ```
* **The Bug**:
  Ticket 01 strictly requires that private stages **do NOT create `MarketplaceListing` records**. Therefore, even if a supplier or workflow tries to award a private bid, `awardBid()` will throw an uncaught exception (`"Listing not found"`).
  *(Note: In `stage_balance_carry_forward.test.ts`, this was masked because the test manually created mock `Opportunity` and `MarketplaceListing` records before calling `awardBid()`.)*

---

### Issue C (High): Missing Exclusivity Publication Lock in `publishLotToMarketplace`
* **Location**: [`backend/src/services/marketplaceService.ts:365-380`](file:///Users/debashisroy/Documents/SpoilerAlert/backend/src/services/marketplaceService.ts#L365-L380)
* **What happens**:
  `publishLotToMarketplace` only validates COA / FDA compliance. It does not check if an active `AutomationRun` exists with `status: { $in: ['evaluating', 'escalating', 'partially_awarded'] }` targeting the lot.
* **Impact**:
  If an operator or concurrent automated process calls `POST /api/v1/supplier/lots/:id/publish-marketplace`, a lot undergoing private Stage 1 bidding is immediately published to the public marketplace, breaching partner exclusivity ([ADR 0034 §2.1](file:///Users/debashisroy/Documents/SpoilerAlert/docs/adr/0034-private-stage-exclusivity-and-marketplace-broadcast-policy.md)).

---

### Issue D (Medium): Multi-Lot Workflow Quick-Bid Truncation
* **Location**: [`backend/src/services/agendaService.ts:303-304, 355-364`](file:///Users/debashisroy/Documents/SpoilerAlert/backend/src/services/agendaService.ts#L303-L364)
* **What happens**:
  When an automated liquidation stage evaluates multiple lots:
  - The email body renders all lots via `{{inventory_table}}`.
  - However, `generateQuickBidToken()` is only passed `primaryLot = effectiveMatchedLots[0]`.
* **Impact**:
  The 1-click token is tied solely to `lots[0]`. The recipient cannot select or place bids on lot 2, 3, etc., from the quick-bid modal.

---

### Issue E (Medium): Missing Payload & State Validations in `/api/bids/quick-submit`
* **Location**: [`backend/src/routes/quickBidRoutes.ts:171-202`](file:///Users/debashisroy/Documents/SpoilerAlert/backend/src/routes/quickBidRoutes.ts#L171-L202)
* **Gaps**:
  1. **Quantity & Price Validation**: Does not verify `cases > 0` or `amount > 0`. Zero or negative numbers are accepted.
  2. **Inventory Availability Check**: Does not verify whether `cases <= lot.availableQty` or whether `lot.status === 'active'`.
  3. **Workflow Run Lifecycle Check**: Does not check if `run.status === 'awarded'` or `'fallback_executed'`. If a run is finished, the route still returns `200 OK` and marks the token as used.
  4. **Activity Feed Logging**: Does not create an [`Activity`](file:///Users/debashisroy/Documents/SpoilerAlert/backend/src/models/Activity.ts) record for the supplier's Lot Operations Hub, unlike public bids.
  5. **Mongoose Mutation Tracking**: Does not call `run.markModified('buyerOffers')`, which can lead to in-memory array changes not persisting to MongoDB on `Mixed` schema types.

---

### Issue F (Medium): Frontend Account Mismatch Bypass & State Retention
* **Location**: [`frontend/src/components/QuickBidModal.tsx:81-85, 139-144`](file:///Users/debashisroy/Documents/SpoilerAlert/frontend/src/components/QuickBidModal.tsx#L81-L144), [`frontend/src/App.tsx:134-137`](file:///Users/debashisroy/Documents/SpoilerAlert/frontend/src/App.tsx#L134-L137)
* **What happens**:
  1. `isAccountMismatch` is calculated as `Boolean(currentUserEmail && buyerEmail && !areBuyerEmailsMatching(...))`.
  2. When the user clicks **Switch Account**, `auth.logout()` runs.
  3. Because `currentUserEmail` is now `null`, `isAccountMismatch` becomes `false`.
  4. The modal immediately renders the bid form and allows submission as an unauthenticated guest, bypassing the intent of having the buyer log into the target account.
  5. Closing the modal or submitting does not clean up `?token=...` from the browser URL, causing the modal to reappear on reload.

---

### Issue G (Low): HMAC Signature Never Verified
* **Location**: [`backend/src/routes/quickBidRoutes.ts:28-35`](file:///Users/debashisroy/Documents/SpoilerAlert/backend/src/routes/quickBidRoutes.ts#L28-L35)
* **What happens**:
  `generateQuickBidToken()` computes an HMAC-SHA256 signature (`rawToken.sig`). However, neither `/api/bids/quick-bid-info` nor `/api/bids/quick-submit` validates `sig`. They simply query `QuickBidToken.findOne({ token })`.

---

## 3. Recommended Changes & Remediation Plan

### Step 1: Connect Quick Bids to the Workflow Evaluation Pipeline
In [`backend/src/routes/quickBidRoutes.ts`](file:///Users/debashisroy/Documents/SpoilerAlert/backend/src/routes/quickBidRoutes.ts):
1. **Validate inputs**:
   ```typescript
   if (typeof amount !== 'number' || amount <= 0 || typeof cases !== 'number' || cases <= 0) {
     return res.status(400).json({ error: 'Valid positive amount and case quantity are required.' });
   }
   ```
2. **Check Run and Lot Status**:
   ```typescript
   if (run && ['awarded', 'fallback_executed', 'error'].includes(run.status)) {
     return res.status(400).json({ error: 'This liquidation stage is no longer active for bidding.' });
   }
   ```
3. **Trigger Workflow Evaluation**:
   Create a standard `Offer` (or stage-scoped bid record) and invoke `checkBidAgainstActiveWorkflows(lot, offer, null)` so that private bids are tested against floor pricing and can trigger auto-award or hold-confirmation.
4. **Log Activity**:
   Emit an `Activity.create({ type: 'bid_submission', subject: 'Private Quick Bid Received', ... })` so the supplier sees incoming private bids in their Lot Operations Hub.

### Step 2: Make `awardBid()` Support Unlisted Private Lots
In [`backend/src/services/inventoryService.ts`](file:///Users/debashisroy/Documents/SpoilerAlert/backend/src/services/inventoryService.ts#L365-L373):
- Allow `MarketplaceListing` to be optional when awarding a private workflow run:
  ```typescript
  const listing = await MarketplaceListing.findOne({ $or: [{ opportunityId: opportunity?._id }, { lotId: lot._id }] });
  // If private stage, listing may be null. Create award linked directly to lotId / runId instead of failing.
  ```

### Step 3: Enforce Private Stage Lock in `publishLotToMarketplace()`
In [`backend/src/services/marketplaceService.ts`](file:///Users/debashisroy/Documents/SpoilerAlert/backend/src/services/marketplaceService.ts#L365-L380):
- Add a guard against active private stage execution:
  ```typescript
  const activePrivateRun = await AutomationRun.findOne({
    snapshotInventoryIds: lot._id,
    status: { $in: ['evaluating', 'escalating', 'partially_awarded'] }
  });
  if (activePrivateRun) {
    throw new Error('Exclusivity Policy: Cannot publish lot to public marketplace while active in a private liquidation stage.');
  }
  ```

### Step 4: Fix Switch Account UX in `QuickBidModal.tsx`
In [`frontend/src/components/QuickBidModal.tsx`](file:///Users/debashisroy/Documents/SpoilerAlert/frontend/src/components/QuickBidModal.tsx):
- When `handleSwitchAccount` is triggered, log out and prompt the user with a login screen specifically for `buyerEmail`, or require authenticated state before allowing submission if an account was previously mismatched.
- On close/success, remove `token` from `window.location.search` via `window.history.replaceState`.
