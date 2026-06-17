# 01 — Buyer API service layer

**What to build:** Wire the frontend to every new backend buyer endpoint. After this ticket, all other buyer-management tickets can read and write real data.

**Blocked by:** None — can start immediately.

**Status:** completed

### networkService.ts — Buyer CRUD (backend endpoints ready)
- [x] `getBuyerById(id)` → `GET /buyers/:id`
- [x] `getAllBuyers()` → `GET /buyers?all=true` (includes inactive, for two-panel assignment)
- [x] `updateBuyer(id, payload)` → `PUT /buyers/:id`
- [x] `deactivateBuyer(id, reason?)` → `PATCH /buyers/:id/deactivate`
- [x] `reactivateBuyer(id)` → `PATCH /buyers/:id/reactivate`

### networkService.ts — Buyer List CRUD (backend route /api/buyer-lists already registered)
- [x] `getBuyerLists()` → `GET /buyer-lists`
- [x] `createBuyerList(payload)` → `POST /buyer-lists`
- [x] `updateBuyerList(id, payload)` → `PUT /buyer-lists/:id`
- [x] `deleteBuyerList(id)` → `DELETE /buyer-lists/:id`
- [x] `updateBuyerListMembers(id, buyerIds[])` → `PUT /buyer-lists/:id/members`

### networkService.ts — Email threads scoped to buyer
- [x] `getEmailThreadsByBuyerEmail(email)` → `GET /email-threads?buyerEmail=<email>`

### coreSlice.ts
- [x] Add `BuyerList` interface: `_id`, `name`, `type: 'primary'|'secondary'|'custom'`, `buyerIds: any[]`, `description`
- [x] Extend `Buyer` interface: add `isActive`, `optInBidding`, `optInSales`, `phone`, `address`, `notes`, `deactivatedAt`, `deactivatedReason`
- [x] Add `buyerLists: BuyerList[]` to `CoreState` (default `[]`)
- [x] Add `fetchBuyerLists` thunk; wire into `fetchCoreReferenceData` so both load on app boot
- [x] Export `selectBuyerLists` selector

## Acceptance criteria
- [x] All functions compile and call correct paths with auth headers
- [x] `fetchCoreReferenceData` stores both buyers and buyer lists in Redux
- [x] TypeScript reports zero errors

