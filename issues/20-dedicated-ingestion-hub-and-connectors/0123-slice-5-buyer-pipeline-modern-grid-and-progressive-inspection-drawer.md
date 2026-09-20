# 0123: Slice 5 - Buyer Pipeline Modern Grid & Progressive Inspection Drawer

**What to build:**
Rebuild the Buyer Pipeline table view to match the Stitch enterprise layout, integrating with the full profile drawer and management modals:
1. Buyer Pipeline Subheader: Displays title, count of verified buyers, and action buttons:
   - "Buyer Lists" (opens `BuyerListManagerModal`)
   - "Import CSV" (opens `UnifiedIngestionModal` with target preselected to `buyer`)
   - "+ Add Buyer" (opens `AddBuyerModal` form)
2. Dedicated Buyer Filter Bar: Search Buyer input, Buyer Tier select, Status & Channel select, and "Show Inactive Buyers" checkbox.
3. Modern table layout: Company/Buyer Name, Contact Email, Buyer Tier, Preferences & Channel, Create Date, Update Date, Status, and Inspect chevron.
4. Row click toggles the in-situ **Progressive Row Inspection Drawer** showing:
   - Procurement Officers (name, corporate title, contact email)
   - Categories / Specialty Criteria (accepted remnants, allergen filters, zero-waste tags)
   - Hub Facilities (assigned distribution centers)
   - Tender Action CTAs: "Send Lot Tender", "Forward Short-Dated Offers", "Route Zero-Waste Donation"
   - Explicit **"Edit Buyer Profile"** button opening the slide-over `BuyerDetailDrawer` for full editing.
5. Synchronized with the master `Toggle All` button.

**Blocked by:** `0119-slice-1-ingestion-shell-telemetry-connectors-and-master-tab-bar`

**Status:** ready-for-agent

- [x] Buyer filter controls filter by keyword, tier, channel status, and inactive inclusion.
- [x] Subheader action buttons correctly launch `BuyerListManagerModal`, `UnifiedIngestionModal`, and the Add Buyer form modal.
- [x] Clicking a buyer row toggles the inline Progressive Row Inspection Drawer.
- [x] Drawer displays procurement contacts, category criteria, hub facilities, and tender buttons.
- [x] Clicking "Edit Buyer Profile" in the drawer opens the comprehensive `BuyerDetailDrawer`.
- [x] Master "Toggle All" toggles all visible buyer inspection drawers.
- [x] Unit tests verify filtering, modal launching, drawer expansion, and profile drawer integration.
