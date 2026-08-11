# 08 — Main Views Light Theme (WorkflowsView, SettingsView, EmailCommunicationsView)

**What to build:** The three primary supplier views render correctly in light mode with professional visual hierarchy throughout. Cards, data tables, drawers, inline modals, tab bars, form controls, status badges, and empty states within these views all use the semantic token system established in ticket 01. No dark sections remain.

**Blocked by:** 01 — Semantic Token Layer Refactor

**Status:** completed

- [x] `WorkflowsView`: workflow cards, automation studio panels, stage editors, and all nested modals render with light surfaces and correct text contrast
- [x] `SettingsView`: settings panels, input fields, toggles, and section headers are fully legible in light mode
- [x] `EmailCommunicationsView`: email list, preview pane, tab bar, and any inline compose areas render correctly in light mode
- [x] Drawers (slide-in panels) render with a light card background — not dark — in light mode
- [x] Status badges (success/warning/error/info) retain their colour-coded meaning in light mode
- [x] Dark mode unchanged across all three views — no regression
