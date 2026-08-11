# Issue #35: Rearchitect Frontend with Redux Toolkit and Domain Service Layer (PRD)

> **State:** `ready-for-agent`
> **Category:** `enhancement`

## Problem Statement

Currently, the primary frontend presentation file (`App.tsx`) is a monolithic component of 7,515 lines managing over 150 local `useState` variables and 45+ raw inline HTTP network requests. This architecture tightly couples presentation rendering, HTTP mechanics, navigation routing, modal overlays, and complex domain business logic across all core domain contexts (`Ingestion Engine`, `Lot Operations Hub`, `Liquidation Automation Studio`, `Buyer Marketplace`, `Logistics`, and `Distressed Inventory Analytics`).

From the developer's and maintainer's perspective, this monolithic structure creates severe friction:
1. **High Cognitive Load & Entangled State**: Shared domain entities (`suppliers`, `buyers`, `inventoryList`) and localized view state (`filters`, `upload loading step`, `wizard steps`) are stored in a flat scope, making state flow difficult to trace and causing prop drilling when child components (`Lot Operations Hub`, `Marketplace Card`) or drawers require state updates.
2. **Absence of Code-Splitting**: All 8 major tabs (`ingestion`, `dashboard`, `analytics`, `marketplace`, `inventory`, `logistics`, `lot-hub`, `workflows`) and heavy sub-views are bundled and rendered synchronously, increasing initial JavaScript bundle size and violating modern React performance standards (`React.lazy` and `Suspense`).
3. **Scattered Network Logic**: Raw `fetch()` calls with specific caching requirements (`Cache-Control: no-cache, no-store`) and custom headers are embedded directly inside UI event handlers, making API endpoints brittle and difficult to mock during automated testing.
4. **Lack of Fault Isolation**: A single runtime JavaScript error occurring inside any tab or data table chart crashes the entire application due to the absence of granular Error Boundaries across domain views.
5. **Strict Constraint Preservation**: Any architectural refactoring must guarantee 100% zero deviation in visual layout, CSS styling, and network API request/response behavior.

## Solution

Rearchitect the frontend application into a modular, production-grade React architecture aligned with the domain glossary, utilizing Redux Toolkit for state management and dedicated domain service modules for network communication:

1. **Centralized Redux Store & Domain Slices**: Establish a modular Redux store composed of 5 domain slices (`Core`, `Ingestion`, `Inventory`, `Logistics`, and `Workflow`) to replace the 150+ flat state variables. This eliminates Context provider nesting and prop drilling across complex multi-step drawers while enabling predictable state transitions.
2. **Decoupled Domain Service Layer**: Extract all 45+ raw HTTP network requests into 5 domain API service modules. These services strictly encapsulate exact endpoints, HTTP methods, headers, cache parameters, and JSON response parsing, guaranteeing 100% preservation of existing network logs.
3. **Page View Decomposition & Lazy Loading**: Break down the monolithic presentation layer into high-level Page Views (`IngestionView`, `InventoryListView`, `LotHubView`, `WorkflowsView`, `MarketplaceView`, `AnalyticsView`, and `LogisticsView`) combined with reusable domain sub-components. Wrap each view route inside an application shell (`AppShell`) using `React.lazy` and `Suspense` for optimal code-splitting and fast initial load times.
4. **Hybrid Modal Placement & Multi-Level Error Boundaries**: Mount cross-domain modals (`AwardModal`, `EmailSentVisualizer`) centrally inside the application shell for clean dispatching via Redux actions, while keeping domain-private drawers (`CampaignDrawer`, `ComplianceModal`) inside their specific page views. Wrap the root shell and each lazy-loaded tab inside granular Error Boundaries to ensure fault isolation.
5. **Memoized Domain Derivations**: Use Redux Toolkit Reselect (`createSelector`) to memoize heavy calculations (`Hybrid Inventory Selector` multi-attribute filtering, `Dynamic Facet Discovery` aggregation, and `Live Impact & Allocation Panel` metrics), preventing unnecessary O(N) array recalculations during UI interactions.
6. **Strict UI & DOM Preservation**: Preserve exact existing HTML tags, DOM nodes, and class names (`sidebar`, `header`, `main-content`, `nav-link`) 100% as-is without introducing structural modifications or visual shifts.

