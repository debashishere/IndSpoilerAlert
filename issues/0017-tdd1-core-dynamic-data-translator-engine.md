# Core Dynamic Data Translator Engine (translatorService)

## What to build

Implement the core `translatorService.ts` module (`translateAttributes`) that transforms raw unmapped supplier product parameters into standardized canonical and semantic attributes (`attributes` and `rawAttributes`).

The service must strictly avoid any many-to-many database connections or join tables—all normalization is deterministic and stateless.

Specifically:
- Evaluate declarative `Semantic Transformation Rule`s (`sourceKey`, `targetKey`, `transform`) for unit conversions (`celsiusToFahrenheit`), type coercions (`toBoolean`, `toNumber`), and string list splitting (`toStringList`).
- Apply built-in CPG Domain Ontology aliases (`storage_temp_c` -> `tempMinF`, `kosher` -> `certifications.kosher`, `pallet_ti_hi` -> `palletTiHi`).
- Preserve original unmapped keys verbatim in `rawAttributes` for auditability.
- Handle missing values, empty strings, and malformed inputs gracefully without throwing exceptions.

## Acceptance criteria

- [ ] RED test: `backend/src/tests/translatorService.test.ts` fails when testing unmapped CPG attribute translation before implementation.
- [ ] GREEN: `translateAttributes` correctly normalizes domain headers, converts units (°C -> °F), coerces types, and preserves pristine raw input in `rawAttributes`.
- [ ] All data structures are self-contained embedded maps/objects without many-to-many relational join structures.

## Blocked by

None - can start immediately
