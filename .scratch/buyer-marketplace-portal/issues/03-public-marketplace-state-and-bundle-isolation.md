# 03 — Public Marketplace State and Bundle Isolation

Type: research
Status: resolved
Assignee: Antigravity
Blocked by: 01

## Question

What state dependencies and Redux slice imports currently exist in `MarketplaceLandingView.tsx` and `BuyerBidModal.tsx` that might couple the public buyer view to supplier-only stores, and how should a dedicated, standalone root entry (`MarketplacePortalApp.tsx`) be structured to ensure zero leakage of supplier session data?

## Answer

### 1. State and Slice Dependencies Audit

#### A. `MarketplaceLandingView.tsx`
- **Direct Redux/Store Dependencies**: **None**.
  - Uses native React state (`useState`) for search filters, category, region, discount tiers, and active listing selections.
  - Queries public listings directly via browser `fetch` to `${apiBaseUrl}/marketplace/listings`.
- **Transitive/Coupling Vectors**:
  - Directly imports and embeds `<BuyerBidModal />` (`src/components/domain/marketplace/BuyerBidModal.tsx`).
  - In `App.tsx` (lines 1594–1597), its `onOpenBidModal` callback was wired to the supplier's internal inventory lot collection (`inventoryList.find(...)` and `setSelectedLot(lot)`), tethering public listing interactions to internal supplier state.

#### B. `BuyerBidModal.tsx`
- **Redux Slice Imports**:
  - `import { useSelector, useDispatch } from 'react-redux';`
  - `import { selectIsAuthenticated, selectBuyer, selectAuthLoading, sendBuyerVerificationThunk, verifyBuyerTokenThunk } from '../../../store/slices/authSlice';`
  - `import type { AppDispatch } from '../../../store/index';`
- **Session Usurpation Risk**:
  - In `App.tsx` (lines 117–129), whenever a supplier authenticates with Firebase, an effect dispatches `setBuyerAuth({ buyer: { id: user.uid, email: user.email, companyName: user.displayName ... }, token })`.
  - Consequently, if a supplier visits the marketplace, `BuyerBidModal` automatically treats the supplier as an authenticated, verified buyer, displays the supplier's business email, and submits bids under the supplier's account without triggering buyer email OTP verification.

#### C. Related Public Components (`MarketplaceLayout.tsx` & `QuickBidModal.tsx`)
- **`MarketplaceLayout.tsx`**:
  - Imports `selectBuyer`, `selectIsAuthenticated`, `openAuthModal`, `logoutBuyer` from `authSlice`.
  - **Firebase Context Fallback**: Lines 29–37 directly invoke `useContext(AuthContext)` (the Firebase supplier auth context). If Redux auth is empty, it falls back to `auth.user` and presents the supplier as a "Verified Buyer", while the header logout button invokes `auth.logout()` (signing the supplier out of Firebase).
- **`QuickBidModal.tsx`**:
  - Imports and dispatches `setSelectedBuyerEmail` from `src/store/slices/inventorySlice.ts`, directly modifying supplier inventory store state during buyer quick bidding.

---

### 2. Monolithic Store & Root Leakage Vectors

In the current entry architecture (`src/main.tsx`):
1. **Monolithic Store Co-location**: `<Provider store={store}>` exposes a single Redux store containing `coreReducer` (supplier contracts, company codes, buyer lists), `ingestionReducer` (unmapped supplier spreadsheets, raw grids), `inventoryReducer` (internal supplier COGS, margin curves, reserve prices), `workflowReducer` (supplier approval workflows), and `logisticsReducer` (supplier freight shipments). Any visitor to `/marketplace` has supplier state resident in the browser's Redux memory.
2. **Eager Root Auth Listeners**: `<AuthProvider>` wraps the entire application at `main.tsx`. If a supplier has an active Firebase session in `indexedDB`/`localStorage`, `AuthProvider` restores it and `App.tsx` eagerly fetches supplier reference data (`fetchCoreReferenceData`, `fetchBuyerLists`).
3. **Monolithic Bundle Size**: Because `main.tsx` statically imports `App.tsx` (2,659 lines), public buyers download supplier views, internal table components, and administrative logic.

---

### 3. Dedicated Standalone Root Architecture: `MarketplacePortalApp.tsx`

To enforce **zero supplier session leakage** and **strict bundle isolation**:

#### A. Isolated Marketplace Redux Store (`marketplaceStore.ts`)
Create a dedicated, lightweight store for the buyer portal:
```ts
// src/store/marketplaceStore.ts
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';

export const marketplaceStore = configureStore({
  reducer: {
    auth: authReducer,
  },
});

export type MarketplaceState = ReturnType<typeof marketplaceStore.getState>;
export type MarketplaceDispatch = typeof marketplaceStore.dispatch;
```
- **Zero Supplier Slices**: Completely excludes `core`, `inventory`, `workflow`, `logistics`, and `ingestion` slices.
- **Contract Parity**: Retains `authSlice` so `BuyerBidModal` and `BuyerAuthModal` continue to work without changing their Redux hooks or thunk dispatches.

#### B. Complete Detachment from Firebase `AuthProvider`
- `MarketplacePortalApp` is **never** wrapped in `<AuthProvider>`.
- Buyer identity is solely established via `/api/v1/marketplace/auth/send-verification` and `/api/v1/marketplace/auth/verify-token` (ADR 0006).
- `MarketplaceLayout.tsx` must remove the `useContext(AuthContext)` fallback so it never reads Firebase supplier credentials.

#### C. Standalone Root Component (`src/MarketplacePortalApp.tsx`)
```tsx
import React, { Suspense } from 'react';
import { Provider } from 'react-redux';
import { marketplaceStore } from './store/marketplaceStore';
import { ThemeProvider } from './context/ThemeContext';
import { MarketplaceLayout } from './components/shell/MarketplaceLayout';
import { MarketplaceLandingView } from './views/marketplace/MarketplaceLandingView';
import { QuickBidModal } from './components/QuickBidModal';

export const MarketplacePortalApp: React.FC = () => {
  const params = new URLSearchParams(window.location.search);
  const quickBidToken = params.get('token') || params.get('quickBidToken');

  return (
    <Provider store={marketplaceStore}>
      <ThemeProvider>
        <MarketplaceLayout>
          <MarketplaceLandingView />
          {quickBidToken && (
            <QuickBidModal
              token={quickBidToken}
              onClose={() => {
                const url = new URL(window.location.href);
                url.searchParams.delete('token');
                url.searchParams.delete('quickBidToken');
                window.history.replaceState({}, '', url.pathname);
              }}
            />
          )}
        </MarketplaceLayout>
      </ThemeProvider>
    </Provider>
  );
};

export default MarketplacePortalApp;
```

#### D. Physical Bundle Isolation via Code-Splitting
In the root entry triage (either `main.tsx` or top of `App.tsx`):
- Dynamically import `MarketplacePortalApp`:
  ```tsx
  const MarketplacePortalApp = React.lazy(() => import('./MarketplacePortalApp'));
  ```
- When `isMarketplaceRoute(pathname, hostname)` evaluates to true:
  - Vite will load only the `MarketplacePortalApp-[hash].js` bundle.
  - Supplier views (`LotOperationsHubView`, `WorkflowsView`, `IngestionView`) and supplier Redux slices are never downloaded into the buyer's browser.