## User Stories

1. As a software developer, I want all global application state (`activeTab`, `sidebarExpanded`, system health, `suppliers`, `buyers`) managed in a dedicated Core Redux slice, so that cross-cutting navigation and reference data are cleanly isolated from domain-specific features.
2. As a software developer, I want file ingestion state (`uploaded file`, `parsed grid`, `column mappings`, `semantic transformation rules`, and `loading step`) managed in an Ingestion Redux slice, so that complex spreadsheet normalization logic does not clutter the global navigation state.
3. As a software developer, I want surplus inventory management state (`inventory list`, `selected lot ID`, `lot operations hub sub-tabs`, and `hybrid inventory selector` filters) managed in an Inventory Redux slice, so that inventory table filtering and lot workflows operate independently.
4. As a software developer, I want logistics state (`shipments list`, `dock appointment scheduling windows`, and `cold chain temperature logs`) managed in a Logistics Redux slice, so that freight workflows and temperature compliance checks are modularized.
5. As a software developer, I want liquidation campaign state (`liquidation cycles`, `editing campaign ID`, `campaign wizard step`, `stage-gate automations`, `automation runs`, and `awarded quantity input`) managed in a Workflow Redux slice, so that multi-step liquidation automation flows are cleanly organized.
6. As a software developer, I want all network calls extracted into 5 domain service modules (`CoreService`, `IngestionService`, `InventoryService`, `LogisticsService`, and `WorkflowService`), so that HTTP request formatting and headers (`Cache-Control: no-cache, no-store`) are centralized and easily mockable.
7. As an operations user, I want all network requests emitted by the refactored frontend to match exact existing API endpoints, HTTP headers, payloads, and response parsing, so that backend integration, authentication, and sidecar communication continue functioning with zero disruptions.
8. As a frontend developer, I want the monolithic component decomposed into distinct Page Views (`IngestionView`, `InventoryListView`, `LotHubView`, `WorkflowsView`, `MarketplaceView`, `AnalyticsView`, and `LogisticsView`), so that each domain feature has a single, cohesive file boundary.
9. As a frontend developer, I want every Page View dynamically loaded using `React.lazy` inside a `<Suspense>` container with a fallback loading skeleton, so that initial bundle load times are drastically optimized and heavy code is only parsed when the user navigates to that tab.
10. As a frontend developer, I want complex UI sections within each Page View decomposed into focused domain sub-components (`UploadDropzone`, `GridMapperTable`, `InventoryFilterBar`, `InventoryTable`, `StageGateTimeline`), so that presentation logic remains reusable and easy to test.
11. As an application user, I want cross-domain modals like `AwardModal` and `EmailSentVisualizer` mounted globally inside the application shell, so that I can trigger bid awards or view dispatch visualizers seamlessly from any tab (`Marketplace`, `Inventory Table`, or `Lot Operations Hub`) without UI lag or duplicate modal rendering.
12. As a supplier operations manager, I want domain-private drawers like `CampaignDrawer` and `ComplianceModal` mounted strictly within their respective page views, so that specific multi-step configuration wizards do not pollute the global application shell.
13. As an application user, I want a root Error Boundary wrapping the entire application shell AND granular Error Boundaries wrapping each lazy-loaded domain tab, so that if an unexpected rendering bug occurs inside a single analytics chart or data table, the rest of the application remains fully functional and displays a localized recovery prompt.
14. As a software developer, I want heavy data filtering across `Hybrid Inventory Selector` criteria (`search query`, `supplier`, `category`, `status`, `distribution center`) memoized via Redux Toolkit `createSelector`, so that filtered lot arrays are cached and only recomputed when the raw inventory list or filter criteria change.
15. As a software developer, I want `Live Impact & Allocation Panel` calculations (`matched lot counts`, `total case volume`, `COGS recovery dollar value`, and `remaining shelf life distribution`) memoized using Reselect selectors, so that adjusting filter sliders updates live metrics instantaneously without main thread stutter.
16. As a software developer, I want component-level event handlers (`handleSortChange`, `handleRowSelection`, and currency/date formatting helpers) memoized using `useCallback` and `useMemo`, so that child table headers and rows do not unnecessarily re-render on parent state updates.
17. As an application user and QA tester, I want all extracted components and views to strictly preserve exact existing HTML element tags, DOM hierarchy, and class names (`sidebar`, `header`, `main-content`, `nav-link`), so that every CSS selector in existing stylesheets applies identically with zero visual layout changes.
18. As a maintainer, I want our architectural decision to adopt Redux Toolkit and domain services formally documented in an Architecture Decision Record (`ADR 0014`), so that future engineers understand the rationale behind the state and service boundaries.

