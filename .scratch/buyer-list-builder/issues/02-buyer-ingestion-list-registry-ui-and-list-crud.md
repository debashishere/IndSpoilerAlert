# 02 — Buyer Ingestion List Registry UI & List CRUD

**What to build:** Build the Buyer List management header bar, list filter tabs/pills, "+ Create New List" modal, custom list rename/delete action menus, and add the "Assigned List" column with inline list update selectors to the buyer table in the Buyer Ingestion workspace.

**Blocked by:** 01 — BuyerList Backend Domain Model & REST APIs

**Status:** ready-for-agent

- [ ] Add a List Header toolbar above the registered buyer table in the Buyer Ingestion tab (`App.tsx`) with filter tabs (`All Buyers`, `Primary Buyers`, `Secondary Buyers`, and custom lists).
- [ ] Add a "+ Create New List" modal allowing users to enter a list name and optional description to create new custom buyer lists.
- [ ] Provide a 3-dots action menu next to custom list filter tabs enabling suppliers to Rename or Delete custom lists (with a warning that system default lists `Primary Buyers` and `Secondary Buyers` cannot be deleted).
- [ ] Add an "Assigned List" column to the buyer table that displays list badges/pills and provides an inline dropdown selector to change a buyer's list membership on the fly.
