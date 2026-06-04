# Issue #42: Monolith Cleanup, Final Verification & Decommissioning (App.tsx Replacement & Regression Suite)

> **State:** `ready-for-agent`
> **Category:** `enhancement`

## Parent

Issue #35

## What to build

Perform the final architectural cutover by replacing the 7,515-line `App.tsx` presentation monolith with a clean, ~50-line root entry component. The new `App.tsx` must render the application wrapped inside `<Provider store={store}>` and the top-level `<AppShell />` containing our `<ErrorBoundary>` and `<Suspense>` lazy route switcher.

Execute a comprehensive automated regression test suite (`Vitest` and `React Testing Library`) verifying end-to-end functionality across all 8 major tabs (`ingestion`, `dashboard`, `analytics`, `marketplace`, `inventory`, `logistics`, `lot-hub`, and `workflows`). Ensure that every single CSS class name, DOM node, and layout structure matches existing styles (`App.css`, `index.css`) exactly with zero pixel shifts, and that 100% of network requests emitted across every user flow match exact target endpoints, HTTP methods, headers (`Cache-Control: no-cache, no-store`), and JSON payloads. Once automated tests pass, conduct a Human-In-The-Loop (HITL) review and sign-off before safely removing the backup file (`App.tsx.restored`) and completing the refactor.

## Acceptance criteria

- [ ] The monolithic `App.tsx` is completely replaced by a concise (< 60 lines) root component rendering `<Provider store={store}><AppShell /></Provider>`.
- [ ] All 8 application tabs (`ingestion`, `dashboard`, `analytics`, `marketplace`, `inventory`, `logistics`, `lot-hub`, `workflows`) lazy-load cleanly and render without errors or console warnings.
- [ ] Full regression test suite (`Vitest`/`RTL`) passes 100%, covering navigation routing, state updates, modal triggers, error boundaries, and API service calls across all domain slices.
- [ ] Zero deviation in visual presentation is confirmed against existing CSS (`App.css`, `index.css`), with all original DOM tag structures and class names preserved intact.
- [ ] Human-In-The-Loop (HITL) walkthrough confirms all user stories (US 1–18) are satisfied, after which legacy backup files (`App.tsx.restored`) are decommissioned.

## Blocked by

Issue #37, Issue #38, Issue #39, Issue #40, Issue #41
