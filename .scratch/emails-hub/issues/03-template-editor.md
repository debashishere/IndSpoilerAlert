# 03 — Template Editor (create & edit)

**What to build:** Clicking `+ New Template` in the gallery header, or the Edit action on a gallery card, replaces the gallery with a full-page Template Editor. The editor follows the same visual layout as Campaign Builder Stage 4 ("Email Template" stage): a breadcrumb / back button at the top returns to the gallery without losing changes via a discard confirmation, and action buttons (Save Template / Discard) sit in the header.

The editor has two areas:
1. **Metadata form** — Template Name (required), Category (Clearance / Auction / Award / General), Subject Line, From Email, Signature
2. **Body editor** — a TipTap rich-text canvas that includes the full toolbar from `WorkflowTipTapBodyEditor` (font family, size, named formats, alignment, color pickers, link modal, image upload/drag-drop, dynamic token badges) **plus** table insertion capability (rows/columns with real table nodes, sourced from `EmailBuilderEngine`). A Tags/Token slide-out drawer lists insertable `{{token}}` variables (buyer_name, lot_title, inventory_table, quick_bid_link, supplier_name).

Saving a new template calls `POST /api/email-templates`; saving an existing one calls `PUT /api/email-templates/:id`. On success the user is returned to the Template Gallery with the saved card visible.

**Blocked by:** 02 — Template Gallery list view

**Status:** ready-for-agent

- [ ] `+ New Template` and gallery card Edit action both open the Template Editor
- [ ] Back / Discard navigates back to the gallery; if body has unsaved changes, a confirmation prompt is shown first
- [ ] Metadata form fields all bind correctly: Name (required), Category dropdown, Subject, From Email, Signature
- [ ] TipTap body editor includes the full Stage-4 toolbar AND table insertion
- [ ] Dynamic token badges are insertable via the Tags/Token drawer
- [ ] Image upload (local file + drag-and-drop) works in the body editor
- [ ] Save calls the correct API endpoint (POST for new, PUT for existing) with `{ name, subject, category, bodyHtml, supplierId }`
- [ ] After a successful save the user lands on the Template Gallery with the new/updated card visible
- [ ] Validation: form cannot be saved with an empty Name or empty Subject
