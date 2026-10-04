# 02: Distraction-Free Integration Suite Workspace & Global Navigation Hiding

**What to build:** An operator working inside the Integration Management Suite (`?tab=ingestion&connector=...`) experiences a distraction-free, full-viewport workspace where the top `GlobalNavigationBar` is completely hidden. Operators cannot switch to other primary application tabs until they explicitly commit Back navigation via the Single-Arrow Return Anchor (or native browser popstate navigation), which exits the suite, returns to the Ingestion pipeline, and seamlessly restores the `GlobalNavigationBar`.

**Blocked by:** 01: Single-Arrow Return Anchor & Ingestion Connector Shell Refinement

**Status:** done

- [x] Top `GlobalNavigationBar` is completely hidden in `SupplierWorkspace` whenever an integration connector is active (`activeConnector` is truthy in Ingestion view / `?tab=ingestion&connector=...`).
- [x] Active connector state is synchronized with the application shell, ensuring instant reactivity upon ingress, switching connectors, and browser back/forward history navigation.
- [x] Committing return via the Single-Arrow Return Anchor (`Back to Ingestion Pipeline`) clears the connector route and immediately restores the visible `GlobalNavigationBar`.
- [x] Direct deep-linking to connector routes (e.g. `?tab=ingestion&connector=google-sheets`) properly mounts in distraction-free mode without rendering the navbar.
- [x] End-to-end integration and shell routing test suites verify navigation bar suppression, return commitment, and navbar restoration.
