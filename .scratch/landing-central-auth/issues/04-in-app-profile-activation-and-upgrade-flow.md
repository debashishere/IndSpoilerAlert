# 04 — In-App Profile Activation & Upgrade Flow

**What to build:** In-app cross-role activation flow enabling seamless upgrade from Buyer to Supplier or Supplier to Buyer without re-registration. Suppliers seeing the Marketplace get a prompt/option to `"Become a Buyer"` (activating bidding capabilities), while Buyers accessing Settings get a `"Become a Supplier"` section that unlocks Ingestion, Inventory, and Workflows.

**Blocked by:** 01 — Central Firebase Auth & Dual-Profile State System, 02 — Public Landing Page & Single Launch CTA, 03 — Role-Gated Navigation & Module Matrix.

**Status:** completed

- [x] Supplier Marketplace view includes `"Become a Buyer to Bid"` activation prompt if `buyerProfile` is inactive
- [x] Settings view includes `"Become a Supplier"` option for Buyer-only accounts
- [x] Activating `supplierProfile` immediately unlocks Ingestion, Inventory, and Workflows in navigation
- [x] Profile state updates dynamically saved to backend user session without requiring page reload
