# 0046 - Studio Persistence Integration & Dual Launch Execution

## What to build

Integrate `LiquidationAutomationStudio.tsx` with the Redux `editingCampaignId` state and Saved Campaigns table. Provide dual CTA launch options in the studio footer: `Save as Draft` (saves strategy with `status: 'draft'` without immediate execution) and `Launch Active Campaign` (opens pre-flight audit modal, then saves as `status: 'active'` and triggers immediate/scheduled stage-gates). Enable loading any existing campaign from the Saved Campaigns table into the studio in full edit mode, populating all parameters, filters, stage-gates, and React Email blocks.

## Acceptance criteria

- [ ] Footer CTA buttons in `LiquidationAutomationStudio.tsx` offer `Save as Draft` and `Launch Active Campaign`.
- [ ] `Save as Draft` persists campaign with `status: 'draft'`, displays success notification toast, and redirects to Saved Campaigns tab.
- [ ] `Launch Active Campaign` opens Pre-Flight Launch Audit modal with rendered email preview and matched lot metrics before persisting with `status: 'active'`.
- [ ] Selecting ✏️ **Edit** on a campaign in the Saved Campaigns table hydrates the studio state with saved filters, stage-gates, and email blocks for editing.
- [ ] End-to-end campaign creation, saving, activating, stopping, editing, and deleting flows verified cleanly across frontend and backend.

## Blocked by

- [0044 - Saved Campaigns Management Tab & 3-Dots Action Lifecycle](file:///Users/debashisroy/Documents/SpoilerAlert/issues/0044-slice-2-saved-campaigns-tab-table-ui.md)
- [0045 - Code-First React Email 6.0 Block Builder & Live Device Preview](file:///Users/debashisroy/Documents/SpoilerAlert/issues/0045-slice-3-react-email-6-builder-wysiwyg-preview.md)
