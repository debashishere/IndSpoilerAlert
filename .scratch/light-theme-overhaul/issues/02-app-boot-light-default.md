# 02 — App Boot: Light Default + Theme Persistence

**What to build:** On first load the app renders in light mode with no dark flash. The `ThemeToggle` component defaults to showing "Switch to Dark". Returning users get their previously chosen theme back from `localStorage`. The app initialisation logic (in `App.tsx` or equivalent entry point) sets `[data-theme="light"]` on the `<html>` element by default when no stored preference exists.

**Blocked by:** 01 — Semantic Token Layer Refactor

**Status:** completed

- [x] First-time visitors (no localStorage entry) see light mode
- [x] Theme preference is read from `localStorage` on mount and applied before first paint (no flash)
- [x] `ThemeToggle` label and icon correctly reflect the current mode in both states
- [x] Toggling persists the new preference to `localStorage`
- [x] Dark mode still applies correctly when toggled or when the user has "dark" stored
