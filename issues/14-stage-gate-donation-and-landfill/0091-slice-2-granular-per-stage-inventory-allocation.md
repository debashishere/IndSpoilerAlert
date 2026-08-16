# 0091 — Slice 2: Granular Per-Stage Inventory Allocation

**What to build:**
Enable suppliers to partition and customize the specific inventory lots allocated to each stage. Within each expanded stage card, introduce a granular **Inventory Allocation** selector allowing users to choose between *"All Matching Lots"* (inheriting the master pool matched in Section 2) or *"Custom Lot Selection"*, providing checkboxes to pick specific lots (`allocatedLotIds?: string[]`). This empowers suppliers to divide a master pool of lots among multiple donation recipients or escalation tiers.

**Blocked by:** `0090 — Slice 1: Stage Type Switcher & Polymorphic Stage Panel Transformation`

**Status:** done

- [x] Add `allocatedLotIds?: string[]` to `Stage` interfaces in frontend and backend models.
- [x] Add an "Inventory Allocation" section inside each stage card under Section 3:
  - Toggle between *"All Matching Lots ({count})"* and *"Custom Lot Subset"*.
  - When in Custom mode, render selectable lot list with title, SKU, available cases, and RSL.
- [x] Render an allocated lots badge on the stage collapsed header row (e.g., `3 of 10 Lots Allocated`).
- [x] Ensure backend and workflow storage accurately persist and load `allocatedLotIds` per stage.
- [x] Unit and component tests verifying lot allocation toggles, multi-lot selection, and state updates.
