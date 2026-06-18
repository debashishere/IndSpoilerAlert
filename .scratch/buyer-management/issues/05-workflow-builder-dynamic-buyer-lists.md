# 05 — Workflow Builder — dynamic Buyer List targeting

**What to build:** Replace the hardcoded `SEGMENT_OPTIONS` constant in LiquidationAutomationStudio with live Buyer Lists fetched from the API. Stage-gate targeting becomes: pick a Buyer List (Primary, Secondary, or any Custom list) instead of a fixed segment key. The `SEGMENT_OPTIONS` constant is deleted entirely.

**Blocked by:** 01 — Buyer API service layer

**Status:** ready-for-agent

## Domain note
This ticket closes the gap identified in the grilling session: the `buyerSegment` field (values like `tier1_retailers`, `all_liquidators`) was a placeholder predating the Buyer List Registry. It is superseded entirely by named Buyer Lists.

## Changes in LiquidationAutomationStudio.tsx

### Stage interface update
Replace:
```
buyerMode: 'segment' | 'custom'
buyerSegment: string
```
With:
```
buyerMode: 'list' | 'custom'
buyerListId: string      // BuyerList._id — used when buyerMode === 'list'
buyerListName: string    // display label for the selected list
customBuyers: BuyerEntry[]
```

### SEGMENT_OPTIONS constant
Delete the entire constant. It is replaced by the live `buyerLists` array from `selectBuyerLists`.

### DEFAULT_STAGES and WORKFLOW_TEMPLATES
Update every hardcoded stage to use `buyerMode: 'list'` with a sentinel `buyerListId: 'primary'` and `buyerListName: 'Primary Buyers'` (the first list seeded). At runtime, the StageAudiencePicker will resolve this to the actual Primary list ID from state.

### StageAudiencePicker component
- Dropdown now renders `buyerLists` from Redux (`useAppSelector(selectBuyerLists)`)
- Each option: `<list.name> — <member count> buyers` (count from `list.buyerIds.length`)
- `onChange` sets `buyerListId` + `buyerListName` on the stage
- "Custom selection" option preserved at the bottom of the dropdown for the `buyerMode: 'custom'` path

### getStageBuyerCount function
- `buyerMode === 'list'` → find matching list in the passed `buyerLists` array by ID → return `list.buyerIds.length`
- `buyerMode === 'custom'` → unchanged (return `customBuyers.length`)
- Remove all segment-based counting logic

### Saving / persistence
When a workflow is saved to the backend (`/liquidation-automations`), stages now carry `buyerListId` and `buyerListName` instead of `buyerSegment`. The backend `LiquidationAutomation` schema stores stage data as `Schema.Types.Mixed`, so no backend schema migration is needed — the new field names simply persist as-is.

## Acceptance criteria
- [ ] `SEGMENT_OPTIONS` constant is gone; no reference to `tier1_retailers`, `all_liquidators`, etc. remains
- [ ] Stage buyer dropdown shows live Buyer Lists from Redux; member counts are accurate
- [ ] Selecting a list sets `buyerListId` + `buyerListName` on the stage
- [ ] `getStageBuyerCount` returns the correct count for list-mode stages
- [ ] Saving a workflow persists the new field names without error
- [ ] Loading a saved workflow with old `buyerSegment` data renders gracefully (unknown segment → "Select a list" placeholder, does not crash)
- [ ] TypeScript reports zero errors
