# 05: Legacy Sidebar Retirement & Full-Width Shell Verification

**What to build:**
The final architectural integration and cleanup retiring the vertical left sidebar navigation and validating the end-to-end full-width workspace shell.

From the user's perspective:
1. The persistent vertical left sidebar column (`<aside className="sidebar">`) is completely removed from the desktop application shell.
2. All operational workspaces (Ingestion Engine, Insight / Inventory / Lot Operations Hub, Workflows, Buyer Marketplace, Emails Hub / Inbox, and Settings) occupy 100% horizontal viewport width beneath the Global Navigation Bar, maximizing visible data columns, cards, and interactive tables.
3. [AppShell.tsx](file:///Users/debashisroy/Documents/SpoilerAlert/frontend/src/components/shell/AppShell.tsx) and [App.tsx](file:///Users/debashisroy/Documents/SpoilerAlert/frontend/src/App.tsx) are updated to cleanly use `GlobalNavigationBar` as the sole navigation header across all routes.
4. Legacy sidebar CSS rules and leftover layout margins are cleaned up to prevent any viewport shifting.
5. The full frontend regression test suite passes cleanly, confirming that all operational functionalities work seamlessly without side-effects.

**Blocked by:** 04: Mobile Navigation Bar & Responsive Slide-Over Drawer.

**Status:** ready-for-agent

- [ ] Legacy `<aside className="sidebar">` eliminated from [App.tsx](file:///Users/debashisroy/Documents/SpoilerAlert/frontend/src/App.tsx) and `Sidebar.tsx` usage transitioned.
- [ ] [AppShell.tsx](file:///Users/debashisroy/Documents/SpoilerAlert/frontend/src/components/shell/AppShell.tsx) updated with `GlobalNavigationBar` as the primary top header shell.
- [ ] CSS layout classes adjusted so workspace canvases occupy full width without margin offset.
- [ ] All primary views (Ingestion, Lot Hub, Workflows, Marketplace, Inbox, Settings) verified in both desktop and mobile viewports.
- [ ] Full frontend unit & integration test suite executed and passing with zero regressions.
