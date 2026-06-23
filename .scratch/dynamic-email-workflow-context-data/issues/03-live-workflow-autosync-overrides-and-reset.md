# 03 — Live Workflow Auto-Sync, Preview Overrides & Reset Control

**What to build:** Auto-sync Step 3 dynamic context in real time when Step 1 (inventory selection/filters) or Step 2 (Stage 1 discount %, duration, target buyers) change. Support manual editing in the *Preview Overrides* panel for testing custom values, and add a "Reset to Workflow Values" button in Step 3 controls to restore live workflow state.

**Blocked by:** 02 — Itemized Inventory Table HTML & Multi-Lot Title Formatting

**Status:** done

- [x] Modifying inventory filters or stage rules automatically updates Step 3 preview context in real time.
- [x] User manual edits in Preview Overrides panel update preview text without breaking live workflow bindings.
- [x] Clicking "Reset to Workflow Values" clears manual overrides and re-binds preview context to live workflow state.
- [x] Integration tests cover live auto-sync, manual override editing, and reset action.
