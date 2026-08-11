# 0078: Slice 3 - TipTap WYSIWYG Template Editor and Dynamic Token Palette

## What to build

Implement a visual WYSIWYG template authoring editor in the frontend using TipTap React. The editor must feature custom Token Chip extensions allowing sales representatives to insert dynamic placeholders (`{{buyer_name}}`, `{{inventory_table}}`, `{{quick_bid_link}}`) visually, and sync seamlessly with backend template persistence and live device previews.

## Acceptance criteria

- [ ] TipTap React editor component integrated into Liquidation Automation Studio template management sub-view.
- [ ] Custom Token Chip extensions rendered in the editor toolbar allowing 1-click token insertion into template text.
- [ ] Editor state bidirectionally bound to `EmailTemplate` API endpoints for saving and updating custom templates.
- [ ] Real-time synchronization between visual TipTap editor state and the Desktop/Mobile Device Preview pane.
- [ ] Frontend unit tests for editor interactions, token chip rendering, and save actions.

## Blocked by

- 0076: Slice 1 - EmailTemplate Schema, REST API CRUD, and Baseline Defaults
- 0077: Slice 2 - Handlebars Token Compiler and Juice CSS Inliner Engine
