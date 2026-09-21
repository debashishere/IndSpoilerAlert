# 04 — Buyer Bidding OTP Verification Flow and API Parity

Type: research
Status: resolved
Assignee: Antigravity
Blocked by: 03

## Question

How do the existing backend endpoints `/api/v1/marketplace/auth/send-verification`, `/api/v1/marketplace/auth/verify-token`, and `/api/v1/marketplace/bids` operate with `BuyerBidModal.tsx`, and how should the standalone marketplace client store and refresh verified buyer session tokens across bids without requiring repeated OTP verification in the same session?

## Answer

### 1. Existing Backend Endpoints Operation & Protocol Parity

The backend provides four core endpoints governing buyer identity and bid placement under `/api/v1/marketplace/*`:

#### A. `POST /api/v1/marketplace/auth/send-verification`
- **Controller / Service**: `buyerAuthController.sendVerification` → `buyerAuthService.sendVerificationToken`
- **Payload**: `{ email: string, companyName?: string }`
- **Mechanism**:
  1. Validates and normalizes email (`email.trim().toLowerCase()`).
  2. Generates a 6-digit numeric OTP (`devOtp`, 15-minute TTL).
  3. Saves the record to in-memory map `pendingOtps`: `{ otp, expiresAt, companyName }`.
- **Response**: `{ success: true, message: 'Verification token sent to email', email, devOtp }`
  - In non-production/test environments, `devOtp` is surfaced in the response payload to allow instantaneous end-to-end automated testing and developer simulation without an SMTP provider.

#### B. `POST /api/v1/marketplace/auth/verify-token`
- **Controller / Service**: `buyerAuthController.verifyToken` → `buyerAuthService.verifyToken`
- **Payload**: `{ email: string, token: string }`
- **Mechanism**:
  1. Validates `pendingOtps.get(normalizedEmail)`. Verifies token matching and ensures `Date.now() <= expiresAt`.
  2. Deletes the OTP from `pendingOtps` once consumed.
  3. Queries or upserts a `Buyer` document in MongoDB. If new, auto-derives initial preferences (`isVerified: true`, standard categories, default geolocation coordinates).
  4. Generates an opaque session token: `buyer_sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`.
  5. Registers the session in in-memory map `activeSessions.set(sessionToken, buyerProfile)`.
- **Response**: `{ success: true, token: sessionToken, buyer: BuyerProfile }`

#### C. `GET /api/v1/marketplace/auth/session`
- **Controller / Service**: `buyerAuthController.getSession` → `buyerAuthService.getSession`
- **Headers**: `Authorization: Bearer <sessionToken>`
- **Mechanism**:
  1. Strips `Bearer ` prefix and checks `activeSessions.get(cleanToken)`.
  2. Returns `{ authenticated: true, buyer: BuyerProfile }` if found; otherwise `{ authenticated: false }`.

#### D. `POST /api/v1/marketplace/bids` (and `/api/v1/marketplace/listing/:id/bids`)
- **Controller / Service**: `marketplaceController.placeBid` → `marketplaceService.placeBid`
- **Payload**: `{ listingId: string, buyerEmail: string, quantity: number, price: number, directPurchase?: boolean, buyerId?: string }`
- **Mechanism**:
  1. Validates the existence of `MarketplaceListing`, parent `Opportunity`, and underlying `InventoryLot`.
  2. Resolves Buyer:
     - If `buyerEmail` is provided, executes [ADR 0006](../../docs/adr/0006-buyer-email-identification-auto-registration.md) domain derivation (e.g. `buyer@kroger.com` → auto-registered company "Kroger").
     - If the buyer document exists, ensures consistency.
  3. Creates an `Offer` document with status `'pending'` (or `'fully_accepted'` if direct purchase).
  4. Logs an `Activity` record (`type: 'bid_submission'`) targeted at the supplier's Lot Operations Hub.
  5. Triggers automated rule evaluation (`agendaService.checkBidAgainstActiveWorkflows`).
  6. If direct purchase, generates `Award` and `Shipment`, and updates `lot.availableQty` and `lot.status = 'sold'`.

---

### 2. Interaction with `BuyerBidModal.tsx`

`BuyerBidModal.tsx` orchestrates the bidding lifecycle using two UI states driven by Redux `authSlice`:

#### A. Unauthenticated / First-Time Buyer Flow
1. Visitor browses public listings openly and clicks "Place Bid" on a listing card.
2. `BuyerBidModal` renders quantity/price inputs, calculating the total bid amount live (`cases * price/cs`).
3. Since `isAuthenticated` is false, it renders the **ADR 0006 Verification Form**:
   - Buyer enters business email (and optional company name).
   - Clicking "Send Verification Code" dispatches `sendBuyerVerificationThunk`.
   - The modal reveals the 6-digit OTP input (and displays `[Dev Mode OTP]: {devOtp}` in test environments).
