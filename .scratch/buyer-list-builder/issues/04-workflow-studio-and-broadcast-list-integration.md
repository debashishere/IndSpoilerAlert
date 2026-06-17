# 04 — Workflow Studio & Broadcast List Integration

**What to build:** Synchronize populated Buyer Lists into Stage-Gate Automation Workflows (`LiquidationAutomationStudio.tsx`) and Ad-Hoc Email Broadcasts (`SendBroadcastView.tsx`), ensuring campaign stage dispatch dynamically resolves recipient lists at runtime.

**Blocked by:** 02 — Buyer Ingestion List Registry UI & List CRUD

**Status:** ready-for-agent

- [ ] Fetch and expose all `BuyerList` entities (`Primary Buyers`, `Secondary Buyers`, and custom lists) inside the buyer selection dropdowns for each stage step in `LiquidationAutomationStudio.tsx`.
- [ ] Populate `BuyerList` options into the smart audience selector in `SendBroadcastView.tsx`.
- [ ] Verify that campaign stage dispatch and broadcast dispatch correctly resolve buyer emails and `{{buyer_name}}` template tokens dynamically from list members at execution time.
- [ ] Ensure Zero-Buyer stage validation rules trigger appropriately if a selected buyer list contains 0 buyers.