## Implementation Decisions

- **State Management Architecture (`Redux Toolkit`)**:
  - Adopt `@reduxjs/toolkit` and `react-redux` as the standardized state management framework.
  - Establish a centralized store configuring 5 domain slices: Core, Ingestion, Inventory, Logistics, and Workflow.
  - Each domain slice manages entities, loading indicators, active filter criteria, and open/closed states for domain-specific modals.
  - Avoid using React Context providers for domain state to eliminate provider nesting (`<CoreProvider><IngestionProvider>...`) and prevent cascading re-renders across tabular components.

- **Network Service Layer Modularization**:
  - Create 5 domain service modules corresponding directly to the domain slices: CoreService, IngestionService, InventoryService, LogisticsService, and WorkflowService.
  - Extract every raw HTTP `fetch()` call currently inside the primary presentation component into the appropriate domain service method.
  - Enforce exact preservation of target URL strings, HTTP methods, headers (including explicit `Cache-Control: no-cache, no-store` and `Pragma: no-cache`), and JSON serialization/deserialization logic.
  - Connect services to Redux slices via asynchronous thunks (`createAsyncThunk`) or action creators triggered by view components.

- **Presentation Layer Decomposition & Code-Splitting**:
  - Create an application shell component (`AppShell`) that renders the top navigation header, expandable sidebar, global cross-domain modals, root Error Boundary, and `<Suspense>` route switcher.
  - Decompose the monolith into 7 top-level Page View components inside a dedicated views structure (`IngestionView`, `InventoryListView`, `LotHubView`, `WorkflowsView`, `MarketplaceView`, `AnalyticsView`, `LogisticsView`).
  - Configure `AppShell` to dynamically load each Page View using `React.lazy()` upon tab navigation.
  - Extract dense UI sections from each view into sub-components organized by domain inside the components structure (`ingestion`, `inventory`, `logistics`, `workflows`, `marketplace`).

- **Modal & Error Boundary Boundaries**:
  - Mount cross-domain modals (`AwardModal`, `EmailSentVisualizer`) once inside `AppShell` and control their visibility and active payloads via UI actions dispatched to the Core or Inventory slice.
  - Mount domain-private wizards (`CampaignDrawer`, `ComplianceModal`, `RunDetailsModal`) inside their respective Page View components to maintain strict domain encapsulation.
  - Implement a reusable `ErrorBoundary` class/component wrapped around `AppShell` and individual `Suspense` tab boundaries to catch child JavaScript exceptions gracefully.

- **Memoized Derivation Structure (`Reselect`)**:
  - Create domain selector modules (`inventorySelectors`, `workflowSelectors`, `ingestionSelectors`) using `createSelector` from Redux Toolkit.
  - Move complex array filtering (`Hybrid Inventory Selector`), distinct value counts (`Dynamic Facet Discovery`), and multi-attribute aggregations (`Live Impact & Allocation Panel`) into memoized selectors.
  - Ensure view components consume these derivations via `useAppSelector(selectFilteredInventoryLots)` rather than computing filters inline during rendering.

