# 01 — Private Stage Exclusivity Enforcement & Quick Bid Routing

**What to build:** Ensure that when a Liquidation Stage targeting specific/customized buyers executes, the evaluated inventory lots remain strictly unlisted on the public marketplace. Private recipients can submit bids solely through private, tokenized 1-click action links (`{{quick_bid_link}}`), preventing public buyers from discovering or bidding on private stage lots.

**Blocked by:** None — can start immediately

**Status:** In Progress (Audit Complete — Code Remediation Identified)
**Audit Report:** [ticket_01_implementation_audit_report.md](../ticket_01_implementation_audit_report.md)
**Target Policy:** [ADR 0034: Private Stage Exclusivity & Marketplace Broadcast Policy](../../../docs/adr/0034-private-stage-exclusivity-and-marketplace-broadcast-policy.md)

---

## 1. Acceptance Criteria & Implementation Status

- [x] **Private Stage Marketplace Isolation**: Private liquidation stage execution does NOT create or activate public `MarketplaceListing` records.
- [x] **Tokenized 1-Click Action Links**: Direct email dispatches include secure, tokenized `{{quick_bid_link}}` tailored to the workflow run and recipient.
- [x] **Scoped Bid Ingestion**: Bids received through private bid links are scoped strictly to the originating workflow run and stage execution.
- [x] **Marketplace Search Filter Tests**: Unit and integration tests verify that lots under active private stage execution do not appear in public marketplace search endpoints (`GET /api/v1/marketplace/listings`).
- [x] **Account Mismatch Detection**: Quick bid modal detects session mismatches between the authenticated profile (`useAuth().user.email`) and target token recipient (`QuickBidToken.buyerEmail`).
  - Renders explicit **Account Mismatch** blocking screen with 1-click **Switch Account / Log Out** action.
  - Prevents overwriting Redux buyer authentication with conflicting credentials.
  - Backend `/api/bids/quick-submit` validates active session / buyer identity against `tokenDoc.buyerEmail` and rejects mismatched callers with `403 Forbidden`.

---

## 2. Remediation Checklist (Critical Gaps Identified in Audit)

- [ ] **A. Connect Quick Bids to Workflow Evaluation & Auto-Award Engine**
  - In `quickBidRoutes.ts:quick-submit`, create an active `Offer` document and invoke `checkBidAgainstActiveWorkflows(lot, offer, null)` so private bids pass floor price checks and trigger auto-awards or hold-confirmations.
  - Emit an `Activity` record (`type: 'bid_submission'`) so private bids appear on the supplier's Lot Operations Hub.
- [ ] **B. Support Unlisted Private Lots in `awardBid()` and Schemas**
  - Relax `MarketplaceListing` requirement in `Award.ts` and `Offer.ts` (allow `listingId` to be optional, add direct `lotId` / `runId` references).
  - In `inventoryService.ts:awardBid()`, permit awards when `MarketplaceListing` is null for private stage lots, executing lot quantity decrements, stage balance updates, PO/BOL generation, and buyer email dispatch without throwing `"Listing not found"`.
- [ ] **C. Enforce Active Stage Exclusivity Lock in `publishLotToMarketplace()`**
  - In `marketplaceService.ts:publishLotToMarketplace()`, check if the lot belongs to an active `AutomationRun` currently executing a private stage (`evaluating`, `partially_awarded`, `escalating`).
  - Reject manual or programmatic attempts to publish an active private lot to the marketplace with an Exclusivity Policy Violation error.
- [ ] **D. Input Validation & Lifecycle Guards in `/api/bids/quick-submit`**
  - Validate `amount > 0` and `cases > 0`.
  - Validate that `cases <= lot.availableQty` and `lot.status === 'active'`.
  - Validate that `run.status` is not in terminal states (`'awarded'`, `'fallback_executed'`, `'failed'`, `'error'`).
  - Ensure `run.markModified('buyerOffers')` is called so Mongoose persists the push on Mixed types.
- [ ] **E. Fix Switch Account Auth Bypass & URL Cleanup in `QuickBidModal.tsx`**
  - In `QuickBidModal.tsx`, prevent logging out from immediately resetting `isAccountMismatch` to false and rendering the submission form as an unauthenticated guest. Require explicit authentication matching `buyerEmail`.
  - Strip `?token=...` from the browser URL when closing the modal or on successful bid submission via `window.history.replaceState`.

---

## 3. Recommended Code-Level Changes

