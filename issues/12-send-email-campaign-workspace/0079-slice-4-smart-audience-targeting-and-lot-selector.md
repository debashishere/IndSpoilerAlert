# 0079: Slice 4 - Smart Audience Targeting and Inventory Lot Selector

## What to build

Build frontend and backend components for broadcast recipient targeting and surplus inventory selection. Sales reps must be able to select target buyer segments (or specific buyer accounts) and attach active inventory lots. Provide a broadcast preview API returning matched buyer counts, case totals, and sample payload structures prior to dispatch.

## Acceptance criteria

- [ ] Smart Audience Targeting UI control implemented allowing buyer segment filtering (e.g. *Short-Dated Grocers*) or explicit buyer multi-selection.
- [ ] Surplus Inventory Lot picker component integrated into broadcast composer allowing selection of 1 or more active lots.
- [ ] REST API endpoint `POST /api/emails/broadcast-preview` created to compute recipient counts, case totals, and preview payloads.
- [ ] Integration test suite asserting buyer segment resolution and inventory lot data extraction.

## Blocked by

- 0076: Slice 1 - EmailTemplate Schema, REST API CRUD, and Baseline Defaults
