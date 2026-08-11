# 01 — Remove CampaignDrawer Step 4 "Email Notification"

**Status:** ready-for-agent

**Blocked by:** None — can start immediately

## What to build

The campaign creation wizard in `CampaignDrawer` currently has four steps: Campaign → Strategy → Rules & Filters → Email Notification. Remove the "📨 Email Notification" step entirely, making the wizard a 3-step flow that saves directly after Rules & Filters.

The step tab bar, the step body renderer, and the footer navigation buttons (Next / Back / Save) must all be updated consistently so nothing is broken or off-by-one after the removal.

## Acceptance criteria

- [ ] The wizard step tabs show only 3 entries: Campaign, Strategy, Rules & Filters
- [ ] Step 3 shows a "Save Campaign & Strategy" primary button (no Next Step)
- [ ] Back/Next navigation is correct across all 3 steps
- [ ] No reference to step 4 or "Email Notification" remains in CampaignDrawer
- [ ] Existing campaign create/edit flows still save successfully end-to-end