4. Buyer enters the 6-digit OTP and clicks "Verify Email & Submit Bid":
   - Dispatches `verifyBuyerTokenThunk({ email, token: otpToken })`.
   - On `.fulfilled`, `authSlice` stores `token`, `buyer`, and sets `isAuthenticated = true`.
   - The modal automatically chains into `submitBidApi(buyerPayload.email)` without requiring another click.
   - Shows success confirmation: `"Bid successfully submitted! Supplier Lot Operations Hub notified."`

#### B. Authenticated / Returning Buyer Flow
1. If the buyer has already verified during the current session, `isAuthenticated && currentBuyer` evaluates to true.
2. The verification form is completely skipped.
3. In its place, `BuyerBidModal` renders the verified buyer card:
   - Company name and initials avatar.
   - Emerald `Verified Buyer` badge with `ShieldCheck` icon.
   - Buyer email address.
4. Clicking "Confirm & Submit Bid" immediately calls `handleDirectSubmitBid` → `submitBidApi(currentBuyer.email)` with zero friction and zero OTP prompts.

---

### 3. Identified Gaps & Session Volatility in Current Code

1. **In-Memory Store Volatility**:
   - In `authSlice.ts`, `token` is kept exclusively in Redux memory (`state.token = action.payload.token`).
   - If the buyer reloads the page, navigates across browser tabs, or returns later, Redux re-initializes to `token: null, isAuthenticated: false`, forcing the buyer through the OTP loop again.
2. **Dormant Session Check**:
   - `checkBuyerSessionThunk` exists in `authSlice.ts` but is never dispatched anywhere upon application mount.
3. **Missing Bearer Header in Bid Submission**:
   - In `BuyerBidModal.tsx` (`submitBidApi`), `fetch(endpoint, ...)` sends only `'Content-Type': 'application/json'`.
   - It does not transmit `Authorization: Bearer ${token}`, leaving backend bid submission reliant solely on unauthenticated email body values rather than session-backed verification tokens.

---

### 4. Specification: Session Token Persistence & Refresh Lifecycle

To achieve true frictionless multi-bid sessions across the standalone marketplace portal:

#### A. Storage Mechanism: Dedicated `localStorage` Key
Store the buyer token in browser `localStorage` under a namespaced key isolated from supplier tokens:
```ts
export const BUYER_TOKEN_STORAGE_KEY = 'marketplace_buyer_token';
```
- **Rationale**: Retail buyers often evaluate multiple listings, compare lots across tabs, and place multiple bids across hours. `localStorage` preserves the session across tabs and refreshes without requiring repeated OTP verification.

#### B. Redux Slice Integration (`authSlice.ts`)
1. **Initial State Hydration**:
   ```ts
   const initialToken = typeof window !== 'undefined' ? localStorage.getItem(BUYER_TOKEN_STORAGE_KEY) : null;

   const initialState: AuthState = {
     buyer: null,
     token: initialToken,
     isAuthenticated: false, // Remains false until session is validated
     isAuthModalOpen: false,
     authModalMode: 'login',
     pendingEmail: null,
     loading: Boolean(initialToken),
     error: null,
   };
   ```
2. **On Successful OTP Verification (`verifyBuyerTokenThunk.fulfilled`)**:
   - Persist token: `localStorage.setItem(BUYER_TOKEN_STORAGE_KEY, action.payload.token)`.
   - Update Redux state: `state.token = action.payload.token; state.buyer = action.payload.buyer; state.isAuthenticated = true;`.
3. **On Explicit Logout (`logoutBuyer` / `POST /api/v1/marketplace/auth/logout`)**:
   - Purge storage: `localStorage.removeItem(BUYER_TOKEN_STORAGE_KEY)`.
   - Reset state: `state.buyer = null; state.token = null; state.isAuthenticated = false;`.

#### C. Root App Bootstrapping (`MarketplacePortalApp.tsx`)
On portal mount, trigger a session check if a token exists:
```tsx
useEffect(() => {
  const token = localStorage.getItem(BUYER_TOKEN_STORAGE_KEY);
  if (token) {
    dispatch(checkBuyerSessionThunk(token));
  }
}, [dispatch]);
```
- If the session is active (`GET /api/v1/marketplace/auth/session` returns `authenticated: true`), Redux marks the buyer verified. All subsequent `BuyerBidModal` instances instantly render the authenticated state.
- If expired, `checkBuyerSessionThunk` clears `localStorage.removeItem(BUYER_TOKEN_STORAGE_KEY)` and marks `isAuthenticated: false`.

#### D. API Request Parity in `BuyerBidModal.tsx`
Update `submitBidApi` to pass the Bearer token when available:
```ts
const headers: Record<string, string> = {
  'Content-Type': 'application/json',
};
if (token) {
  headers['Authorization'] = `Bearer ${token}`;
}
```
This guarantees authenticated bid provenance while preserving ADR 0006 auto-registration compatibility for unauthenticated requests.

