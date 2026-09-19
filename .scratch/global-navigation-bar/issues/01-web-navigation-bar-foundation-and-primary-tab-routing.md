# 01: Web Navigation Bar Foundation & Primary Tab Routing

**What to build:**
The foundational desktop Global Navigation Bar matching Google Stitch specification (`docs/stitch/web-nav-bar.html`), linking typography and icons, and establishing primary tab routing directly to the active Redux application state.

From the user's perspective:
1. When viewing on desktop (`min-width: 1024px`), a persistent, refined top header bar renders at the top of the viewport with the brand emblem icon ("IndSpoiler Alert", "Enterprise Liquidation OS").
2. The center contains a rounded pill navigation container housing all primary module tabs: `Ingestion Engine`, `Insight`, `Workflow`, `Marketplace`, `Inbox` (with blue alert indicator dot), and `Settings`.
3. Clicking any tab smoothly changes the active route via Redux (`core.activeTab`), dynamically highlighting the selected tab in high-contrast institutional deep blue (`#0d47a1`) with white typography, and rendering the corresponding operational workspace.
4. The right side features a Notification Bell button (with blue unread dot badge) and the User Profile Pill (`DH` avatar, `Debashishere007`, `Verified Agent` badge, and chevron trigger).
5. All interactions are thoroughly covered by unit tests in `GlobalNavigationBar.test.tsx`.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] [index.html](file:///Users/debashisroy/Documents/SpoilerAlert/frontend/index.html) links `Hanken Grotesk` and `Material Symbols Outlined` with embedded SVG/Lucide fallback support.
- [ ] `GlobalNavigationBar.tsx` is implemented under `frontend/src/components/navigation/` adhering to [web-nav-bar.html](file:///Users/debashisroy/Documents/SpoilerAlert/docs/stitch/web-nav-bar.html).
- [ ] Active tab routing is synchronized with Redux `state.core.activeTab` and `setActiveTab`.
- [ ] Desktop navigation tabs switch seamlessly across Ingestion Engine, Insight, Workflow, Marketplace, Inbox, and Settings.
- [ ] `GlobalNavigationBar.test.tsx` passes 100% with full coverage of rendering, tab clicks, and badge displays.
