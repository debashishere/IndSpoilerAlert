# Dynamic Faceted Navigation UI in Buyer Marketplace

## Parent

Reference to Issue 0020 (Multi-Attribute Query Filter API)

## What to build

Implement the frontend `DynamicFacetPanel` component in the buyer marketplace that dynamically fetches `/api/inventory/facets` and filters inventory listings via `attributeFilters`.

Specifically:
- Fetch `/api/inventory/facets` on marketplace load.
- Dynamically render filter checkboxes and range selectors for discovered semantic attributes (`certifications`, `palletTiHi`, `tempMinF`).
- Pass selected `attributeFilters` to `GET /api/inventory/lots` when filtering listings.

## Acceptance criteria

- [ ] UI component dynamically renders checkboxes for discovered semantic attribute keys (`certifications`, `palletTiHi`, etc.).
- [ ] Selecting/unselecting a filter updates listing results dynamically without page reload.

## Blocked by

- [Issue 0020](file:///Users/debashisroy/Documents/SpoilerAlert/issues/0020-tdd4-multi-attribute-query-filter-api.md)
