# 01 — Unified Lot Bids Query & Operation Hub Bid & Offer Workspace List View

**What to build:** 
Ensure all bids associated with an inventory lot—whether submitted through private liquidation workflows or public marketplace listings—are properly retrieved by the backend and displayed in Operation Hub. Replace the dual-panel layout in Operation Hub with a single, clean "Bid & Offer" list view equipped with status filters, search, and key commercial metrics for each offer.

**Blocked by:** None — can start immediately.

**Status:** completed

- [x] Backend `/api/inventory/:id/bids` retrieves offers matching either `lotId: id` or `listingId: listing._id` without failing when a public marketplace listing does not exist.
- [x] Private workflow bids (e.g. bid from `debashisroe1996@gmail.com` on Lot #11) appear in Operation Hub with populated buyer details.
- [x] Dual panels in `LotOperationsHubView.tsx` ("Incoming Bids & Offers" and "Live Negotiation Chat") are unified into a single full-width section titled "Bid & Offer".
- [x] Bids render in a responsive list view with buyer company, email, unit price, quantity, total recovery value, submission timestamp, and status badges.
- [x] Interactive status filters (`All`, `Pending`, `Countered`, `Awarded`, `Declined`) and search filter records accurately.
- [x] Selecting a bid row triggers the inspector action target.
