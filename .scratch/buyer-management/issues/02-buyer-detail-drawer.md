# 02 — Buyer Detail Drawer

**What to build:** A full-screen slide-over drawer that opens from the right when a supplier clicks any buyer row in the Buyer Registry. Provides the complete single-buyer management surface: edit profile, toggle opt-in flags, manage list memberships, deactivate/reactivate, and view email communication history.

**Blocked by:** 01 — Buyer API service layer

**Status:** ready-for-agent

## Behaviour

### Opening / closing
- Clicking any buyer row in the Buyer Registry opens the drawer for that buyer
- An `×` button and clicking the overlay close it
- Only one drawer open at a time

### Tab 1 — Profile & Settings
**Edit mode** (inline, no separate edit page):
- Editable fields: Company Name, Email, Tier, Phone, Address, Notes
- Accepts Short-Dated toggle, Min Shelf Life, Transport Radius
- Save/Cancel buttons; optimistic update with rollback on error

**Opt-Out controls** (two independent pill-toggles):
- "Bidding sessions" — maps to `optInBidding`
- "Sales sessions" — maps to `optInSales`
- When OFF, shows an amber "Currently skipped" badge; tooltip explains they will be excluded from workflow execution

**List memberships** (checkbox grid):
- Shows all Buyer Lists (Primary, Secondary, every Custom list)
- Checked = buyer is a member; unchecking removes them via `updateBuyerListMembers`
- System list checkboxes show a lock icon but are still toggleable (only the *name* is locked)

**Deactivation zone** (bottom of tab, red-tinted card):
- Active buyer → red "Deactivate Buyer" button; opens inline confirmation (reason text field + confirm)
- Inactive buyer → amber warning banner "Deactivated on <date>: <reason>" + green "Reactivate Buyer" button
- Deactivated buyer row in the registry gets a muted style + "Inactive" badge

### Tab 2 — Communications
- Fetches `GET /email-threads?buyerEmail=<buyer.email>`
- Lists threads: subject, last-message snippet (≤120 chars), date, open/unread indicator
- "Open in Hub" link on each thread navigates to Email Communications Hub filtered to that thread
- Empty state if no threads exist

## Acceptance criteria
- [ ] Drawer opens on row click and closes on overlay click or ×
- [ ] All profile fields save to `PUT /buyers/:id` with success/error toast
- [ ] Opt-in toggles call the correct endpoint and reflect persisted state on re-open
- [ ] List membership checkboxes call `PUT /buyer-lists/:id/members` and stay in sync with coreSlice
- [ ] Deactivate flow calls `PATCH /buyers/:id/deactivate`; row becomes muted in registry without page reload
- [ ] Reactivate flow calls `PATCH /buyers/:id/reactivate`; buyer returns to normal display
- [ ] Communications tab renders scoped EmailThread list; empty state handled
- [ ] TypeScript reports zero errors