### 3.1 Data Model Schema Relaxation (`Offer.ts` & `Award.ts`)
```typescript
// backend/src/models/Offer.ts
const OfferSchema: Schema = new Schema({
  listingId: { type: Schema.Types.ObjectId, ref: 'MarketplaceListing', required: false },
  lotId: { type: Schema.Types.ObjectId, ref: 'InventoryLot' },
  runId: { type: Schema.Types.ObjectId, ref: 'AutomationRun' },
  buyerId: { type: Schema.Types.ObjectId, ref: 'Buyer', required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'countered', 'rejected', 'partially_accepted', 'fully_accepted'], default: 'pending' },
  awardedQty: { type: Number, default: 0 },
  submittedAt: { type: Date, default: Date.now },
  messages: { type: Array, default: [] }
});

// backend/src/models/Award.ts
const AwardSchema: Schema = new Schema({
  listingId: { type: Schema.Types.ObjectId, ref: 'MarketplaceListing', required: false },
  lotId: { type: Schema.Types.ObjectId, ref: 'InventoryLot' },
  offerId: { type: Schema.Types.ObjectId, ref: 'Offer', required: true },
  buyerId: { type: Schema.Types.ObjectId, ref: 'Buyer', required: true },
  awardedQty: { type: Number, required: true },
  price: { type: Number, required: true },
  emailSent: { type: String },
  poPdfUrl: { type: String },
  approvedDate: { type: Date, default: Date.now }
});
```

### 3.2 `awardBid()` in `backend/src/services/inventoryService.ts`
```typescript
export async function awardBid(
  lotId: string,
  bidId: string,
  emailSent?: string,
  emailSubject?: string,
  awardedQty?: number
) {
  const lot = await InventoryLot.findById(lotId);
  if (!lot) throw new Error('Inventory Lot not found.');

  const offer = await Offer.findById(bidId);
  if (!offer) throw new Error('Bid (Offer) not found.');

  const buyer = await Buyer.findById(offer.buyerId);
  if (!buyer) throw new Error('Buyer not found.');

  // For unlisted private lots, opportunity and marketplace listing are optional
  const opportunity = await Opportunity.findOne({ lotId: lot._id });
  const listing = opportunity
    ? await MarketplaceListing.findOne({ opportunityId: opportunity._id })
    : await MarketplaceListing.findOne({ lotId: lot._id });

  // ... (Award record creation with listingId: listing?._id, lotId: lot._id) ...
  // ... (Safe handling of listing.availableQuantity / opportunity updates only if present) ...
}
```

### 3.3 Quick Bid Route Evaluation Hook (`backend/src/routes/quickBidRoutes.ts`)
```typescript
// Validate payload
const numAmount = Number(amount);
const numCases = Number(cases);
if (isNaN(numAmount) || numAmount <= 0 || isNaN(numCases) || numCases <= 0) {
  return res.status(400).json({ error: 'Valid positive amount and case quantity are required.' });
}

// Check lot and run state
const lot = await InventoryLot.findById(tokenDoc.lotId || tokenDoc.listingId);
if (!lot || lot.status !== 'active') {
  return res.status(400).json({ error: 'Inventory lot is no longer active or available.' });
}
if (numCases > lot.availableQty) {
  return res.status(400).json({ error: `Requested quantity (${numCases}) exceeds available quantity (${lot.availableQty}).` });
}

// Create Offer & invoke evaluation
const offer = await Offer.create({
  lotId: lot._id,
  runId: tokenDoc.runId || undefined,
  buyerId: buyer._id,
  quantity: numCases,
  price: numAmount,
  status: 'pending'
});

const { checkBidAgainstActiveWorkflows } = await import('../services/agendaService');
await checkBidAgainstActiveWorkflows(lot, offer, null);
```

### 3.4 Exclusivity Lock in `backend/src/services/marketplaceService.ts`
```typescript
export async function publishLotToMarketplace(lotId: string) {
  const lot = await InventoryLot.findById(lotId);
  if (!lot) throw new Error('Inventory Lot not found.');

  // Exclusivity Policy Guard (ADR 0034 §2.1)
  const activePrivateRun = await AutomationRun.findOne({
    snapshotInventoryIds: lot._id,
    status: { $in: ['evaluating', 'partially_awarded', 'escalating'] }
  });
  if (activePrivateRun) {
    const LiquidationAutomation = (await import('../models/LiquidationAutomation')).default;
    const automation = await LiquidationAutomation.findById(activePrivateRun.automationId);
    const currentStage = automation?.stages?.[activePrivateRun.currentStageIndex ?? 0];
    const isPublicBroadcastStage = currentStage?.buyerType === 'all_buyers' || currentStage?.targetChannel === 'marketplace';
    if (!isPublicBroadcastStage) {
      throw new Error('Exclusivity Policy: Cannot publish lot to public marketplace while active in a private liquidation stage.');
    }
  }
  // ... proceed to COA verification and listing creation
}
```

### 3.5 Modal UX and Auth Gating in `frontend/src/components/QuickBidModal.tsx`
- Maintain an `isSwitchingAccount` or `requiresTargetLogin` state when "Switch Account" is clicked.
- Do not render the guest bid input form when an account switch is in progress; display a login prompt targeting `buyerEmail`.
- Remove `token` and `quickBidToken` from the browser URL upon modal dismissal or successful submission.
