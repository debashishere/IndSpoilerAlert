# 03: Top Buyers Expandable Accordion & Transaction Drilldown

**What to build:** An interactive buyer closeout performance view in the `Top Buyers` sub-tab displaying ranked buyer summary cards that expand inline to reveal full-width transaction ledgers with in-table search, closeout recovery metrics, and direct Lot Operations Hub deep links.

**Blocked by:** 02: Sales & Clearing Sub-Navigation Shell & Overview Isolation

**Status:** complete

- [x] Top Buyers list renders ranked summary cards showing rank badge, buyer company name, segment badge, total spent ($), case volume, share % badge, and transaction count.
- [x] Clicking any buyer card smoothly expands an inline accordion displaying an itemized child transaction table.
- [x] Child transaction table displays columns: Sale Date, Invoice / Lot #, Product Description & Brand, Cases, Price/Case, Total Revenue, Fulfillment Facility, COGS Recovery %, and Delivery Status.
- [x] Embedded search input within the expanded card filters that buyer's transactions by SKU, lot number, or product name in real time.
- [x] Clicking a Lot # inside the transaction table invokes the Lot Operations Hub (`onOpenLotHub`) for in-situ batch inspection.
- [x] Multiple buyer cards can be expanded or collapsed independently without losing page scroll or filter state.
