# 02 — Itemized Inventory Table HTML & Multi-Lot Title Formatting

**What to build:** Dynamically format `lot_title` and `inventory_table` for the email preview context. For a single lot, display its description; for multiple lots, display the primary lot title with a `(+N additional lots)` badge. For `inventory_table`, render an itemized HTML table listing matched lots (SKU, Description, Quantity, Expiry/RSL) or a clean empty row message `[No Inventory Selected]` when 0 lots are matched.

**Blocked by:** 01 — Dynamic Workflow Context Computation & Empty Fallback Placeholders

**Status:** done

- [x] Single lot selection formats `lot_title` as exact lot description.
- [x] Multiple lot selections format `lot_title` as primary lot description with `(+N additional lots)`.
- [x] `inventory_table` dynamically generates clean HTML table markup with SKU, Title, Available Qty, and Expiry/RSL for matched lots.
- [x] 0 matched lots renders an empty row notice inside the inventory table template tag.
- [x] Automated tests verify HTML table generation and lot title formatting across 0, 1, and multiple lot scenarios.
