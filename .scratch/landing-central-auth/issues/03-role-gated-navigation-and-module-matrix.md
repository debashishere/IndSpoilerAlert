# 03 — Role-Gated Navigation & Module Matrix

**What to build:** Navigation system enforcing module visibility according to the role access matrix: Buyer Marketplace, Inbox, and Settings are common modules rendered for both Buyers and Suppliers. Ingestion, Inventory, and Workflows are strictly hidden from Buyer-only accounts.

**Blocked by:** 01 — Central Firebase Auth & Dual-Profile State System, 02 — Public Landing Page & Single Launch CTA.

**Status:** ready-for-agent

- [ ] Navigation header/sidebar rendering common modules (**Marketplace**, **Inbox**, **Settings**) for all authenticated users
- [ ] Role guard hiding Supplier-only modules (**Ingestion**, **Inventory**, **Workflows**) from Buyer-only accounts
- [ ] Supplier accounts can access Supplier modules while also viewing the Buyer Marketplace
- [ ] Clean redirect handling if a user attempts to access a guarded supplier route without a supplier profile
