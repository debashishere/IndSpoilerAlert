# 02 — Template Gallery list view

**What to build:** The Templates sub-tab (currently a placeholder) becomes a working Template Gallery. It fetches the supplier's saved Email Templates from `GET /api/email-templates?supplierId=...` and renders them as a card grid. Each card shows the template name, category badge (Clearance / Auction / Award / General), the subject line as a preview, and the last-updated timestamp. Each card has an **Edit** action and a **Delete** action — Delete calls `DELETE /api/email-templates/:id` and refreshes the list. When no templates exist, an empty state with a clear CTA is shown. A `+ New Template` button is present in the gallery header; clicking it does nothing yet (wired in ticket 03).

**Blocked by:** 01 — Emails Hub shell

**Status:** ready-for-agent

- [ ] Gallery fetches from `/api/email-templates` scoped to the current `supplierId`
- [ ] Each template card displays: name, category badge, subject preview, last-updated date
- [ ] Delete action removes the template via `DELETE /api/email-templates/:id` and updates the list without a full reload
- [ ] Empty state is shown when no templates exist for the supplier
- [ ] `+ New Template` button renders in the header (click handler is a no-op — wired next ticket)
- [ ] Loading and error states are handled gracefully
