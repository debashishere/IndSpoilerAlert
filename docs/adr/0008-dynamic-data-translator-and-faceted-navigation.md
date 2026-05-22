# Dynamic Data Translator and Faceted Navigation

To support heterogeneous product parameters from diverse CPG suppliers without brittle database migrations or schema proliferation, we decided to implement a hybrid schema architecture with a **Dynamic Data Translator** and **Dynamic Facet Discovery** over MongoDB rather than migrating to Cassandra or Graph databases.

### Key Decisions

1. **Hybrid Schema Separation**: Strictly typed top-level fields are preserved for canonical invariants required by transaction mechanics, yield optimization, and bidding (`expirationDate`, `quantityCases`, `standardSellPrice`, `status`). Category-specific or supplier-specific product attributes are stored inside a structured `attributes` dictionary (`Map<string, any>`).
2. **Dynamic Data Translator**: Ingestion applies declarative `Semantic Transformation Rule`s (unit conversion, data type coercion, and ontology mapping) so supplier-specific headers normalize to standard semantic attribute keys while preserving original unmapped attributes.
3. **Dynamic Facet Discovery**: Instead of hardcoded filter dropdowns, the API provides a dynamic facet discovery mechanism (`GET /api/inventory/facets`) and multi-attribute query filtering (`attributeFilters`) over `attributes` to adapt dynamically to whichever inventory categories are active.

### Alternatives Considered

- **Wide-Column Store (Apache Cassandra)**: Rejected because Cassandra requires query-driven schema definitions upfront and performs poorly on ad-hoc multi-attribute filtering across arbitrary dynamic keys.
- **Graph Database (Neo4j)**: Rejected for primary storage because graph databases lack OLTP performance for tabular marketplace listings, pagination, and financial bidding workflows.
