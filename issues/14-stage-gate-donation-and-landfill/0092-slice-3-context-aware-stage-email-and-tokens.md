# 0092 — Slice 3: Context-Aware Stage Email Presets & Dynamic Token Interpolation

**What to build:**
Adapt the stage email authoring workflow and backend dispatch engine to the stage's operational type (`stageType`). When a stage is configured as Donation or Landfill, `StageEmailModal` and backend email generation apply purpose-tailored templates, filter out commercial pricing tokens, resolve `{{inventory_table}}` to render only the lots allocated to that stage, and resolve timing tokens (`{{expiry_hours}}`, `{{offer_expiration_time}}`, `{{disposal_deadline}}`) contextually.

**Blocked by:** `0091 — Slice 2: Granular Per-Stage Inventory Allocation`

**Status:** ready-for-agent

- [x] Add default email templates for Donation (*"Surplus Food Inventory Donation Transfer Offer"*) and Landfill (*"Scheduled Surplus Inventory Disposal & Removal Authorization"*).
- [x] In `StageEmailModal`, pre-populate appropriate default templates and subject lines when opening for a Donation or Landfill stage if no custom email has been saved.
- [x] In backend email interpolation (`agendaService.ts` / email controllers):
  - Resolve `{{current_stage_discount}}` to *"Surplus Donation Transfer (Complimentary)"* for Donation or *"Scheduled Removal & Disposal"* for Landfill.
  - Resolve `{{expiry_hours}}` and `{{offer_expiration_time}}` to the configured response window.
  - Resolve `{{disposal_deadline}}` to the formatted date string.
  - Render `{{inventory_table}}` using only `stage.allocatedLotIds` when specified (falling back to matching lots).
- [x] Unit and backend integration tests validating token interpolation across Liquidation, Donation, and Landfill stages.
