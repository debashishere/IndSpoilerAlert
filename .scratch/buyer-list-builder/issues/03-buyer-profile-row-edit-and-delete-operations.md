# 03 — Buyer Profile Row Edit & Delete Operations

**What to build:** Implement complete row-level Buyer CRUD in the unified buyer table, including updating manual creation & CSV bulk import to support initial list assignment, an "Edit Buyer" modal, and a "Delete Buyer" confirmation dialog.

**Blocked by:** 02 — Buyer Ingestion List Registry UI & List CRUD

**Status:** ready-for-agent

- [ ] Update the "+ Add Buyer Manually" form and CSV Bulk Importer to include an optional "Initial List Assignment" dropdown field.
- [ ] Add an "Edit Buyer" action button on each buyer table row opening a modal to edit company name, email, tier, transport radius, and excluded allergens.
- [ ] Add a "Delete Buyer" action button on each buyer table row with a confirmation modal to remove the buyer from the database registry and clean up any list references.
- [ ] Ensure table search, tier filtering, list filtering, and buyer counter stats update reactively upon editing or deleting buyer profiles.
