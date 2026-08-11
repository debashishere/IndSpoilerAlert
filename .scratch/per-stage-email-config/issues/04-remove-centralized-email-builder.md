# 04 — Remove centralized Section 4 "Email Builder" from LiquidationAutomationStudio

**Status:** ready-for-agent

**Blocked by:** 03 — per-stage email modal must be in place before the centralized builder is removed

## What to build

With per-stage email configuration now fully handled by the StageEmailModal (ticket 03), remove the centralized "Section 4: Email Builder & Live Preview" card (`workflow-email-builder-container`) from the LiquidationAutomationStudio layout entirely.

Also clean up the centralized state that was only used by Section 4: the top-level `emailSubject`, `emailBodyHtml`, `emailBlocks`, `stepperStep`, and `completedSteps` state variables (and any setters) that are now orphaned.

For the campaign save payload: the `emailTemplate` field currently uses the centralized state. After removal, either drop the field from the payload or derive it from Stage 1's email config for backward compatibility — pick whichever leaves the backend contract cleanest (the decision can be noted inline in the save handler).

## Acceptance criteria

- [ ] The `workflow-email-builder-container` card no longer renders in the studio
- [ ] No visual gap or layout shift where Section 4 used to be
- [ ] Centralized `emailSubject`, `emailBodyHtml`, `emailBlocks`, `stepperStep`, `completedSteps` state and their setters are removed (no dead code)
- [ ] The campaign save payload compiles and sends without referencing the deleted state
- [ ] Saving a workflow with per-stage emails configured persists those stage-level email fields correctly
- [ ] No TypeScript errors or console warnings introduced by the cleanup
