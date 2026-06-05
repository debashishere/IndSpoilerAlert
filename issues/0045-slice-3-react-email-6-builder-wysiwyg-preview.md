# 0045 - Code-First React Email 6.0 Block Builder & Live Device Preview

## What to build

Implement a modern React Email 6.0 style code-first Email Builder component integrated within `LiquidationAutomationStudio.tsx`. Provide a modular block toolkit (Header, Text Paragraph, `{{inventory_table}}` placeholder config, CTA Button, Logistics & Compliance Footer) with visual reordering controls (Move Up, Move Down, Duplicate, Delete). Add quick-click token injector pills (`{{inventory_table}}`, `{{buyer_name}}`, `{{discount_percent}}`, `{{offer_expiry_hours}}`) and a dual view switcher between **Block Edit Mode** and **Live WYSIWYG Device Preview** (Desktop & Mobile viewports).

## Acceptance criteria

- [ ] Email Builder renders structured blocks with design token styling and block manipulation toolbar (Up, Down, Duplicate, Delete).
- [ ] Token Injector Pills insert dynamic context variables (`{{inventory_table}}`, `{{buyer_name}}`, `{{expiration_window}}`) into block text fields.
- [ ] `{{inventory_table}}` block config enables toggling table columns (Product SKU, Description, Quantity Cases, Expiration Date, MSRP, Discount Price).
- [ ] Live Device Preview toggle switches between Block Editor and Desktop/Mobile HTML frame view with sample lot data rendered live.
- [ ] Starter preset buttons load pre-built email templates (*Short-Dated Clearance*, *Category FEFO Fast-Track*, *FDA COA Verified Exclusive*).

## Blocked by

- [0043 - Backend Campaign Status & Persistence REST Endpoints](file:///Users/debashisroy/Documents/SpoilerAlert/issues/0043-slice-1-backend-campaign-status-persistence-api.md)
