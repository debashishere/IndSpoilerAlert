# 04: Top Warehouses / DCs Expandable Accordion & Fulfillment Drilldown

**What to build:** An interactive fulfillment clearing performance view in the `Top Warehouses / DCs` sub-tab displaying ranked distribution center cards that expand inline to reveal full-width clearance ledgers with in-table search, purchasing buyer destination tags, recovery yields, and direct Lot Operations Hub deep links.

**Blocked by:** 02: Sales & Clearing Sub-Navigation Shell & Overview Isolation

**Status:** complete

- [x] Top Warehouses / DCs list renders ranked summary cards showing rank badge, warehouse name/location, cleared revenue ($), case volume, recovery % badge, and cleared transaction count.
- [x] Clicking any warehouse card smoothly expands an inline accordion displaying an itemized child transaction table.
- [x] Child transaction table displays columns: Sale Date, Invoice / Lot #, Product Description & Brand, Purchasing Buyer, Cases Cleared, Price/Case, Cleared Revenue, Recovery %, and Delivery Status.
- [x] Embedded search input within the expanded card filters that facility's cleared transactions by SKU, lot number, product name, or buyer.
- [x] Clicking a Lot # inside the transaction table invokes the Lot Operations Hub (`onOpenLotHub`) for in-situ batch inspection.
- [x] Multiple warehouse cards can be expanded or collapsed independently without losing page scroll or filter state.
