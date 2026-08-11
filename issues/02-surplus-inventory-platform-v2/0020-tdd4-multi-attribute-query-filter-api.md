# Multi-Attribute Query Filter API (GET /api/inventory/lots?attributeFilters=...)

## Parent

Reference to Issue 0019 (Dynamic Facet Discovery API)

## What to build

Extend `getInventoryLots(options)` in `backend/src/services/inventoryService.ts` to support dynamic `attributeFilters` and wire query parameter parsing into `GET /api/inventory/lots`.

Specifically:
- Accept `attributeFilters: Record<string, any>` (e.g. `{ certifications: 'kosher', tempMinF: { $lte: 40 } }`).
- Construct Mongoose queries matching nested embedded keys inside `attributes.*` alongside top-level canonical fields.
- Ensure no many-to-many joins are needed to filter by attributes.

## Acceptance criteria

- [ ] RED test: API integration test querying `GET /api/inventory/lots` with `attributeFilters` fails or ignores filters before implementation.
- [ ] GREEN: Query correctly filters Mongoose `InventoryLot` documents on nested `attributes.*` paths alongside canonical top-level fields.

## Blocked by

- [Issue 0019](file:///Users/debashisroy/Documents/IndSpoilerAlert/issues/0019-tdd3-dynamic-facet-discovery-api.md)
