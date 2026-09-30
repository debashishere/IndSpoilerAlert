# 01A: IngestionBatch Contract & Resilient Date/Shelf-Life Normalization Core

## Parent
[01: Ingestion Engine Seam Expansion & Normalized Batch Port](./01-ingestion-engine-seam-expansion-and-normalized-batch-port.md)

**What to build:** The foundational `IngestionBatch` input contract on `ingestService` and the centralized tabular normalization core. Encapsulates resilient date parsing heuristics (supporting ISO, slash, hyphen, and custom warehouse date formats), category shelf-life fallback calculations (e.g. Dairy 45 days, Produce 30 days, Dry Goods 180 days), and fallback SKU generation into reusable, pure domain utilities inside the ingestion engine.

**Blocked by:** None (can start immediately)

**Status:** completed

- [x] Define the `IngestionBatch` interface accepting `supplierId`, `headers`, `rows`, `columnMappings`, and `source` (`'csv'` | `'google-sheets'` | `'manual'`), with optional metadata.
- [x] Define the `IngestionBatchResult` contract reporting execution metrics (`totalRows`, `inserted`, `updated`, `depleted`, `errors`, `lotIds`).
- [x] Implement centralized `parseIngestionDate(rawDate?: string): Date | undefined` handling standard ISO strings, `MM/DD/YYYY`, `DD-MM-YYYY`, and returning `undefined` for unparseable input.
- [x] Centralize the category shelf-life default lookup table (`categoryDefaults`) and the remaining shelf-life fraction calculation logic (`remainingShelfLife` bounded between `0.0` and `1.0`).
- [x] Centralize the reproducible fallback SKU generation utility from item descriptions (`SKU-UPPERCASE-ALPHANUMERIC`).
- [x] Add unit tests verifying date parsing, shelf-life calculation, and SKU generation against malformed strings and edge cases.

