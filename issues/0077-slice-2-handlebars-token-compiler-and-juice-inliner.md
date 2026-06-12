# 0077: Slice 2 - Handlebars Token Compiler and Juice CSS Inliner Engine

## What to build

Build an email compilation service that processes email templates using Handlebars.js for dynamic token interpolation (`{{buyer_name}}`, `{{inventory_table}}`, `{{quick_bid_link}}`) and Juice to automatically inline CSS into HTML elements. Connect this compiler to the email dispatch pipeline and add a live HTML device preview pane rendering compiled sample context.

## Acceptance criteria

- [ ] Email compilation service transforms raw template HTML and context data into clean, cross-client HTML output.
- [ ] Handles standard tokens including `{{buyer_name}}`, `{{inventory_table}}`, and `{{quick_bid_link}}`.
- [ ] Applies `juice` CSS inlining to ensure email rendering compatibility across Microsoft Outlook, Gmail, and mobile clients.
- [ ] Connects compiled HTML output into `sendCampaignEmail` in `emailService.ts`.
- [ ] Live Device Preview pane implemented in the frontend displaying live rendered HTML with sample lot data.
- [ ] Unit test suite asserting Handlebars substitution accuracy and CSS inlining rules.

## Blocked by

- 0076: Slice 1 - EmailTemplate Schema, REST API CRUD, and Baseline Defaults
