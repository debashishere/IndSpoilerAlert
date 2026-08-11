# 03 — Build StageEmailModal (full 4-step email builder per stage)

**Status:** ready-for-agent

**Blocked by:** 02 — per-stage configure email button must exist first

## What to build

Wire the "Configure Stage Email" button (added in ticket 02) to open a full-screen modal overlay. The modal contains the exact same 4-step email builder stepper that currently lives in the centralized Section 4 of LiquidationAutomationStudio:

- **Step 1 — Template:** choose a template preset (same options as the current centralized template picker)
- **Step 2 — Subject:** edit the stage email subject line
- **Step 3 — Edit Email Body:** TipTap WYSIWYG editor for the email body HTML
- **Step 4 — Preview & Overrides:** responsive desktop/mobile preview of the rendered email

The modal opens pre-seeded with that stage's existing `emailSubject`, `emailBodyHtml`, and `emailTemplateId` (or defaults if none are set). Internal changes are held in local modal state and only committed to the stage on "Save Email Config". "Close / Cancel" discards unsaved changes.

The modal should be accessible: focus-trapped while open, closeable via Escape key, and with a close button in the header.

## Acceptance criteria

- [ ] Clicking "Configure Stage Email" on any stage opens the modal for that stage only
- [ ] Modal header identifies which stage is being configured (e.g., "Stage 2 — Email Configuration")
- [ ] All 4 stepper steps are present and navigable within the modal
- [ ] Modal opens pre-seeded with that stage's existing email data (or defaults if none)
- [ ] "Save Email Config" commits changes to that stage's `emailSubject`, `emailBodyHtml`, `emailTemplateId` and closes the modal
- [ ] "Cancel" closes the modal without modifying stage state
- [ ] Pressing Escape closes the modal without saving
- [ ] Opening the modal for Stage 1 does not affect the state of Stage 2 or Stage 3
- [ ] "Email Configured ✓" badge (from ticket 02) reflects the saved state correctly after modal save
