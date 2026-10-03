# 01: Streamline Pipeline Switcher Tab Labels and Standardize Create Buyer Action

**What to build:** Operators navigating the Ingestion workspace see streamlined dataset tab labels ("Inventory", "Sales", "Buyers") stripped of the redundant "Pipeline" suffix in `PipelineSwitcherBar`. Within the "Buyers" tab action strip, the manual creation trigger is updated from "+Add Buyer" to "Create Buyer", while preserving accessibility and legacy test tokens.

**Blocked by:** None (can start immediately)

**Status:** completed

- [x] Visible tab labels in `PipelineSwitcherBar` are renamed to "Inventory", "Sales", and "Buyers".
- [x] Screen-reader and compatibility tokens are preserved for existing test assertions (`📦 Inventory Pipeline`, `💰 Sales Pipeline`, `👥 Buyer List`).
- [x] The manual buyer creation button is renamed to "Create Buyer" (`#create-buyer-btn`) and triggers the manual buyer modal.
- [x] Contextual action strip maintains `Buyer Lists` and `Create Buyer` only when `activeTab === 'buyers'`.
- [x] Existing test assertions in `IngestionSlice1Shell.test.tsx` are updated to match "Inventory", "Sales", "Buyers", and "Create Buyer".