- **Strict DOM Preservation Policy**:
  - Do not alter, replace, or wrap existing HTML element tags (`<aside>`, `<nav>`, `<main>`, `<header>`) during component extraction.
  - Do not introduce headless UI libraries or third-party accessible primitives that inject wrapper DOM nodes or custom attributes that could conflict with existing CSS selectors.
  - Preserve exact existing `className` strings across all extracted components to ensure 100% pixel fidelity with existing stylesheets.

## Testing Decisions

- **Testing Philosophy & Behavior Isolation**:
  - Good tests must verify external user-facing behavior and public contract boundaries rather than internal component state structures or private implementation details.
  - Tests should assert that user actions (tab clicks, filter changes, form submissions) result in expected DOM updates and exact HTTP service invocations.

- **Seams for Testing**:
  - **Highest Seam: Full View & App Integration Seam (`React Testing Library` / `Vitest`)**:
    - Mount `AppShell` and individual Page Views (`IngestionView`, `InventoryListView`, `WorkflowsView`) inside a real Redux `<Provider>` and `<Suspense>` container.
    - Intercept and mock network interactions at the Network Service Seam (`vi.spyOn(networkService, 'apiFetch')` or global `fetch` mocking).
    - Assert that navigation switching, dynamic table filtering, modal opening, and error boundary recovery function correctly across integrated component trees.
  - **Domain State & Derivation Seam (`Redux Slices & Reselect Selectors`)**:
    - Test domain slices (`ingestionSlice`, `inventorySlice`, `logisticsSlice`, `workflowSlice`) by dispatching actions synchronously and asserting resulting state snapshots.
    - Test Reselect selectors (`selectFilteredInventoryLots`, `selectLiveImpactMetrics`) against mock state inputs to verify correct multi-attribute filtering, RSL categorization, and exact memoization caching behavior.
  - **Network Service Contract Seam (`Domain Services`)**:
    - Test isolated domain service modules (`CoreService`, `IngestionService`, etc.) against mock HTTP responses (`fetchMock`).
    - Verify that service methods emit exact target endpoints (`API_BASE_URL` / `SIDECAR_BASE_URL`), exact HTTP headers (`Cache-Control: no-cache, no-store`), and correct JSON payload formats matching existing API logs.

- **Prior Art**:
  - Follow existing test patterns and domain mocks seen in backend integration tests (`test_files/`) and ensure compatibility with standard `Vitest` and `React Testing Library` test setups.

## Out of Scope

- Modifying any visual CSS rules, dimensions, colors, typography, or responsive layout behavior in `App.css` or `index.css`.
- Changing, adding, or removing any backend API endpoint path, query parameter, HTTP request header, payload schema, or JSON response structure.
- Adding ARIA or accessibility attributes (`aria-label`, `aria-expanded`, `role=`) that alter existing DOM structure or introduce visual/layout scope creep beyond exact current code behavior.
- Altering any backend Node.js (`backend/`), Python Sidecar (`sidecar/`), or MongoDB/LocalStack infrastructure configurations.
- Creating or editing domain business logic rules unrelated to refactoring existing inline code into modular slices and hooks.

## Further Notes

- This PRD directly builds upon our architectural alignment recorded in `docs/adr/0014-redux-toolkit-state-and-service-architecture.md`.
- All extracted components and slices must strictly adhere to the domain vocabulary defined in `docs/CONTEXT.md` (`Ingestion Engine`, `Yield Optimization`, `Demand Matching`, `Offer Sheet / Listing`, `Buyer Marketplace`, `Lot Operations Hub`, `Liquidation Automation Studio`, and `Dynamic Data Translator`).
