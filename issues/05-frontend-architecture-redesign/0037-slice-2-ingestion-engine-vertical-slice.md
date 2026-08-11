# Issue #37: Ingestion Engine Vertical Slice (IngestionService, IngestionSlice & IngestionView)

> **State:** `closed`
> **Category:** `enhancement`

## Parent

Issue #35

## What to build

Decompose and extract the entire Messy Data AI Normalizer (`Ingestion Engine`) workflow from the monolithic presentation file into a modular, self-contained vertical slice. Create the `IngestionService` module to encapsulate all spreadsheet/PDF file upload, asynchronous parsing job polling (`ingestionJobId`), column mapping suggestions, dynamic data translator semantic rules (`sourceKey`, `targetKey`, `transform`), and sales closeout confirmations (`/ingest/confirm-sales`, `/sales`).

Build the `Ingestion` Redux slice (`ingestionSlice`) to manage uploaded file state, raw grid data, mapping dictionaries, semantic transformation rules, and progress loading steps (`loadingStep`). Create the lazy-loaded `IngestionView` component and domain sub-components (`UploadDropzone`, `GridMapperTable`, `SemanticRulesEditor`) that connect directly to the Redux slice without prop drilling while preserving 100% exact UI styling and DOM structure.

## Acceptance criteria

- [x] `IngestionService` is built, encapsulating `/ingest/upload`, `/ingest/jobs/:id`, `/ingest/confirm`, `/ingest/confirm-sales`, and `/sales` with exact HTTP headers and JSON payload formatting.
- [x] `ingestionSlice` manages file selection, drag active states, raw spreadsheet grids, suggested mappings, semantic transformation rules, and loading step indicators cleanly.
- [x] `IngestionView` is dynamically loaded via `React.lazy` inside `AppShell` when the `ingestion` tab is active, rendering the exact existing UI markup and CSS classes.
- [x] Sub-components (`UploadDropzone`, `GridMapperTable`, `SemanticRulesEditor`) operate cohesively via Redux dispatch actions without requiring parent prop drilling.
- [x] Automated integration tests assert exact file upload payloads, asynchronous job status polling transitions, column mapping saves, and sales confirmations against mocked API endpoints.

## Blocked by

Issue #36
