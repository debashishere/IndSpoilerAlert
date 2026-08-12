# 04 — Remove Email Builder + Broadcast sub-tabs from WorkflowsView

**What to build:** Now that the Template Builder lives in the Emails Hub, the `Email Builder` and `Send Broadcast` sub-tab buttons in the Workflows tab are dead weight. Remove both the sub-tab buttons and their corresponding render blocks from `WorkflowsView`. The remaining Workflows sub-tabs (Saved Campaigns, Automation Runs, and any others) must continue to work identically. Any Redux state related to the `templates` and `broadcast` sub-tab values of `workflowSubTab` should be cleaned up if it is no longer reachable.

**Blocked by:** 03 — Template Editor (ensure the Emails Hub Template Builder is fully working before removing the Workflows fallback)

**Status:** complete

- [x] `Email Builder` sub-tab button is removed from the Workflows sub-tab bar
- [x] `Send Broadcast` sub-tab button is removed from the Workflows sub-tab bar
- [x] `SendBroadcastView` is no longer rendered anywhere inside `WorkflowsView`
- [x] The `EmailBuilderEngine` / `TipTapTemplateEditor` block that was wired to the `templates` sub-tab is no longer rendered inside `WorkflowsView`
- [x] All remaining Workflows sub-tabs (Saved Campaigns, Automation Runs, Campaign Builder) render and behave correctly
- [x] No orphaned Redux state for the removed sub-tab values causes runtime errors (clean up enum/union types and default-case handling as needed)
