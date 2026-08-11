# Dynamic Facet Discovery API (GET /api/inventory/facets)

## Parent

Reference to Issue 0018 (Ingestion Pipeline & Supplier Template Integration)

## What to build

Implement the dynamic facet discovery aggregation mechanism (`getInventoryFacets` in `backend/src/services/inventoryService.ts`) and expose `GET /api/inventory/facets` in `backend/src/routes/api.ts`.

Specifically:
- Use MongoDB aggregation (`$project`, `$unwind`, `$group`) over active `InventoryLot.attributes` documents to dynamically inspect and aggregate distinct attribute keys and their distinct values/counts.
- Avoid many-to-many lookup tables or separate relational join collections—compute facets directly over active embedded `attributes`.
- Expose `GET /api/inventory/facets` returning `FacetResult[]`.

## Acceptance criteria

- [ ] RED test: API test asserting `GET /api/inventory/facets` returns distinct attribute keys and accurate value counts across active lots.
- [ ] GREEN: Endpoint returns HTTP 200 with dynamic `FacetResult[]` JSON adapting to whichever inventory categories are currently active.

## Blocked by

- [Issue 0018](file:///Users/debashisroy/Documents/IndSpoilerAlert/issues/0018-tdd2-ingestion-pipeline-supplier-template-integration.md)
