# 02 — Replace stage inline email editor with "Configure Stage Email" button + status badge

**Status:** ready-for-agent

**Blocked by:** None — can start immediately

## What to build

Inside each expanded stage card in the LiquidationAutomationStudio, the "Stage Email Template & Body Data" section currently contains a Subject input, a Template Preset dropdown, a TipTap body editor toggle, and the inline TipTap editor itself. Remove all of these controls.

Replace them with:

1. A **"Configure Stage Email" button** — clicking it will eventually open the per-stage email modal (wired up in ticket 03).
2. A **"Email Configured ✓" green badge** shown alongside the button when the stage already has email data set (`emailSubject` or `emailBodyHtml` is non-empty). The badge must be absent when no email is configured.
3. A **"Clear" control** (small link or icon button) visible only when email is configured, which resets `emailSubject`, `emailBodyHtml`, and `emailTemplateId` back to undefined for that stage.

The button click handler can be a no-op stub (`console.log` or comment) at this stage — the modal is wired in ticket 03.

## Acceptance criteria

- [ ] Subject input is removed from each expanded stage card
- [ ] Template Preset dropdown is removed from each expanded stage card
- [ ] TipTap body editor toggle and inline TipTap editor are removed from each expanded stage card
- [ ] "Configure Stage Email" button is visible in the Stage Email section of every expanded stage card
- [ ] When a stage has no email configured, no badge is shown
- [ ] When a stage has email configured, the green "Email Configured ✓" badge appears next to the button
- [ ] "Clear" control resets `emailSubject`, `emailBodyHtml`, and `emailTemplateId` to undefined for that stage only
- [ ] All other stage card content (discount settings, buyer targeting, wait hours) is unaffected
