# Issue #39: Lot Operations Hub Vertical Integration (LotHubView & Redux Connection)

> **State:** `closed`
> **Category:** `enhancement`

## Parent

Issue #35

## What to build

Integrate and refactor the dedicated workspace view for individual surplus inventory lots (`Lot Operations Hub`) to connect natively to the Redux architecture. Currently living in `src/components/LotOperationsHubView.tsx` and relying on heavy prop drilling and inline callbacks from `App.tsx`, this component must be refactored to consume `inventorySlice` state (`selectedLotHubId`, `lotHubSubTab`) and dispatch actions directly (`useAppSelector`, `useAppDispatch`).

Create `LotHubView` as a lazy-loaded top-level view route that hosts `LotOperationsHubView` across its structured sub-tabs (`Item Details`, `Active Bids & Negotiation Chain`, and `Chronological Activity Tracking`). Ensure that selecting a lot from the inventory list view updates the Redux store and transitions smoothly to `LotHubView` while allowing users to evaluate bids, dispatch counter-offers (`/offers/:bidId/message`), execute alternative disposal (`/donate`, `/recycle`), and trigger `AwardModal` seamlessly through Redux actions.

## Acceptance criteria

- [x] `LotOperationsHubView` is refactored to consume Redux state and dispatch typed actions, eliminating deep prop drilling from parent components.
- [x] `LotHubView` is dynamically loaded via `React.lazy` when `activeTab === 'lot-hub'` and `selectedLotHubId` is populated.
- [x] Sub-tab navigation (`details`, `bids`, `activities`) updates `lotHubSubTab` in Redux and renders corresponding chronological activity tracking and negotiation communication chains accurately.
- [x] Triggering bid awards, donations, or recycling inside the hub dispatches clean API thunks through `InventoryService` and opens the global `AwardModal` or `EmailSentVisualizer` when applicable.
- [x] Automated integration tests verify lot selection transitions, sub-tab switching, bid negotiation message exchange, and alternative disposal actions.

## Blocked by

Issue #38
