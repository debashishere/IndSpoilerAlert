# 01: Core Final Price Data Pipeline & Operation Hub Bid List Dual-Figure Presentation

**What to build:** Persist and expose the negotiated Final Unit Price (`finalPrice`) across the backend data pipeline and the Operation Hub Bid List view. When an offer is awarded or accepted (via supplier acceptance or buyer counter acceptance), persist `finalPrice` on the `Offer` entity while retaining the immutable baseline bid price (`price`). In the Operation Hub Bid List view (`LotOperationsHubView`), accepted bids with negotiated terms display a stacked dual-figure unit price (prominent green settled price with subtitle initial bid reference) and compute Total Recovery from the finalized terms.

**Blocked by:** None (can start immediately)

**Status:** completed

- [x] Add `finalPrice?: number` to `Offer` schema and model definitions.
- [x] On offer acceptance in `offersService.acceptBid` and `portalController.acceptCounterProposal`, persist `offer.finalPrice = pricePerCase`.
- [x] In `inventoryService.getBids` and `offersService.getAllOffers`, return `finalPrice`, falling back to `award.price` if `offer.finalPrice` is not yet set.
- [x] In the Operation Hub Bid List view, render a stacked dual-figure unit price for accepted bids where `finalPrice` differs from `price` (prominent green settled price `$30.00/cs` with `Settled` tag, plus `Initial: $29.00/cs` subtext).
- [x] In the Operation Hub Bid List view, recalculate `Total Recovery` from the settled terms (`finalPrice * awardedQty`).
- [x] Automated tests verify `finalPrice` persistence, legacy fallback, and list view dual-figure rendering.

