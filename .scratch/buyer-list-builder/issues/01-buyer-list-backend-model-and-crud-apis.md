# 01 — BuyerList Backend Domain Model & REST APIs

**What to build:** Create the `BuyerList` database schema and REST API endpoints supporting list management (Primary, Secondary, and Custom lists), list member assignment, and backend seeder initialization for default lists.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] Define the `BuyerList` Mongoose schema with fields: `name`, `type` ('primary' | 'secondary' | 'custom'), `buyerIds` (array of Buyer ObjectIds), `supplierId`, `description`, and timestamps.
- [ ] Provide backend REST API endpoints at `/api/buyer-lists` supporting GET (list all lists), POST (create list), PUT `/api/buyer-lists/:id` (update list name/description), DELETE `/api/buyer-lists/:id` (delete custom list), and PUT `/api/buyer-lists/:id/members` (add/remove buyer IDs).
- [ ] Update backend seeder (`seeder.ts`) to automatically initialize default `Primary Buyers` and `Secondary Buyers` lists and populate them with seeded primary and secondary buyers.
- [ ] Add integration tests verifying API CRUD routes, default list protection, and buyer member association.
