# Issue #61: Slice 2 - Run History Execution Metrics Grid & Snapshot Lot Summary Card

## What to build

Enhance historical execution cards in "Run History & Audit Log" to render a full 4-card metric grid (Total Cases & Snapshot Lots, Total Bids Received, Winning Bid per Case, Total Revenue Recovered) alongside interactive snapshot SKU/lot tags, matching the layout structure of Active Workflow Evaluations.

## Acceptance criteria

- [ ] Each history card displays a 4-card metrics grid: Total Cases & Snapshot Lots, Total Bids Received, Winning Bid per Case ($/case), and Total Revenue Recovered ($).
- [ ] Card header displays a prominent summary pill: `Status` • `Dispatched / Resolved Timestamp ("When")` • `Total Cases` • `Total Recovery ($)`.
- [ ] Snapshot inventory lot IDs are rendered as interactive SKU tags that reveal lot details when hovered or clicked.
- [ ] Winning bid values correctly reflect accepted buyer offers or highest bid evaluations recorded in resolution logs.

## Blocked by

- Issue #60
