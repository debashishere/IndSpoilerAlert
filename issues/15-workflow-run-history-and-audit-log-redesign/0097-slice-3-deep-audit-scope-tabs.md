# 0097 — Slice 3: Granular Scope Tabs (Strategy Snapshot, Inventory Lots, Comms Log, & Bids Ledger)

**What to build:**
Equip the full-screen execution audit inspector (`WorkflowRunAuditModal.tsx`) with 4 granular audit tabs enabling deep, "A-to-Z" forensic investigation into how a workflow executed.

**Blocked by:** 0096 — Slice 2: Full-Screen "A to Z" Execution Audit Inspector & Stage-Gate Stepper

**Status:** completed

- [x] **Strategy Snapshot Tab**: Render the exact immutable configuration of the workflow active at dispatch (Category filter, Max RSL %, Min Cases, Stage Gate discount schedules, wait hours, auto-execute flags).
- [x] **Inventory Scope Tab**: Render itemized data table of all evaluated lots and SKUs (Lot Number, SKU, Description, Cases Count, Remaining Shelf Life %, Valuation) with direct deep-links to Lot Hub.
- [x] **Communications Log Tab**: Render itemized ledger of partner outreach emails sent (Recipient Email / Company, Timestamp, OAuth Gmail delivery status).
- [x] **Bids & Offers Ledger Tab**: Render buyer bids evaluation table (Buyer Name, Target SKU, Bid / Case, Cases Offered, Total Valuation, Status), clearly highlighting the winning bid.
- [x] Unit and component tests verifying tab switching, correct data extraction, and empty states.
