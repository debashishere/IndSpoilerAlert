# 0122: Slice 4 - Sales Pipeline Modern Grid & Progressive Inspection Drawer

**What to build:**
Rebuild the Sales Pipeline table view to match the Stitch enterprise layout and progressive disclosure architecture:
1. Dedicated Sales Filter Bar:
   - Row 1: Search Sales, Lot Number, Buyer select, Distribution Center select, Create Date.
   - Row 2: Price Range select, Sales Status select, and live ERP clearing record count badge.
2. Modern table header and rows: Product/SKU, Lot #, Buyer/Customer, Distribution Center, Qty Sold, Price Details, Total Revenue, Dates, and Inspect chevron.
3. Row click toggles the in-situ **Progressive Row Inspection Drawer** displaying:
   - Logistics & Dispatch: Contract number, tracking carrier, delivery window / pickup terms.
   - Audit & Date Logs: Date recorded, create UTC timestamp, update UTC timestamp.
   - Financial Remittance: Gross sale, net remitted / escrow funding status.
   - Contextual Action CTAs: "Reconcile Invoice", "Authorize Dock Gate Pass", "Live Fleet Telemetry".
4. Synchronized with the master `Toggle All` button.

**Blocked by:** `0119-slice-1-ingestion-shell-telemetry-connectors-and-master-tab-bar`

**Status:** completed

- [x] Sales filter controls accurately filter records by keyword, lot number, buyer name, DC warehouse, price bracket, and status.
- [x] Table rows render styled SKU badges, buyer node indicators, monospace currency formatting, and chevron toggles.
- [x] Clicking a sales row or chevron smoothly expands/collapses the Progressive Row Inspection Drawer.
- [x] Inspection drawer renders logistics telemetry, date audit logs, remittance breakdown, and action triggers.
- [x] Master "Toggle All" toggles all visible sales inspection drawers.
- [x] Unit tests verify filtering, row expansion, action handling, and pagination.
