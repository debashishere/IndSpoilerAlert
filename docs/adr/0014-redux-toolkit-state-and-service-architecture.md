# 0014. Redux Toolkit State and Domain Service Architecture

## Status
Accepted

## Context
The frontend monolithic `App.tsx` currently stands at 7,515 lines (`393 KB`) and manages over 150+ `useState` variables along with 45+ direct raw `fetch()` network calls. This architecture mixes presentation JSX, global domain state (`suppliers`, `buyers`, `inventoryList`), local UI state (`filters`, `modals`), and HTTP requests across all core domain contexts (`Ingestion Engine`, `Lot Operations Hub`, `Liquidation Automation Studio`, `Logistics`, and `Analytics`).

To refactor the frontend into modular functional components and maintain clean boundaries while strictly ensuring zero changes to UI aesthetics or API network logs, we evaluated multiple state and service integration strategies:
- **Nested React Contexts (`useContext`)**: While native, managing 150+ variables across 5+ domain contexts leads to excessive provider nesting (`<CoreProvider><IngestionProvider><InventoryProvider>...`) and potential re-render cascades across heavy tabular views.
- **Zustand / External Store**: Lightweight, but lacks the formal slice/action structure required for strict enterprise governance across multiple domain sub-systems.
- **Redux Toolkit (`@reduxjs/toolkit` + `react-redux`)**: Provides structured domain slices, predictable state updates via reducers/actions, memoized selectors (`createSelector`), DevTools inspection, and clean separation between UI components and asynchronous side effects.

## Decision
We adopt **Redux Toolkit (`@reduxjs/toolkit` + `react-redux`)** for global domain state management and organize our architecture around domain slices (`src/store/slices/`) paired with dedicated domain API service modules (`src/services/`):

1. **Domain Service Layer (`src/services/`)**:
   All HTTP communication is extracted from `App.tsx` into 5 domain service modules (`coreService.ts`, `ingestionService.ts`, `inventoryService.ts`, `logisticsService.ts`, and `workflowService.ts`). These modules encapsulate exact endpoints, HTTP methods, headers (`Cache-Control: no-cache, no-store`), and JSON parsing to guarantee 100% fidelity to existing network logs.

2. **Domain-Scoped Redux Slices (`src/store/slices/`)**:
   We establish 5 corresponding Redux slices (`coreSlice`, `ingestionSlice`, `inventorySlice`, `logisticsSlice`, `workflowSlice`) to manage domain entities, UI loading steps, active filters, and modal open/close triggers.

3. **Decoupled View Components**:
   View components connect cleanly to Redux slices via custom typed hooks (`useAppDispatch`, `useAppSelector`) without prop drilling across modal drawers or tab boundaries.

## Consequences
- **Positive**: Eliminates prop drilling across complex multi-step workflows and drawers (`Lot Operations Hub`, `Liquidation Automation Studio`).
- **Positive**: Guarantees zero deviation in API payloads and network request/response timing.
- **Positive**: Simplifies unit and integration testing of domain business logic and network error boundaries.
- **Negative**: Adds two external dependencies (`@reduxjs/toolkit`, `react-redux`) to `frontend/package.json`.
