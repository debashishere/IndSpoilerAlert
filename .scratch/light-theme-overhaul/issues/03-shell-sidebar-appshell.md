# 03 — Shell: Sidebar + AppShell Light Theme

**What to build:** The main supplier app sidebar, brand mark, nav links, health status indicators, and the outer app shell wrapper all render correctly in light mode. No dark sections bleed through in either the expanded or icon-only collapsed sidebar state. Active nav states, hover effects, and the sidebar toggle control all look polished in both themes.

**Blocked by:** 01 — Semantic Token Layer Refactor

**Status:** completed

- [x] Sidebar background, border, and shadow use semantic tokens (no hardcoded dark hex or Tailwind dark classes)
- [x] Brand name gradient renders legibly on a light background
- [x] Nav link hover and active states are visually distinct and correct in light mode
- [x] Collapsed sidebar (icon-only) renders correctly in light mode
- [x] Health status dots (MongoDB, FastAPI) remain visible against a light surface
- [x] Both dark and light modes look correct side by side — no regression in dark mode
