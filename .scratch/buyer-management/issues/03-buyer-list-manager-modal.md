# 03 — Buyer List Manager modal

**What to build:** A modal opened from a new "Buyer Lists" button in the Buyer Registry header. Provides two capabilities: (1) list-level CRUD for Custom Buyer Lists, and (2) a two-panel bulk member assignment interface for any list. System Default Lists (Primary, Secondary) are protected from renaming and deletion.

**Blocked by:** 01 — Buyer API service layer

**Status:** ready-for-agent

## Behaviour

### Opening
- "Buyer Lists" button lives to the right of "Add Buyer Manually" in the BuyerRegistryPanel header
- Opens a wide modal (max-width ~900px); overlay click closes it

### Left panel — list directory
- Lists all Buyer Lists with: name, type badge (System / Custom), member count
- System lists show a 🔒 lock icon; no rename/delete controls
- Custom lists show a pencil (rename) and trash (delete with confirmation) icon
- "＋ New List" button at the bottom → inline name input → calls `POST /buyer-lists`

### Right panel — bulk member assignment (appears when a list is selected)
- Title: "<List Name> — Members"
- Two columns:
  - **Current members** (left): buyers already in the list; click `−` to remove
  - **All active buyers** (right): buyers NOT in the list; click `+` to add
  - Search box above each column
- Changes are batched; a "Save Changes" button calls `PUT /buyer-lists/:id/members` with the full updated array
- Dirty-state indicator if unsaved changes exist; prompts confirmation before switching lists

## Acceptance criteria
- [ ] "Buyer Lists" button appears in BuyerRegistryPanel header and opens the modal
- [ ] All Buyer Lists are fetched from Redux state (selectBuyerLists); no extra API call at open time
- [ ] Creating a Custom List calls `POST /buyer-lists`, refreshes the list directory
- [ ] Renaming a Custom List calls `PUT /buyer-lists/:id`, updates in place
- [ ] Deleting a Custom List calls `DELETE /buyer-lists/:id` after confirmation; list removed from directory
- [ ] System lists show lock icon; rename and delete controls are absent
- [ ] Two-panel assignment saves via `PUT /buyer-lists/:id/members`; member counts update immediately
- [ ] Dirty state prevents accidental list-switch without save
- [ ] TypeScript reports zero errors
