# 02 — Bid Action Inspector with Mode-Driven Actions & Decline Flow

**What to build:** 
A full-size modal window that opens when clicking a bid row in the Bid & Offer Workspace. The inspector introduces 3 primary mode tabs: `[✓ Accept Offer]`, `[⇄ Re-negotiate / Counter]`, and `[✕ Decline Offer]`. This ticket delivers the complete end-to-end Decline workflow (mandatory decline reason dropdown and rationale notes, updating offer status to `rejected`, logging to the lot CRM timeline) and provides a test utility to reset/override bid status so test bids can be re-actioned.

**Blocked by:** 01 — Unified Lot Bids Query & Operation Hub Bid & Offer Workspace List View

**Status:** completed

- [x] Full-size "Bid Action Inspector" modal opens upon clicking any bid row in the Bid & Offer list view, displaying the active bid details, buyer info, and lot summary header.
- [x] Top navigation renders 3 action mode buttons: `[✓ Accept Offer]`, `[⇄ Re-negotiate / Counter]`, and `[✕ Decline Offer]`.
- [x] Switching to `Decline Offer` mode presents a mandatory decline reason selector (e.g., Price below minimum recovery floor, Inventory committed elsewhere, Logistics/pickup constraint, or Custom rationale).
- [x] Backend endpoint `POST /api/bids/:id/decline` updates the offer status to `rejected`, records the decline rationale in the offer history, and creates an audit entry in the lot CRM timeline.
- [x] Adaptive bid lifecycle handling allows overriding/resetting test bids back to `pending` via an explicit action control.
- [x] Decline flow emits feedback toast, updates the bid list row status badge, and closes or refreshes the inspector.
