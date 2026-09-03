# 03 — Compliance Hold Gate & Supplier Document Alerts

**What to build:** Implement a compliance verification gate when publishing inventory lots to the public marketplace. When lots are targeted for open marketplace listing (via an "All Buyers" stage or marketplace fallback), lots with verified COA/Batch records publish immediately, while unverified FDA-regulated lots enter a `compliance_hold` state accompanied by an urgent supplier alert/action item.

**Blocked by:** 01 — Private Stage Exclusivity Enforcement & Quick Bid Routing

**Status:** complete

- [x] `publishLotToMarketplace` verifies compliance status without blocking unaffected compliant lots in a multi-lot batch.
- [x] Lots lacking verified compliance docs enter a structured `compliance_hold` state in the execution run.
- [x] An actionable alert/notification is generated for the supplier to upload and verify required COA/compliance docs.
- [x] Upon document verification, held lots auto-promote to active marketplace listings if the broadcast window is still active.
