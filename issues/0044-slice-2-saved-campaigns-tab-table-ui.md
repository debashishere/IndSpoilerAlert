# 0044 - Saved Campaigns Management Tab & 3-Dots Action Lifecycle

## What to build

Implement a dedicated **Saved Campaigns** tab within `WorkflowsView.tsx` as the default view for the Workflows module. Render a responsive data table listing all saved strategy campaigns with status badges (`Draft` [Yellow], `Active` [Green Pulse], `Stopped` [Red], `Completed` [Blue]), CreatedAt, CreatedBy, matched inventory lot/case scope, and a 3-dots dropdown menu (`Edit`, `Activate`, `Stop`, `Delete`). Provide a top-right `+ New Campaign` button that switches directly to the `Campaign Builder` workspace.

## Acceptance criteria

- [ ] `WorkflowsView.tsx` sub-tabs updated to 3 tabs: `Saved Campaigns` (default), `Campaign Builder`, `Runs & History`.
- [ ] Saved Campaigns table renders columns: `Campaign Name & Template`, `Status`, `Matched Inventory`, `Created At`, `Created By`, and `Actions`.
- [ ] 3-dots action dropdown menu exposes:
  - ✏️ **Edit**: Loads target campaign into `Campaign Builder` in edit mode.
  - 🚀 **Activate**: Updates status to `active` and initiates automated stage-gate scheduling.
  - ⛔ **Stop**: Pauses an active campaign, updating status to `stopped`.
  - 🗑️ **Delete**: Prompts confirmation and deletes campaign via API thunk.
- [ ] Top-right `+ New Campaign` button clears active edit state and navigates directly to `Campaign Builder`.

## Blocked by

- [0043 - Backend Campaign Status & Persistence REST Endpoints](file:///Users/debashisroy/Documents/IndSpoilerAlert/issues/0043-slice-1-backend-campaign-status-persistence-api.md)
