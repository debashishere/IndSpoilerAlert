# Issue #36: Foundation & Core Domain Refactor (CoreStore, CoreService, AppShell & Navigation)

> **State:** `ready-for-agent`
> **Category:** `enhancement`

## Parent

Issue #35

## What to build

Establish the foundational Redux Toolkit state architecture and core domain service integration needed to support the modularized frontend application. Install `@reduxjs/toolkit` and `react-redux` and set up the centralized store. Create the Core Redux slice to manage global navigation tabs, sidebar expansion states, system health check statuses (`backendHealthy`, `sidecarHealthy`), and shared reference entities (`suppliers`, `buyers`). 

Extract core network calls (`/health`, `/sidecar/health`, `/suppliers`, `/buyers`) from `App.tsx` into a clean CoreService module that guarantees 100% exact endpoint, HTTP header (`Cache-Control: no-cache, no-store`), and JSON payload preservation. Build the top-level `AppShell` component containing the navigation Header, collapsible Sidebar, root Error Boundary, and a `<Suspense>` route container capable of rendering lazy-loaded domain views without visual styling deviations.

## Acceptance criteria

- [ ] `@reduxjs/toolkit` and `react-redux` are installed and configured cleanly inside `frontend/package.json`.
- [ ] Centralized Redux store and Core slice (`coreSlice`) are implemented, allowing components to read and dispatch navigation (`activeTab`), sidebar toggles, and reference data cleanly via typed hooks (`useAppSelector`, `useAppDispatch`).
- [ ] `CoreService` encapsulates `/health`, `/sidecar/health`, `/suppliers`, and `/buyers` HTTP calls with exact existing headers (`Cache-Control: no-cache, no-store`, `Pragma: no-cache`) and error handling.
- [ ] `AppShell` renders the exact visual Header and Sidebar elements with pristine CSS fidelity against `App.css` and `index.css`.
- [ ] Automated integration tests (`Vitest`/`RTL`) verify store initialization, top-level navigation switching, health polling updates, and error boundary recovery.

## Blocked by

None - can start immediately
