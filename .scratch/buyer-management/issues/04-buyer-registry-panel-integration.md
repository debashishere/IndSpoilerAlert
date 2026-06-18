# 04 — Buyer Registry Panel integration

**What to build:** Wire the BuyerRegistryPanel to the two new components (Buyer Detail Drawer, Buyer List Manager) and update the buyer rows to reflect deactivation and opt-out state.

**Blocked by:** 02 — Buyer Detail Drawer, 03 — Buyer List Manager modal

**Status:** completed

## Changes to BuyerRegistryPanel.tsx

### Header area
- Add "Buyer Lists" button to the right of "Add Buyer Manually"
  - Style: outlined, consistent with existing CSV Import button
  - onClick → opens BuyerListManager modal

### Buyer row — clickability
- Each row becomes fully clickable (cursor pointer, hover highlight)
- onClick → sets `selectedBuyer` state → renders `<BuyerDetailDrawer buyer={selectedBuyer} />`

### Buyer row — status indicators
Inactive buyer row:
- Text colour muted (50% opacity)
- "Inactive" red badge appended after the company name
- Excluded from the default filtered view (add a toggle "Show inactive buyers" that hits `?all=true`)

Active buyer with opt-out(s):
- Small amber pill(s) on the right: "No Bidding" / "No Sales" matching which flags are off
- These are informational only; the row stays fully clickable

### State wiring
- On mount, dispatch `fetchBuyerLists()` so the drawer's list-membership checkboxes and the manager's directory are ready
- After BuyerDetailDrawer saves/deactivates/reactivates, call `fetchCoreReferenceData()` to refresh both buyers and lists in one shot

## Acceptance criteria
- [x] "Buyer Lists" button present in header; opens BuyerListManager modal
- [x] Clicking any buyer row opens the Buyer Detail Drawer for that buyer
- [x] Inactive buyers are visually muted with an "Inactive" badge
- [x] Opt-out badges ("No Bidding", "No Sales") appear on relevant rows
- [x] "Show inactive buyers" toggle fetches `?all=true` and shows full registry
- [x] Drawer close refreshes the buyer list in the panel
- [x] TypeScript reports zero errors

